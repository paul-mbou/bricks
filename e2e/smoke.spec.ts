import { expect, test } from '@playwright/test';

async function enterDemo(page: import('@playwright/test').Page) {
  await page.goto('/connexion');
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  await page.getByRole('button', { name: /démonstration/i }).click();
  await expect(page).toHaveURL(/\/app/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible({ timeout: 15_000 });

  const skip = page.getByRole('button', { name: 'Passer' });
  await skip.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null);
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await expect(skip).toBeHidden({ timeout: 5_000 });
  }
}

test('connexion démo puis tableau de bord', async ({ page }) => {
  await enterDemo(page);
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
});

test('parcours production accessible', async ({ page }) => {
  await enterDemo(page);
  await page.goto('/app/production');
  // Tour may reappear only if state was lost — dismiss again if needed.
  const skip = page.getByRole('button', { name: 'Passer' });
  if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) await skip.click();
  await expect(page.getByRole('heading', { name: 'Production' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Nouvelle séance' }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('dialog').getByText('Séance de production')).toBeVisible();
});

test('stocks et inventaire', async ({ page }) => {
  await enterDemo(page);
  await page.goto('/app/stocks');
  const skip = page.getByRole('button', { name: 'Passer' });
  if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) await skip.click();
  await expect(page.getByRole('heading', { name: 'Stocks' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Inventaire' }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('dialog').getByText('Inventaire physique')).toBeVisible();
});
