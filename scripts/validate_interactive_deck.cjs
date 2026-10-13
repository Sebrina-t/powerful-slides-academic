#!/usr/bin/env node
/* Validate a locally generated interactive academic deck through an existing CDP browser.
 * Usage: node validate_interactive_deck.cjs <index.html> [cdp-url] [report.json]
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const input = process.argv[2];
const cdpUrl = process.argv[3] || 'http://127.0.0.1:9222';
const reportPath = process.argv[4] || path.resolve('interactive-deck-validation.json');
if (!input) {
  console.error('Usage: node validate_interactive_deck.cjs <index.html> [cdp-url] [report.json]');
  process.exit(64);
}

const htmlPath = path.resolve(input);
if (!fs.existsSync(htmlPath)) {
  console.error(`Deck not found: ${htmlPath}`);
  process.exit(66);
}

async function inspectState(page, slideIndex, theme, mode) {
  await page.evaluate(({ slideIndex, theme, mode }) => {
    const engine = window.presentationEngine;
    if (engine?.setTheme) engine.setTheme(theme);
    else document.documentElement.dataset.theme = theme;
    if (engine?.setMode) engine.setMode(mode);
    else document.documentElement.dataset.mode = mode;
    if (engine?.goToSlide) engine.goToSlide(slideIndex);
    else {
      const slides = [...document.querySelectorAll('.interactive-slide, .slide')];
      slides.forEach((s, i) => {
        s.classList.toggle('active', i === slideIndex);
        s.hidden = i !== slideIndex;
      });
    }
    if (mode === 'export' && engine?.freezeForExport) engine.freezeForExport();
  }, { slideIndex, theme, mode });
  await page.waitForTimeout(80);

  return page.evaluate(({ slideIndex, theme, mode }) => {
    const slide = [...document.querySelectorAll('.interactive-slide, .slide')][slideIndex];
    if (!slide) return { slideIndex, theme, mode, missingSlide: true, issues: [] };
    const sr = slide.getBoundingClientRect();
    const issues = [];
    const visible = (el) => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity !== 0 && r.width > 0 && r.height > 0;
    };
    const decorative = (el) => el.closest('[data-layer="background"], [data-allow-overlap="true"]');
    const textTags = new Set(['P','H1','H2','H3','H4','H5','H6','LI','TD','TH','SPAN','LABEL','BUTTON','OUTPUT','FIGCAPTION','DIV']);

    for (const el of slide.querySelectorAll('*')) {
      if (!visible(el) || decorative(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.left < sr.left - 1 || r.top < sr.top - 1 || r.right > sr.right + 1 || r.bottom > sr.bottom + 1) {
        issues.push({ code: 'ELEMENT_OUTSIDE_SLIDE', element: el.dataset.elementId || el.className || el.tagName });
      }
      const hasText = textTags.has(el.tagName) && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      if (hasText && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
        issues.push({
          code: 'TEXT_OUTSIDE_TEXT_BOX',
          element: el.dataset.elementId || el.className || el.tagName,
          text: el.textContent.trim().slice(0, 120),
          size: [el.clientWidth, el.clientHeight, el.scrollWidth, el.scrollHeight]
        });
      }
      if (hasText) {
        const range = document.createRange();
        range.selectNodeContents(el);
        for (const rr of range.getClientRects()) {
          if (rr.left < r.left - 1 || rr.top < r.top - 1 || rr.right > r.right + 1 || rr.bottom > r.bottom + 1) {
            issues.push({ code: 'TEXT_LINE_BOX_CLIPPED', element: el.dataset.elementId || el.className || el.tagName, text: el.textContent.trim().slice(0, 120) });
            break;
          }
        }
      }
    }

    const boxes = [...slide.querySelectorAll('[data-layout-box]')].filter(visible).filter(el => !decorative(el));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].getBoundingClientRect(), b = boxes[j].getBoundingClientRect();
      const overlap = Math.max(0, Math.min(a.right,b.right)-Math.max(a.left,b.left)) * Math.max(0, Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
      if (overlap > 4) issues.push({ code: 'UNINTENDED_FOREGROUND_OVERLAP', elements: [boxes[i].dataset.elementId || i, boxes[j].dataset.elementId || j], pixels: Math.round(overlap) });
    }

    for (const img of slide.querySelectorAll('img')) {
      if (!img.complete || !img.naturalWidth) issues.push({ code: 'MISSING_IMAGE', element: img.dataset.elementId || img.alt || 'img' });
    }
    for (const canvas of slide.querySelectorAll('canvas')) {
      if (!canvas.width || !canvas.height) issues.push({ code: 'EMPTY_CANVAS', element: canvas.dataset.elementId || 'canvas' });
    }
    return { slideId: slide.dataset.slideId || String(slideIndex + 1), slideIndex, theme, mode, issues };
  }, { slideIndex, theme, mode });
}

(async () => {
  const browser = await chromium.connectOverCDP(cdpUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  const meta = await page.evaluate(() => ({
    slides: document.querySelectorAll('.interactive-slide, .slide').length,
    themes: [...document.querySelectorAll('[data-theme-option]')].map(x => x.dataset.themeOption || x.value).filter(Boolean),
    externalResources: [...document.querySelectorAll('script[src],link[href],img[src]')].map(x => x.src || x.href).filter(u => /^https?:/i.test(u)),
    hasPresenterMode: !!(window.presentationEngine?.setMode || document.querySelector('[data-presenter-mode]')),
    reducedMotionQuery: matchMedia('(prefers-reduced-motion: reduce)').matches
  }));
  const themes = [...new Set(meta.themes.length ? meta.themes : [document.documentElement.dataset.theme || 'default'])];
  const results = [];
  for (const theme of themes) {
    for (let i = 0; i < meta.slides; i++) {
      results.push(await inspectState(page, i, theme, 'review'));
      results.push(await inspectState(page, i, theme, 'export'));
    }
  }
  const globalIssues = [];
  if (themes.length !== 3) globalIssues.push({ code: 'THEME_COUNT_NOT_THREE', found: themes });
  if (meta.externalResources.length) globalIssues.push({ code: 'NETWORK_DEPENDENCY', urls: meta.externalResources });
  if (!meta.hasPresenterMode) globalIssues.push({ code: 'PRESENTER_MODE_MISSING' });
  const blocking = [...globalIssues, ...results.flatMap(r => r.issues)];
  const report = { deck: htmlPath, cdpUrl, checkedAt: new Date().toISOString(), meta: { ...meta, themes }, globalIssues, results, blockingIssueCount: blocking.length };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ reportPath, slides: meta.slides, themes, blockingIssueCount: blocking.length }, null, 2));
  await page.close();
  await browser.close();
  process.exit(blocking.length ? 2 : 0);
})().catch(err => {
  console.error(err.stack || err);
  process.exit(1);
});
