---
layout: page
title: learn-english skill for agents
description: A prompt-engineered framework for vocabulary memorization, sentence analysis, and collaborative corpus building.
img: assets/img/6.jpg
importance: 4
category: agent-skills
---

# Abstract

This project presents a prompt-engineered framework for agent-assisted English learning. The design objective is to improve vocabulary retention efficiency through rapid mnemonic generation, sentence-level interpretation, and bilingual explanation pipelines. The current implementation is a prompt protocol and has **not yet been packaged as a formal agent skill**.

## Demonstrations

- Demo: Click Here
- Try More Advanced Prompts: Click Here

## Community Contribution Protocol

If you have a GPT-4 Plus account, you are invited to contribute by uploading your vocabulary-list outputs to repository issues. This collaborative mechanism allows learners without GPT-4 Plus access to benefit from curated results.

## System Modules

| Module | Function |
| ------ | -------- |
| Sentence Analyze (2024-04-06) | Structured analysis of sentence grammar and semantics |
| Chinese Version | Chinese instructional prompt set |
| English Version | English instructional prompt set |
| Result-EnglishVersion | Output archive for English-mode responses |
| Result-ChineseVersion | Output archive for Chinese-mode responses |
| Partial Result | Demonstration subset for quick inspection |

The demonstration output is designed for direct migration into spaced-repetition tools (e.g., Anki), where mnemonic variants can be reviewed as cards.

## Prerequisites and Usage Boundary

- Minimum learner level: A1 English proficiency.
- Recommended model tier: GPT-4 Plus for best mnemonic relevance and linguistic accuracy.
- If GPT-4 Plus is unavailable, use precompiled outputs stored in `/GRE`, `/TOEFL`, and related folders.
- Avoid running GPT-4-specific prompts on lower-capability models when accuracy is critical.

## Quick Start

### I. What Is Mr.G?

Mr.G is a prompt series for English learning with three major functions:

- Automatic generation and switching of mnemonic strategies for hard vocabulary (targeting one-minute memorization cycles).
- Analysis of difficult vocabulary, sentences, and paragraphs.
- Repository-based restoration of mnemonic corpora for GRE, TOEFL, IELTS, and Duolingo-style preparation.

### II. Operational Procedure

1. Open the `/prompts` directory and select the prompt file aligned with your task.
2. Input target vocabulary, phrasal verbs, sentences, or short paragraphs.
3. Run the corresponding model variant:
   - Use prompts labeled for GPT-3.5 when operating on GPT-3.5.
   - Use `GPT3.5-API` versions when token conservation is required.
   - Use GPT-4 Plus prompts for full feature access.
4. Export outputs to Anki, Notion, or Obsidian for long-term review and traceability.

### III. Extended Function

- `G-GPT4.md`: grouped-vocabulary processing workflow (updated).

## Recommended Note-Taking Stack

- Anki
- Notion
- Obsidian

These tools support structured storage, iterative review, and contribution back to the shared corpus.
