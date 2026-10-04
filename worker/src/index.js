/**
 * AI Chat — Cloudflare Worker proxy for DeepSeek API
 * Serves the academic homepage only.
 *
 * Secrets (set via `wrangler secret put`):
 *   DEEPSEEK_API_KEY
 *
 * Environment vars (in wrangler.toml):
 *   ALLOWED_ORIGINS
 *   ACADEMIC_CONTEXT_URL (optional)
 */

const MODEL = "deepseek-flash";
const MAX_USER_TURNS = 30;
const MAX_MESSAGES = MAX_USER_TURNS * 2;
const CONTEXT_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CONTEXT_CHARS = 30000;
const TURN_LIMIT_REPLY = `This conversation has reached its ${MAX_USER_TURNS}-message limit. Refresh the page to start a new one. 本次对话已达 ${MAX_USER_TURNS} 条上限，刷新页面即可重新开始。`;

const ACADEMIC_PROMPT = `You are the AI assistant on the academic homepage of Guangyu Hou (English name: Lucas), gy-hou.github.io. You run on DeepSeek's ${MODEL} model.

Rules:
- Reply in the language the visitor writes in.
- Focus on on-site information: profile, education, projects, publications, and blog updates.
- The on-site index below is your only source of facts about Guangyu Hou. If something is not in it, say it is not listed on the site instead of guessing.
- If asked for citation counts or publication metrics not listed on the site, explicitly say not available on-site and suggest checking Google Scholar.
- Do not fabricate publications, awards, affiliations, or links.
- Keep answers concise and practical (under 200 words).`;
const DEFAULT_CONTEXT_URL = "https://raw.githubusercontent.com/gy-hou/gy-hou.github.io/main/assets/ai/academic-assistant-index.md";
const contextCache = { fetchedAt: 0, content: "" };

function safePathnameFromUrl(rawUrl) {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname || "";
  } catch {
    return "";
  }
}

function isLocalDev(origin, referer) {
  return /(localhost|127\.0\.0\.1)/.test(origin || "") || /(localhost|127\.0\.0\.1)/.test(referer || "");
}

function isAcademicRequest(siteMode, origin, referer) {
  const refererPath = safePathnameFromUrl(referer);
  const fromWikiPath = refererPath === "/openresource-wiki" || refererPath.startsWith("/openresource-wiki/");
  if (fromWikiPath) return false;
  if (isLocalDev(origin, referer)) return true;
  return siteMode !== "wiki";
}

function trimAndSanitizeMessages(messages) {
  return messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-MAX_MESSAGES);
}

function sanitizeContext(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, MAX_CONTEXT_CHARS);
}

async function loadAssistantContext(env) {
  const now = Date.now();
  if (contextCache.content && now - contextCache.fetchedAt < CONTEXT_CACHE_TTL_MS) {
    return contextCache.content;
  }

  const contextUrl = env.ACADEMIC_CONTEXT_URL || DEFAULT_CONTEXT_URL;
  if (!contextUrl) return "";

  try {
    const res = await fetch(contextUrl, {
      method: "GET",
      headers: { Accept: "text/markdown,text/plain;q=0.9,*/*;q=0.1" },
    });
    if (!res.ok) return contextCache.content || "";
    const content = sanitizeContext(await res.text());
    contextCache.fetchedAt = now;
    contextCache.content = content;
    return content;
  } catch {
    return contextCache.content || "";
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    if (request.method !== "POST") {
      return json({ error: "POST only" }, 405, env, request);
    }

    try {
      const body = await request.json();
      const messages = body?.messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        return json({ error: "messages required" }, 400, env, request);
      }

      const origin = request.headers.get("Origin") || "";
      const referer = request.headers.get("Referer") || "";
      if (!isAcademicRequest(body?.site_mode, origin, referer)) {
        return json({ error: "This endpoint is for academic site only." }, 403, env, request);
      }

      const trimmed = trimAndSanitizeMessages(messages);
      if (messages.filter((m) => m?.role === "user").length > MAX_USER_TURNS) {
        return json({ reply: TURN_LIMIT_REPLY }, 200, env, request);
      }
      // DeepSeek is stateless: the site facts must be sent on every turn, or the model
      // has nothing to ground on and invents a profile. Never call it without them.
      const context = await loadAssistantContext(env);
      if (!context) {
        return json({ error: "Site context unavailable" }, 503, env, request);
      }
      const systemPrompt = `${ACADEMIC_PROMPT}\n\nOn-site index context:\n${context}`;

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: systemPrompt }, ...trimmed],
          thinking: { type: "disabled" },
          max_tokens: 1024,
          temperature: 0.2,
          stream: false,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return json({ error: "DeepSeek API error", detail: text }, 502, env, request);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, I cannot answer right now.";
      return json({ reply }, 200, env, request);
    } catch (e) {
      return json({ error: e.message }, 500, env, request);
    }
  },
};

function corsHeaders(env, request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const match = allowed.includes(origin) ? origin : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": match,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status, env, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env, request) },
  });
}
