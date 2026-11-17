export function buildRunInviteUrl(runId: number): string {
  if (typeof window === 'undefined') {
    return `/?run=${runId}`;
  }
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('run', String(runId));
  return url.toString();
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below when Clipboard API is restricted
    }
  }

  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
