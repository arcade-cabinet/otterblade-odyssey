import type { Page } from '@playwright/test';

/**
 * Loads a chapter manifest from the running dev server.
 */
export async function loadChapterManifest(page: Page, fileName: string): Promise<any> {
  const response = await page.request.get(`/data/manifests/chapters/${fileName}`);
  if (!response.ok()) {
    throw new Error(
      `Failed to load chapter manifest ${fileName}: ${response.status()} ${response.statusText()}`
    );
  }
  return response.json();
}
