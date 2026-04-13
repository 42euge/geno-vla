/**
 * Quick smoke test — calls each tool directly (no MCP transport needed).
 */

import { BrowserManager } from './src/browser.js';
import { navigateTool } from './src/tools/navigate.js';
import { observeTool } from './src/tools/observe.js';
import { interactTool } from './src/tools/interact.js';
import { extractTool } from './src/tools/extract.js';

async function test() {
  const browser = new BrowserManager();
  await browser.launch({ headless: true });

  console.log('=== Test 1: geno_navigate ===');
  const t1 = performance.now();
  const navResult = await navigateTool.handle(browser, {
    url: 'https://example.com',
    waitUntil: 'domcontentloaded',
  });
  const t1End = performance.now();
  console.log(`Time: ${(t1End - t1).toFixed(0)}ms`);
  console.log(navResult.content[0].type === 'text' ? navResult.content[0].text.slice(0, 300) : '(image)');
  console.log();

  console.log('=== Test 2: geno_observe ===');
  const t2 = performance.now();
  const obsResult = await observeTool.handle(browser, {
    includeScreenshot: false,
    fullPage: false,
  });
  const t2End = performance.now();
  console.log(`Time: ${(t2End - t2).toFixed(0)}ms`);
  console.log(obsResult.content[0].type === 'text' ? obsResult.content[0].text.slice(0, 300) : '(image)');
  console.log();

  console.log('=== Test 3: geno_observe with screenshot ===');
  const t3 = performance.now();
  const obsScreenshot = await observeTool.handle(browser, {
    includeScreenshot: true,
    fullPage: false,
  });
  const t3End = performance.now();
  console.log(`Time: ${(t3End - t3).toFixed(0)}ms`);
  console.log(`Content blocks: ${obsScreenshot.content.length}`);
  if (obsScreenshot.content[1]?.type === 'image') {
    console.log(`Screenshot: ${obsScreenshot.content[1].mimeType}, ${(obsScreenshot.content[1].data.length / 1024).toFixed(1)}KB base64`);
  }
  console.log();

  console.log('=== Test 4: geno_interact (click link) ===');
  const t4 = performance.now();
  const clickResult = await interactTool.handle(browser, {
    action: 'click',
    selector: 'a',
    clearFirst: false,
  });
  const t4End = performance.now();
  console.log(`Time: ${(t4End - t4).toFixed(0)}ms`);
  console.log(clickResult.content[0].type === 'text' ? clickResult.content[0].text.slice(0, 300) : '(image)');
  console.log();

  // Navigate back for extract test
  await navigateTool.handle(browser, { url: 'https://example.com', waitUntil: 'domcontentloaded' });

  console.log('=== Test 5: geno_extract ===');
  const t5 = performance.now();
  const extractResult = await extractTool.handle(browser, {
    expression: '({ title: document.title, headings: [...document.querySelectorAll("h1")].map(h => h.textContent), paragraphs: document.querySelectorAll("p").length })',
  });
  const t5End = performance.now();
  console.log(`Time: ${(t5End - t5).toFixed(0)}ms`);
  console.log(extractResult.content[0].type === 'text' ? extractResult.content[0].text : '(image)');
  console.log();

  console.log('=== All tests passed ===');
  await browser.close();
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
