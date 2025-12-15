import { test as setup, expect } from '@playwright/test';

setup('global login via Keycloak', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Redirects to /api/auth/signin
    await page.getByRole('button', { name: /keycloak/i }).click();

    // Keycloak login page
    await page.waitForURL(/keycloak/i);

    await page.fill('#username', 'input_your_username_here');
    await page.fill('#password', 'input_your_password_here');
    await page.click('#kc-login');


    await page.waitForURL('http://localhost:3000/**', {
        timeout: 20_000,
    });

    // 🔍 sanity check — must NOT be on login page
    await expect(page).not.toHaveURL(/signin|keycloak/);

    // Save authenticated browser state
    await page.context().storageState({ path: 'storageState.json' });
});
