import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCAL_SITE = 'http://localhost:4321';
const LIVE_SITE = 'https://jack.direct';

test.describe('Blog Content Verification', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('homepage should have correct content', async ({ page }) => {
    await page.goto(LOCAL_SITE);
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toContain('Jack Klimov');

    const avatar = page.locator('img[alt*="Jack"], img[src*="avatar"]');
    await expect(avatar).toBeVisible();

    const articles = await page.locator('article').count();
    expect(articles).toBeGreaterThan(0);
  });

  test('about page should have correct content', async ({ page }) => {
    await page.goto(`${LOCAL_SITE}/about`);
    await page.waitForLoadState('networkidle');

    const heading = await page.locator('h1').first().textContent();
    expect(heading).toContain('About');

    const content = await page.locator('article, .prose, main').first().textContent();
    expect(content).toBeTruthy();
  });

  test('blog listing should show posts', async ({ page }) => {
    await page.goto(`${LOCAL_SITE}/blog`);
    await page.waitForLoadState('networkidle');

    const postLinks = await page.locator('a[href*="/blog/"]').count();
    expect(postLinks).toBeGreaterThan(0);
  });

  test('blog post should have correct content', async ({ page }) => {
    await page.goto(`${LOCAL_SITE}/blog/wild-west-of-ai-protocols`);
    await page.waitForLoadState('networkidle');

    const title = await page.locator('h1').first().textContent();
    expect(title).toContain('Wild West of AI Protocols');

    const paragraphs = await page.locator('p').count();
    expect(paragraphs).toBeGreaterThan(0);
  });

  test('social links should be present', async ({ page }) => {
    await page.goto(LOCAL_SITE);
    await page.waitForLoadState('networkidle');

    const links = await page.locator('a[href*="github"], a[href*="linkedin"], a[href*="twitter"], a[href*="x.com"]').count();
    expect(links).toBeGreaterThan(0);
  });

  test('all 12 blog posts should be accessible', async ({ page }) => {
    const blogPosts = [
      'wild-west-of-ai-protocols',
      'note-about-smart-pointers-in-rust',
      'understanding-replication-statement-wal-logical-log-and-trigger-based-approaches',
      'reflections-on-kotters-8-step-change-model',
      'rollback-pycharm-or-any-jetbrains-ide-settings',
      'python-threading-semaphores-and-barriers',
      'cap-theorem-for-developers',
      'how-to-stop-your-solidity-code-from-guzzling-gas-and-eth',
      'pull-over-push-pattern-in-solidity',
      'understanding-deadlocks-in-python-with-examples',
      'mastering-solidity-pragma-6-ways-to-specify-compiler-versions',
      'understanding-variable-types-in-solidity',
    ];

    for (const slug of blogPosts) {
      await page.goto(`${LOCAL_SITE}/blog/${slug}`);
      await page.waitForLoadState('networkidle');

      const title = await page.locator('h1').first().textContent();
      expect(title).toBeTruthy();
    }
  });
});

