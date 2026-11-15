// node src/tools/og.js icons/og.png
// Draws the picture a shared satsprint.org link shows (1200 x 630, the size link previews use), from the site's own logo,
// colors and fonts. The page's <head> points to it (site/make_index.py). Needs Playwright; the fonts come from Google Fonts
// and fall back to Inter.
const { chromium } = require('playwright');
const path = require('path');
const out = path.resolve(process.argv[2] || 'icons/og.png');
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,500;9..40,600;9..40,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #FFFFFF; color: #0A0A0A; font-family: Inter, system-ui, sans-serif;
    background-image: radial-gradient(900px 500px at 105% -10%, #EEF2FF 0%, rgba(238, 242, 255, 0) 60%), radial-gradient(700px 420px at -10% 115%, #FDF2F8 0%, rgba(253, 242, 248, 0) 60%); }
  .wrap { display: grid; grid-template-columns: 1fr 440px; gap: 64px; align-items: center; height: 100%; padding: 72px 80px; }
  .brand { display: flex; align-items: center; gap: 22px; }
  .brand svg { width: 76px; height: 76px; }
  .brand b { font: 700 54px/1 "DM Sans", Inter, sans-serif; letter-spacing: -.02em; }
  h1 { margin-top: 52px; font: 700 70px/1.02 "DM Sans", Inter, sans-serif; letter-spacing: -.035em; }
  p { margin-top: 26px; font-size: 27px; line-height: 1.42; color: #3F3F46; max-width: 600px; }
  .subj { display: flex; gap: 26px; margin-top: 40px; font: 600 25px/1 Inter, sans-serif; color: #3F3F46; }
  .subj span { display: inline-flex; align-items: center; gap: 10px; }
  .subj i { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
  .card { background: #FFFFFF; border: 1px solid #E6E6EA; border-radius: 28px; padding: 34px 32px; box-shadow: 0 2px 4px rgba(10, 10, 20, .05), 0 24px 60px -18px rgba(10, 10, 20, .22); border-left: 6px solid #1D4ED8; }
  .label { font: 600 17px/1 Inter, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #3F3F46; }
  .q { margin-top: 18px; font: 600 30px/1.25 "DM Sans", Inter, sans-serif; letter-spacing: -.01em; }
  .opts { display: grid; gap: 12px; margin-top: 24px; }
  .opt { display: flex; align-items: center; gap: 16px; padding: 14px 18px; border: 1.5px solid #E6E6EA; border-radius: 16px; font-size: 25px; }
  .opt em { font: 600 18px/1 Inter, sans-serif; font-style: normal; width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid #A1A1AA; display: grid; place-items: center; color: #3F3F46; }
  .opt.right { border-color: #15803D; background: #DCFCE7; font-weight: 600; }
  .opt.right em { border-color: #15803D; background: #15803D; color: #FFFFFF; }
  .opt.right::after { content: "Right"; margin-left: auto; font: 600 19px/1 Inter, sans-serif; color: #15803D; }
</style></head><body><div class="wrap">
  <div>
    <div class="brand"><svg viewBox="0 0 24 24"><rect width="24" height="24" rx="5.3" fill="#0A0A0A"/><path d="M6.5 12.5l3.8 3.8 7.2-8.3" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 3) scale(.75)"/></svg><b>SAT Sprint</b></div>
    <h1>Free SAT practice,<br>one step at a time</h1>
    <p>Lessons, shortcuts, a study plan and 1,925 real practice questions with College Board's answers.</p>
    <div class="subj"><span><i style="background:#BE185D"></i>Reading &amp; Writing</span><span><i style="background:#1D4ED8"></i>Math</span><span style="color:#0A0A0A">satsprint.org</span></div>
  </div>
  <div class="card">
    <div class="label">Math · question of the day</div>
    <div class="q">If 3x + 7 = 22, what is the value of x?</div>
    <div class="opts">
      <div class="opt"><em>A</em>3</div>
      <div class="opt right"><em>B</em>5</div>
      <div class="opt"><em>C</em>7</div>
      <div class="opt"><em>D</em>15</div>
    </div>
  </div>
</div></body></html>`;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  const fam = await page.evaluate(() => document.fonts.check('700 54px "DM Sans"') ? 'DM Sans' : 'Inter (DM Sans did not load)');
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log('wrote', out, '1200x630, headings in', fam);
})();
