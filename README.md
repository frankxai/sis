# SIS Nexus — Full-Stack Multi-Agent Harness Engineering, Jarvis Command System & Content Production Substrate

> **One shared sovereign brain, context continuity bridge, Jarvis command deck, and multi-channel content studio across your entire AI agent fleet.**

**SIS Nexus** (`@frankxai/sis-nexus`) is a full-stack TypeScript reference platform for **Starlight Intelligence System (SIS)** built on the **Starlight Intelligence Protocol (`SIP-v1.1.1`)**. It unifies four operational pillars in a single zero-bloat full-stack web application, REST API, and CLI:

1. **Jarvis Command Core (`JarvisCommandEngine`)** — Natural-language & slash-command mission dispatch (`/directive`, `/forge`, `/produce`, `/handoff`, `/audit`, `/recall`, `/attest`, `/compile-harness`) with a 7-stage execution trace and automated **Maker/Checker** verification gates.
2. **Multi-Agent Harness Engineering (`MultiAgentHarnessEngine`)** — Coordinates the **7 Named Council Agents** (*Orchestrator*, *Prime*, *Architect*, *Navigator*, *Sentinel*, *Weaver*, *Sage*) across **6 Platform Harnesses** (*Claude Code*, *Cursor*, *Codex*, *Gemini CLI*, *OpenCode*, *Antigravity*) and compiles live attested harness contracts (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `GEMINI.md`, and `mcp.json` / `config.toml`).
3. **Sovereign Memory & Context Continuity (`SovereignVaultEngine` + `ContextContinuityEngine`)** — Six human-readable semantic vaults (`◆ Strategic`, `⬡ Technical`, `✦ Creative`, `▸ Operational`, `◎ Wisdom`, `↗ Horizon`) with **BM25 lexical ranking**, **90-day confidence half-life decay**, **word-trigram Jaccard + polarity contradiction detection**, dynamic token-budget compilation, and **revision-scoped cross-harness handoff packets**.
4. **Content Production Studio (`ContentProductionEngine`)** — End-to-end 6-stage pipeline (`brief` → `research` → `draft` → `review` → `attested` → `published`) that transforms vault-grounded engineering decisions into **4 simultaneous publication formats** (*Technical RFC / Essay*, *Executive Social Thread*, *Release Changelog*, and *Jarvis Audio/Video Briefing Script*) audited by Sentinel's editorial quality gate.

---

## Ecosystem Navigation

