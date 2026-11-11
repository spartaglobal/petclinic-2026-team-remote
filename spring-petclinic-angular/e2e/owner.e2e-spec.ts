import { test, expect } from '@playwright/test';

test('should load home page', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await expect(page).toHaveTitle(/SpringPetclinicAngular/);
});
