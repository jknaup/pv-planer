const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
(async () => {
  const server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { stdio: 'ignore' });
  let browser;
  try {
    await new Promise(r => setTimeout(r, 1500));
    browser = await chromium.launch({ headless: true });
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto('http://127.0.0.1:8765/tests/browser-tests.html');
      await page.waitForFunction(() => document.documentElement.dataset.testFailures !== undefined, { timeout: 15000 });
      const failures = await page.locator('li.fail').allTextContents();
      const passes = await page.locator('li.ok').count();
      console.log(viewport.width + 'px: ' + passes + ' passed, ' + failures.length + ' failed');
      for (const failure of failures) console.error(failure);
      if (errors.length || failures.length || passes < 10) throw Error('Browser regression failure: ' + JSON.stringify({ viewport, errors, failures, passes }));
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
