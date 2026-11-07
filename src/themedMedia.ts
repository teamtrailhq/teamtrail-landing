import { $$ } from './dom';
import { isNight, onThemeChange } from './theme';

const NIGHT_DIR = '/media/night/';
/** Product captures exist in both themes; brand art and agent logos don't. */
const CAPTURE = /^\/media\/(?:night\/)?((?:lookout-|flow-|landing-journey)[^/]+)$/;

function themedUrl(url: string | null) {
  const match = url && CAPTURE.exec(url);
  if (!match) return undefined;
  return isNight() ? `${NIGHT_DIR}${match[1]}` : `/media/${match[1]}`;
}

function swapVideo(video: HTMLVideoElement) {
  const src = themedUrl(video.getAttribute('src'));
  const poster = themedUrl(video.getAttribute('poster'));
  if (poster && poster !== video.getAttribute('poster')) video.setAttribute('poster', poster);
  if (!src || src === video.getAttribute('src')) return;
  const { currentTime, paused } = video;
  video.setAttribute('src', src);
  video.addEventListener('loadedmetadata', () => (video.currentTime = currentTime), { once: true });
  if (!paused) void video.play().catch(() => {});
}

function swapAll() {
  for (const img of $$<HTMLImageElement>('img')) {
    const src = themedUrl(img.getAttribute('src'));
    if (src && src !== img.getAttribute('src')) img.setAttribute('src', src);
  }
  for (const video of $$<HTMLVideoElement>('video')) swapVideo(video);
}

/** Screenshots and the video always match the theme that's showing. */
export function initThemedMedia() {
  swapAll();
  onThemeChange(swapAll);
}
