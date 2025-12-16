import { test, expect, request } from '@playwright/test';

const PAGE_URL = '/admin/products/new';
const API_URL = process.env.API_URL
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

interface Category {
    id: string;
    name: string;
}

test.describe('Add New Product Page E2E', () => {
    let categories: Category[] = [];

    async function createOption(page, name, values) {
        await page.locator('#create-option').click();
        await page.fill('#name', name);
        const input = page.locator('input[placeholder="Enter value..."]');
        await input.first().fill(values[0]);
        for(let i= 1; i < values.length; i++) {
            await page.locator('#add-option-value').click();
            await input.nth(i).fill(values[i]);
        }
        await page.getByRole('button', { name: 'Add' }).click();
    }

    test.beforeAll(async ({ request }) => {
        const response = await request.get(`${API_URL}/categories`, {
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        expect(response.ok()).toBeTruthy();
        const json = await response.json();
        categories = json.data;
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(PAGE_URL);
    });

    test.describe('General UI & Form Validation', () => {
        test('TC_CMS_NEW_PROD_UI_01: Render UI', async ({ page }) => {
            await expect(page.getByRole('heading', { name: 'Add Product' })).toBeVisible();;
            await expect(page.locator('button:has-text("Select category")')).toBeVisible();
            await expect(page.getByLabel('name')).toBeVisible();
            await expect(page.getByLabel('description')).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Images' })).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Attributes' })).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible();
            await expect(page.getByPlaceholder('Add Name')).toBeVisible();
            await expect(page.getByPlaceholder('Add description')).toBeVisible();
            await expect(page.locator('button#upload-image-button')).toBeVisible();
            await expect(page.locator('button#create-attribute')).toBeVisible();
            await expect(page.locator('button#create-option')).toBeVisible();
            await expect(page.locator('button#create-variant')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Create Product' })).toBeVisible();
        });

        test('TC_CMS_NEW_PROD_UI_02: Validation Errors when submitting new form', async ({ page }) => {
            await page.getByRole('button', { name: 'Create Product' }).click();
            await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
            await expect(page.getByText('Thêm ít nhất một hình ảnh cho sản phẩm')).toBeVisible();
        });
    });

    test.describe('Image Upload Feature', () => {
        test('TC_CMS_NEW_PROD_IMG_01: Upload image and preview image', async ({ page }) => {
            await page.route('**/products/images/upload-url', async route => {
                await route.fulfill({
                    json: { url: 'https://via.placeholder.com/150', key: 'mock-key' }
                });
            });
            await page.route('https://via.placeholder.com/150', async route => {
                await route.fulfill({ status: 200 });
            });

            const fileChooserPromise = page.waitForEvent('filechooser');
            await page.locator('#upload-image-button').click();
            const fileChooser = await fileChooserPromise;

            await fileChooser.setFiles({
                name: 'test-image.png',
                mimeType: 'image/png',
                buffer: Buffer.from('mock-image-content')
            });

            await expect(page.locator('.images img')).toBeVisible();
        });

        test('TC_CMS_NEW_PROD_IMG_02: Delete uploaded image', async ({ page }) => {
            await page.route('**/products/images/upload-url', async route => route.fulfill({ json: { url: 'https://via.placeholder.com/150', key: 'mock' } }));
            await page.route('https://via.placeholder.com/150', async route => route.fulfill({ status: 200 }));

            const fileChooserPromise = page.waitForEvent('filechooser');
            await page.locator('#upload-image-button').click();
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('x') });
            const deleteBtn = page.locator('svg.lucide-trash-2').first();
            await deleteBtn.click();

            await expect(page.locator('.images img')).not.toBeVisible();
        });
    });

    test.describe('Product Attributes', () => {
        test('TC_CMS_NEW_PROD_ATTR_01: Open dialog and dialog UI', async ({ page }) => {
            await page.locator('#create-attribute').click();
            await expect(page.getByRole('heading', { name: 'Add Attribute' })).toBeVisible();
            await expect(page.getByText('Thêm thuộc tính vào sản phẩm.')).toBeVisible();
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.locator("button#attribute-id")).toBeVisible();
            await expect(page.getByLabel('Add Attribute').getByText('Value', { exact: true })).toBeVisible();
            await expect(page.locator('button#attribute-id')).toBeVisible();
            await expect(page.locator('button:has-text("Select value")')).toBeVisible();
            await expect(page.locator('button:has-text("Select value")')).toBeDisabled();
            await page.click('button:has-text("Select attribute")');
        });

        test('TC_CMS_NEW_PROD_ATTR_02: Add new attribute', async ({ page }) => {
            await page.route('**/attributes', async route => {
                await route.fulfill({
                    json: {
                        data: [{
                            id: 'attr-1', name: 'Material',
                            values: [{ id: 'val-1', value: 'Cotton' }, { id: 'val-2', value: 'Silk' }]
                        }]
                    }
                });
            });

            await page.locator('#create-attribute').click();

            await page.click('button:has-text("Select attribute")');
            await page.getByRole('option', { name: 'Material' }).click();
            await page.click('button:has-text("Select value")');
            await page.getByRole('option', { name: 'Cotton' }).click();
            await page.getByRole('button', { name: 'Add' }).click();

            const row = page.locator('table tbody tr').first();
            await expect(row).toContainText('Material');
            await expect(row).toContainText('Cotton');
        });

        test('TC_CMS_NEW_PROD_ATTR_03: Validate no duplicate attribute', async ({ page }) => {
            await page.route('**/attributes', async route => {
                await route.fulfill({
                    json: {
                        data: [{
                            id: 'attr-1', name: 'Material',
                            values: [{ id: 'val-1', value: 'Cotton' }, { id: 'val-2', value: 'Silk' }]
                        }]
                    }
                });
            });

            await page.locator('#create-attribute').click();
            const attributeBtn = page.locator('button#attribute-id');
            await attributeBtn.click();
            await page.getByRole('option', { name: 'Material' }).click();
            await page.click('button:has-text("Select value")');
            await page.getByRole('option', { name: 'Cotton' }).click();
            await page.getByRole('button', { name: 'Add' }).click();

            await page.locator('#create-attribute').first().click();
            await attributeBtn.click();

            const option = page.getByRole('option', { name: 'Material' });
            await expect(option).toBeDisabled();
        });

        test("TC_CMS_NEW_PROD_ATTR_04: New attribute added at the bottom of the list", async ({ page }) => {
            await page.route('**/attributes', async route => {
                await route.fulfill({
                    json: {
                        data: [
                            { id: 'attr-1', name: 'Material', values: [{ id: 'val-1', value: 'Cotton' }] },
                            { id: 'attr-2', name: 'Brand', values: [{ id: 'val-2', value: 'BrandA' }] }
                        ]
                    }
                });
            });
            await page.locator('#create-attribute').click();
            await page.click('button:has-text("Select attribute")');
            await page.getByRole('option', { name: 'Material' }).click();
            await page.click('button:has-text("Select value")');
            await page.getByRole('option', { name: 'Cotton' }).click();
            await page.getByRole('button', { name: 'Add' }).click();

            await page.locator('#create-attribute').first().click();
            await page.click('button:has-text("Select attribute")');
            await page.getByRole('option', { name: 'Brand' }).click();
            await page.click('button:has-text("Select value")');
            await page.getByRole('option', { name: 'BrandA' }).click();
            await page.getByRole('button', { name: 'Add' }).click();

            const rows = page.locator('table tbody tr');
            const rowCount = await rows.count();
            const lastRow = rows.nth(rowCount - 1);
            await expect(lastRow).toContainText('Brand');
            await expect(lastRow).toContainText('BrandA');
        });
    });

    test.describe('Product Options', () => {
        test('TC_CMS_NEW_PROD_OPT_01: Add Option with multiple values', async ({ page }) => {
            await page.locator('#create-option').click();
            await page.fill('#name', 'Color');
            await page.fill('input[placeholder="Enter value..."]', 'Red');
            await page.locator('#option-form > div.flex.w-full.items-center.gap-2 > button').click();
            const inputs = page.locator('input[placeholder="Enter value..."]');
            await inputs.nth(1).fill('Blue');
            await page.getByRole('button', { name: 'Add' }).click();
            const row = page.locator('table').nth(1).locator('tbody tr').first();
            await expect(row).toContainText('Color');
            await expect(row).toContainText('Red, Blue');
        });

        test('TC_CMS_NEW_PROD_OPT_02: Edit Option', async ({ page }) => {

            // precondition: create option first
            await page.locator('#create-option').click();
            await page.fill('#name', 'Size');
            await page.fill('input[placeholder="Enter value..."]', 'M');
            await page.getByRole('button', { name: 'Add' }).click();

            // click edit
            await page.locator('table').nth(1).locator('button').first().click();

            await page.fill('#name', 'Size Updated');
            await page.getByRole('button', { name: 'Save' }).click();
            await expect(page.locator('table').nth(1)).toContainText('Size Updated');
        });

        test('TC_CMS_NEW_PROD_OPT_03: Delete Option', async ({ page }) => {
            await page.locator('#create-option').click();
            await page.fill('#name', 'Pattern');
            await page.fill('input[placeholder="Enter value..."]', 'Striped');
            await page.getByRole('button', { name: 'Add' }).click();
            await page.locator('#delete-option').click();
            const rows = page.locator('table').nth(1).locator('tbody tr');
            const rowCount = await rows.count();
            for (let i = 0; i < rowCount; i++) {
                const row = rows.nth(i);
                await expect(row).not.toContainText('Pattern');
            }
        });
    });
    -
    test.describe('Product Variants & Logic Constraints', () => {

        test('TC_CMS_NEW_PROD_VAR_01: Create Variant', async ({ page }) => {
            await createOption(page, 'Color', ['Red', 'Blue']);
            await page.locator('#create-variant').click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.locator('input[value="Color"]')).toBeDisabled();
            await page.locator('#option-value-0').click();
            await page.getByRole('option', { name: 'Red' }).click();
            await page.fill('#sku', 'sku-red');
            await page.fill('#price', '100000');
            await page.fill('#quantity', '10');
            await page.getByRole('button', { name: 'Create Variant' }).click();

            const variantRow = page.locator('table').nth(2).locator('tbody tr').first();
            await expect(variantRow).toContainText('Color');
            await expect(variantRow).toContainText('Red');
            await expect(variantRow).toContainText('100000');
            await expect(variantRow).toContainText('10');
        });

        test('TC_CMS_NEW_PROD_VAR_02: Not allow add and edit options after creating variant', async ({ page }) => {
            await createOption(page, 'Material', ['wood']);
            await page.locator('#create-variant').click();
            await page.locator('#option-value-0').click();
            await page.getByRole('option', { name: 'wood' }).click();
            await page.fill('#sku', 'test');
            await page.fill('#price', '10');
            await page.fill('#quantity', '1');
            await page.getByRole('button', { name: 'Create Variant' }).click();
            const optionActionsCell = page.locator('table').nth(1).locator('tbody tr td').last();

            await expect(optionActionsCell.locator('button')).toHaveCount(0);
        });

        test('TC_CMS_NEW_PROD_VAR_03: Deleting all variants allow adjusting options', async ({ page }) => {
            await createOption(page, 'Size', ['L']);
            await page.locator('#create-variant').click();
            await page.click('#option-value-0');
            await page.getByRole('option', { name: 'L' }).click();
            await page.fill('#sku', 'TEST-UNLOCK');
            await page.fill('#price', '1');
            await page.fill('#quantity', '1');
            await page.getByRole('button', { name: 'Create Variant' }).click();

            const variantDeleteBtn = page.locator('table').nth(2).locator('button').last();
            await variantDeleteBtn.click();

            const optionActionsCell = page.locator('table').nth(1).locator('tbody tr td').last();
            await expect(optionActionsCell.locator('button')).not.toHaveCount(0);
        });
    });

    test.describe('Full Product Submission', () => {
        test('TC_CMS_NEW_PROD_SUBMIT_01: Happy Path - Tạo sản phẩm thành công', async ({ page }) => {
            await page.fill('#name', 'Playwright Test Product');
            await page.click('button:has-text("Select category")');
            await page.getByRole('option', { name: categories[0].name }).click();
            await page.fill('#description', 'Test product');

            await page.route('**/products/images/upload-url', async route => route.fulfill({ json: { url: 'https://via.placeholder.com/150', key: 'key' } }));
            await page.route('https://via.placeholder.com/150', async route => route.fulfill({ status: 200 }));
            const fileChooserPromise = page.waitForEvent('filechooser');
            await page.locator('#upload-image-button').click();
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles({ name: 'p.png', mimeType: 'image/png', buffer: Buffer.from('img') });

            await page.route('**/products', async route => {
                if(route.request().method() === 'POST') {
                    await route.fulfill({
                        status: 201,
                        json: { id: 'new-prod-123', name: 'E2E Testing Product' }
                    });
                } else {
                    await route.continue();
                }
            });

            await createOption(page, 'Size', ['L']);
            await page.locator('#create-variant').click();
            await page.click('#option-value-0');
            await page.getByRole('option', { name: 'L' }).click();
            await page.fill('#sku', 'TEST-UNLOCK');
            await page.fill('#price', '1');
            await page.fill('#quantity', '1');
            await page.getByRole('button', { name: 'Create Variant' }).click();

            await page.addInitScript(() => {
                window.open = () => null;
            });

            await page.getByRole('button', { name: 'Create Product' }).click();
            await expect(page.getByText('Tạo sản phẩm thành công')).toBeVisible();
            await expect(page.locator('#name')).toHaveValue('');
        });
    });
});