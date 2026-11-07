import { drawCamp } from './camp';
import type { Scene } from './common';
import { drawRidges } from './ridges';
import { drawTopo } from './topo';

export type SceneId = 'map' | 'ridges' | 'camp';

export const SCENES: Record<SceneId, { label: string; draw: (scene: Scene) => void }> = {
  map: { label: 'Map', draw: drawTopo },
  ridges: { label: 'Ridges', draw: drawRidges },
  camp: { label: 'Camp', draw: drawCamp },
};

const KEY = 'teamtrail-hero';
const listeners = new Set<() => void>();

function stored(): SceneId {
  try {
    const value = localStorage.getItem(KEY);
    return value && value in SCENES ? (value as SceneId) : 'map';
  } catch {
    return 'map';
  }
}

let current = stored();

export const currentScene = () => current;

export function chooseScene(id: SceneId) {
  current = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Private windows can refuse storage; the choice still holds for this page.
  }
  for (const listener of listeners) listener();
}

export function onSceneChange(listener: () => void) {
  listeners.add(listener);
}
