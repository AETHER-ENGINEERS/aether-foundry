import { bootRuntime as bootJs, diagnose as diagnoseJs, stepWorld as stepJs } from "./sim-core.js";
import type { Diagnosis, EngineDef, Project, Yard } from "./types";

export function bootRuntime(project: Project, engine: EngineDef): Yard {
  return bootJs(project, engine) as Yard;
}

export function stepWorld(yard: Yard, project: Project, engine: EngineDef): Yard {
  return stepJs(yard, project, engine) as Yard;
}

export function diagnose(yard: Yard, project: Project, engine: EngineDef, entityId: string): Diagnosis[] {
  return diagnoseJs(yard, project, engine, entityId) as Diagnosis[];
}
