const http = require('http');
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

let server;
let baseURL;

const normalizePath = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.posix.normalize(clean);
  return normalized.replace(/^(\.\.(\/|\\|$))+/, '/');
};

const resolveFilePath = (urlPath) => {
  let safePath = normalizePath(urlPath);
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }
  if (safePath.endsWith('/')) {
    safePath += 'index.html';
  }
  return path.join(ROOT_DIR, safePath);
};

const startServer = async () => {
  server = http.createServer((req, res) => {
    const filePath = resolveFilePath(req.url || '/');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseURL = `http://127.0.0.1:${port}`;
};

const stopServer = async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
};

const assertPlayerAssets = async (page) => {
  const assets = [
    'assets/js/player-init.js',
    'assets/js/player.js',
    'assets/css/player.css',
    'assets/sounds/music/t-metal.mp3'
  ];

  const waits = assets.map((asset) =>
    page.waitForResponse((response) => response.url().includes(asset), { timeout: 15000 })
  );

  const responses = await Promise.all(waits);
  for (const response of responses) {
    expect(response.status(), `${response.url()} should not 404`).not.toBe(404);
  }
};

const runPageAssertions = async (page, url) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const assetCheck = assertPlayerAssets(page);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await assetCheck;

  const player = page.locator('#ddt-player');
  await expect(player).toBeVisible();
  await expect(page.locator('#ddtPlay')).toBeVisible();

  const audioSrc = await page.locator('#ddtAudio').evaluate((el) => el.currentSrc || el.src || '');
  expect(audioSrc).toContain('t-metal.mp3');

  await page.locator('#ddtPlay').click();
  await expect(page.locator('#ddtPlay')).toHaveText(/Play|Pause/);

  expect(consoleErrors, `Console errors on ${url}: ${consoleErrors.join(' | ')}`).toEqual([]);
};

test.beforeAll(async () => {
  await startServer();
});

test.afterAll(async () => {
  await stopServer();
});

test('audio player loads on home page', async ({ page }) => {
  await runPageAssertions(page, `${baseURL}/index.html`);
});

test('audio player loads on nested page', async ({ page }) => {
  await runPageAssertions(page, `${baseURL}/artists/index.html`);
});

test.describe('live github pages (optional)', () => {
  const liveURL = process.env.GITHUB_PAGES_URL;
  test.skip(!liveURL, 'GITHUB_PAGES_URL not set');

  test('audio player loads on live site', async ({ page }) => {
    await runPageAssertions(page, liveURL);
  });
});
