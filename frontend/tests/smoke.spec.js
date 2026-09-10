import { test, expect } from '@playwright/test';

test.describe('NearbyApp Smoke Tests', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
  });

  test('should navigate tabs without console errors', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app shell to be ready
    await page.waitForSelector('.app-shell', { state: 'visible' });

    // Click on bottom navigation tabs
    await page.click('text=Saved');
    await page.waitForTimeout(500); // Give time for any lazy rendering/errors

    await page.click('text=AI Guide');
    await page.waitForTimeout(500);

    await page.click('text=Profile');
    await page.waitForTimeout(500);

    await page.click('text=Nearby');
    await page.waitForTimeout(500);

    // Verify no errors occurred during navigation
    expect(errors).toHaveLength(0);
  });

  test('should open Place Detail modal without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-shell', { state: 'visible' });
    await page.waitForTimeout(1000); // Wait for places to load from API/IDB

    // Click the first place card
    const firstCard = page.locator('.neo-card').filter({ hasText: /Book tickets|View details|Get directions/ }).first();
    if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForTimeout(1000);
        
        // Ensure the back button is visible, proving the modal opened
        const backBtn = page.locator('button:has-text("Back")');
        await expect(backBtn).toBeVisible();
        await backBtn.click();
    }
    
    expect(errors).toHaveLength(0);
  });

  test('should open Create Meetup modal without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app-shell', { state: 'visible' });
    
    // Click the Host Activity button on the map (it might be absolute positioned)
    const hostBtn = page.locator('button:has-text("HOST AN ACTIVITY")');
    if (await hostBtn.isVisible()) {
        await hostBtn.click();
        await page.waitForTimeout(1000);

        const formTitle = page.locator('h1:has-text("Host a Sports Meetup")');
        await expect(formTitle).toBeVisible();
        
        const backBtn = page.locator('button:has-text("Back")');
        await backBtn.click();
    }

    expect(errors).toHaveLength(0);
  });
});
