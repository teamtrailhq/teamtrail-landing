import { $$ } from '../dom';
import { SCENES, type SceneId, chooseScene, currentScene, onSceneChange } from './scenes';

const ICONS: Record<SceneId, string> = {
  map: '<path d="M2 11c2-3 4-1 6-3s2-5 6-5M2 15c3-3 6-1 8-3s3-4 6-3M3 5c2-2 4-1 5-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  ridges:
    '<path d="M2 15V11M5 15V7M8 15V4M11 15V8M14 15V5M16 15V10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="1.6 1"/>',
  camp: '<path d="M9 2l3.4 5H10.8L14 12H10v4H8v-4H4l3.2-5H5.6z" fill="currentColor"/>',
};

function sceneButton(id: SceneId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.scene = id;
  button.title = SCENES[id].label;
  button.setAttribute('aria-label', `${SCENES[id].label} background`);
  button.innerHTML = `<svg viewBox="0 0 18 18" aria-hidden="true">${ICONS[id]}</svg>`;
  button.addEventListener('click', () => chooseScene(id));
  return button;
}

function syncPressed() {
  for (const button of $$('[data-scene]')) {
    button.setAttribute('aria-pressed', String(button.dataset.scene === currentScene()));
  }
}

/** The small switch in the corner of each page hero: which background plays behind the headline. */
export function initSceneSwitch() {
  for (const canvas of $$<HTMLCanvasElement>('canvas[data-field="hero"]')) {
    const group = document.createElement('div');
    group.className = 'scene-switch';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Hero background');
    for (const id of Object.keys(SCENES) as SceneId[]) group.append(sceneButton(id));
    canvas.parentElement?.append(group);
  }
  syncPressed();
  onSceneChange(syncPressed);
}
