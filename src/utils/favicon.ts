/**
 * Utility to dynamically update the browser favicon to the school logo.
 * Whenever the school logo is uploaded or updated, the browser tab icon updates in real-time.
 */

const DEFAULT_FAVICON = '/favicon.ico';

export function updateAppFavicon(logoUrl?: string | null): void {
  if (typeof document === 'undefined') return;

  const targetUrl = logoUrl && logoUrl.trim().length > 0 ? logoUrl.trim() : DEFAULT_FAVICON;

  // Remove existing favicon links to force browser tab refresh
  const existingLinks = document.querySelectorAll<HTMLLinkElement>(
    "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
  );
  existingLinks.forEach((el) => el.remove());

  // Create new <link rel="icon">
  const newIcon = document.createElement('link');
  newIcon.rel = 'icon';
  if (targetUrl.startsWith('data:image/svg')) {
    newIcon.type = 'image/svg+xml';
  } else if (targetUrl.startsWith('data:image/png')) {
    newIcon.type = 'image/png';
  } else if (targetUrl.startsWith('data:image/jpeg') || targetUrl.startsWith('data:image/jpg')) {
    newIcon.type = 'image/jpeg';
  } else if (targetUrl.endsWith('.svg')) {
    newIcon.type = 'image/svg+xml';
  } else {
    newIcon.type = 'image/x-icon';
  }
  newIcon.href = targetUrl;
  document.head.appendChild(newIcon);

  // Create shortcut icon for legacy browsers
  const newShortcut = document.createElement('link');
  newShortcut.rel = 'shortcut icon';
  newShortcut.type = newIcon.type;
  newShortcut.href = targetUrl;
  document.head.appendChild(newShortcut);
}