- **Protocol & Reference Monorepo:** [`frankxai/Starlight-Intelligence-System`](https://github.com/frankxai/Starlight-Intelligence-System)
- **Minimal SIP Adoption Kit:** [`frankxai/starlight`](https://github.com/frankxai/starlight)
- **Creator / Agent OS Runtime:** [`frankxai/agentic-creator-os`](https://github.com/frankxai/agentic-creator-os)
- **Creative Platform:** [`frankxai/arcanea`](https://github.com/frankxai/arcanea)

---

## Quick Start

```bash
npm install
npm run build
npm test
npm start
```

Open **`http://localhost:4173`** to launch the interactive **SIS Nexus Web Command Center**.

### CLI Usage

```bash
# View 6-vault telemetry, 7 council agents, and 6 platform harnesses
node dist/cli.js status

# Search across the 6 semantic vaults (BM25 + 90-day half-life decay)
node dist/cli.js search "maker checker context budget"

# Dispatch a Jarvis directive to the Council
node dist/cli.js directive "/forge Architect a zero-drift context handoff bridge"

# Compile a ready-to-use harness contract (cursor, claude-code, codex, gemini-cli, opencode, antigravity)
node dist/cli.js compile cursor "Multi-agent harness orchestration and content production"
```

---

## System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                   JARVIS WEB COMMAND CENTER & REST API                     │
│  01 Jarvis Deck · 02 Harness Studio · 03 Context Bridge · 04 Vaults · 05 Studio │
└───────────────┬───────────────────────────────┬────────────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────────┐
│      JARVIS COMMAND CORE          │ │     CONTENT PRODUCTION STUDIO        │
│ • Intent & Slash-Command Parser   │ │ • 6-Stage Pipeline (Brief→Published) │
│ • Typed Task Envelope Minting     │ │ • 4 Compiled Formats (RFC, Thread,   │
│ • 7-Stage Execution Trace         │ │   Changelog, Jarvis Briefing Script) │
│ • Sentinel Maker/Checker Gate     │ │ • Zero-Slop & Vault Citation Audit   │
└───────────────┬───────────────────┘ └─────────────────┬────────────────────┘
                │                                       │
                └───────────────────┬───────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│            MULTI-AGENT HARNESS & CONTEXT CONTINUITY ENGINE                 │
│ • 7 Council Agents: Orchestrator, Prime, Architect, Navigator,             │
│   Sentinel, Weaver, Sage (mapped to SIP's 5 Voice Archetypes)              │
│ • 6 Platform Harnesses: Claude Code (200k), Cursor (128k), Codex (192k),   │
│   Gemini CLI (1M), OpenCode (128k), Antigravity (1M)                       │
│ • Revision-Scoped Handoff Ledger (Git SHA + Cooperative Integrity Digest)  │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                  SIX SEMANTIC VAULTS (SOVEREIGN MEMORY)                    │
│  ◆ Strategic · ⬡ Technical · ✦ Creative · ▸ Operational · ◎ Wisdom · ↗ Horizon │
│  • Hybrid BM25 Ranking + 90-Day Temporal Half-Life Confidence Decay        │
│  • Word-Trigram Jaccard + Polarity Contradiction Radar                     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## The Six Semantic Vaults

| Vault | Symbol | Purpose |
| :--- | :---: | :--- |
| **Strategic** | ◆ | Business insights, architectural moats, and portfolio positioning |
| **Technical** | ⬡ | Stack decisions, BM25 retrieval patterns, and harness adapter schemas |
| **Creative** | ✦ | Starlight dark technical design system, voice rules, and zero-slop standards |
| **Operational** | ▸ | Maker/Checker verification gates, edit safety, and worktree discipline |
| **Wisdom** | ◎ | First principles, signal-to-noise laws, and compounding cognition truths |
| **Horizon** | ↗ | Long-range sovereign human intent and Jarvis command roadmap |

Temporal confidence decays with a **90-day half-life**:

\[
c_{\text{eff}}(t) = \max\left(0.05,\; c_0 \cdot 0.5^{\Delta t / 90}\right)
\]

Confirming an entry via `sis_confirm` (`POST /api/vaults/:id/confirm`) resets $\Delta t \to 0$ and restores full effective confidence.

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health & SIP protocol readiness check |
| `GET` | `/api/overview` | Full telemetry snapshot (vault stats, council agents, harnesses, contradictions, handoffs, projects, directives) |
| `GET` | `/api/vaults` | Query/search vault entries (`?vault=`, `?q=`, `?tag=`) and active contradiction reports |
| `POST` | `/api/vaults/entries` | Append a new attested memory entry to any of the 6 vaults |
| `POST` | `/api/vaults/:id/confirm` | Touch `lastConfirmed` (`sis_confirm`) and boost confidence |
| `POST` | `/api/vaults/:id/invalidate` | Mark a stale or contradictory entry as expired (`sis_invalidate`) |
| `POST` | `/api/context/compile` | Compile a token-budgeted `ContextPack` and platform memory file (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `GEMINI.md`) |
| `GET` | `/api/context/handoffs` | List revision-scoped cross-harness handoff packets |
| `POST` | `/api/context/handoffs` | Mint a new cross-harness handoff packet with Maker/Checker verification |
| `POST` | `/api/jarvis/command` | Dispatch a Jarvis directive or slash command through the 7-stage Council pipeline |
| `GET` | `/api/content` | List multi-format Content Production Studio runs |
| `POST` | `/api/content` | Create a new 4-format Content Production run grounded in vault citations |
| `POST` | `/api/content/:id/advance` | Advance a content project across pipeline stages (`brief` → `published`) |

---

## License

MIT — see [`LICENSE`](LICENSE). **Built on SIP** · Starlight Intelligence Protocol v1.1.1.
