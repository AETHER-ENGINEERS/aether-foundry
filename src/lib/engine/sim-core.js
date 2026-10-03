// @ts-nocheck
/** Pure yard simulation. One source for the studio and the packed webxdc. */

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function bootRuntime(project, engine) {
  const tiles = normalizeTiles(engine);
  const entities = [];
  (engine.spawns || []).forEach((sp, i) => {
    const thing = thingById(project, sp.thingId);
    if (!thing) return;
    entities.push(makeEntity(project, thing, sp.x, sp.y, "b" + i));
  });
  return {
    engineId: engine.id,
    tick: 0,
    w: engine.mapW,
    h: engine.mapH,
    tiles,
    entities,
    hoard: 0,
    stolen: 0,
    left: 0,
    log: [{ tick: 0, text: "Yard set. No law has run yet." }],
  };
}

export function stepWorld(yard, project, engine) {
  const draft = cloneRuntime(yard);
  draft.tick += 1;
  const enabled = new Set(engine.systemIds || []);
  const mechanics = (project.mechanics || []).filter((m) => enabled.has(m.systemId));
  const pulses = mechanics.filter((m) => m.kind === "pulse");
  const orders = mechanics
    .filter((m) => m.kind === "order")
    .slice()
    .sort((a, b) => a.priority - b.priority || String(a.name).localeCompare(String(b.name)));

  for (const law of project.worldLaws || []) {
    if (!enabled.has(law.systemId)) continue;
    if (law.every < 1 || draft.tick % law.every !== 0) continue;
    const living = draft.entities.filter((e) => e.alive && e.thingId === law.thingId).length;
    if (living >= law.cap) continue;
    const spots = indexesOf(draft.tiles, law.onTerrain).filter((i) => {
      const t = terrainAt(project, draft, i % draft.w, Math.floor(i / draft.w));
      return t && t.passable;
    });
    if (!spots.length) continue;
    const i = spots[Math.floor(Math.random() * spots.length)];
    const thing = thingById(project, law.thingId);
    if (!thing) continue;
    draft.entities.push(
      makeEntity(project, thing, i % draft.w, Math.floor(i / draft.w), "s" + draft.tick + "-" + i),
    );
    pushLog(draft, "A " + thing.name + " arrived. (" + law.name + ")");
  }

  const ids = draft.entities.map((e) => e.id);
  for (const id of ids) {
    const entity = draft.entities.find((e) => e.id === id);
    if (!entity || !entity.alive) continue;
    ensureStats(project, entity);
    entity.age += 1;
    for (const pulse of pulses) {
      if (!conditionsHold(draft, project, entity, pulse).ok) continue;
      applyEffects(draft, project, entity, pulse, false);
      entity.law = pulse.name;
      entity.lawId = pulse.id;
    }
    let fired = null;
    for (const order of orders) {
      if (!conditionsHold(draft, project, entity, order).ok) continue;
      const trial = cloneRuntime(draft);
      const ghost = trial.entities.find((e) => e.id === entity.id);
      if (!ghost) continue;
      const ok = applyEffects(trial, project, ghost, order, true);
      if (!ok) continue;
      applyEffects(draft, project, entity, order, true);
      fired = order;
      break;
    }
    if (fired) {
      entity.law = fired.name;
      entity.lawId = fired.id;
      entity.trace = fired.note || fired.name;
    } else if (!entity.law) {
      entity.trace = "No order can act.";
    }
    if ((entity.stats.vigor ?? 1) <= 0 && entity.alive) {
      entity.alive = false;
      const thing = thingById(project, entity.thingId);
      pushLog(draft, (thing ? thing.name : "Something") + " collapsed.");
    }
  }
  return draft;
}

