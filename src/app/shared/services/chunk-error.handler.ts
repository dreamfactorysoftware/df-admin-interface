import { ErrorHandler, Injectable } from '@angular/core';

/**
 * Global error handler that self-heals stale lazy chunks. When the app is
 * rebuilt (a deploy, or an active dev rebuild) while a tab is open, the loaded
 * main bundle references chunk hashes that no longer exist on disk, so the next
 * lazy route load throws ChunkLoadError. Instead of a dead error, reload once to
 * fetch the current index.html and chunk set. Guarded against a reload loop.
 */
@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  private static readonly RELOAD_KEY = 'df-chunk-reload-at';
  private static readonly RELOAD_WINDOW_MS = 10000;

  handleError(error: unknown): void {
    if (this.isChunkLoadError(error) && this.canReload()) {
      sessionStorage.setItem(ChunkErrorHandler.RELOAD_KEY, String(Date.now()));
      window.location.reload();
      return;
    }
    // eslint-disable-next-line no-console
    console.error(error);
  }

  private isChunkLoadError(error: unknown): boolean {
    const e = error as { name?: string; message?: string } | null;
    const name = e?.name ?? '';
    const message = e?.message ?? String(error);
    return (
      /ChunkLoadError/i.test(name) ||
      /Loading (?:CSS )?chunk [\w-]+ failed/i.test(message)
    );
  }

  private canReload(): boolean {
    // Reload at most once per window so a chunk that is genuinely missing
    // (not just stale) cannot loop the page.
    const last = Number(
      sessionStorage.getItem(ChunkErrorHandler.RELOAD_KEY) ?? '0'
    );
    return Date.now() - last > ChunkErrorHandler.RELOAD_WINDOW_MS;
  }
}
