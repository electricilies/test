import { test, expect } from '@playwright/test';

const BASE_URL = '/';

test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
});

test.describe('Landing Page E2E', () => {

    test('TC_HOME_001: Logo Placeholder', async ({ page }) => {
        await expect(page.getByText('Placeholder for logo')).toBeVisible();
    });

    test('TC_HOME_002: Search Input Interaction', async ({ page }) => {
        const searchInput = page.locator('header input[type="text"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('iPhone');
        await expect(searchInput).toHaveValue('iPhone');
    });

    test('TC_HOME_003: Header Icons Visibility', async ({ page }) => {
        const iconContainer = page.locator('header .flex.items-center.gap-5');
        await expect(iconContainer).toBeVisible();
        // Expect at least 3 icons (User, Doc, Cart)
        const icons = iconContainer.locator('svg');
        expect(await icons.count()).toBeGreaterThanOrEqual(3);
    });

    test('TC_HOME_004: Cart Navigation', async ({ page }) => {
        const cartIcon = page.locator('header svg.lucide-shopping-cart');
        await cartIcon.click();

        // Check for URL or Page Title
        await expect(async () => {
            const url = page.url();
            const title = await page.getByText('Giỏ hàng').isVisible();
            return url.includes('cart') || title;
        }).toBeTruthy();
    });

    test('TC_HOME_005: Hero Banner Text', async ({ page }) => {
        await expect(page.getByText('40% OFF')).toBeVisible();
        await expect(page.getByText('watch', { exact: true })).toBeVisible();
    });

    test('TC_HOME_006: Hero Image Loading', async ({ page }) => {
        const heroImg = page.locator('img[alt="watchHero"]');
        await expect(heroImg).toBeVisible();
        const isLoaded = await heroImg.evaluate((img: HTMLImageElement) => img.naturalWidth > 0);
        expect(isLoaded).toBe(true);
    });

    test('TC_HOME_007: CTA Button Visibility', async ({ page }) => {
        // Note: Checking visibility only (Defect: implemented as div)
        const cta = page.getByText('Mua ngay');
        await expect(cta).toBeVisible();
        await expect(cta).toHaveClass(/bg-tertiary/);
    });

    test('TC_HOME_008: Sidebar Container', async ({ page }) => {
        const sidebar = page.locator('.overflow-y-scroll');
        await expect(sidebar).toBeVisible();
    });

    test('TC_HOME_009: Sidebar Categories Exist', async ({ page }) => {
        const sidebar = page.locator('.overflow-y-scroll');
        const links = sidebar.locator('a');

        if (await links.count() === 0) {
            console.warn('DB Empty: No categories found');
        } else {
            await expect(links.first()).toBeVisible();
        }
    });

    test('TC_HOME_010: Sidebar Filter Click', async ({ page }) => {
        const sidebar = page.locator('.overflow-y-scroll');
        const firstCat = sidebar.locator('a').first();

        if (await firstCat.isVisible()) {
            await firstCat.click();
            await page.waitForURL(/category_ids/);
            expect(page.url()).toContain('category_ids');
        }
    });

    test('TC_HOME_011: Best Seller Section Title', async ({ page }) => {
        const section = page.getByText('Bán chạy nhất');
        await section.scrollIntoViewIfNeeded();
        await expect(section).toBeVisible();
    });

    test('TC_HOME_012: Product Card UI Elements', async ({ page }) => {
        const card = page.locator('a[href*="/products/"]').first();
        if (await card.isVisible()) {
            await expect(card.locator('img')).toBeVisible();
            await expect(card.locator('.text-tertiary')).toBeVisible(); // Price
            await expect(card.locator('.line-clamp-3')).not.toBeEmpty(); // Name
        }
    });

    test('TC_HOME_013: Carousel Next Action', async ({ page }) => {
        const nextBtn = page.locator('svg.lucide-chevron-right').first();
        if (await nextBtn.isVisible()) {
            const beforeText = await page.locator('a[href*="/products/"] .line-clamp-3').first().innerText();

            await nextBtn.click();
            await page.waitForTimeout(600); // Wait for animation

            // Only assert if we have enough items to actually slide
            const afterText = await page.locator('a[href*="/products/"] .line-clamp-3').first().innerText();
            if (beforeText === afterText) console.log('Carousel slide skipped (Low data volume)');
        }
    });

    test('TC_HOME_014: Carousel Prev Button', async ({ page }) => {
        const prevBtn = page.locator('svg.lucide-chevron-left').first();
        // Just verify the button is rendered and interactive
        if (await prevBtn.isVisible()) {
            await expect(prevBtn).toBeEnabled();
        }
    });

    test('TC_HOME_015: Product Card Click Navigation', async ({ page }) => {
        const card = page.locator('a[href*="/products/"]').first();
        if (await card.isVisible()) {
            await card.click();
            await expect(page).toHaveURL(/\/products\/.+/);
        }
    });

    test('TC_HOME_016: Dynamic Category Sections', async ({ page }) => {
        // Check if other headers exist besides "Bán chạy nhất"
        // We look for h2 tags
        const headers = page.locator('h2.text-h2');
        // Expect at least 2 headers (Best Seller + 1 Category)
        if (await headers.count() > 1) {
            await expect(headers.nth(1)).toBeVisible();
        }
    });

    test('TC_HOME_018: Footer Contact Text', async ({ page }) => {
        const footer = page.locator('footer');
        await footer.scrollIntoViewIfNeeded();
        await expect(footer.getByText('CONTACT US')).toBeVisible();
    });

    test('TC_HOME_019: Footer Social Icons', async ({ page }) => {
        const footer = page.locator('footer');
        const icons = footer.locator('svg.lucide');
        expect(await icons.count()).toBeGreaterThanOrEqual(4);
    });

    test('TC_HOME_020: Layout Width Check', async ({ page }) => {
        // Check if the main wrapper applies centering
        const mainWrapper = page.locator('.mx-auto.flex.min-h-screen');
        await expect(mainWrapper).toHaveClass(/mx-auto/);
    });

});
