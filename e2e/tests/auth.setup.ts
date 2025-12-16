import { test as setup, expect } from '@playwright/test';

const USERNAME = 'admin'
const PASSWORD = 'admin'

setup('global login via Keycloak', async ({ page }) => {
    await page.goto('/');

    // Redirects to /api/auth/signin
    await page.getByRole('button', { name: /keycloak/i }).click();

    // Keycloak login page
    await page.waitForURL(/keycloak/i);

    await page.fill('#username', USERNAME);
    await page.fill('#password', PASSWORD);
    await page.click('#kc-login');

    await expect(page).not.toHaveURL(/signin|keycloak/);

    await page.context().storageState({ path: 'storageState.json' });
});
