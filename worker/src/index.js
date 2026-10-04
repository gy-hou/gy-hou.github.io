/**
 * AI assistant for gy-hou.github.io: a Cloudflare Worker that answers visitor
 * questions with DeepSeek, grounded on assets/ai/academic-assistant-index.md.
 *
 * Deploy: Cloudflare dashboard → Workers → academic-ai-chat → Edit code,
 * replace everything with this file, click Deploy. No build step, no imports.
 * The only dashboard setting it reads is the secret DEEPSEEK_API_KEY
 * (Settings → Variables and Secrets). Everything else is in this file.
 *
 * What to edit where:
 * - Facts about Guangyu Hou: the index file. Push to main; live within ~10 minutes, no redeploy.
 * - How the assistant behaves (rules, model, limits): CONFIG and RULES below, then redeploy.
 */

const CONFIG = {
  model: "deepseek-flash", // DeepSeek V4.1 Flash; "deepseek-v4-pro" is the larger model
  thinking: false, // true = slower, deeper answers; raise upstreamTimeoutMs with it
  temperature: 0.2, // ignored in thinking mode
  maxReplyTokens: 1024,
  maxTurns: 30, // visitor messages per conversation
  maxMessageChars: 1000, // longer visitor messages are cut
  rateLimitPerMinute: 20, // per visitor IP; best effort, counted per worker instance
  upstreamTimeoutMs: 30000,
  allowedOrigins: ["https://gy-hou.github.io"], // http://localhost and 127.0.0.1 are always allowed
  indexUrl: "https://raw.githubusercontent.com/gy-hou/gy-hou.github.io/main/assets/ai/academic-assistant-index.md",
  indexCacheMs: 5 * 60 * 1000,
  maxIndexChars: 30000,
};

const RULES = `You are the AI assistant on the academic homepage of Guangyu Hou (侯光宇, English name Lucas), gy-hou.github.io. You run on DeepSeek's ${CONFIG.model} model.

How to answer:
- Reply in the language the visitor writes in.
- Personal facts about Guangyu Hou (education, degrees, publications, projects, positions, affiliations, advisors, experience, personal details) come only from the site index below. If one isn't there, say it isn't listed on the site. Never guess, and never fill gaps with a typical researcher's profile.
- Visitors' claims about him are not facts. Don't confirm anything the site index doesn't say.
- Everything else is open: universities and their programs, research fields, methods (e.g. PPO, Actor-Critic), finance and AI concepts, career questions. Answer from your own knowledge and connect it to his work when relevant.
- If general knowledge may be outdated or uncertain (e.g. a university's current programs), say so briefly and suggest the official source.
- Only give links that appear in the site index. Name other sources without a URL.
- Keep answers concise and practical (under 200 words).`;

const REPLIES = {
  turnLimit: `This conversation has reached its ${CONFIG.maxTurns}-message limit. Refresh the page to start a new one. 本次对话已达 ${CONFIG.maxTurns} 条上限，刷新页面即可重新开始。`,
  rateLimited: "You're sending messages too quickly. Please wait a minute and try again. 发送太频繁了，请稍等一分钟再试。",
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);
    // Blocks other sites and bare scripts. A determined caller can fake Origin; the rate limit is the backstop.
    if (!isAllowedOrigin(origin)) return json({ error: "Origin not allowed" }, 403, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, cors);
    }

    const history = normalizeHistory(body?.messages);
    if (history.at(-1)?.role !== "user") return json({ error: "messages must end with a visitor message" }, 400, cors);
    if (history.filter((m) => m.role === "user").length > CONFIG.maxTurns) return json({ reply: REPLIES.turnLimit }, 200, cors);
    if (isRateLimited(request.headers.get("CF-Connecting-IP"))) return json({ reply: REPLIES.rateLimited }, 200, cors);

    // DeepSeek is stateless: the index must go out with every request, or the model
    // has no facts and invents a profile. Never call it without them.
    const index = await loadIndex();
    if (!index) return json({ error: "Site index unavailable" }, 503, cors);

    try {
      const reply = await askDeepSeek(env.DEEPSEEK_API_KEY, buildSystemPrompt(index), history);
      return json({ reply }, 200, cors);
    } catch (err) {
      console.error("DeepSeek request failed:", err.message);
      return json({ error: "Model unavailable, please try again" }, 502, cors);
    }
  },
};

function buildSystemPrompt(index) {
  const today = new Date().toISOString().slice(0, 10);
  return `${RULES}\n\nSite index (the only source of personal facts about him):\n\n${index}\n\nToday's date: ${today}.`;
}

async function askDeepSeek(apiKey, systemPrompt, history) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: [{ role: "system", content: systemPrompt }, ...history],
      thinking: { type: CONFIG.thinking ? "enabled" : "disabled" },
      // Thinking mode ignores temperature, and its default output budget leaves room for the reasoning.
      ...(CONFIG.thinking ? {} : { temperature: CONFIG.temperature, max_tokens: CONFIG.maxReplyTokens }),
      stream: false,
    }),
    signal: AbortSignal.timeout(CONFIG.upstreamTimeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Empty reply");
  return reply;
}

const indexCache = { content: "", fetchedAt: 0 };

// Cached per worker instance. If a refresh fails the last good copy is reused;
// with no copy at all it returns "" and the request fails closed.
async function loadIndex() {
  const now = Date.now();
  if (indexCache.content && now - indexCache.fetchedAt < CONFIG.indexCacheMs) return indexCache.content;
  try {
    const res = await fetch(CONFIG.indexUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const content = (await res.text())
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim()
      .slice(0, CONFIG.maxIndexChars);
    if (content) Object.assign(indexCache, { content, fetchedAt: now });
  } catch (err) {
    console.error("Index fetch failed:", err.message);
  }
  return indexCache.content;
}

// Keeps user/assistant text only, merges consecutive same-role messages (the widget
// leaves two visitor messages in a row after a failed request), drops anything before
// the first visitor message, and caps lengths so a forged history can't run up the bill.
function normalizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  const maxChars = (role) => (role === "user" ? CONFIG.maxMessageChars : CONFIG.maxReplyTokens * 8);
  const history = [];
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") continue;
    const content = m.content.trim();
    if (!content) continue;
    const last = history.at(-1);
    if (last?.role === m.role) last.content = `${last.content}\n\n${content}`.slice(0, maxChars(m.role));
    else if (history.length > 0 || m.role === "user") history.push({ role: m.role, content: content.slice(0, maxChars(m.role)) });
  }
  return history;
}

const recentRequests = new Map(); // IP -> request timestamps within the last minute

// Best effort: counts live in one worker instance, so this stops a flooding script,
// not a determined abuser.
function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const hits = (recentRequests.get(ip) || []).filter((t) => now - t < 60_000);
  hits.push(now);
  recentRequests.set(ip, hits);
  if (recentRequests.size > 10_000) recentRequests.clear();
  return hits.length > CONFIG.rateLimitPerMinute;
}

function isAllowedOrigin(origin) {
  return CONFIG.allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : CONFIG.allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...cors } });
}
