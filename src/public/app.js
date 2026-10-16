const state = {
  overview: null,
  activeTab: "jarvis",
  selectedHarness: "cursor",
  selectedVaultFilter: null,
  vaultEntries: [],
  contradictions: [],
  selectedProjectId: null,
  selectedFormat: "technical-essay",
  currentContextPack: null,
};

function showToast(message) {
  const el = document.getElementById("toast-notification");
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.classList.remove("visible");
  }, 2800);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tabId}`);
  });
}

async function fetchJson(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function renderHudMetrics() {
  if (!state.overview) return;
  const stats = state.overview.vaultStats;
  const projects = state.overview.projects || [];
  const contraCount = state.contradictions.length;

  document.getElementById("hud-vault-count").textContent = `${stats.activeEntries} active entries`;
  document.getElementById("hud-avg-conf").textContent = `${(
    stats.avgEffectiveConfidence * 100
  ).toFixed(1)}% (90d half-life)`;
  document.getElementById("hud-contra-count").textContent =
    contraCount > 0 ? `${contraCount} conflict(s)` : "0 conflicts";
  document.getElementById("hud-content-count").textContent = `${projects.length} multi-format runs`;
}

// ============================================================================
// TAB 1: JARVIS COMMAND DECK
// ============================================================================
function renderJarvisDeck(directiveResult) {
  const history = state.overview?.directives || [];
  const current = directiveResult || history[0];
  if (!current) return;

  document.getElementById("jarvis-synthesis-output").textContent =
    current.synthesizedResponse;
  document.getElementById("jarvis-receipt-tag").textContent =
    current.qualityReceipt?.sipAttestation || "SIP-ATTESTED";
  document.getElementById("jarvis-gate-score").textContent = `Sentinel Gate: ${
    current.qualityReceipt?.overallScore ?? 100
  }/100`;

  const traceList = document.getElementById("jarvis-trace-list");
  traceList.innerHTML = (current.steps || [])
    .map(
      (s) => `
      <div class="trace-step">
        <div class="trace-step-top">
          <span class="trace-phase">0${s.stepNumber} · ${escapeHtml(s.phase)}</span>
          <span class="trace-agent">Agent: ${escapeHtml(s.agent.toUpperCase())} · ${escapeHtml(
        s.harness
      )} (${s.durationMs}ms)</span>
        </div>
        <div class="trace-summary">${escapeHtml(s.summary)}</div>
      </div>
    `
    )
    .join("");

  const checksEl = document.getElementById("jarvis-gate-checks");
  checksEl.innerHTML = (current.qualityReceipt?.checks || [])
    .map(
      (c) => `
      <div class="gate-check-item">
        <div class="gate-check-title">
          <span>${escapeHtml(c.name)}</span>
          <span>${c.score}/100</span>
        </div>
        <div class="gate-check-detail">${escapeHtml(c.detail)}</div>
      </div>
    `
    )
    .join("");

  const recalledEl = document.getElementById("jarvis-recalled-list");
  recalledEl.innerHTML = (current.recalledMemories || [])
    .map(
      (m) => `
      <div class="compact-item">
        <div class="compact-item-top">
          <span class="accent-aqua">[${escapeHtml(m.id)}] · ${escapeHtml(
        m.vault.toUpperCase()
      )}</span>
          <span>eff. conf: ${(m.effectiveConfidence * 100).toFixed(0)}% · ${
        m.daysSinceConfirmed
      }d ago</span>
        </div>
        <div>${escapeHtml(m.content)}</div>
      </div>
    `
    )
    .join("");

  const historyEl = document.getElementById("jarvis-history-list");
  historyEl.innerHTML = history
    .slice(0, 6)
    .map(
      (h) => `
      <div class="compact-item">
        <div class="compact-item-top">
          <span class="accent-violet">${escapeHtml(
            h.envelope.id.toUpperCase()
          )} · ${escapeHtml(h.parsedCommand.toUpperCase())}</span>
          <span>Lead: ${escapeHtml(h.envelope.leadAgent)} · ${escapeHtml(
        h.envelope.targetHarness
      )}</span>
        </div>
        <div>${escapeHtml(h.rawInput)}</div>
      </div>
    `
    )
    .join("");
}

// ============================================================================
// TAB 2: MULTI-AGENT HARNESS STUDIO
// ============================================================================
function renderHarnessStudio() {
  if (!state.overview) return;
  const agents = state.overview.agents || [];
  const harnesses = state.overview.harnesses || [];

  const agentsGrid = document.getElementById("council-agents-grid");
  agentsGrid.innerHTML = agents
    .map(
      (a) => `
      <div class="agent-card">
        <div class="agent-card-top">
          <span class="agent-name">${escapeHtml(a.name)}</span>
          <span class="agent-callsign">${escapeHtml(a.callsign)}</span>
        </div>
        <div class="agent-role">${escapeHtml(a.roleTitle)} · Archetype: ${escapeHtml(
        a.archetype
      )}</div>
        <div class="agent-specialty">${escapeHtml(a.specialty)}</div>
        <div class="agent-meta-row">
          <span>Vaults: ${escapeHtml(a.primaryVaults.join(", "))}</span>
          <span>${a.tasksCompleted} runs · ${a.avgLatencyMs}ms</span>
        </div>
      </div>
    `
    )
    .join("");

  const harnessList = document.getElementById("harness-adapters-list");
  harnessList.innerHTML = harnesses
    .map(
      (h) => `
      <div class="harness-item ${
        h.id === state.selectedHarness ? "active" : ""
      }" data-harness-id="${escapeHtml(h.id)}">
        <div class="harness-item-top">
          <span class="harness-name">${escapeHtml(h.name)}</span>
          <span class="mono-tag">${escapeHtml(h.memoryFile)} · ${(
        h.maxTokens / 1000
      ).toFixed(0)}k tokens</span>
        </div>
        <div class="card-desc" style="margin-bottom:4px;">${escapeHtml(
          h.strengths.join(" · ")
        )}</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">
          MCP Path: <code>${escapeHtml(h.mcpConfigPath)}</code> | Status: <span class="accent-aqua">${escapeHtml(
        h.syncStatus.toUpperCase()
      )}</span>
        </div>
      </div>
    `
    )
    .join("");

  harnessList.querySelectorAll(".harness-item").forEach((el) => {
    el.addEventListener("click", () => {
      state.selectedHarness = el.dataset.harnessId;
      renderHarnessStudio();
      compileAndRenderHarnessArtifact();
    });
  });

  renderCompiledArtifactPanel();
}

function renderCompiledArtifactPanel() {
  const pack = state.currentContextPack || state.overview?.defaultContextPack;
  if (!pack) return;
  const art = pack.compiledArtifact;
  document.getElementById(
    "compiler-title"
  ).textContent = `Compiled Contract: ${art.harnessId.toUpperCase()} (${
    art.memoryFileName
  })`;
  document.getElementById("compiler-meta-bar").innerHTML = `
    <span>Target: <strong class="accent-aqua">${escapeHtml(art.harnessId)}</strong></span>
    <span>File: <code>${escapeHtml(art.memoryFileName)}</code></span>
    <span>Artifact Tokens: <strong>${art.totalTokensUsed.toLocaleString()}</strong></span>
    <span>Attestation: <code>${escapeHtml(art.attestationSignature)}</code></span>
  `;
  document.getElementById(
    "compiler-mem-filename"
  ).textContent = `${art.memoryFileName} (Sovereign Harness Memory Contract)`;
  document.getElementById("compiler-mem-content").textContent =
    art.memoryFileContent;
  document.getElementById(
    "compiler-mcp-filename"
  ).textContent = `${art.mcpConfigPath} (MCP Registration)`;
  document.getElementById("compiler-mcp-content").textContent =
    art.mcpConfigContent;
}

async function compileAndRenderHarnessArtifact() {
  const focus =
    document.getElementById("compiler-focus-input")?.value ||
    "Full-stack multi-agent harness orchestration";
  const data = await fetchJson("/api/context/compile", {
    method: "POST",
    body: JSON.stringify({
      targetHarness: state.selectedHarness,
      taskFocus: focus,
    }),
  });
  state.currentContextPack = data.contextPack;
  renderCompiledArtifactPanel();
  renderContextBridge();
}

// ============================================================================
// TAB 3: CONTEXT & HANDOFF BRIDGE
// ============================================================================
function renderContextBridge() {
  const pack = state.currentContextPack || state.overview?.defaultContextPack;
  if (pack) {
    document.getElementById(
      "ctx-utilization-badge"
    ).textContent = `${pack.totalUsedTokens.toLocaleString()} / ${pack.usableTokens.toLocaleString()} usable tokens (${
      pack.utilizationPct
    }%)`;

    const sectionsEl = document.getElementById("ctx-sections-list");
    sectionsEl.innerHTML = (pack.sections || [])
      .map(
        (sec) => `
        <div class="ctx-section-card">
          <div class="compact-item-top">
            <span class="accent-aqua">${escapeHtml(sec.label)}</span>
            <span>${sec.usedTokens.toLocaleString()} / ${sec.budgetTokens.toLocaleString()} tokens (${
          sec.utilizationPct
        }% · ${sec.itemsCount} items)</span>
          </div>
          <div class="ctx-bar-track">
            <div class="ctx-bar-fill" style="width:${Math.min(
              100,
              sec.utilizationPct
            )}%"></div>
          </div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);white-space:pre-wrap;">${escapeHtml(
            sec.preview.slice(0, 280)
          )}${sec.preview.length > 280 ? "..." : ""}</div>
        </div>
      `
      )
      .join("");
  }

  const handoffs = state.overview?.handoffs || [];
  const ledgerEl = document.getElementById("handoff-ledger-list");
  ledgerEl.innerHTML = handoffs
    .map(
      (h) => `
      <div class="handoff-card">
        <div class="compact-item-top">
          <span class="accent-violet">${escapeHtml(
            h.id.toUpperCase()
          )} · ${escapeHtml(h.fromHarness)} → ${escapeHtml(h.toHarness)}</span>
          <span class="accent-aqua">SHA: ${escapeHtml(h.revisionSha)} · ${escapeHtml(
        h.verificationStatus.toUpperCase()
      )}</span>
        </div>
        <div style="margin:6px 0;font-weight:500;">${escapeHtml(h.summary)}</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);">
          Maker: <strong>${escapeHtml(h.makerAgent)}</strong> | Checker: <strong>${escapeHtml(
        h.checkerAgent
      )}</strong> | Digest: <code>${escapeHtml(h.integrityDigest)}</code>
        </div>
      </div>
    `
    )
    .join("");
}

// ============================================================================
// TAB 4: SIX SEMANTIC VAULTS
// ============================================================================
function renderVaultsTab() {
  if (!state.overview) return;
  const byVault = state.overview.vaultStats.byVault;
  const selectorGrid = document.getElementById("vault-selector-grid");

  selectorGrid.innerHTML = Object.values(byVault)
    .map(
      (v) => `
      <button type="button" class="vault-card-btn ${
        state.selectedVaultFilter === v.meta.id ? "active" : ""
      }" data-vault-id="${escapeHtml(v.meta.id)}">
        <div class="vault-symbol">${escapeHtml(v.meta.symbol)}</div>
        <div class="vault-card-name">${escapeHtml(v.meta.name)}</div>
        <div class="vault-card-stats">${v.count} entries · ${(
        v.avgConfidence * 100
      ).toFixed(0)}% eff. conf</div>
      </button>
    `
    )
    .join("");

  selectorGrid.querySelectorAll(".vault-card-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const vid = btn.dataset.vaultId;
      state.selectedVaultFilter = state.selectedVaultFilter === vid ? null : vid;
      await refreshVaultEntries();
    });
  });

  document.getElementById("vault-view-title").textContent =
    state.selectedVaultFilter
      ? `${byVault[state.selectedVaultFilter].meta.symbol} ${
          byVault[state.selectedVaultFilter].meta.name
        } Entries`
      : "All 6 Semantic Vault Entries (BM25 + 90-Day Half-Life Ranked)";

  const listEl = document.getElementById("vault-entries-list");
  listEl.innerHTML = state.vaultEntries
    .map(
      (e) => `
      <div class="vault-entry-card">
        <div class="compact-item-top">
          <span class="accent-aqua">[${escapeHtml(e.id)}] · ${escapeHtml(
        e.vault.toUpperCase()
      )} · ${escapeHtml(e.category)}</span>
          <span>Raw: ${(e.confidence * 100).toFixed(0)}% → <strong>Eff: ${(
        e.effectiveConfidence * 100
      ).toFixed(1)}%</strong> (${e.daysSinceConfirmed}d since confirm)</span>
        </div>
        <div style="margin:6px 0;font-size:13.5px;">${escapeHtml(e.content)}</div>
        <div class="vault-entry-footer">
          <div>
            ${(e.tags || [])
              .map((t) => `<span class="tag-pill">#${escapeHtml(t)}</span>`)
              .join("")}
            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">
              Agent: ${escapeHtml(e.authorAgent)} · Harness: ${escapeHtml(
        e.sourceHarness
      )} · <code>${escapeHtml(e.attestationHash)}</code>
            </span>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-secondary btn-sm" data-confirm-entry="${escapeHtml(
              e.id
            )}">
              sis_confirm
            </button>
            <button type="button" class="btn btn-danger btn-sm" data-invalidate-entry="${escapeHtml(
              e.id
            )}">
              sis_invalidate
            </button>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  listEl.querySelectorAll("[data-confirm-entry]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.confirmEntry;
      await fetchJson(`/api/vaults/${encodeURIComponent(id)}/confirm`, {
        method: "POST",
      });
      showToast(`Confirmed memory ${id} — temporal decay reset to 100%`);
      await refreshVaultEntries();
    });
  });

  listEl.querySelectorAll("[data-invalidate-entry]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.invalidateEntry;
      await fetchJson(`/api/vaults/${encodeURIComponent(id)}/invalidate`, {
        method: "POST",
      });
      showToast(`Invalidated stale/conflicting entry ${id}`);
      await refreshVaultEntries();
    });
  });

  // Render Contradiction Radar
  const contraBadge = document.getElementById("contra-badge-count");
  contraBadge.textContent = `${state.contradictions.length} Detected`;

  const contraList = document.getElementById("contradictions-list");
  if (state.contradictions.length === 0) {
    contraList.innerHTML = `<div class="compact-item accent-aqua">Zero active semantic contradictions across all 6 vaults.</div>`;
  } else {
    contraList.innerHTML = state.contradictions
      .map((c) => {
        const staleId =
          c.entryA.daysSinceConfirmed >= c.entryB.daysSinceConfirmed
            ? c.entryA.id
            : c.entryB.id;
        return `
        <div class="contra-card">
          <div class="compact-item-top">
            <span class="accent-gold">${escapeHtml(
              c.severity.toUpperCase()
            )} CONFLICT · Overlap: ${(c.jaccardSimilarity * 100).toFixed(0)}%</span>
            <span>${escapeHtml(c.vaultA.toUpperCase())} vs ${escapeHtml(
          c.vaultB.toUpperCase()
        )}</span>
          </div>
          <div style="font-size:12px;color:var(--accent-coral);margin-bottom:6px;">
            ${escapeHtml(c.polarityConflict)}
          </div>
          <div style="font-size:12px;margin-bottom:4px;">
            <strong>[${escapeHtml(c.entryA.id)}]:</strong> "${escapeHtml(
          c.entryA.content
        )}"
          </div>
          <div style="font-size:12px;margin-bottom:8px;">
            <strong>[${escapeHtml(c.entryB.id)}]:</strong> "${escapeHtml(
          c.entryB.content
        )}"
          </div>
          <div style="font-size:11.5px;color:var(--text-secondary);margin-bottom:8px;">
            ${escapeHtml(c.recommendation)}
          </div>
          <button type="button" class="btn btn-danger btn-sm" data-resolve-stale="${escapeHtml(
            staleId
          )}">
            Resolve Conflict (Invalidate Stale ${escapeHtml(staleId)})
          </button>
        </div>
      `;
      })
      .join("");

    contraList.querySelectorAll("[data-resolve-stale]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.resolveStale;
        await fetchJson(`/api/vaults/${encodeURIComponent(id)}/invalidate`, {
          method: "POST",
        });
        showToast(`Resolved contradiction by invalidating stale entry ${id}`);
        await refreshVaultEntries();
      });
    });
  }
}

