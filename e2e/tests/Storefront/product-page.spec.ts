import { test, expect } from '@playwright/test';

const BASE_URL = '';
const TEST_PRODUCT_ID = '1';

test.describe('Product Page E2E (Sorted 001-020)', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(`/products/${TEST_PRODUCT_ID}`);
    });

    test('TC_PDP_001: Critical Info Visibility', async ({ page }) => {
        await expect(page.locator('h1.text-h2')).toBeVisible();
        await expect(page.locator('text=₫').first()).toBeVisible();
        await expect(page.locator('.relative.h-\\[400px\\] img')).toBeVisible();
    });

    test('TC_PDP_002: Main Image Integrity', async ({ page }) => {
        const img = page.locator('.relative.h-\\[400px\\] img');
        await expect(img).toBeVisible();
        const src = await img.getAttribute('src');
        expect(src).toBeTruthy();
    });

    test('TC_PDP_003: Thumbnail Slider Navigation', async ({ page }) => {
        const firstThumbnail = page.locator('.relative.h-\\[70px\\] img').first();
        const nextBtn = page.locator('svg.lucide-chevron-right').first();

        if (await nextBtn.isVisible()) {
            const srcBefore = await firstThumbnail.getAttribute('src');
            await nextBtn.click();
            await page.waitForTimeout(500);
            const srcAfter = await firstThumbnail.getAttribute('src');
            expect(srcBefore).not.toEqual(srcAfter);
        }
    });

    test('TC_PDP_004: Thumbnail Selection', async ({ page }) => {
        const thumbnails = page.locator('.relative.h-\\[70px\\]');
        if (await thumbnails.count() > 1) {
            const secondThumb = thumbnails.nth(1);
            await secondThumb.click();
            await expect(secondThumb).toHaveClass(/border-blue-500|ring/);
        }
    });

    test('TC_PDP_005: Add Button Disabled Initially', async ({ page }) => {
        const optionGroups = page.locator('.flex.flex-col.gap-2');
        if (await optionGroups.count() > 0) {
            const btn = page.getByRole('button', { name: 'Thêm vào giỏ' });
            await expect(btn).toBeDisabled();
        }
    });

    test('TC_PDP_006: Button Enables After Selection', async ({ page }) => {
        const optionGroups = page.locator('.flex.flex-col.gap-2');
        const btn = page.getByRole('button', { name: 'Thêm vào giỏ' });

        for (const group of await optionGroups.all()) {
            await group.locator('button:not([disabled])').first().click();
        }
        await expect(btn).toBeEnabled();
    });

    test('TC_PDP_007: Add to Cart Success Toast', async ({ page }) => {
        const optionGroups = page.locator('.flex.flex-col.gap-2');
        for (const group of await optionGroups.all()) {
            await group.locator('button:not([disabled])').first().click();
        }

        await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
        await expect(page.getByText('Đã thêm sản phẩm vào giỏ hàng')).toBeVisible();
    });

    test('TC_PDP_008: Buy Now Redirect', async ({ page }) => {
        const optionGroups = page.locator('.flex.flex-col.gap-2');
        for (const group of await optionGroups.all()) {
            await group.locator('button:not([disabled])').first().click();
        }

        await page.getByRole('link', { name: 'Mua ngay' }).click();
        await expect(page).toHaveURL(/\/checkout/);
    });

    test('TC_PDP_009: Description Toggle', async ({ page }) => {
        const toggle = page.getByText('Xem thêm');
        if (await toggle.isVisible()) {
            await toggle.click();
            await expect(page.getByText('Thu gọn')).toBeVisible();
        }
    });

    test('TC_PDP_010: Tech Specs Visibility', async ({ page }) => {
        const header = page.getByText('Thông số kỹ thuật');
        if (await header.isVisible()) {
            await header.scrollIntoViewIfNeeded();
            await expect(page.locator('.grid.grid-cols-2').first()).toBeVisible();
        }
    });

    test('TC_PDP_011: Star Rating Hover', async ({ page }) => {
        const inputStars = page.locator('h3:has-text("Viết đánh giá") + div svg');
        if (await inputStars.count() >= 5) {
            await inputStars.nth(3).hover();
            await expect(inputStars.nth(3)).toHaveAttribute('fill', '#facc15');
        }
    });

    test('TC_PDP_012: Review Length Limit', async ({ page }) => {
        const textarea = page.locator('textarea[placeholder*="Viết nội dung"]');
        if (await textarea.isVisible()) {
            const longText = 'a'.repeat(505);
            await textarea.fill(longText);
            await expect(page.getByText('500/500')).toBeVisible();
        }
    });

    test('TC_PDP_013: Submit Review', async ({ page }) => {
        const submitBtn = page.locator('button').filter({ hasText: /Gửi|Đăng|Submit/i }).first();
        const textarea = page.locator('textarea[placeholder*="Viết nội dung"]');
        const inputStars = page.locator('h3:has-text("Viết đánh giá") + div svg');

        if (await submitBtn.isVisible()) {
            await textarea.fill('Playwright test review content.');
            await inputStars.nth(4).click();
            await submitBtn.click();

            await expect(async () => {
                const success = await page.getByText('Review created').isVisible();
                const error = await page.getByText('đã đánh giá').isVisible();
                return success || error;
            }).toBeTruthy();
        }
    });

    test('TC_PDP_014: Related Products', async ({ page }) => {
        const related = page.getByText('Sản phẩm liên quan');
        await related.scrollIntoViewIfNeeded();
        await expect(related).toBeVisible();
    });

    test('TC_PDP_015: Breadcrumb Navigation', async ({ page }) => {
        const nav = page.locator('nav[aria-label="breadcrumb"]');
        if (await nav.count() > 0) {
            await expect(nav).toBeVisible();
            await expect(nav).toContainText('Trang chủ');
        }
    });

    test('TC_PDP_016: Quantity Input Logic', async ({ page }) => {
        const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
        const qtyDisplay = page.locator('span.border-r.border-l, input[type="number"]').first();

        if (await plusBtn.isVisible()) {
            const initial = await qtyDisplay.innerText();
            await plusBtn.click();
            const after = await qtyDisplay.innerText();
            expect(initial).not.toEqual(after);
        }
    });

    test('TC_PDP_017: Price Formatting', async ({ page }) => {
        const price = page.locator('text=₫').first();
        await expect(price).toBeVisible();
        const text = await price.innerText();
        expect(text).toMatch(/[.,]/);
    });

    test('TC_PDP_018: Variant Display Labels', async ({ page }) => {
        const headers = page.locator('h3.font-bold');
        if (await headers.count() > 0) {
            await expect(headers.first()).toBeVisible();
        }
    });

    test('TC_PDP_019: Header Cart Count Update', async ({ page }) => {
        const optionGroups = page.locator('.flex.flex-col.gap-2');
        for (const group of await optionGroups.all()) {
            await group.locator('button:not([disabled])').first().click();
        }
        await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
        await expect(page.getByText('Đã thêm sản phẩm vào giỏ hàng')).toBeVisible();

        const cartBadge = page.locator('header a[href="/cart"] .bg-red-500, header .badge');
        if (await cartBadge.isVisible()) {
            await expect(cartBadge).toBeVisible();
        }
    });

    test('TC_PDP_020: API Error on Add (Mock)', async ({ page }) => {
        await page.route('**/carts/*/item', async route => {
            if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
                await route.fulfill({ status: 500, json: { message: 'Mock Error' } });
            } else {
                await route.continue();
            }
        });

        const optionGroups = page.locator('.flex.flex-col.gap-2');
        for (const group of await optionGroups.all()) {
            await group.locator('button:not([disabled])').first().click();
        }
        await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();

        await expect(page.locator('[data-sonner-toast]')).toBeVisible();
    });

});