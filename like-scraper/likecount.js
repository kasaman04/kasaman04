import { chromium } from 'playwright';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

// 全iframeを走査して aria-label から「〇〇件のいいね」を拾う
async function findLikeCount(page) {
  const re = /このポストには\s*([\d,\.]+)\s*件のいいねがあります/;
  for (const frame of page.frames()) {
    const loc = frame.locator('[aria-label*="このポストには"][aria-label*="いいねがあります"]').first();
    if (await loc.count()) {
      const label = await loc.getAttribute('aria-label');
      if (label) {
        const m = label.match(re);
        if (m) {
          const raw = m[1];                    // 例: "4,074"
          const num = Number(raw.replace(/[^\d]/g,''));
          return { label, countText: raw, count: num };
        }
      }
    }
  }
  return null;
}

async function main() {
  const url = process.argv[2];
  const browser = await chromium.launch({ headless: true /* うまくいかない時は false に */ });
  const ctx = await browser.newContext({ userAgent: UA, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(()=>{});
    const hit = await findLikeCount(page);
    console.log(JSON.stringify({ ok: !!hit, url, ...hit }, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ ok:false, url, error: String(e) }, null, 2));
  } finally {
    await browser.close();
  }
}
main();
