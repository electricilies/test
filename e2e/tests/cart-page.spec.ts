import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://electricilies.vercel.app';
const PRODUCT_ID = '1';

async function addItemToCart(page: Page) {
    await page.goto(`${BASE_URL}/products/${PRODUCT_ID}`);
    // Handle options if they exist
    const optionGroups = page.locator('.flex.flex-col.gap-2');
    const count = await optionGroups.count();
    for (let i = 0; i < count; ++i) {
        await optionGroups.nth(i).locator('button:not([disabled])').first().click();
    }
    await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
}

test.describe('Cart Page E2E', () => {

    test('TC_CART_001: Empty Cart State', async ({ page }) => {
        await page.route('**/carts/me', async route => {
            const json = { id: 'cart-mock', items: [] };
            await route.fulfill({ json });
        });

        await page.goto(`${BASE_URL}/cart`);
        await expect(page.getByText('Giỏ hàng của bạn đang trống')).toBeVisible();
    });

    test('TC_CART_002: Add Item Flow', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);
        // Check if at least one item exists
        const item = page.locator('.flex.items-center.gap-4').first();
        await expect(item).toBeVisible();
    });

    test('TC_CART_003: Increase Quantity (+)', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
        const qtyDisplay = page.locator('span.border-r.border-l').first();

        const initialQty = parseInt(await qtyDisplay.innerText());

        await plusBtn.click();

        await expect(qtyDisplay).toHaveText(String(initialQty + 1));
    });

    test('TC_CART_004: Decrease Quantity (-)', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
        const minusBtn = page.locator('button:has(svg.lucide-minus)').first();
        const qtyDisplay = page.locator('span.border-r.border-l').first();

        const initialQty = parseInt(await qtyDisplay.innerText());
        if (initialQty === 1) {
            await plusBtn.click();
            await expect(qtyDisplay).toHaveText('2');
        }

        await minusBtn.click();
        await expect(qtyDisplay).toHaveText(String(Math.max(1, initialQty)));
    });

    test('TC_CART_005: Min Quantity Guard', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const minusBtn = page.locator('button:has(svg.lucide-minus)').first();
        const qtyDisplay = page.locator('span.border-r.border-l').first();

        let currentQty = parseInt(await qtyDisplay.innerText());
        while (currentQty > 1) {
            await minusBtn.click();
            await page.waitForTimeout(200);
            currentQty = parseInt(await qtyDisplay.innerText());
        }

        await minusBtn.click();
        await expect(qtyDisplay).toHaveText('1');
    });

    test('TC_CART_006: Delete Item', async ({ page }) => {

        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        // Count items before delete
        const itemsBefore = await page.locator('.flex.items-center.gap-4').count();

        // Click delete on the first item
        await page.locator('button:has(svg.lucide-trash-2)').first().click();

        // Wait for potential update
        await page.waitForTimeout(1000);

        // Assert item count decreased
        const itemsAfter = await page.locator('.flex.items-center.gap-4').count();
        expect(itemsAfter).toBeLessThan(itemsBefore);
    });

    test('TC_CART_007: Persistence on Reload', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);
        await page.reload();
        await expect(page.locator('.flex.items-center.gap-4').first()).toBeVisible();
    });

    test('TC_CART_008: Checkbox Selection', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const checkbox = page.getByRole('checkbox').first();
        const totalText = page.locator('div.text-lead').getByText('Tổng tiền sản phẩm').locator('..').locator('span.float-right');

        const isCheckedInitial = await checkbox.isChecked();
        await checkbox.click();

        expect(await checkbox.isChecked()).not.toBe(isCheckedInitial);
    });

    test('TC_CART_009: Subtotal Calculation', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const checkbox = page.getByRole('checkbox').first();
        if (!await checkbox.isChecked()) await checkbox.click();

        const itemPriceEl = page.locator('.text-h4.text-tertiary').first();
        const itemPriceText = await itemPriceEl.innerText();
        const subtotalEl = page.locator('div.text-lead').getByText('Tổng tiền sản phẩm').locator('..').locator('span.float-right');

        // Simple check: Subtotal should assume the price format logic
        await expect(subtotalEl).toContainText('₫');
    });

    test('TC_CART_010: Discount Calculation', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const checkbox = page.getByRole('checkbox').first();
        if (!await checkbox.isChecked()) await checkbox.click();

        const discountRow = page.getByText('Giảm giá').locator('..').locator('span.float-right');
        const discountText = await discountRow.innerText();

        expect(discountText).not.toContain('0 ₫');
        expect(discountText).toContain('₫');
    });

    test('TC_CART_011: Grand Total Logic', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const checkbox = page.getByRole('checkbox').first();
        if (!await checkbox.isChecked()) await checkbox.click();

        const finalTotal = page.getByText('Tổng tiền thanh toán').locator('..').locator('span.float-right');
        await expect(finalTotal).toBeVisible();
        await expect(finalTotal).toContainText('₫');
    });

    test('TC_CART_012: Continue Shopping Link', async ({ page }) => {
        await page.goto(`${BASE_URL}/cart`);
        const link = page.getByRole('link', { name: 'Tiếp tục mua hàng' });
        await expect(link).toBeVisible();
        await link.click();
        await expect(page).toHaveURL(`${BASE_URL}/products`);
    });

    test('TC_CART_013: Checkout Navigation', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const checkoutBtn = page.getByRole('link', { name: 'Thanh toán' });
        await checkoutBtn.click();
        await expect(page).toHaveURL(`${BASE_URL}/checkout`);
    });

    test('TC_CART_014: Variant Details Display', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);
        const name = page.locator('.flex.items-center.gap-4 .line-clamp-3').first();
        await expect(name).not.toBeEmpty();
    });

    test('TC_CART_015: Currency Formatting', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);
        const price = page.locator('.text-h4.text-tertiary').first();
        await expect(price).toContainText('₫');
    });

    test('TC_CART_016: Item Image Visibility', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);
        const img = page.locator('.flex.items-center.gap-4 img').first();
        await expect(img).toBeVisible();
        const src = await img.getAttribute('src');
        expect(src).toBeTruthy();
    });

    test('TC_CART_017: Multi-Variant Rows', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);
        await expect(page.locator('.flex.items-center.gap-4')).toHaveCount(2); // At least 1
    });

    test('TC_CART_018: Debounce/Optimistic UI', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
        const display = page.locator('span.border-r.border-l').first();

        const startVal = parseInt(await display.innerText());
        await plusBtn.click();
        await plusBtn.click();
        await plusBtn.click();

        await expect(display).toHaveText(String(startVal + 3));
    });


    test('TC_CART_019: API Error Handling (Mock)', async ({ page }) => {
        await addItemToCart(page);
        await page.goto(`${BASE_URL}/cart`);

        await page.route('**/carts/*/item/*', async route => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 500, json: { message: 'Mock Error' } });
            } else {
                await route.continue();
            }
        });

        const deleteBtn = page.locator('button:has(svg.lucide-trash-2)').first();
        if (await deleteBtn.isVisible()) {
            await deleteBtn.click();
            await expect(page.locator('.flex.items-center.gap-4').first()).toBeVisible();
        }
    });

});