async function refreshVaultEntries() {
  const q = document.getElementById("vault-search-input")?.value || "";
  const params = new URLSearchParams();
  if (state.selectedVaultFilter) params.set("vault", state.selectedVaultFilter);
  if (q.trim()) params.set("q", q.trim());

  const data = await fetchJson(`/api/vaults?${params.toString()}`);
  state.vaultEntries = data.entries || [];
  state.contradictions = data.contradictions || [];
  if (state.overview) {
    state.overview.vaultStats = data.stats;
  }
  renderHudMetrics();
  renderVaultsTab();
}

// ============================================================================
// TAB 5: CONTENT PRODUCTION STUDIO
// ============================================================================
function renderContentStudio() {
  const projects = state.overview?.projects || [];
  if (!state.selectedProjectId && projects.length > 0) {
    state.selectedProjectId = projects[0].id;
  }

  const listEl = document.getElementById("content-projects-list");
  listEl.innerHTML = projects
    .map(
      (p) => `
      <div class="content-project-item ${
        p.id === state.selectedProjectId ? "active" : ""
      }" data-project-id="${escapeHtml(p.id)}">
        <div class="compact-item-top">
          <span class="accent-aqua">${escapeHtml(p.id.toUpperCase())} · ${escapeHtml(
        p.pillar
      )}</span>
          <span class="mono-tag">${escapeHtml(p.stage.toUpperCase())}</span>
        </div>
        <div style="font-weight:600;font-size:13px;">${escapeHtml(p.title)}</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-top:4px;">
          Gate Score: ${p.qualityScorecard.overallScore}/100 · ${
        p.citedEntryIds.length
      } vault citations
        </div>
      </div>
    `
    )
    .join("");

  listEl.querySelectorAll(".content-project-item").forEach((el) => {
    el.addEventListener("click", () => {
      state.selectedProjectId = el.dataset.projectId;
      renderContentStudio();
    });
  });

  const activeProject =
    projects.find((p) => p.id === state.selectedProjectId) || projects[0];
  if (!activeProject) return;

  document.getElementById("studio-pillar-tag").textContent = `${activeProject.pillar.toUpperCase()} // ${activeProject.sipAttestation}`;
  document.getElementById("studio-project-title").textContent =
    activeProject.title;

  const stages = ["brief", "research", "draft", "review", "attested", "published"];
  const currentIdx = stages.indexOf(activeProject.stage);
  document.getElementById("studio-stage-stepper").innerHTML = stages
    .map((st, idx) => {
      const cls =
        idx < currentIdx ? "completed" : idx === currentIdx ? "current" : "";
      return `<div class="stage-step ${cls}">${idx + 1}. ${st}</div>`;
    })
    .join("");

  const sc = activeProject.qualityScorecard;
  document.getElementById("studio-scorecard-strip").innerHTML = `
    <div class="scorecard-metric">
      <span class="scorecard-metric-label">OVERALL GATE</span>
      <span class="scorecard-metric-val">${sc.overallScore}/100</span>
    </div>
    <div class="scorecard-metric">
      <span class="scorecard-metric-label">VOICE ALIGNMENT</span>
      <span class="scorecard-metric-val">${sc.voiceAlignment}%</span>
    </div>
    <div class="scorecard-metric">
      <span class="scorecard-metric-label">VAULT GROUNDING</span>
      <span class="scorecard-metric-val">${sc.vaultGrounding}%</span>
    </div>
    <div class="scorecard-metric">
      <span class="scorecard-metric-label">ZERO-SLOP AUDIT</span>
      <span class="scorecard-metric-val">${sc.zeroSlopScore}%</span>
    </div>
    <div class="scorecard-metric">
      <span class="scorecard-metric-label">STRUCTURAL CLARITY</span>
      <span class="scorecard-metric-val">${sc.structuralClarity}%</span>
    </div>
  `;

  document.querySelectorAll("#studio-format-tabs .format-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.format === state.selectedFormat);
  });

  document.getElementById("studio-output-pre").textContent =
    activeProject.outputs[state.selectedFormat] || "";

  document.getElementById("studio-research-notes").innerHTML = [
    ...(activeProject.qualityScorecard.notes || []).map(
      (n) => `<div class="accent-aqua">✓ ${escapeHtml(n)}</div>`
    ),
    ...(activeProject.researchNotes || []).map(
      (r) => `<div>• ${escapeHtml(r)}</div>`
    ),
  ].join("");
}

