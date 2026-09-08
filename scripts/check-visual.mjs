import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createServer } from 'vite';

const testServer = process.env.VISUAL_URL ? null : await createServer({ server: { host: '127.0.0.1', port: 4178, strictPort: true } });
if (testServer) await testServer.listen();
const baseUrl = process.env.VISUAL_URL || 'http://127.0.0.1:4178';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await fs.mkdir('artifacts', { recursive: true });
const results = [];

async function waitForState(page, mode, drawer = '') {
  await page.waitForFunction(({ mode, drawer }) => {
    const canvas = document.querySelector('canvas');
    return canvas?.dataset.mode === mode && canvas.dataset.activeDrawer === drawer && canvas.dataset.transitioning === 'false';
  }, { mode, drawer });
}

async function snapshot(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return {
      mode: canvas.dataset.mode,
      drawer: canvas.dataset.activeDrawer,
      zoom: Number(canvas.dataset.cameraZoom),
      overviewZoom: Number(canvas.dataset.overviewZoom),
      modelWidth: Number(canvas.dataset.modelWidth),
      folders: Number(canvas.dataset.folderCount),
      silhouetteObjects: Number(canvas.dataset.silhouetteObjects),
      structuralEdgeObjects: Number(canvas.dataset.structuralEdgeObjects),
      structuralEdgeSegments: Number(canvas.dataset.structuralEdgeSegments),
      outlineRaycastDisabled: canvas.dataset.outlineRaycastDisabled === 'true',
      brandOffset: Number(canvas.dataset.drawerBrandOffset),
      packagingOffset: Number(canvas.dataset.drawerPackagingOffset),
      ipOffset: Number(canvas.dataset.drawerIpOffset),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
}

async function swipe(page, deltaY) {
  const box = await page.locator('canvas').boundingBox();
  const x = box.x + box.width * .54;
  const y = box.y + box.height * .54;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + deltaY, { steps: 8 });
  await page.mouse.up();
}

for (const [width, height] of [[375,812], [390,844], [430,932], [1440,1000]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  const errors = [];
  const webglWarnings = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('console', message => { if (message.type() === 'warning' && /webgl/i.test(message.text())) webglWarnings.push(message.text()); });
  await page.goto(baseUrl);
  await page.waitForSelector('canvas[data-ready="true"]');
  await waitForState(page, 'CABINET_OVERVIEW');
  const overview = await snapshot(page);
  const overviewName = width === 1440 ? 'outline-desktop-1440x1000.png' : `outline-overview-${width}x${height}.png`;
  await page.screenshot({ path: `artifacts/${overviewName}`, fullPage: true });
  if (errors.length || webglWarnings.length > 4 || overview.overflow || overview.folders !== 24 || overview.structuralEdgeObjects < 70 || !overview.outlineRaycastDisabled) throw new Error(JSON.stringify({ width, height, overview, errors, webglWarnings }));
  if (width < 760 && (overview.modelWidth < width * .78 || overview.modelWidth > width * .85)) throw new Error(`Overview framing outside target: ${JSON.stringify(overview)}`);

  if (width === 390) {
    const box = await page.locator('canvas').boundingBox();
    await page.mouse.click(box.x + box.width * .48, box.y + box.height * .43);
    await waitForState(page, 'DRAWER_FOCUS', 'brand');
    const brand = await snapshot(page);
    if (!(brand.zoom > brand.overviewZoom && brand.brandOffset > .13)) throw new Error(`Brand focus failed: ${JSON.stringify(brand)}`);
    await page.screenshot({ path: 'artifacts/outline-brand-focus-390x844.png', fullPage: true });

    await swipe(page, -90);
    await waitForState(page, 'DRAWER_FOCUS', 'packaging');
    const packaging = await snapshot(page);
    if (Math.abs(packaging.brandOffset) > .01 || packaging.packagingOffset < .13) throw new Error(`Packaging switch failed: ${JSON.stringify(packaging)}`);
    await page.screenshot({ path: 'artifacts/outline-packaging-focus-390x844.png', fullPage: true });

    await swipe(page, -90);
    await waitForState(page, 'DRAWER_FOCUS', 'ip');
    const ip = await snapshot(page);
    if (ip.ipOffset < .13) throw new Error(`IP switch failed: ${JSON.stringify(ip)}`);
    await page.screenshot({ path: 'artifacts/outline-ip-focus-390x844.png', fullPage: true });

    await page.mouse.click(8, 8);
    await waitForState(page, 'CABINET_OVERVIEW');
    const restored = await snapshot(page);
    if (Math.abs(restored.zoom - restored.overviewZoom) > .01 || Math.max(Math.abs(restored.brandOffset), Math.abs(restored.packagingOffset), Math.abs(restored.ipOffset)) > .01) throw new Error(`Overview restore failed: ${JSON.stringify(restored)}`);
    results.push({ width, height, overview, brand, packaging, ip, restored, errors, webglWarnings });
  } else results.push({ width, height, overview, errors, webglWarnings });
  await page.close();
}

await fs.writeFile('artifacts/visual-check.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
if (testServer) await testServer.close();
