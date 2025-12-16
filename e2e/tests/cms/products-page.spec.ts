import {expect, test} from '@playwright/test';
import {randomInt} from "crypto";

const PAGE_URL = '/admin/products';
const API_URL = process.env.API_URL;
let productId = '';

// sequential tests to avoid conflicts when adding mock products
test.describe.configure({ mode: 'serial' });

interface PresignedUrlResponse {
    url: string;
    key: string;
}

async function getImageFileFromUrl(imageUrl, fileName = 'image.jpg', mimeType = 'image/jpeg') {
    try {
        const response = await fetch(imageUrl); // Fetch the image from the URL
        const blob = await response.blob(); // Convert the response to a Blob

        // Create a new File object from the Blob
        return new File([blob], fileName, {type: mimeType});
    } catch (error) {
        console.error("Error fetching image:", error);
        return null;
    }
}
export const uploadImageToMinio = async (file: File, token: string) => {
    const res = await fetch(
        `${API_URL}/products/images/upload-url`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        },
    );
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to get upload URL");
    }
    const data: PresignedUrlResponse = await res.json();
    const uploadRes = await fetch(data.url, {
        method: "PUT",
        headers: {
            "Content-Type": file.type,
        },
        body: file,
    });
    if (!uploadRes.ok) {
        throw new Error("Failed to upload image to storage");
    }
    return {
        key: data.key,
        url: data.url.split("?")[0],
    };
};

const addMockProduct = async () => {
    const imgFile = await getImageFileFromUrl('https://picsum.photos/500', 'mock-product.jpg', 'image/jpeg');
    if (!imgFile) {
        throw new Error('Failed to fetch image for mock product');
    }

    const uploadedImage = await uploadImageToMinio(imgFile, process.env.ADMIN_TOKEN);

    const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
            "name": "Playwright Testing Item 2",
            "description": "Description",
            "categoryId": "019aed3f-fb9b-7043-b4e9-a7a435c32904",
            "images": [
                {
                    "key": uploadedImage.key,
                    "order": 1
                }
            ],
            "attributes": [],
            "options": [],
            "variants": [
                {
                    "sku": randomInt(1000000, 9999999).toString(),
                    "price": 1,
                    "quantity": 1,
                    "images": [],
                    "options": []
                }
            ]
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error adding mock product:', errorData);
        throw new Error(`Failed to add mock product: ${response.statusText}`);
    }

    const resData = await response.json();
    productId = resData.id;
    console.log('Mock product added with ID:', productId);
}

test.describe('Admin Products Page E2E', () => {
    const productName = 'Điện thoại ZTE Family 4GB/128GB, Màn OLED Full HD+, Dimensity 700, Kháng nước IP67, Sạc 22,5W - Mới nguyên seal - Hàng nhập khẩu nhật'

    test.beforeAll(async () => {
        await addMockProduct();
    })
    test.beforeEach(async ({ page }) => {
        await page.goto(PAGE_URL);
    });

    test('TC_01: Render Heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Products List' })).toBeVisible();

        const addButton = page.locator('a[href="/admin/products/new"]');
        await expect(addButton).toBeVisible();

        const searchInput = page.getByPlaceholder('Type a product name to search...');
        await expect(searchInput).toBeVisible();
    });

    test('TC_02: Render Table Headings', async ({ page }) => {
        const headers = ['Name', 'Price', 'Purchased', 'Rating', 'Last Updated', 'Cover Image', 'Actions'];
        for (const header of headers) {
            await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
        }
    })

    test('TC_03: Render Product Row', async ({ page }) => {
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toContainText(productName);
        await expect(firstRow).toContainText('2599000');
        await expect(firstRow).toContainText('0');
        await expect(firstRow).toContainText('0');
        await expect(firstRow.locator('img')).toHaveAttribute('alt', productName);
    })

    test.describe('Search Functionality', () => {
        const searchTerm = 'Testing Item';
        const placeholderText = 'Type a product name to search...'
        test('TC_04: Search Results Update URL', async ({ page }) => {
            const searchInput = page.getByPlaceholder(placeholderText);
            await searchInput.fill(searchTerm);
            await searchInput.press('Enter');
            await expect(page).toHaveURL(new RegExp(`search=${encodeURIComponent(searchTerm)}`.replace(/%20/g, '\\+')));
        });

        test('TC_05: Search Retains Input Value', async ({ page }) => {
            const searchInput = page.getByPlaceholder(placeholderText);
            await searchInput.fill(searchTerm);
            await searchInput.press('Enter');
            await expect(searchInput).toHaveValue(searchTerm);
        })

        test('TC_06: Search Results Displayed', async ({ page }) => {
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

    test('TC_07: "Add Button Redirects Correctly', async ({ page }) => {
        const addButton = page.locator('a[href="/admin/products/new"]');
        await addButton.click();
        await expect(page).toHaveURL(/\/admin\/products\/new/);
    });

    test('TC_08: Product Name Opens Product Page', async ({ page }) => {
        const productLink = page.getByRole('link', { name: productName });
        await expect(productLink).toHaveAttribute('target', '_blank');
        await expect(productLink).toHaveAttribute('href', `/products/00000000-0000-7000-0000-000278469345`);
        const [newPage] = await Promise.all([
            page.waitForEvent('popup'),
            productLink.click(),
        ]);
        await expect(newPage).toHaveURL(new RegExp(`/products/00000000-0000-7000-0000-000278469345`));
    });

    test('TC_09: Render Table Actions', async ({ page }) => {
        const row = page.locator('tbody tr').first();
        const editBtn = row.locator('svg.lucide-square-pen');
        const deleteBtn = row.locator('svg.lucide-trash2');
        await expect(editBtn).toBeVisible();
        await expect(deleteBtn).toBeVisible();
    });

    test.afterAll(async () => {
        // Clean up mock product
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error deleting mock product:', errorData);
            throw new Error(`Failed to delete mock product: ${response.statusText}`);
        }
        console.log('Mock product deleted with ID:', productId);
    })
});