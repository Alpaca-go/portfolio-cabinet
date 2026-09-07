import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await fs.mkdir('artifacts', { recursive: true });
const results = [];
for (const [width,height] of [[375,812],[390,844],[430,932],[1440,1000]]) {
  const page = await browser.newPage({ viewport: {width,height}, deviceScaleFactor: 1.5 });
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {if(m.type()==='error') errors.push(m.text());});
  await page.goto('http://127.0.0.1:5174');
  await page.waitForSelector('canvas[data-ready="true"]');
  await page.waitForTimeout(900);
  const state=await page.evaluate(() => {
    const canvas=document.querySelector('canvas');
    return {overflow: document.documentElement.scrollWidth>innerWidth, modelWidth:Number(canvas.dataset.modelWidth), folders: Number(canvas.dataset.folderCount), canvasHeight:canvas.clientHeight};
  });
  await page.screenshot({path:`artifacts/archive-${width}x${height}.png`,fullPage:true});
  results.push({width,height,...state,errors});
  if(errors.length||state.overflow||state.modelWidth>width*.76) throw new Error(JSON.stringify(results.at(-1)));
  await page.close();
}
await browser.close();
await fs.writeFile('artifacts/visual-check.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));

