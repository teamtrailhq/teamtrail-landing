// Re-theme preview only: ?font=plex|space|instrument|manrope, ?accent=indigo|blue|amber and ?corners=square|slight|rounded
// set data-font, data-accent and data-corners on <html>, kept for the visit so every page shows the same pick.
const OPTIONS: Record<string, string[]> = {
  font: ['plex', 'space', 'instrument', 'manrope'],
  accent: ['indigo', 'blue', 'amber'],
  corners: ['square', 'slight', 'rounded'],
};

export function initPreviewLook() {
  const params = new URLSearchParams(location.search);
  for (const [name, allowed] of Object.entries(OPTIONS)) {
    let value = params.get(name);
    try {
      if (value && allowed.includes(value)) sessionStorage.setItem(`teamtrail-preview-${name}`, value);
      else value = sessionStorage.getItem(`teamtrail-preview-${name}`);
    } catch {
      // Storage can be refused; the query still applies to this page.
    }
    if (value && allowed.includes(value)) document.documentElement.dataset[name] = value;
  }
}
