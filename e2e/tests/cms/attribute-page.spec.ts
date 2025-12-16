import { test, expect, Page } from '@playwright/test';
import {randomInt} from "node:crypto";

const BASE_URL = 'https://electricilies.vercel.app/admin/attributes';

async function mockAttributesList(page: Page, data: any[] = []) {
    await page.route('**/attributes?*', async route => {
        await route.fulfill({
            status: 200,
            json: {
                data: data,
                meta: { totalPages: 2, page: 1, limit: 10 }
            }
        });
    });
}

const NAME = randomInt(100000, 900000);
const VALUE1 = randomInt(100000, 900000);

test.describe('Admin Attributes Page E2E', () => {

    test('TC_ATTR_001: Page Load & Table UI', async ({ page }) => {
        await mockAttributesList(page, [{ id: '1', code: 'color', name: 'Màu sắc', values: [] }]);
        await page.goto(BASE_URL);
        await expect(page.locator('table')).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
    });


    test('TC_ATTR_002: Open Create Dialog', async ({ page }) => {
        await page.goto(BASE_URL);
        const createBtn = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
        await createBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Tạo thuộc tính')).toBeVisible();
    });

    test('TC_ATTR_003: Create Validation', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        // Attempt save empty
        await page.getByRole('button', { name: 'Lưu' }).click();

        // Check for browser validation or UI requirement
        const nameInput = page.locator('input').filter({ hasText: 'Tên thuộc tính' }).first();
        // Since Shadcn/Radix usually relies on HTML5 validation or form state
        // We expect the dialog to still be open
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('TC_ATTR_004: Add Value Input', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        const valueInputs = page.getByPlaceholder('Nhập giá trị...');
        await expect(valueInputs).toHaveCount(1);

        const addValueBtn = page.locator('button:has(svg.lucide-circle-plus)');
        await addValueBtn.click();
        await expect(valueInputs).toHaveCount(2);
    });

    test('TC_ATTR_005: Remove Value Input', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        const addValueBtn = page.locator('button:has(svg.lucide-circle-plus)');
        await addValueBtn.click();

        const removeBtns = page.locator('button:has(svg.lucide-trash2)');
        await removeBtns.last().click();

        await expect(page.getByPlaceholder('Nhập giá trị...')).toHaveCount(1);
    });

    test('TC_ATTR_006: Min Value Guard', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        const removeBtn = page.locator('button:has(svg.lucide-trash2)').last();
        await expect(removeBtn).toBeDisabled();
    });

    test('TC_ATTR_007: Create Success', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        // Fill Form
        await page.locator('input').nth(1).fill(String(NAME)); // Name
        await page.locator('input').nth(2).fill(String(NAME)); // Code

        const addValueBtn = page.locator('button:has(svg.lucide-circle-plus)');
        await addValueBtn.click();

        await page.getByPlaceholder('Nhập giá trị...').first().fill(String(NAME));
        await page.getByPlaceholder('Nhập giá trị...').nth(1).fill(String(VALUE1));

        await page.getByRole('button', { name: 'Lưu' }).click();
        await expect(page.getByText('Thành công')).toBeVisible();
        await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('TC_ATTR_008: Blank Attribute Code Error', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        await page.getByRole('button', { name: 'Lưu' }).click();
        await expect(page.getByText('Vui lòng nhập mã thuộc tính')).toBeVisible();
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('TC_ATTR_009: Blank Attribute Name Error', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        await page.locator('input').nth(1).fill(String(NAME));

        await page.getByRole('button', { name: 'Lưu' }).click();
        await expect(page.getByText('Vui lòng nhập tên thuộc tính')).toBeVisible();
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('TC_ATTR_010: Blank Attribute Value Error', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        await page.locator('input').nth(1).fill(String(NAME));
        await page.locator('input').nth(2).fill(String(NAME));

        await page.getByRole('button', { name: 'Lưu' }).click();
        await expect(page.getByText('Vui lòng nhập ít nhất 1 giá trị')).toBeVisible();
        await expect(page.getByRole('dialog')).toBeVisible();
    });


    test('TC_ATTR_011: Edit Dialog Open', async ({ page }) => {
        const mockData = [{ id: '1', code: 'color', name: 'Màu sắc', values: [{id: 'v1', value: 'Red'}] }];
        await mockAttributesList(page, mockData);
        await page.goto(BASE_URL);

        // Click Edit button (Pencil)
        const editBtn = page.locator('button').filter({ has: page.locator('svg.lucide-square-pen') }).first();
        await editBtn.click();

        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.locator('input').nth(1)).toBeDisabled();
    });

    test('TC_ATTR_012: Edit Dialog Close (Cancel)', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

        await page.getByRole('button', { name: 'Hủy' }).click();
        await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('TC_ATTR_013: Edit Success', async ({ page }) => {
        await page.goto(BASE_URL);

        await page.locator('button').filter({ has: page.locator('svg.lucide-square-pen') }).first().click();

        await page.getByRole('button', { name: 'Lưu' }).click();

        await expect(page.getByText('Thành công')).toBeVisible();
    });

    test('TC_ATTR_014: Delete Action', async ({ page }) => {
        await page.goto(BASE_URL);

        const searchInput = page.getByPlaceholder('Search attributes...');
        await expect(searchInput).toBeVisible();
        await searchInput.fill(String(NAME));

        const deleteBtn = page.locator('button:has(svg.lucide-trash-2)').first();
        await deleteBtn.click();

        await page.getByRole('button', { name:'Xóa ngay'}).click();

        await expect(page.getByText('Thành công')).toBeVisible();
    });

    const searchTerm = 'Testing Attributes';
    const placeholderText = 'Search attributes...';

    test('TC_ATTR_015: Search Results Update URL', async ({ page }) => {
        await page.goto(BASE_URL);
        const searchInput = page.getByPlaceholder(placeholderText);
        await searchInput.fill(searchTerm);
        await searchInput.press('Enter');
        await expect(page).toHaveURL(new RegExp(`search=${encodeURIComponent(searchTerm)}`.replace(/%20/g, '\\+')));
    });

    test('TC_ATTR_016: Search Retains Input Value', async ({ page }) => {
        await page.goto(BASE_URL);
        const searchInput = page.getByPlaceholder(placeholderText);
        await searchInput.fill(searchTerm);
        await searchInput.press('Enter');
        await expect(searchInput).toHaveValue(searchTerm);
    })

    test('TC_ATTR_017: Search Results Displayed', async ({ page }) => {
        await page.goto(BASE_URL);
        const searchInput = page.getByPlaceholder(placeholderText);
        await searchInput.fill(searchTerm);

        // wait for search response & ui renders
        const searchResponsePromise = page.waitForResponse(
            res => res.url().includes('search=') && res.status() === 200
        );
        await searchInput.press('Enter');
        await searchResponsePromise;
        await expect(page.locator('tbody tr').first()).toContainText(searchTerm);

        const rows = page.locator('tbody tr');
        const rowCount = await rows.count();
        console.log(rowCount);
        expect(rowCount).toBeGreaterThan(0);
        for (let i = 0; i < rowCount - 1; i++) {
            const row = rows.nth(i);
            await expect(row).toContainText(searchTerm);
        }
    });
});