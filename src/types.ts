export type VaultType =
  | "strategic"
  | "technical"
  | "creative"
  | "operational"
  | "wisdom"
  | "horizon";

export interface VaultMetadata {
  id: VaultType;
  name: string;
  symbol: string;
  purpose: string;
  accentColor: string;
  exampleEntry: string;
}

export type EntryCategory =
  | "architecture"
  | "pattern"
  | "decision"
  | "principle"
  | "voice"
  | "workflow"
  | "vision"
  | "directive"
  | "handoff";

export type HarnessId =
  | "claude-code"
  | "cursor"
  | "codex"
  | "gemini-cli"
  | "opencode"
  | "antigravity";

export type VoiceArchetype =
  | "architect"
  | "sovereign-creator"
  | "protocol-defender"
  | "implementer"
  | "overseer";

export type AgentId =
  | "orchestrator"
  | "prime"
  | "architect"
  | "navigator"
  | "sentinel"
  | "weaver"
  | "sage";

export interface VaultEntry {
  id: string;
  vault: VaultType;
  content: string;
  category: EntryCategory;
  tags: string[];
  confidence: number;
  createdAt: string;
  lastConfirmed: string;
  sourceHarness: HarnessId;
  authorAgent: AgentId;
  attestationHash: string;
  expired?: boolean;
  contradicts?: string[];
}

export interface ScoredVaultEntry extends VaultEntry {
  effectiveConfidence: number;
  daysSinceConfirmed: number;
  relevanceScore: number;
  matchedTerms: string[];
}

export interface ContradictionReport {
  id: string;
  entryA: VaultEntry;
  entryB: VaultEntry;
  vaultA: VaultType;
  vaultB: VaultType;
  jaccardSimilarity: number;
  polarityConflict: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
}

export interface AgentDefinition {
  id: AgentId;
  name: string;
  roleTitle: string;
  archetype: VoiceArchetype;
  callsign: string;
  specialty: string;
  decisionRights: string[];
  primaryVaults: VaultType[];
  preferredHarnesses: HarnessId[];
  systemDirective: string;
  status: "active" | "standby" | "executing";
  tasksCompleted: number;
  avgLatencyMs: number;
}

export interface HarnessAdapterSpec {
  id: HarnessId;
  name: string;
  memoryFile: string;
  mcpConfigPath: string;
  maxTokens: number;
  defaultReserveTokens: number;
  strengths: string[];
  protocolFormat: "markdown-rules" | "toml-hybrid" | "json-manifest";
  activeSessions: number;
  syncStatus: "synced" | "drift-detected" | "rebuilding";
  lastSyncedAt: string;
}

export interface ContextBudgetAllocation {
  systemRulesPct: number;
  activeTaskPct: number;
  vaultRecallPct: number;
  episodicHistoryPct: number;
}

export interface ContextSection {
  id: "system-rules" | "active-task" | "vault-recall" | "episodic-history";
  label: string;
  budgetTokens: number;
  usedTokens: number;
  utilizationPct: number;
  itemsCount: number;
  preview: string;
}

export interface CompiledHarnessArtifact {
  harnessId: HarnessId;
  memoryFileName: string;
  memoryFileContent: string;
  mcpConfigPath: string;
  mcpConfigContent: string;
  totalTokensUsed: number;
  maxTokens: number;
  attestationSignature: string;
  generatedAt: string;
}

export interface ContextPack {
  id: string;
  targetHarness: HarnessId;
  taskFocus: string;
  maxTokens: number;
  usableTokens: number;
  totalUsedTokens: number;
  utilizationPct: number;
  sections: ContextSection[];
  selectedEntries: ScoredVaultEntry[];
  assignedAgents: AgentId[];
  compiledArtifact: CompiledHarnessArtifact;
  createdAt: string;
}

export interface ContextHandoff {
  id: string;
  fromHarness: HarnessId;
  toHarness: HarnessId;
  repository: string;
  branch: string;
  revisionSha: string;
  summary: string;
  completedObjectives: string[];
  pendingTasks: string[];
  modifiedFiles: string[];
  openRisks: string[];
  makerAgent: AgentId;
  checkerAgent: AgentId;
  verificationStatus: "verified" | "pending-review" | "rejected";
  integrityDigest: string;
  createdAt: string;
}

export interface QualityGateCheck {
  name: string;
  passed: boolean;
  score: number;
  detail: string;
}

export interface QualityGateReceipt {
  id: string;
  makerAgent: AgentId;
  checkerAgent: AgentId;
  harness: HarnessId;
  passed: boolean;
  overallScore: number;
  checks: QualityGateCheck[];
  sipAttestation: string;
  timestamp: string;
}

export interface TaskEnvelope {
  id: string;
  title: string;
  intent: string;
  commandType:
    | "directive"
    | "forge"
    | "produce"
    | "handoff"
    | "recall"
    | "audit"
    | "attest"
    | "compile-harness";
  priority: "P0-critical" | "P1-high" | "P2-standard";
  leadAgent: AgentId;
  supportingAgents: AgentId[];
  targetHarness: HarnessId;
  vaultTouches: VaultType[];
  status: "queued" | "executing" | "verifying" | "completed";
  createdAt: string;
}

export interface JarvisExecutionStep {
  stepNumber: number;
  phase:
    | "INTENT_PARSE"
    | "VAULT_RECALL"
    | "CONTEXT_BUDGET"
    | "COUNCIL_DISPATCH"
    | "MAKER_EXECUTION"
    | "SENTINEL_GATE"
    | "SIP_ATTESTATION";
  agent: AgentId;
  harness: HarnessId;
  summary: string;
  durationMs: number;
  status: "ok" | "warning";
  artifactSnippet?: string;
}

export interface JarvisDirectiveResult {
  id: string;
  rawInput: string;
  parsedCommand: TaskEnvelope["commandType"];
  envelope: TaskEnvelope;
  recalledMemories: ScoredVaultEntry[];
  contextPack: ContextPack;
  steps: JarvisExecutionStep[];
  qualityReceipt: QualityGateReceipt;
  synthesizedResponse: string;
  memoryWritten?: VaultEntry;
  createdProject?: ContentProject;
  createdHandoff?: ContextHandoff;
  timestamp: string;
}

export type ContentStage =
  | "brief"
  | "research"
  | "draft"
  | "review"
  | "attested"
  | "published";

export type ContentFormat =
  | "technical-essay"
  | "social-thread"
  | "launch-changelog"
  | "jarvis-briefing-script";

export interface ContentQualityScorecard {
  overallScore: number;
  voiceAlignment: number;
  vaultGrounding: number;
  zeroSlopScore: number;
  structuralClarity: number;
  passedGate: boolean;
  notes: string[];
}

export interface ContentProject {
  id: string;
  title: string;
  topic: string;
  audience: string;
  pillar: "Harness Engineering" | "Sovereign Memory" | "Jarvis Systems" | "Agentic Content Ops";
  stage: ContentStage;
  leadAgent: AgentId;
  reviewerAgent: AgentId;
  targetHarness: HarnessId;
  groundingVaults: VaultType[];
  citedEntryIds: string[];
  researchNotes: string[];
  outputs: Record<ContentFormat, string>;
  qualityScorecard: ContentQualityScorecard;
  sipAttestation: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentProjectInput {
  title: string;
  topic: string;
  audience?: string;
  pillar?: ContentProject["pillar"];
  targetHarness?: HarnessId;
  groundingVaults?: VaultType[];
}
