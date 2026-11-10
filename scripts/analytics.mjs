// Vercel Web Analytics on every built page: page views and referrers, no cookies and no personal data, so
// no consent banner. Vercel serves the script at /_vercel/insights once Web Analytics is switched on for the
// project (Vercel → the project → Analytics); until then the request is a harmless 404. Builds only, so the
// dev server stays quiet.
const TAGS =
  `    <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>\n` +
  `    <script defer src="/_vercel/insights/script.js"></script>\n`;

/** @returns {import('vite').Plugin} */
export function analytics() {
  return {
    name: 'analytics',
    apply: 'build',
    transformIndexHtml: (html) => html.replace(/\s*<\/head>/, `\n${TAGS}  </head>`),
  };
}
