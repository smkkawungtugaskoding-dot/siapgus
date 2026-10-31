/**
 * Utility to dynamically update the browser favicon to the school logo.
 * Whenever the school logo is saved or updated in the school profile,
 * the browser tab icon immediately updates and displays the new logo.
 */

const DEFAULT_FAVICON = '/favicon.ico';

export function updateAppFavicon(logoUrl?: string | null): void {
  if (typeof document === 'undefined') return;

  const rawUrl = logoUrl && logoUrl.trim().length > 0 ? logoUrl.trim() : null;

  const setFaviconLinks = (href: string, mimeType = 'image/png') => {
    // Remove all existing icon links to force browser to re-read
    const existing = document.querySelectorAll<HTMLLinkElement>(
      "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
    );
    existing.forEach((el) => el.remove());

    // Create primary icon
    const link = document.createElement('link');
    link.id = 'dynamic-favicon';
    link.rel = 'icon';
    link.type = mimeType;
    link.href = href;
    document.head.appendChild(link);

    // Create shortcut icon
    const shortcut = document.createElement('link');
    shortcut.id = 'dynamic-favicon-shortcut';
    shortcut.rel = 'shortcut icon';
    shortcut.type = mimeType;
    shortcut.href = href;
    document.head.appendChild(shortcut);

    // Create apple touch icon
    const apple = document.createElement('link');
    apple.id = 'dynamic-favicon-apple';
    apple.rel = 'apple-touch-icon';
    apple.href = href;
    document.head.appendChild(apple);
  };

  if (!rawUrl) {
    // Reset to default
    setFaviconLinks(`${DEFAULT_FAVICON}?v=${Date.now()}`, 'image/x-icon');
    return;
  }

  // If already a base64 or valid image, render onto a 64x64 canvas to ensure crisp square icon
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 64, 64);
          // Draw image centered and scaled
          const scale = Math.min(64 / img.width, 64 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (64 - w) / 2;
          const y = (64 - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          const canvasDataUrl = canvas.toDataURL('image/png');
          setFaviconLinks(canvasDataUrl, 'image/png');
          return;
        }
      } catch (err) {
        console.warn('Canvas favicon conversion note:', err);
      }
      setFaviconLinks(rawUrl, rawUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png');
    };
    img.onerror = () => {
      setFaviconLinks(rawUrl, 'image/png');
    };
    img.src = rawUrl;
  } catch {
    setFaviconLinks(rawUrl, 'image/png');
  }
}
