import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

const overviewRoutes = [
  {
    path: '/api-connections',
    heading: 'Build and test governed APIs',
  },
  {
    path: '/api-connections/api-types',
    heading: 'Choose the right API source',
  },
  {
    path: '/api-security',
    heading: 'Control who can call what',
  },
  {
    path: '/system-settings',
    heading: 'Operate this DreamFactory instance',
  },
  {
    path: '/admin-settings',
    heading: 'Manage people, data, and diagnostics',
  },
  {
    path: '/ai',
    heading: 'Bring AI to your DreamFactory data',
  },
];

test.describe('Parent nav overview pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('home tiles navigate to the parent overview pages and expose real hrefs', async ({
    page,
  }) => {
    await page.goto('/dreamfactory/dist/#/home');

    const homeTiles = [
      { name: 'API Management', hash: '#/api-connections' },
      { name: 'API Types', hash: '#/api-connections/api-types' },
      { name: 'Security', hash: '#/api-security' },
      { name: 'System', hash: '#/system-settings' },
      { name: 'Admin Settings', hash: '#/admin-settings' },
      { name: 'AI Data Gateway', hash: '#/ai' },
    ];

    for (const tile of homeTiles) {
      const link = page.getByRole('link', { name: new RegExp(tile.name) });
      await expect(link).toHaveAttribute('href', new RegExp(tile.hash));
    }

    await page.getByRole('link', { name: /API Management/ }).click();
    await expect(page).toHaveURL(/#\/api-connections$/);
    await expect(
      page.getByRole('heading', { name: 'Build and test governed APIs' })
    ).toBeVisible();
  });

  test('tile bodies navigate on the first click, not only text clicks', async ({
    page,
  }) => {
    await page.goto('/dreamfactory/dist/#/home');

    const homeTile = page
      .getByRole('link', { name: /API Management/ })
      .locator('mat-card');
    await expect(homeTile).toBeVisible();
    await homeTile.click({ position: { x: 18, y: 18 } });
    await expect(page).toHaveURL(/#\/api-connections$/);

    await page.goto('/dreamfactory/dist/#/api-connections/api-types');
    const overviewTile = page
      .getByRole('link', { name: /Database APIs/ })
      .locator('.section-card__icon');
    await expect(overviewTile).toBeVisible();
    await overviewTile.click();
    await expect(page).toHaveURL(/#\/api-connections\/api-types\/database$/);
  });

  test('api generation file tile opens the file service category on the first click', async ({
    page,
  }) => {
    await page.goto('/dreamfactory/dist/#/api-connections');

    const fileTile = page
      .getByRole('link', { name: /^File$/ })
      .locator('.section-card__icon');
    await expect(fileTile).toBeVisible();
    await fileTile.click();
    await expect(page).toHaveURL(/#\/api-connections\/api-types\/file$/);
  });

  test('parent nav entries route to overview pages without redirecting to first child', async ({
    page,
  }) => {
    for (const route of overviewRoutes) {
      await page.goto(`/dreamfactory/dist/#${route.path}`);
      await expect(page).toHaveURL(new RegExp(`#${route.path}$`));
      await expect(
        page.getByRole('heading', { name: route.heading })
      ).toBeVisible();
    }
  });

  test('overview tiles are full-card links and support new-tab navigation', async ({
    page,
    context,
  }) => {
    await page.goto('/dreamfactory/dist/#/api-connections/api-types');

    const databaseTile = page.getByRole('link', { name: /Database APIs/ });
    await expect(databaseTile).toHaveAttribute(
      'href',
      /#\/api-connections\/api-types\/database$/
    );

    const popupPromise = context.waitForEvent('page');
    await databaseTile.click({ button: 'middle' });
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await expect(popup).toHaveURL(/#\/api-connections\/api-types\/database$/);
    await popup.close();
  });

  test('security and system aliases link to the existing implementation pages', async ({
    page,
  }) => {
    await page.goto('/dreamfactory/dist/#/api-security');
    await page.getByTestId('nav-group-api-security').click();

    const securityRoleLink = page.getByTestId(
      'nav-api-security-role-based-access'
    );
    await expect(securityRoleLink).toHaveAttribute(
      'href',
      /#\/api-connections\/role-based-access$/
    );

    const securityKeyLink = page.getByTestId('nav-api-security-api-keys');
    await expect(securityKeyLink).toHaveAttribute(
      'href',
      /#\/api-connections\/api-keys$/
    );

    await page.goto('/dreamfactory/dist/#/system-settings');
    await page.getByTestId('nav-group-system-settings').click();

    const systemLogsLink = page.getByTestId('nav-system-settings-file-logs');
    await expect(systemLogsLink).toHaveAttribute(
      'href',
      /#\/admin-settings\/logs$/
    );

    const configPackageLink = page.getByTestId(
      'nav-system-settings-config-config-package'
    );
    await expect(configPackageLink).toHaveAttribute(
      'href',
      /#\/system-settings\/config\/config-package$/
    );
  });

  test('config package screen exports portable JSON', async ({ page }) => {
    await page.goto(
      '/dreamfactory/dist/#/system-settings/config/config-package'
    );

    await expect(
      page.getByRole('heading', {
        name: 'Config Import / Export',
        exact: true,
      })
    ).toBeVisible();

    await page.getByRole('button', { name: /Export config/ }).click();
    await expect(page.getByText('Config package exported.')).toBeVisible();
    await expect(page.locator('textarea[readonly]')).toHaveValue(
      /"format": "dreamfactory\.config\/v1"/
    );
  });
});
