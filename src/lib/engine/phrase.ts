import type { Condition, Effect, Mechanic, Project } from "./types";

function terrainName(project: Project, id: string) {
  return project.terrains.find((t) => t.id === id)?.name ?? id;
}

function statName(project: Project, key: string) {
  return project.stats.find((s) => s.key === key)?.label ?? key;
}

export function conditionPhrase(c: Condition, project: Project): string {
  switch (c.op) {
    case "always":
      return "always";
    case "tag":
      return `tagged ${c.any.join(" or ") || "nothing"}`;
    case "stat":
      return `${statName(project, c.stat)} is ${c.cmp === "lte" ? "at most" : "at least"} ${c.value}`;
    case "on":
      return `standing on ${terrainName(project, c.terrain)}`;
    case "nearThing":
      return `a ${c.tag} is within ${c.radius}`;
    case "awayThing":
      return `no ${c.tag} within ${c.radius}`;
    case "nearTerrain":
      return `${terrainName(project, c.terrain)} is within ${c.radius}`;
    case "crowd":
      return `${c.cmp === "lte" ? "at most" : "at least"} ${c.value} ${c.tag} within ${c.radius}`;
    case "onEdge":
      return "on the edge of the yard";
    case "every":
      return `every ${c.n} beats`;
    case "chance":
      return `a ${c.pct}% chance`;
    default:
      return "a test";
  }
}

export function effectPhrase(e: Effect, project: Project): string {
  switch (e.op) {
    case "stat":
      return `shift ${statName(project, e.stat)} by ${e.delta}`;
    case "seekThing":
      return `step toward the nearest ${e.tag}`;
    case "seekTerrain":
      return `step toward ${terrainName(project, e.terrain)}`;
    case "digToward":
      return `dig toward ${terrainName(project, e.terrain)}`;
    case "fleeThing":
      return `step away from ${e.tag}`;
    case "fleeEdge":
      return "step toward the edge";
    case "wander":
      return "wander";
    case "excavate":
      return "excavate this tile";
    case "hurt":
      return `harm an adjacent ${e.tag}, ${statName(project, e.stat)} −${e.amount}`;
    case "removeNearest":
      return `remove an adjacent ${e.tag}`;
    case "deposit":
      return `bank carried ${statName(project, e.stat)}`;
    case "withdraw":
      return `take ${e.amount} ${statName(project, e.stat)} from the hoard`;
    case "vanishIf":
      return `leave the yard if ${statName(project, e.stat)} is ${e.cmp === "lte" ? "at most" : "at least"} ${e.value}`;
    default:
      return "act";
  }
}

export function lawSentence(m: Mechanic, project: Project): string {
  const when = m.when.length ? m.when.map((c) => conditionPhrase(c, project)).join(", and ") : "always";
  const then = m.then.length ? m.then.map((e) => effectPhrase(e, project)).join(", then ") : "do nothing";
  const head = m.kind === "pulse" ? "Each beat" : "When it is free to act";
  return `${head}, if ${when}: ${then}.`;
}