export function diagnose(yard, project, engine, entityId) {
  const entity = (yard.entities || []).find((e) => e.id === entityId);
  if (!entity) return [];
  const enabled = new Set(engine.systemIds || []);
  const mechanics = (project.mechanics || []).filter((m) => enabled.has(m.systemId));
  const orders = mechanics
    .filter((m) => m.kind === "order")
    .slice()
    .sort((a, b) => a.priority - b.priority || String(a.name).localeCompare(String(b.name)));
  let winner = null;
  const rows = [];
  for (const order of orders) {
    const held = conditionsHold(yard, project, entity, order);
    if (!held.ok) {
      rows.push(row(order, false, false, held.text));
      continue;
    }
    if (winner) {
      rows.push(row(order, true, false, "Holds, but a sharper order already took the beat."));
      continue;
    }
    const trial = cloneRuntime(yard);
    const ghost = trial.entities.find((e) => e.id === entity.id);
    const ok = ghost ? applyEffects(trial, project, ghost, order, true) : false;
    if (ok) {
      winner = order.id;
      rows.push(row(order, true, true, held.text));
    } else {
      rows.push(row(order, true, false, "Conditions hold, but the act cannot be done from here."));
    }
  }
  for (const pulse of mechanics.filter((m) => m.kind === "pulse")) {
    const held = conditionsHold(yard, project, entity, pulse);
    rows.push(row(pulse, held.ok, false, held.ok ? held.text : held.text));
  }
  rows.sort((a, b) => a.priority - b.priority);
  return rows;
}

function row(mechanic, match, winner, because) {
  return {
    id: mechanic.id,
    name: mechanic.name,
    kind: mechanic.kind,
    priority: mechanic.priority,
    match,
    winner,
    because,
  };
}

function makeEntity(project, thing, x, y, id) {
  return {
    id,
    thingId: thing.id,
    x,
    y,
    stats: startingStats(project, thing),
    age: 0,
    alive: true,
    law: "",
    lawId: "",
    trace: "Waiting.",
  };
}

function startingStats(project, thing) {
  const stats = {};
  for (const def of project.stats || []) {
    const over = thing.stats ? thing.stats[def.key] : undefined;
    stats[def.key] = clamp(def, over ?? def.start);
  }
  return stats;
}

function ensureStats(project, entity) {
  for (const def of project.stats || []) {
    if (typeof entity.stats[def.key] !== "number") entity.stats[def.key] = def.start;
  }
}

function clamp(def, value) {
  return Math.max(def.min, Math.min(def.max, value));
}

function clampKey(project, key, value) {
  const def = (project.stats || []).find((s) => s.key === key);
  if (!def) return value;
  return clamp(def, value);
}

function cloneRuntime(yard) {
  return {
    engineId: yard.engineId,
    tick: yard.tick,
    w: yard.w,
    h: yard.h,
    tiles: yard.tiles.slice(),
    entities: yard.entities.map((e) => ({ ...e, stats: { ...e.stats } })),
    hoard: yard.hoard,
    stolen: yard.stolen,
    left: yard.left,
    log: yard.log.slice(),
  };
}

function normalizeTiles(engine) {
  const n = engine.mapW * engine.mapH;
  const tiles = (engine.tiles || []).slice(0, n);
  while (tiles.length < n) tiles.push("rock");
  return tiles;
}

function thingById(project, id) {
  return (project.things || []).find((t) => t.id === id) || null;
}

function terrainById(project, id) {
  return (project.terrains || []).find((t) => t.id === id) || null;
}

function terrainAt(project, yard, x, y) {
  if (x < 0 || y < 0 || x >= yard.w || y >= yard.h) return null;
  return terrainById(project, yard.tiles[y * yard.w + x]);
}

function hasTag(project, thingId, tag) {
  const thing = thingById(project, thingId);
  return !!thing && (thing.tags || []).includes(tag);
}

function indexesOf(tiles, id) {
  const out = [];
  for (let i = 0; i < tiles.length; i++) if (tiles[i] === id) out.push(i);
  return out;
}

function edgeDist(x, y, w, h) {
  return Math.min(x, y, w - 1 - x, h - 1 - y);
}

function canWalk(project, yard, x, y) {
  const t = terrainAt(project, yard, x, y);
  return !!t && t.passable;
}

function conditionsHold(yard, project, entity, mechanic) {
  const when = mechanic.when || [];
  if (!when.length) return { ok: true, text: "Always." };
  const parts = [];
  for (const c of when) {
    const r = evalCondition(yard, project, entity, c, mechanic.id);
    if (!r.ok) return r;
    parts.push(r.text);
  }
  return { ok: true, text: parts.join(" · ") };
}

