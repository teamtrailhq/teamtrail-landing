import { $$ } from '../dom';
import { chartScene } from './chartScene';
import { needsScene } from './needsScene';
import { parallelScene } from './parallelScene';
import { proofScene } from './proofScene';
import { runScene, type Scene } from './sequencer';

const SCENES: Record<string, Scene> = {
  needs: needsScene,
  chart: chartScene,
  parallel: parallelScene,
  proof: proofScene,
};

/**
 * The product scenes (partials/scene-*.html): each plays its loop while on screen. With reduced motion, or without
 * scripts, the markup's still frame stays.
 */
export function initScenes(reducedMotion: boolean) {
  if (reducedMotion || !('IntersectionObserver' in window)) return;
  for (const root of $$('[data-scene]')) {
    const scene = SCENES[root.dataset.scene ?? ''];
    if (scene) runScene(root, scene);
  }
}
