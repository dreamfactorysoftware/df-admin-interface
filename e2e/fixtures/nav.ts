import { Page, expect } from '@playwright/test';

/**
 * Page object for the admin sidebar. Assumes df-side-nav.component.html
 * now emits `data-testid="nav-<path>"` on leaf items and
 * `data-testid="nav-group-<path>"` on expansion panel headers.
 *
 * Use route paths (e.g. '/api-connections/event-scripts', '/admin-settings/admins')
 * — the same paths the router uses. Path is normalized by stripping the
 * leading slash and replacing '/' with '-' to form the test ID.
 */
export class NavPage {
  constructor(private page: Page) {}

  private testId(path: string, prefix: 'nav' | 'nav-group' = 'nav') {
    const norm = path.replace(/^\/+/, '').replace(/\//g, '-') || 'root';
    return `${prefix}-${norm}`;
  }

  /** Expand a parent category (e.g. 'api-connections'). */
  async expandGroup(path: string) {
    const header = this.page.getByTestId(this.testId(path, 'nav-group'));
    await header.scrollIntoViewIfNeeded();
    // Only click if it's collapsed. Material expansion panel headers
    // set aria-expanded="true" when open.
    const expanded = await header.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await header.click();
    }
  }

  /**
   * Navigate to a leaf route. Expands parent groups along the path as
   * needed. Returns once the page.url() matches #<path>.
   */
  async goto(path: string) {
    // Walk the path segments and expand each parent group.
    const parts = path.replace(/^\/+/, '').split('/');
    for (let i = 1; i < parts.length; i++) {
      const parentPath = '/' + parts.slice(0, i).join('/');
      const groupId = this.testId(parentPath, 'nav-group');
      if ((await this.page.getByTestId(groupId).count()) > 0) {
        await this.expandGroup(parentPath);
      }
    }
    const link = this.page.getByTestId(this.testId(path));
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(this.page).toHaveURL(new RegExp(`#${path}$`), {
      timeout: 8_000,
    });
  }
}