function evalCondition(yard, project, entity, c, salt) {
  if (!c || !c.op) return { ok: true, text: "Always." };
  if (c.op === "always") return { ok: true, text: "Always." };
  if (c.op === "tag") {
    const thing = thingById(project, entity.thingId);
    const tags = thing ? thing.tags || [] : [];
    const any = c.any || [];
    const ok = any.some((t) => tags.includes(t));
    return { ok, text: ok ? "tag " + any.join("/") : "not tagged " + any.join("/") };
  }
  if (c.op === "stat") {
    const v = num(entity.stats[c.stat]);
    const ok = c.cmp === "lte" ? v <= c.value : v >= c.value;
    const word = c.cmp === "lte" ? "at most" : "at least";
    return {
      ok,
      text: (c.stat || "stat") + " is " + v + ", needs " + word + " " + c.value,
    };
  }
  if (c.op === "on") {
    const id = yard.tiles[entity.y * yard.w + entity.x];
    const ok = id === c.terrain;
    return { ok, text: ok ? "on " + c.terrain : "not on " + c.terrain };
  }
  if (c.op === "nearThing" || c.op === "awayThing") {
    const near = nearest(yard, project, entity, c.tag, c.radius);
    if (c.op === "nearThing") {
      return { ok: !!near, text: near ? c.tag + " is close" : "no " + c.tag + " within " + c.radius };
    }
    return { ok: !near, text: near ? c.tag + " is still close" : "clear of " + c.tag };
  }
  if (c.op === "nearTerrain") {
    const hit = nearestTerrain(yard, entity, c.terrain, c.radius);
    return { ok: hit, text: hit ? c.terrain + " is close" : "no " + c.terrain + " within " + c.radius };
  }
  if (c.op === "crowd") {
    const n = countNear(yard, project, entity, c.tag, c.radius);
    const ok = c.cmp === "lte" ? n <= c.value : n >= c.value;
    return { ok, text: n + " " + c.tag + " nearby" };
  }
  if (c.op === "onEdge") {
    const ok = edgeDist(entity.x, entity.y, yard.w, yard.h) <= 1;
    return { ok, text: ok ? "on the edge" : "not on the edge" };
  }
  if (c.op === "every") {
    const n = Math.max(1, c.n | 0);
    const ok = entity.age % n === 0;
    return { ok, text: ok ? "beat matches" : "waiting on a beat" };
  }
  if (c.op === "chance") {
    const roll = hash(`${yard.tick}|${entity.id}|${salt}`) % 100;
    const ok = roll < c.pct;
    return { ok, text: ok ? "chance hit" : "chance missed" };
  }
  return { ok: false, text: "unknown test" };
}

