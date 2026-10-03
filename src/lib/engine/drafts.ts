import type { Condition, Effect, Project } from "./types";

export function freshCondition(op: Condition["op"], project: Project): Condition {
  const stat = project.stats[0]?.key ?? "vigor";
  const terrain = project.terrains.find((t) => t.passable)?.id ?? project.terrains[0]?.id ?? "flag";
  const tag = project.things[0]?.tags[0] ?? "cast";
  switch (op) {
    case "always":
      return { op: "always" };
    case "tag":
      return { op: "tag", any: [tag] };
    case "stat":
      return { op: "stat", stat, cmp: "gte", value: 50 };
    case "on":
      return { op: "on", terrain };
    case "nearThing":
      return { op: "nearThing", tag, radius: 2 };
    case "awayThing":
      return { op: "awayThing", tag, radius: 3 };
    case "nearTerrain":
      return { op: "nearTerrain", terrain, radius: 2 };
    case "crowd":
      return { op: "crowd", tag, radius: 1, cmp: "gte", value: 3 };
    case "onEdge":
      return { op: "onEdge" };
    case "every":
      return { op: "every", n: 4 };
    case "chance":
      return { op: "chance", pct: 25 };
    default:
      return { op: "always" };
  }
}

export function freshEffect(op: Effect["op"], project: Project): Effect {
  const stat = project.stats[0]?.key ?? "vigor";
  const terrain = project.terrains[0]?.id ?? "earth";
  const tag = project.things[0]?.tags[0] ?? "cast";
  switch (op) {
    case "stat":
      return { op: "stat", stat, delta: -1 };
    case "seekThing":
      return { op: "seekThing", tag };
    case "seekTerrain":
      return { op: "seekTerrain", terrain };
    case "digToward":
      return { op: "digToward", terrain };
    case "fleeThing":
      return { op: "fleeThing", tag };
    case "fleeEdge":
      return { op: "fleeEdge" };
    case "wander":
      return { op: "wander" };
    case "excavate":
      return { op: "excavate" };
    case "hurt":
      return { op: "hurt", tag, stat, amount: 10 };
    case "removeNearest":
      return { op: "removeNearest", tag };
    case "deposit":
      return { op: "deposit", stat };
    case "withdraw":
      return { op: "withdraw", stat, amount: 1 };
    case "vanishIf":
      return { op: "vanishIf", stat, cmp: "gte", value: 1, tally: "left" };
    default:
      return { op: "wander" };
  }
}

export const CONDITION_OPS: { op: Condition["op"]; label: string }[] = [
  { op: "always", label: "Always" },
  { op: "tag", label: "Carries a tag" },
  { op: "stat", label: "A measure" },
  { op: "on", label: "Standing on" },
  { op: "nearThing", label: "Near a tag" },
  { op: "awayThing", label: "Clear of a tag" },
  { op: "nearTerrain", label: "Near ground" },
  { op: "crowd", label: "Crowding" },
  { op: "onEdge", label: "On the edge" },
  { op: "every", label: "Every n beats" },
  { op: "chance", label: "A percent chance" },
];

export const EFFECT_OPS: { op: Effect["op"]; label: string }[] = [
  { op: "stat", label: "Shift a measure" },
  { op: "seekThing", label: "Step toward a tag" },
  { op: "seekTerrain", label: "Step toward ground" },
  { op: "digToward", label: "Dig toward ground" },
  { op: "fleeThing", label: "Step away from a tag" },
  { op: "fleeEdge", label: "Step toward the edge" },
  { op: "wander", label: "Wander" },
  { op: "excavate", label: "Excavate this tile" },
  { op: "hurt", label: "Harm an adjacent tag" },
  { op: "removeNearest", label: "Remove an adjacent tag" },
  { op: "deposit", label: "Bank a measure" },
  { op: "withdraw", label: "Take from the hoard" },
  { op: "vanishIf", label: "Leave the yard" },
];
