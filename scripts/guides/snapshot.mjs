// `npm run guides:snapshot`: refreshes content/guides/catalog.json, the offline fallback for the /guides cards.
import { writeSnapshot } from './catalog.mjs';

const catalog = await writeSnapshot(process.cwd());
console.log(`Wrote ${catalog.guides.length} guides to content/guides/catalog.json`);