function num(v) {
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function nearest(yard, project, entity, tag, radius) {
  let best = null;
  let bestD = Infinity;
  for (const other of yard.entities) {
    if (!other.alive || other.id === entity.id) continue;
    if (!hasTag(project, other.thingId, tag)) continue;
    const d = Math.max(Math.abs(other.x - entity.x), Math.abs(other.y - entity.y));
    if (d <= radius && d < bestD) {
      best = other;
      bestD = d;
    }
  }
  return best;
}

function countNear(yard, project, entity, tag, radius) {
  let n = 0;
  for (const other of yard.entities) {
    if (!other.alive || other.id === entity.id) continue;
    if (!hasTag(project, other.thingId, tag)) continue;
    const d = Math.max(Math.abs(other.x - entity.x), Math.abs(other.y - entity.y));
    if (d <= radius) n += 1;
  }
  return n;
}

function nearestTerrain(yard, entity, terrain, radius) {
  for (let y = entity.y - radius; y <= entity.y + radius; y++) {
    for (let x = entity.x - radius; x <= entity.x + radius; x++) {
      if (x < 0 || y < 0 || x >= yard.w || y >= yard.h) continue;
      if (Math.max(Math.abs(x - entity.x), Math.abs(y - entity.y)) > radius) continue;
      if (yard.tiles[y * yard.w + x] === terrain) return true;
    }
  }
  return false;
}

function applyEffects(yard, project, entity, mechanic, stopAfterMove) {
  let any = false;
  let moved = false;
  for (const effect of mechanic.then || []) {
    const result = applyOne(yard, project, entity, effect);
    if (result.ok) any = true;
    if (result.moved) {
      moved = true;
      if (stopAfterMove) break;
    }
  }
  return any;
}

function applyOne(yard, project, entity, effect) {
  if (!effect || !effect.op) return { ok: false, moved: false };
  if (effect.op === "stat") {
    const def = (project.stats || []).find((s) => s.key === effect.stat);
    const cur = num(entity.stats[effect.stat]);
    entity.stats[effect.stat] = def ? clamp(def, cur + effect.delta) : cur + effect.delta;
    return { ok: true, moved: false };
  }
  if (effect.op === "seekThing") return moveSeekThing(yard, project, entity, effect.tag);
  if (effect.op === "seekTerrain") return moveSeekTerrain(yard, project, entity, effect.terrain, false);
  if (effect.op === "digToward") return moveSeekTerrain(yard, project, entity, effect.terrain, true);
  if (effect.op === "fleeThing") return moveFlee(yard, project, entity, effect.tag);
  if (effect.op === "fleeEdge") return moveEdge(yard, project, entity);
  if (effect.op === "wander") return moveWander(yard, project, entity);
  if (effect.op === "excavate") return excavateAt(yard, project, entity, entity.x, entity.y, true);
  if (effect.op === "hurt") return hurtNear(yard, project, entity, effect);
  if (effect.op === "removeNearest") return removeNear(yard, project, entity, effect.tag);
  if (effect.op === "deposit") return deposit(yard, project, entity, effect.stat);
  if (effect.op === "withdraw") return withdraw(yard, project, entity, effect.stat, effect.amount);
  if (effect.op === "vanishIf") return vanishIf(yard, project, entity, effect);
  return { ok: false, moved: false };
}

function moveSeekThing(yard, project, entity, tag) {
  const goal = (x, y) =>
    yard.entities.some(
      (o) => o.alive && o.id !== entity.id && o.x === x && o.y === y && hasTag(project, o.thingId, tag),
    );
  const next = nextStep(yard, project, entity.x, entity.y, goal, (x, y) => canWalk(project, yard, x, y) || goal(x, y));
  if (!next) return { ok: false, moved: false };
  if (!canWalk(project, yard, next.x, next.y)) return { ok: false, moved: false };
  entity.x = next.x;
  entity.y = next.y;
  return { ok: true, moved: true };
}

function moveSeekTerrain(yard, project, entity, terrainId, digging) {
  const goal = (x, y) => yard.tiles[y * yard.w + x] === terrainId;
  if (goal(entity.x, entity.y)) return { ok: false, moved: false };
  const pass = (x, y) => {
    if (goal(x, y)) return true;
    const t = terrainAt(project, yard, x, y);
    if (!t) return false;
    if (digging) return t.passable || t.diggable;
    return t.passable;
  };
  const next = nextStep(yard, project, entity.x, entity.y, goal, pass);
  if (!next) return { ok: false, moved: false };
  const t = terrainAt(project, yard, next.x, next.y);
  if (digging && t && !t.passable && t.diggable) {
    return excavateAt(yard, project, entity, next.x, next.y, false);
  }
  if (!t || !t.passable) return { ok: false, moved: false };
  entity.x = next.x;
  entity.y = next.y;
  return { ok: true, moved: true };
}

function moveFlee(yard, project, entity, tag) {
  const threat = nearest(yard, project, entity, tag, 99);
  if (!threat) return { ok: false, moved: false };
  let best = null;
  let bestD = Math.max(Math.abs(threat.x - entity.x), Math.abs(threat.y - entity.y));
  for (const [dx, dy] of DIRS) {
    const x = entity.x + dx;
    const y = entity.y + dy;
    if (!canWalk(project, yard, x, y)) continue;
    const d = Math.max(Math.abs(threat.x - x), Math.abs(threat.y - y));
    if (d > bestD) {
      bestD = d;
      best = { x, y };
    }
  }
  if (!best) return { ok: false, moved: false };
  entity.x = best.x;
  entity.y = best.y;
  return { ok: true, moved: true };
}

function moveEdge(yard, project, entity) {
  let best = null;
  let bestD = edgeDist(entity.x, entity.y, yard.w, yard.h);
  for (const [dx, dy] of DIRS) {
    const x = entity.x + dx;
    const y = entity.y + dy;
    if (!canWalk(project, yard, x, y)) continue;
    const d = edgeDist(x, y, yard.w, yard.h);
    if (d < bestD) {
      bestD = d;
      best = { x, y };
    }
  }
  if (!best) return { ok: false, moved: false };
  entity.x = best.x;
  entity.y = best.y;
  return { ok: true, moved: true };
}

function moveWander(yard, project, entity) {
  const options = [];
  for (const [dx, dy] of DIRS) {
    const x = entity.x + dx;
    const y = entity.y + dy;
    if (canWalk(project, yard, x, y)) options.push({ x, y });
  }
  if (!options.length) return { ok: false, moved: false };
  const pick = options[hash(`${yard.tick}|${entity.id}|wander`) % options.length];
  entity.x = pick.x;
  entity.y = pick.y;
  return { ok: true, moved: true };
}

function excavateAt(yard, project, entity, x, y, requireCurrent) {
  if (requireCurrent && (x !== entity.x || y !== entity.y)) return { ok: false, moved: false };
  const t = terrainAt(project, yard, x, y);
  if (!t || !t.diggable || !t.becomes) return { ok: false, moved: false };
  yard.tiles[y * yard.w + x] = t.becomes;
  if (t.yieldStat && t.yieldAmt) {
    const cur = num(entity.stats[t.yieldStat]);
    entity.stats[t.yieldStat] = clampKey(project, t.yieldStat, cur + t.yieldAmt);
  }
  const who = thingById(project, entity.thingId);
  pushLog(yard, (who ? who.name : "Someone") + " dug " + t.name + " at " + x + "," + y);
  return { ok: true, moved: false };
}

function hurtNear(yard, project, entity, effect) {
  const other = nearest(yard, project, entity, effect.tag, 1);
  if (!other) return { ok: false, moved: false };
  const cur = num(other.stats[effect.stat]);
  other.stats[effect.stat] = clampKey(project, effect.stat, cur - Math.abs(effect.amount));
  const who = thingById(project, entity.thingId);
  const them = thingById(project, other.thingId);
  pushLog(yard, (who ? who.name : "Someone") + " struck " + (them ? them.name : "someone") + ".");
  return { ok: true, moved: false };
}

function removeNear(yard, project, entity, tag) {
  const other = nearest(yard, project, entity, tag, 1);
  if (!other) return { ok: false, moved: false };
  other.alive = false;
  const who = thingById(project, entity.thingId);
  const them = thingById(project, other.thingId);
  pushLog(yard, (who ? who.name : "Someone") + " ate " + (them ? them.name : "someone") + ".");
  return { ok: true, moved: false };
}

function deposit(yard, project, entity, stat) {
  const n = num(entity.stats[stat]);
  if (n <= 0) return { ok: false, moved: false };
  yard.hoard += n;
  entity.stats[stat] = 0;
  const who = thingById(project, entity.thingId);
  pushLog(yard, (who ? who.name : "Someone") + " banked " + n + " " + stat + ".");
  return { ok: true, moved: false };
}

function withdraw(yard, project, entity, stat, amount) {
  const n = Math.abs(amount || 0);
  if (n <= 0 || yard.hoard < n) return { ok: false, moved: false };
  yard.hoard -= n;
  entity.stats[stat] = clampKey(project, stat, num(entity.stats[stat]) + n);
  const who = thingById(project, entity.thingId);
  pushLog(yard, (who ? who.name : "Someone") + " took from the hoard.");
  return { ok: true, moved: false };
}

function vanishIf(yard, project, entity, effect) {
  const v = num(entity.stats[effect.stat]);
  const ok = effect.cmp === "lte" ? v <= effect.value : v >= effect.value;
  if (!ok) return { ok: false, moved: false };
  entity.alive = false;
  if (effect.tally === "left") yard.left += 1;
  else yard.stolen += 1;
  const who = thingById(project, entity.thingId);
  pushLog(yard, (who ? who.name : "Someone") + " slipped away.");
  return { ok: true, moved: false };
}

function pushLog(yard, text) {
  if (!yard || typeof yard !== "object") return;
  yard.log = [...yard.log, { tick: yard.tick, text }].slice(-48);
}

function nextStep(yard, project, sx, sy, goal, pass) {
  if (sx < 0 || sy < 0 || sx >= yard.w || sy >= yard.h) return null;
  const start = sy * yard.w + sx;
  if (goal(sx, sy)) return null;
  const parent = new Map();
  parent.set(start, -1);
  const q = [start];
  let qi = 0;
  let found = -1;
  while (qi < q.length) {
    const cur = q[qi++];
    const cx = cur % yard.w;
    const cy = Math.floor(cur / yard.w);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= yard.w || ny >= yard.h) continue;
      const k = ny * yard.w + nx;
      if (parent.has(k)) continue;
      if (!pass(nx, ny)) continue;
      parent.set(k, cur);
      if (goal(nx, ny)) {
        found = k;
        break;
      }
      q.push(k);
    }
    if (found >= 0) break;
  }
  if (found < 0) return null;
  let cur = found;
  let prev = parent.get(cur);
  while (prev !== start && prev !== -1 && prev !== undefined) {
    cur = prev;
    prev = parent.get(cur);
  }
  return { x: cur % yard.w, y: Math.floor(cur / yard.w) };
}
