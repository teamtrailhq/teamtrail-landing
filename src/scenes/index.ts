import { $$ } from '../dom';
import { chartScene } from './chartScene';
import { cloudAwayScene } from './cloudAwayScene';
import { cloudHeroScene } from './cloudHeroScene';
import { criteriaScene } from './criteriaScene';
import { decideScene } from './decideScene';
import { guidesScene } from './guidesScene';
import { mobileAnswerScene } from './mobileAnswerScene';
import { mobileMergeScene } from './mobileMergeScene';
import { mobileNeedsScene } from './mobileNeedsScene';
import { mobileNotifyScene } from './mobileNotifyScene';
import { mobileTrailsScene } from './mobileTrailsScene';
import { needsScene } from './needsScene';
import { parallelScene } from './parallelScene';
import { planScene } from './planScene';
import { proofScene } from './proofScene';
import { recordScene } from './recordScene';
import { scenePlayer, type Scene } from './sequencer';
import { initShowcase } from './showcase';
import { slackAnswerScene } from './slackAnswerScene';
import { slackMentionScene } from './slackMentionScene';
import { slackRiskScene } from './slackRiskScene';
import { takeTurns } from './turns';
import { worktreesScene } from './worktreesScene';

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
  'mobile-needs': mobileNeedsScene,
  'mobile-answer': mobileAnswerScene,
  'mobile-merge': mobileMergeScene,
  'mobile-trails': mobileTrailsScene,
  'mobile-notify': mobileNotifyScene,
  plan: planScene,
  worktrees: worktreesScene,
  decide: decideScene,
  criteria: criteriaScene,
  record: recordScene,
  guides: guidesScene,
};

/**
 * The product scenes (partials/scene-*.html) on this page, taking turns: one plays at a time, the others show their
 * still frame. With reduced motion, or without scripts, every scene keeps its still frame.
 */
export function initScenes(reducedMotion: boolean) {
  const motion = !reducedMotion && 'IntersectionObserver' in window;
  // The showcase's cards switch its panes with or without motion; with motion it also takes turns, as one scene.
  const showcases = $$('[data-showcase]').map((root) => initShowcase(root, SCENES, motion));
  if (!motion) return;
  const players = $$('[data-scene]').flatMap((root) => {
    const scene = SCENES[root.dataset.scene ?? ''];
    return scene && !root.closest('[data-showcase]') ? [scenePlayer(root, scene)] : [];
  });
  const turns = takeTurns([...players, ...showcases.map((s) => s.player)]);
  for (const s of showcases) s.onClaim(turns.claim);
}
