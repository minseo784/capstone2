// src/lib/islandStore.ts

export type PinId = 1 | 2 | 3;

export type IslandRecord = {
  islandId: string; 
  pinId: PinId;
  slot: 1 | 2 | 3; 
  title: string;
  description: string;
  flag: string;
  serverUrl: string;
  createdAt: string;
};

export type IslandsStore = Record<string, IslandRecord[]>;

export const STORE_KEY = "hackahoy:islands";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadStore(): IslandsStore {
  if (typeof window === "undefined") return {};
  return safeParse<IslandsStore>(localStorage.getItem(STORE_KEY), {});
}

export function saveStore(next: IslandsStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(next));
}

export function getProblemsByPin(
  store: IslandsStore,
  pinId: PinId
): IslandRecord[] {
  const v = store[String(pinId)];
  return Array.isArray(v) ? v : [];
}

export function getUsedSlots(
  store: IslandsStore,
  pinId: PinId
): Set<1 | 2 | 3> {
  const used = new Set<1 | 2 | 3>();
  for (const p of getProblemsByPin(store, pinId)) {
    used.add(p.slot);
  }
  return used;
}

export function addProblemToPin(
  store: IslandsStore,
  pinId: PinId,
  rec: IslandRecord
): IslandsStore {
  const list = getProblemsByPin(store, pinId);

  if (list.some((x) => x.slot === rec.slot)) return store;

  if (list.length >= 3) return store;

  return {
    ...store,
    [String(pinId)]: [...list, rec].sort((a, b) => a.slot - b.slot),
  };
}

export function getFullPins(store: IslandsStore): Set<PinId> {
  const s = new Set<PinId>();
  for (const k of Object.keys(store)) {
    const n = Number(k);
    if (n === 2 || n === 3) {
      if (getProblemsByPin(store, n as PinId).length >= 3) s.add(n as PinId);
    }
  }
  return s;
}

export function getFullPinsWithFixed(store: IslandsStore): Set<PinId> {
  const s = new Set<PinId>([1]);
  for (const k of Object.keys(store)) {
    const n = Number(k);
    if (n === 2 || n === 3) {
      if (getProblemsByPin(store, n as PinId).length >= 3) s.add(n as PinId);
    }
  }
  return s;
}

export function getOccupiedPinsWithFixed(store: IslandsStore): Set<PinId> {
  const s = new Set<PinId>([1]);
  for (const k of Object.keys(store)) {
    const n = Number(k);
    if ((n === 2 || n === 3) && getProblemsByPin(store, n as PinId).length > 0)
      s.add(n as PinId);
  }
  return s;
}

export function findProblemByIslandId(
  store: IslandsStore,
  islandId: string
): IslandRecord | null {
  for (const pinKey of Object.keys(store)) {
    const list = store[pinKey];
    if (!Array.isArray(list)) continue;
    const hit = list.find((x) => x.islandId === islandId);
    if (hit) return hit;
  }
  return null;
}
