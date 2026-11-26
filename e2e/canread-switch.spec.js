// R2 UX 11-26: the "Can read English words" switch did nothing when its track was tapped (double toggle:
// track onClick + the enclosing label). jsdom does not reproduce label activation, so this runs in a real browser.
import { test, expect } from '@playwright/test';

test('tapping the can-read switch itself toggles it once', async ({ page }) => {
  await page.goto('/new-player');
  const box = page.getByRole('checkbox');
  const sw = page.getByTestId('canread-switch');
  await expect(box).toBeChecked();
  await sw.click();
  await expect(box).not.toBeChecked();
  await sw.click();
  await expect(box).toBeChecked();
});
