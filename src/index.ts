export * from "./types.js";
export * from "./vault-engine.js";
export * from "./harness-engine.js";
export * from "./context-engine.js";
export * from "./content-engine.js";
export * from "./jarvis-engine.js";

import { ContentProductionEngine } from "./content-engine.js";
import { ContextContinuityEngine } from "./context-engine.js";
import { MultiAgentHarnessEngine } from "./harness-engine.js";
import { JarvisCommandEngine } from "./jarvis-engine.js";
import { SovereignVaultEngine } from "./vault-engine.js";

export interface SisNexusRuntime {
  vaultEngine: SovereignVaultEngine;
  harnessEngine: MultiAgentHarnessEngine;
  contextEngine: ContextContinuityEngine;
  contentEngine: ContentProductionEngine;
  jarvisEngine: JarvisCommandEngine;
}

export function createSisNexusRuntime(options?: {
  vaultDir?: string;
  seedDefaults?: boolean;
}): SisNexusRuntime {
  const vaultEngine = new SovereignVaultEngine(options);
  const harnessEngine = new MultiAgentHarnessEngine();
  const contextEngine = new ContextContinuityEngine(vaultEngine, harnessEngine);
  const contentEngine = new ContentProductionEngine(vaultEngine);
  const jarvisEngine = new JarvisCommandEngine({
    vaultEngine,
    harnessEngine,
    contextEngine,
    contentEngine,
  });

  return {
    vaultEngine,
    harnessEngine,
    contextEngine,
    contentEngine,
    jarvisEngine,
  };
}