// ============================================================================
// INITIALIZATION & EVENT LISTENERS
// ============================================================================
async function initApp() {
  // Navigation tabs
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // HUD pill shortcuts
  document.querySelectorAll(".hud-pill[data-goto-tab]").forEach((pill) => {
    pill.addEventListener("click", () => switchTab(pill.dataset.gotoTab));
  });

  // Quick Directive preset chips
  document.querySelectorAll(".preset-chip").forEach((chip) => {
    chip.addEventListener("click", async () => {
      const directive = chip.dataset.directive;
      const inputEl = document.getElementById("jarvis-input");
      inputEl.value = directive;
      await submitJarvisDirective();
    });
  });

  // Jarvis Directive form
  document
    .getElementById("jarvis-directive-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitJarvisDirective();
    });

  // Harness Compiler buttons
  document
    .getElementById("recompile-harness-btn")
    .addEventListener("click", () => compileAndRenderHarnessArtifact());

  document.getElementById("copy-harness-btn").addEventListener("click", () => {
    const content = document.getElementById("compiler-mem-content").textContent;
    navigator.clipboard?.writeText(content);
    showToast("Copied compiled harness contract to clipboard");
  });

  // Context budget sliders
  const sliderIds = [
    ["slider-rules", "val-rules"],
    ["slider-task", "val-task"],
    ["slider-vault", "val-vault"],
    ["slider-history", "val-history"],
  ];
  sliderIds.forEach(([sId, vId]) => {
    const slider = document.getElementById(sId);
    const valSpan = document.getElementById(vId);
    slider.addEventListener("input", () => {
      valSpan.textContent = slider.value;
    });
  });

  document
    .getElementById("context-budget-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const targetHarness = document.getElementById("ctx-harness-select").value;
      const taskFocus = document.getElementById("ctx-focus-input").value;
      const allocation = {
        systemRulesPct: Number(document.getElementById("slider-rules").value),
        activeTaskPct: Number(document.getElementById("slider-task").value),
        vaultRecallPct: Number(document.getElementById("slider-vault").value),
        episodicHistoryPct: Number(
          document.getElementById("slider-history").value
        ),
      };
      const data = await fetchJson("/api/context/compile", {
        method: "POST",
        body: JSON.stringify({ targetHarness, taskFocus, allocation }),
      });
      state.currentContextPack = data.contextPack;
      state.selectedHarness = targetHarness;
      renderContextBridge();
      renderHarnessStudio();
      showToast(`Recompiled Context Pack for ${targetHarness}`);
    });

  // Handoff creation form
  document
    .getElementById("handoff-create-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const fromHarness = document.getElementById("ho-from").value;
      const toHarness = document.getElementById("ho-to").value;
      const revisionSha = document.getElementById("ho-sha").value;
      const summary = document.getElementById("ho-summary").value;
      const data = await fetchJson("/api/context/handoffs", {
        method: "POST",
        body: JSON.stringify({ fromHarness, toHarness, revisionSha, summary }),
      });
      state.overview.handoffs = data.handoffs;
      document.getElementById("ho-summary").value = "";
      renderContextBridge();
      showToast(
        `Minted revision-scoped handoff ${data.handoff.id} (${fromHarness} → ${toHarness})`
      );
    });

  // Vault Search & Reset
  document
    .getElementById("vault-search-btn")
    .addEventListener("click", () => refreshVaultEntries());
  document
    .getElementById("vault-search-input")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        refreshVaultEntries();
      }
    });
  document
    .getElementById("reset-vault-filter-btn")
    .addEventListener("click", async () => {
      state.selectedVaultFilter = null;
      document.getElementById("vault-search-input").value = "";
      await refreshVaultEntries();
    });

  // Append Memory Form
  document
    .getElementById("append-memory-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const vault = document.getElementById("mem-vault-select").value;
      const category = document.getElementById("mem-category-select").value;
      const authorAgent = document.getElementById("mem-agent-select").value;
      const content = document.getElementById("mem-content-input").value;
      const tags = document.getElementById("mem-tags-input").value;

      const data = await fetchJson("/api/vaults/entries", {
        method: "POST",
        body: JSON.stringify({ vault, category, authorAgent, content, tags }),
      });
      document.getElementById("mem-content-input").value = "";
      document.getElementById("mem-tags-input").value = "";
      await refreshVaultEntries();
      showToast(`Appended attested entry ${data.entry.id} to ${vault.toUpperCase()} vault`);
    });

  // Content Studio Format Tabs & Actions
  document.querySelectorAll("#studio-format-tabs .format-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedFormat = btn.dataset.format;
      renderContentStudio();
    });
  });

  document.getElementById("copy-content-btn").addEventListener("click", () => {
    const text = document.getElementById("studio-output-pre").textContent;
    navigator.clipboard?.writeText(text);
    showToast(`Copied ${state.selectedFormat} output to clipboard`);
  });

  document
    .getElementById("advance-stage-btn")
    .addEventListener("click", async () => {
      if (!state.selectedProjectId) return;
      const data = await fetchJson(
        `/api/content/${encodeURIComponent(state.selectedProjectId)}/advance`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );
      state.overview.projects = data.projects;
      state.overview.vaultStats = data.vaultStats;
      renderHudMetrics();
      renderContentStudio();
      showToast(
        `Advanced "${data.project.title}" to stage: ${data.project.stage.toUpperCase()}`
      );
    });

  document
    .getElementById("create-content-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("cp-title").value;
      const topic = document.getElementById("cp-topic").value;
      const pillar = document.getElementById("cp-pillar").value;
      const targetHarness = document.getElementById("cp-harness").value;

      const data = await fetchJson("/api/content", {
        method: "POST",
        body: JSON.stringify({ title, topic, pillar, targetHarness }),
      });
      state.overview.projects = data.projects;
      state.selectedProjectId = data.project.id;
      document.getElementById("cp-title").value = "";
      document.getElementById("cp-topic").value = "";
      renderHudMetrics();
      renderContentStudio();
      showToast(`Created 4-format Content Production Run ${data.project.id}`);
    });

  // Load initial data
  const [overviewData, vaultsData] = await Promise.all([
    fetchJson("/api/overview"),
    fetchJson("/api/vaults"),
  ]);
  state.overview = overviewData;
  state.currentContextPack = overviewData.defaultContextPack;
  state.vaultEntries = vaultsData.entries || [];
  state.contradictions = vaultsData.contradictions || [];

  renderHudMetrics();
  renderJarvisDeck();
  renderHarnessStudio();
  renderContextBridge();
  renderVaultsTab();
  renderContentStudio();
}

async function submitJarvisDirective() {
  const input = document.getElementById("jarvis-input").value;
  const preferredHarness = document.getElementById(
    "jarvis-harness-select"
  ).value;
  if (!input.trim()) return;

  const data = await fetchJson("/api/jarvis/command", {
    method: "POST",
    body: JSON.stringify({ input, preferredHarness }),
  });

  state.overview.directives = data.history;
  state.overview.vaultStats = data.vaultStats;
  state.overview.projects = data.projects;
  state.overview.handoffs = data.handoffs;
  state.currentContextPack = data.result.contextPack;

  renderHudMetrics();
  renderJarvisDeck(data.result);
  renderHarnessStudio();
  renderContextBridge();
  await refreshVaultEntries();
  renderContentStudio();
  showToast(
    `Jarvis executed [${data.result.parsedCommand.toUpperCase()}] · Gate: ${
      data.result.qualityReceipt.overallScore
    }/100`
  );
}

initApp().catch((err) => {
  console.error("Failed to initialize SIS Nexus UI:", err);
});
