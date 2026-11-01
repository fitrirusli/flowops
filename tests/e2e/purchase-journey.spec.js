const { test, expect } = require('@playwright/test');
const { randomUUID } = require('node:crypto');

async function login(page, email) {
  await page.goto('/');
  await page.getByLabel('Email address').fill(`${email}@flowops.test`);
  await page.getByLabel('Password', { exact: true }).fill('FlowOpsDemo!2026');
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page.getByRole('heading', { name: /^Hello,/ })).toBeVisible();
}

async function logout(page) {
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make work flow.' })).toBeVisible();
}

test('complete purchase journey through independent manager and finance sessions', async ({
  page,
}) => {
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await login(page, 'alex');
  await page.screenshot({ path: '.local/screenshots/overview-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'New request', exact: true }).first().click();
  const title = `Browser verification ${randomUUID().slice(0, 8)}`;
  await page.getByLabel(/Request title/).fill(title);
  await page.getByLabel(/Purchase amount/).fill('14000.00');
  await page
    .getByLabel(/Business justification/)
    .fill(
      'Purchase workstations for a synthetic browser verification of manager and finance review.',
    );
  await page.getByRole('button', { name: 'Save draft & review' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  const requestPath = new URL(page.url()).pathname;
  await page.getByRole('button', { name: 'Review & submit', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm & submit' }).click();
  await expect(page.getByRole('status')).toContainText('Request submitted');
  await page.screenshot({ path: '.local/screenshots/request-desktop.png', fullPage: true });
  await logout(page);

  await login(page, 'maya');
  await page.getByRole('link', { name: 'Approval inbox', exact: true }).click();
  await page.getByRole('link', { name: title, exact: true }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByLabel('Review comment (optional)').fill('Manager reviewed in the real browser.');
  await page.getByRole('button', { name: 'Confirm approval' }).click();
  await expect(page.getByRole('status')).toContainText('Your approval has been recorded');
  await expect(page.locator('.route-status-pending')).toContainText('Finance review');
  await logout(page);

  await login(page, 'noah');
  await page.goto(requestPath);
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm approval' }).click();
  await expect(page.locator('.page-heading .status')).toHaveText('Approved');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('workspace switching, real policy publication, preserved history, and mobile navigation', async ({
  page,
}) => {
  await login(page, 'alex');
  await page.getByRole('link', { name: 'Approval policy', exact: true }).click();
  const policyResponse = await page.request.get(
    '/api/v1/organizations/' +
      (await page.locator('#organization-select').inputValue()) +
      '/policy',
    { headers: { Referer: page.url(), Accept: 'application/json' } },
  );
  expect(policyResponse.ok()).toBeTruthy();
  const policy = (await policyResponse.json()).data;
  const oldVersion = policy.current.version_number;
  await page
    .getByLabel('Finance review threshold')
    .fill((policy.current.threshold_minor / 100 + 100).toFixed(2));
  await page
    .getByLabel('What’s changing?')
    .fill('Browser verification of immutable policy publication.');
  await page.getByRole('button', { name: 'Review & publish' }).click();
  await page.getByRole('button', { name: 'Publish policy', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(`Policy v${oldVersion + 1} published`);
  await expect(page.getByText(`Policy v${oldVersion + 1} is live`)).toBeVisible();
  await page.screenshot({ path: '.local/screenshots/policy-desktop.png', fullPage: true });

  await page.getByRole('link', { name: 'My requests', exact: true }).click();
  await page.getByRole('link', { name: 'Developer workstations', exact: true }).click();
  await expect(page.locator('.policy-snapshot')).toContainText('Policy v1');

  const cedar = await page
    .locator('#organization-select option')
    .evaluateAll((options) => options.find((option) => option.textContent === 'Cedar Works').value);
  await page.getByLabel('Choose organization').selectOption(cedar);
  await expect(page.locator('.topbar')).toContainText('Cedar Works');
  await expect(page.getByRole('link', { name: 'New request', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Developer workstations', exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('link', { name: 'Workshop tooling supplies', exact: true }),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('.sidebar')).toBeInViewport();
  await page.getByRole('link', { name: 'Workspace guide', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Your workspace guide' })).toBeVisible();
  await expect(page.locator('.sidebar')).not.toBeInViewport();
  await page.screenshot({ path: '.local/screenshots/mobile-guide.png', fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});

test('mobile sign in is usable and does not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Make work flow.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in to workspace' })).toBeVisible();
  await page.screenshot({ path: '.local/screenshots/login-mobile.png', fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});
