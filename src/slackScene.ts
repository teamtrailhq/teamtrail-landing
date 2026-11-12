import { mountScout } from '@teamtrail/scout-avatar/mount';
import { $$ } from './dom';

/** /slack: Scout next to Slack's mark, mounted like Scout on the /cloud stage (idle, unframed). */
export function initSlackScene() {
  for (const host of $$('[data-slack-scout]')) {
    mountScout(host, { size: Number(host.dataset.size ?? 2.4), state: 'idle', framed: false });
  }
}
