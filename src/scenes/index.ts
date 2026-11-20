import { $$ } from '../dom';
import { chartScene } from './chartScene';
import { cloudAwayScene } from './cloudAwayScene';
import { cloudHeroScene } from './cloudHeroScene';
import { needsScene } from './needsScene';
import { parallelScene } from './parallelScene';
import { proofScene } from './proofScene';
import { scenePlayer, type Scene } from './sequencer';
import { slackAnswerScene } from './slackAnswerScene';
import { slackMentionScene } from './slackMentionScene';
import { slackRiskScene } from './slackRiskScene';
import { takeTurns } from './turns';

const SCENES: Record<string, Scene> = {
  needs: needsScene,
  chart: chartScene,
  parallel: parallelScene,
  proof: proofScene,
  'slack-answer': slackAnswerScene,
  'slack-mention': slackMentionScene,
  'slack-risk': slackRiskScene,
  'cloud-hero': cloudHeroScene,
  'cloud-away': cloudAwayScene,
};

/**
 * The product scenes (partials/scene-*.html) on this page, taking turns: one plays at a time, the others show their
 * still frame. With reduced motion, or without scripts, every scene keeps its still frame.
 */
export function initScenes(reducedMotion: boolean) {
  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const players = $$('[data-scene]').flatMap((root) => {
    const scene = SCENES[root.dataset.scene ?? ''];
    return scene ? [scenePlayer(root, scene)] : [];
  });
  takeTurns(players);
}