test.describe('Visual Comparison with Live Ghost Blog', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('homepage background color should match Ghost blog', async ({ browser }) => {
    // Ghost blog renders in dark mode; force dark color scheme for both
    const liveContext = await browser.newContext({ colorScheme: 'dark' });
    const livePage = await liveContext.newPage();
    await livePage.goto(LIVE_SITE);
    await livePage.waitForLoadState('networkidle');

    const liveBgColor = await livePage.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const bodyBg = window.getComputedStyle(body).backgroundColor;
      const htmlBg = window.getComputedStyle(html).backgroundColor;
      return bodyBg !== 'rgba(0, 0, 0, 0)' ? bodyBg : htmlBg;
    });

    const localContext = await browser.newContext({ colorScheme: 'dark' });
    const localPage = await localContext.newPage();
    await localPage.goto(LOCAL_SITE);
    await localPage.waitForLoadState('networkidle');

    const localBgColor = await localPage.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const bodyBg = window.getComputedStyle(body).backgroundColor;
      const htmlBg = window.getComputedStyle(html).backgroundColor;
      return bodyBg !== 'rgba(0, 0, 0, 0)' ? bodyBg : htmlBg;
    });

    // Parse rgb values and compare with tolerance (within 10 per channel)
    const parseRgb = (color: string) => {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      return match ? [+match[1], +match[2], +match[3]] : null;
    };

    const liveRgb = parseRgb(liveBgColor);
    const localRgb = parseRgb(localBgColor);

    expect(liveRgb, `Ghost bg: ${liveBgColor}`).not.toBeNull();
    expect(localRgb, `Astro bg: ${localBgColor}`).not.toBeNull();

    if (liveRgb && localRgb) {
      for (let i = 0; i < 3; i++) {
        expect(
          Math.abs(liveRgb[i] - localRgb[i]),
          `Channel ${i}: Ghost=${liveRgb[i]}, Astro=${localRgb[i]}`
        ).toBeLessThanOrEqual(10);
      }
    }

    await liveContext.close();
    await localContext.close();
  });

  test('homepage should have same post titles as Ghost blog', async ({ browser }) => {
    const liveContext = await browser.newContext();
    const livePage = await liveContext.newPage();
    await livePage.goto(LIVE_SITE);
    await livePage.waitForLoadState('networkidle');

    const livePostTitles = await livePage.evaluate(() => {
      const titles = document.querySelectorAll('h3');
      return Array.from(titles).map(el => el.textContent?.trim()).filter(Boolean);
    });

    const localContext = await browser.newContext();
    const localPage = await localContext.newPage();
    await localPage.goto(LOCAL_SITE);
    await localPage.waitForLoadState('networkidle');

    const localText = await localPage.textContent('body');

    // Normalize quotes for comparison
    const normalize = (s: string) => s.replace(/[\u2018\u2019\u201C\u201D""\u0022]/g, "'").replace(/\u2014/g, '-');

    for (const title of livePostTitles) {
      // Use first 40 chars to avoid truncation/wrapping differences
      const searchTerm = normalize(title!).substring(0, 40);
      expect(
        normalize(localText || ''),
        `Missing post title: "${title}"`
      ).toContain(searchTerm);
    }

    await liveContext.close();
    await localContext.close();
  });

  test('homepage visual snapshot comparison', async ({ browser }) => {
    const outputDir = join(__dirname, '..', 'test-results', 'visual-comparison');
    mkdirSync(outputDir, { recursive: true });

    const liveContext = await browser.newContext({ colorScheme: 'dark' });
    const livePage = await liveContext.newPage();
    await livePage.goto(LIVE_SITE);
    await livePage.waitForLoadState('networkidle');
    const liveScreenshot = await livePage.screenshot({ fullPage: true });

    const localContext = await browser.newContext({ colorScheme: 'dark' });
    const localPage = await localContext.newPage();
    await localPage.goto(LOCAL_SITE);
    await localPage.waitForLoadState('networkidle');
    const localScreenshot = await localPage.screenshot({ fullPage: true });

    writeFileSync(join(outputDir, 'ghost-homepage.png'), liveScreenshot);
    writeFileSync(join(outputDir, 'astro-homepage.png'), localScreenshot);

    expect(liveScreenshot.length).toBeGreaterThan(0);
    expect(localScreenshot.length).toBeGreaterThan(0);

    await liveContext.close();
    await localContext.close();
  });

  test('blog post visual snapshot comparison', async ({ browser }) => {
    const outputDir = join(__dirname, '..', 'test-results', 'visual-comparison');
    mkdirSync(outputDir, { recursive: true });

    const slug = 'wild-west-of-ai-protocols';

    const liveContext = await browser.newContext({ colorScheme: 'dark' });
    const livePage = await liveContext.newPage();
    await livePage.goto(`${LIVE_SITE}/${slug}/`);
    await livePage.waitForLoadState('networkidle');
    const liveScreenshot = await livePage.screenshot({ fullPage: true });

    const localContext = await browser.newContext({ colorScheme: 'dark' });
    const localPage = await localContext.newPage();
    await localPage.goto(`${LOCAL_SITE}/blog/${slug}`);
    await localPage.waitForLoadState('networkidle');
    const localScreenshot = await localPage.screenshot({ fullPage: true });

    writeFileSync(join(outputDir, `ghost-post-${slug}.png`), liveScreenshot);
    writeFileSync(join(outputDir, `astro-post-${slug}.png`), localScreenshot);

    expect(liveScreenshot.length).toBeGreaterThan(0);
    expect(localScreenshot.length).toBeGreaterThan(0);

    await liveContext.close();
    await localContext.close();
  });
});
