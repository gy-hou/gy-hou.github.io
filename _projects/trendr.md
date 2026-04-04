---
layout: page
title: TrendR
description: Trend Research — Automated literature review + platform trend monitoring + Obsidian knowledge management.
importance: 1
category: work
giscus_comments: true
related_publications: false
toc:
  sidebar: left
---

{% assign xhs_trendr = site.data.xiaohongshu.notes | where: "slug", "trendr" | first %}

{% if xhs_trendr %}
<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% include xhs_note_card.liquid note=xhs_trendr %}
</div>
{% endif %}

<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center mt-2 mb-4">
  {% include repository/repo.liquid repository="gy-hou/trendr" %}
</div>

> **4 Agents · 8 Skills · 9-source search · 9-platform trends · Basic / Full install**
>
> Tell your agent one sentence. TrendR handles the rest.

```
You: "Survey the latest advances in agentic RAG 2025"

TrendR:
  → 9-source parallel search, 81 candidate papers found
  → Deep-read 11 papers, structured notes + comparison matrix
  → 14KB literature review (taxonomy, gap analysis, BibTeX)
  → Auto-archived to Obsidian, paper pool persisted
  → Notifies you: Done ✅
```

Inspired by [karpathy/autoresearch](https://github.com/karpathy/autoresearch) — redesigned from "LLM training optimization" to "paper search + literature review."

> TrendR is a research-agent harness system, evolving toward a domain-specific agent OS.

---

## What Problem It Solves

| Step | Manual | TrendR |
|------|--------|--------|
| Cross-platform paper search | 3–4 hrs | 5 min (9 sources parallel) |
| Filter relevant papers | 2–3 hrs | Auto score 1–5 + dedup |
| Deep read + notes | 8–12 hrs | Structured extraction (problem / method / result / limitation) |
| Write literature review | 6–8 hrs | Auto-generated (taxonomy + gap analysis + trends) |
| BibTeX references | 1–2 hrs | Automatic |
| Archive to knowledge base | 1 hr | Auto-sync to Obsidian |
| **Total** | **~20–30 hrs** | **~30 min wait** |

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────┐
│              User  (Telegram / 飞书 / Web / CLI)       │
└─────────────────────┬────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────┐
│           OpenClaw Gateway (runs locally)             │
│                                                      │
│  ┌─ main agent ─────────────────────────────────┐   │
│  │    receive → decompose → dispatch → synthesize│   │
│  └──────┬──────────────┬──────────────┬──────────┘   │
│         ▼              ▼              ▼               │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌──────┐ │
│  │paper-scout │ │paper-      │ │review-   │ │verif-│ │
│  │search·score│ │analyzer    │ │lead      │ │ier   │ │
│  │dedup       │ │read·extract│ │orchestr. │ │verify│ │
│  └────────────┘ └────────────┘ └──────────┘ └──────┘ │
│                                                      │
│  ┌── Skills (executable Markdown knowledge files) ──┐ │
│  │  paper-scout · paper-analyzer · review-writer   │ │
│  │  verifier · trendr-watchdog · platform-hotspots │ │
│  │  chrome-cdp-setup · research-vault              │ │
│  └──────────────────────┬───────────────────────────┘ │
│                         ▼                            │
│  ┌── v2 engine (state machine / validators / watchdog)┐│
│  │  INIT→DISCOVERY→ANALYSIS→GAP_CHECK→WRITING→VERIFY│ │
│  │  Basic:  9×academic APIs (free, no extra MCP)    │ │
│  │  Full:   +Scrapling +Nano-pdf +Context7 +Zotero  │ │
│  │  Fallback: Playwright (JS gaps / login only)     │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────┬───────────────┘
               ▼                       ▼
  ┌─────────────────────┐   ┌───────────────────────┐
  │  9 Academic APIs    │   │  Obsidian Vault        │
  │  arXiv·S2·OA·PubMed │   │  paper pool / reviews  │
  │  CrossRef·DBLP···   │   │  cards / daily logs    │
  └─────────────────────┘   └───────────────────────┘
```

### v2 State Machine

```
INIT → DISCOVERY → ANALYSIS → GAP_CHECK → WRITING → VERIFY → DONE
                          ↑                          ↓
                          └────── coverage gaps ─────┘

VERIFY fail:
WRITING ← verify.json.pass=false (max 2 repair rounds)
```

### Pipeline

```
User prompt
    │
    ▼
Phase 1 · Search ────── paper-scout: 3–5 APIs parallel
    │                   → candidates.csv (40–100, scored 1–5)
    ▼
Phase 2 · Deep Read ─── paper-analyzer: reads score ≥ 4
    │                   → notes/*.md + matrix.csv
    ▼
Phase 3 · Gap Check ─── enough coverage? → Ph.4 : loop back
    ▼
Phase 4 · Write ──────── review-lead: full literature review
    │                   → review.md (15–25KB) + references.bib
    ▼
Phase 5 · Verify ──────── verifier: citation/claim/taxonomy check
    │                   fail → Ph.4 (max 2 rounds) | pass → Ph.6
    ▼
Phase 6 · Persist ──────── Basic: ~/research/  Full: Obsidian+Zotero
    ▼
Notify user (Telegram / 飞书)
```

---

## Contents

### Core (Basic + Full)

| Type | Name | Role |
|------|------|------|
| Agent | `paper-scout` | 9-source search + score + dedup |
| Agent | `paper-analyzer` | Deep read + structured notes + matrix |
| Agent | `review-lead` | Pipeline orchestration + survey writing |
| Agent | `verifier` | Citation validity / taxonomy consistency |
| Skill | `paper-scout` | 9 academic API playbooks (10KB) |
| Skill | `paper-analyzer` | Structured extraction templates |
| Skill | `review-writer` | Survey template + quality checklist |
| Skill | `verifier` | VERIFY rules + verify.json protocol |
| Skill | `research-vault` | Obsidian persistence + paper pool index |
| Skill | `trendr-watchdog` | Runtime supervision + auto-resume |
| Skill | `platform-hotspots` | 9-platform trend scraping |
| Skill | `chrome-cdp-setup` | Chrome 146+ CDP dual-instance + cookie sync |
| Runtime | `engine/` | v2: state machine + validators + watchdog |
| Runtime | `cli.py` | Standalone CLI: `run / resume / status` |

### Full Mode Extras

| Component | Function | Without it |
|-----------|----------|-----------|
| Scrapling | JS-rendered page crawling | Static API only, lower coverage |
| Zotero | Auto-import DOI to library | BibTeX still generated locally |
| Obsidian + obsidian-cli | Paper cards + review archive + daily logs | Results saved to `~/research/` |
| Nano-pdf | Full-text PDF reading | Abstract/metadata only |
| Context7 | Precise library docs for codex-coder | Falls back to web search |

### Fallback Layer

| Component | Trigger |
|-----------|---------|
| Playwright | JS rendering gaps, login-gated pages, or explicit user request only |

---

## 9 Search Sources

All APIs are publicly free — called via `web_fetch`, no extra MCP needed.

| # | Source | Coverage | Key Required |
|---|--------|----------|-------------|
| 1 | arXiv | CS / math / physics preprints | No |
| 2 | Semantic Scholar | 200M+ papers, citation graph | Recommended (free) |
| 3 | OpenAlex | 250M+ works, fully open | No |
| 4 | PubMed | 36M+ biomedical | No |
| 5 | CrossRef | 140M+ DOI registry | No |
| 6 | DBLP | Computer science bibliography | No |
| 7 | Europe PMC | 40M+ life sciences | No |
| 8 | bioRxiv | Biology preprints | No |
| 9 | Papers with Code | ML papers + code repos | No |

Agent auto-selects 3–5 most relevant sources per topic.

---

## Platform Trend Monitoring

Beyond academic papers, TrendR monitors 9 platforms in real time via Chrome CDP:

```
You: "What's trending in AI today?"

TrendR:
  → Chrome CDP automation (dedicated instance with login state)
  → Zhihu · Xiaohongshu · X/Twitter · Reddit
  → YouTube · GitHub Trending · Hacker News · Product Hunt
  → Cross-platform tech trend summary
```

---

## Compatible Runtimes

| Platform | Support | Notes |
|----------|---------|-------|
| **OpenClaw** | Full | Native multi-agent + browser automation |
| **Standalone CLI** | v2 engine | `python cli.py run --topic "..." --depth B` |
| **Claude Code** | Skills readable | via `CLAUDE.md`, `WebFetch` / `Agent` tool |
| **Codex** | Skills readable | via `AGENTS.md`, `curl`/`fetch`, sequential |
| **Other agents** | Skills readable | Standard Markdown, API URLs copyable |

---

## Anti-Forgetting Mechanism

When using non-frontier models (e.g. MiniMax M2.5), agents may skip reading Skill files. TrendR uses a 3-layer defense:

| Layer | Mechanism |
|-------|-----------|
| `AGENTS.md` | Hard rule: "task description must include 'read skills/xxx/SKILL.md first'" |
| `SOUL.md` | Top warning: "⚠️ Step 1: read skills/xxx/SKILL.md" |
| `SKILL.md` | Complete copy-paste commands, not abstract instructions |

---

## Obsidian Vault Structure

```
[Vault]/Research/
├── _index/
│   └── paper-pool.csv       ← paper pool (cross-project, cumulative)
├── papers/
│   └── 2301.12345.md        ← paper card (YAML frontmatter + wiki-links)
├── reviews/
│   └── project-name/
│       ├── review.md
│       ├── references.bib
│       └── matrix.csv
├── daily/
│   └── 2026-03-10.md        ← daily research log
└── templates/
```

Paper pool CSV tracks state: `candidate` → `analyzed` → `cited_in_review`

---

## Installation

```bash
git clone https://github.com/gy-hou/trendr.git
cd trendr
chmod +x install.sh
./install.sh
```

Choose **Basic** for zero extra dependencies, or **Full** for Scrapling + Obsidian + Zotero + Nano-pdf.

---

## Known Limitations

- **Not real-time**: academic APIs have rate limits (arXiv: 3s/request); full search takes a few minutes
- **Network policy variance**: some DNS/proxy routes academic domains to `198.18.x.x` (fake-ip); TrendR has fallback search but coverage may drop
- **Non-frontier model forgetting**: MiniMax M2.5 may occasionally skip Skill files despite 3-layer defense
- **Full-text reading (Basic)**: abstract only; Full mode with Nano-pdf enables PDF deep reading
- **No dual-AI review**: extensible (see paper-distill-mcp dual-review mode)

---

## Credits

- [karpathy/autoresearch](https://github.com/karpathy/autoresearch) — inspiration for autonomous research loops
- [paper-distill-mcp](https://github.com/Eclipse-Cj/paper-distill-mcp) — multi-source search architecture reference
- [OpenClaw](https://openclaw.ai) — agent runtime infrastructure
