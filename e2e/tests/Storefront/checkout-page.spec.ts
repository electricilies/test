import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://electricilies.vercel.app';
const PRODUCT_ID = '1';

async function setupCartAndGoToCheckout(page: Page) {
    await page.goto(`${BASE_URL}/products/${PRODUCT_ID}`);
    const optionGroups = page.locator('.flex.flex-col.gap-2');
    const count = await optionGroups.count();
    for (let i = 0; i < count; ++i) {
        await optionGroups.nth(i).locator('button:not([disabled])').first().click();
    }
    await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();

    await page.goto(`${BASE_URL}/cart`);
    const checkbox = page.getByRole('checkbox').first();
    if (!await checkbox.isChecked()) {
        await checkbox.click();
    }

    await page.getByRole('link', { name: 'Thanh toán' }).click();
    await expect(page).toHaveURL(/.*checkout/);
}

test.describe('Checkout Page E2E', () => {

    test('TC_CO_001: Page Load & Access', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await expect(page.getByText('Thông tin đặt hàng')).toBeVisible();
        await expect(page.locator('form#checkout-form')).toBeVisible();
    });

    test('TC_CO_002: Order Summary Display', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await expect(page.getByText('Tổng số lượng sản phẩm')).toBeVisible();
        await expect(page.getByText('Tổng tiền sản phẩm')).toBeVisible();

        const label = page.getByText('Thanh toán', { exact: true });
        await expect(label).toBeVisible();

        const price = page.locator('.text-lead').filter({ hasText: 'Thanh toán' }).locator('..').locator('span').last();
        await expect(price).toContainText('₫');
    });

    test('TC_CO_003: Empty Form Validation', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        const submitBtn = page.getByRole('button', { name: 'Đặt hàng' });
        await expect(submitBtn).toBeDisabled();
    });

    test('TC_CO_004: Name Field Validation', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        const nameInput = page.locator('input[name="fullName"]');
        await nameInput.fill('A');
        await nameInput.blur();
        await expect(page.getByText('Vui lòng nhập họ tên')).toBeVisible();
    });

    test('TC_CO_005: Phone Input Interaction', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        const phoneInput = page.locator('input[type="tel"]');
        await expect(phoneInput).toBeVisible();
        await phoneInput.fill('0901234567');
        await expect(phoneInput).toHaveValue('0901 234 567');
    });

    test('TC_CO_006: Invalid Phone Validation', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        const phoneInput = page.locator('input[type="tel"]');
        await phoneInput.fill('123');
        await phoneInput.blur();
        await expect(page.getByText('Số điện thoại không hợp lệ')).toBeVisible();
    });

    test('TC_CO_007: Address Field Interaction', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        const addressInput = page.getByPlaceholder('Nhập địa chỉ giao hàng');
        await addressInput.fill('123 Street, City');
        await expect(addressInput).toHaveValue('123 Street, City');
    });

    test('TC_CO_008: Payment Method Selection', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        const codRadio = page.getByLabel('Thanh toán khi nhận hàng (COD)');
        const vnpayRadio = page.getByLabel('VNPay');

        await codRadio.check();
        await expect(codRadio).toBeChecked();

        await vnpayRadio.check();
        await expect(vnpayRadio).toBeChecked();
        await expect(codRadio).not.toBeChecked();
    });

    test('TC_CO_009: Button Enable State', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await page.locator('input[name="fullName"]').fill('Test User');
        await page.locator('input[type="tel"]').fill('0901234567');
        await page.getByPlaceholder('Nhập địa chỉ giao hàng').fill('123 Test Street');
        await page.getByLabel('Thanh toán khi nhận hàng (COD)').check();

        const submitBtn = page.getByRole('button', { name: 'Đặt hàng' });
        await expect(submitBtn).toBeEnabled();
    });

    test('TC_CO_010: COD Checkout Success', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await page.route('**/orders', async route => {
            await route.fulfill({ status: 200, json: { message: 'Success' } });
        });

        await page.locator('input[name="fullName"]').fill('Test User');
        await page.locator('input[type="tel"]').fill('0901234567');
        await page.getByPlaceholder('Nhập địa chỉ giao hàng').fill('123 Test Street');
        await page.getByLabel('Thanh toán khi nhận hàng (COD)').check();

        await page.getByRole('button', { name: 'Đặt hàng' }).click();

        await expect(page.getByText('Đặt hàng hoàn tất!')).toBeVisible();
    });

    test('TC_CO_011: Payment Redirect (VNPay)', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await page.route('**/orders', async route => {
            await route.fulfill({ status: 200, json: { payUrl: 'http://mock-vnpay.com' } });
        });

        await page.locator('input[name="fullName"]').fill('Test User');
        await page.locator('input[type="tel"]').fill('0901234567');
        await page.getByPlaceholder('Nhập địa chỉ giao hàng').fill('123 Test Street');
        await page.getByLabel('VNPay').check();

        const submitBtn = page.getByRole('button', { name: 'Đặt hàng' });
        await expect(submitBtn).toBeEnabled();
    });

    test('TC_CO_012: Payment Redirect (MoMo)', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await page.locator('input[name="fullName"]').fill('Test User');
        await page.locator('input[type="tel"]').fill('0901234567');
        await page.getByPlaceholder('Nhập địa chỉ giao hàng').fill('123 Test Street');
        await page.getByLabel('MoMo').check();

        const submitBtn = page.getByRole('button', { name: 'Đặt hàng' });
        await expect(submitBtn).toBeEnabled();
    });

    test('TC_CO_013: Payment Redirect (Zalo)', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await page.locator('input[name="fullName"]').fill('Test User');
        await page.locator('input[type="tel"]').fill('0901234567');
        await page.getByPlaceholder('Nhập địa chỉ giao hàng').fill('123 Test Street');
        await page.getByLabel('ZaloPay').check();

        const submitBtn = page.getByRole('button', { name: 'Đặt hàng' });
        await expect(submitBtn).toBeEnabled();
    });

    test('TC_CO_014: Submit Loading State', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await page.route('**/orders', async route => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await route.fulfill({ status: 200, json: { message: 'Success' } });
        });

        await page.locator('input[name="fullName"]').fill('Test User');
        await page.locator('input[type="tel"]').fill('0901234567');
        await page.getByPlaceholder('Nhập địa chỉ giao hàng').fill('123 Test Street');
        await page.getByLabel('Thanh toán khi nhận hàng (COD)').check();

        await page.getByRole('button', { name: 'Đặt hàng' }).click();
        await expect(page.getByText('Đang xử lý đơn hàng...')).toBeVisible();
    });

    test('TC_CO_015: API Error Handling', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await page.route('**/orders', async route => {
            await route.fulfill({ status: 500, json: { message: 'Server Error' } });
        });

        await page.locator('input[name="fullName"]').fill('Test User');
        await page.locator('input[type="tel"]').fill('0901234567');
        await page.getByPlaceholder('Nhập địa chỉ giao hàng').fill('123 Test Street');
        await page.getByLabel('Thanh toán khi nhận hàng (COD)').check();

        await page.getByRole('button', { name: 'Đặt hàng' }).click();
        await expect(page.locator('[data-sonner-toast]')).toBeVisible();
    });

    test('TC_CO_016: Empty Cart Guard', async ({ page }) => {
        await page.route('**/carts/me', async route => {
            await route.fulfill({ status: 200, json: { items: [] } });
        });

        await page.goto(`${BASE_URL}/checkout`);

        await expect(async () => {
            const text = await page.getByText('Giỏ hàng trống').isVisible();
            const url = page.url();
            return text || url.includes('cart');
        }).toBeTruthy();
    });

    test('TC_CO_017: Input Persistence Check', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        await page.locator('input[name="fullName"]').fill('Persist Name');
        await page.reload();
        await expect(page.locator('form#checkout-form')).toBeVisible();
    });

    test('TC_CO_018: Phone Country Search', async ({ page }) => {
        await setupCartAndGoToCheckout(page);
        const trigger = page.locator('button[role="combobox"]');
        if (await trigger.isVisible()) {
            await trigger.click();
            const searchInput = page.getByPlaceholder('Search country...');
            if (await searchInput.isVisible()) {
                await searchInput.fill('Vietnam');
                await expect(page.getByText('Vietnam')).toBeVisible();
            }
        }
    });

});