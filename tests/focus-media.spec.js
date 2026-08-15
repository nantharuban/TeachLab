const { test, expect } = require('@playwright/test');

const waitForApp = async page => {
  await page.goto('http://localhost:8000');
  await page.waitForFunction(() => !!window.UnitLoader, { timeout: 15000 });
  await page.waitForFunction(() => !!document.querySelector('#unitLoaderPanel .unit-loader-content'), { timeout: 15000 });
};

test('focus mode toggles the chrome without changing the active node', async ({ page }) => {
  await waitForApp(page);

  const before = await page.evaluate(() => ({
    node: window.UnitLoader.activeNodeId,
    topVisible: !document.querySelector('.topbar').classList.contains('hidden'),
    sidebarVisible: !document.querySelector('.sidebar').classList.contains('hidden')
  }));

  await page.click('#focusModeBtn');
  await page.waitForFunction(() => document.body.classList.contains('focus-mode'));

  const during = await page.evaluate(() => ({
    node: window.UnitLoader.activeNodeId,
    topVisible: !document.querySelector('.topbar').classList.contains('hidden'),
    sidebarVisible: !document.querySelector('.sidebar').classList.contains('hidden'),
    navVisible: !document.querySelector('.bottom-nav').classList.contains('hidden')
  }));

  await page.click('#exitFocusBtn');
  await page.waitForFunction(() => !document.body.classList.contains('focus-mode'));

  const after = await page.evaluate(() => ({
    node: window.UnitLoader.activeNodeId,
    topVisible: !document.querySelector('.topbar').classList.contains('hidden'),
    sidebarVisible: !document.querySelector('.sidebar').classList.contains('hidden')
  }));

  expect(before.node).toBe(during.node);
  expect(before.node).toBe(after.node);
  expect(during.topVisible).toBe(false);
  expect(during.sidebarVisible).toBe(false);
  expect(during.navVisible).toBe(true);
  expect(after.topVisible).toBe(true);
  expect(after.sidebarVisible).toBe(true);
});

test('media rendering handles blank and missing-file states safely', async ({ page }) => {
  await waitForApp(page);

  const blank = await page.evaluate(() => {
    const host = document.createElement('div');
    host.className = 'unit-loader-content';
    document.getElementById('unitLoaderPanel').appendChild(host);
    const node = { title: 'blank test', image_paths: '', image_description: '' };
    const unit = { folder: 'U01_nervous_system' };
    const subunit = { folder: 'SU01_introduction_coordination' };
    const result = window.UnitLoader.renderImageArea(node, host, unit, subunit);
    return { result, hasFrame: !!host.querySelector('.scene-image-frame'), hasVisualNote: !!host.querySelector('.visual-note') };
  });

  const missing = await page.evaluate(() => {
    const host = document.createElement('div');
    host.className = 'unit-loader-content';
    document.getElementById('unitLoaderPanel').appendChild(host);
    const node = { title: 'missing test', image_paths: 'images/missing.png', image_description: 'Missing image note' };
    const unit = { folder: 'U01_nervous_system' };
    const subunit = { folder: 'SU01_introduction_coordination' };
    const result = window.UnitLoader.renderImageArea(node, host, unit, subunit);
    return { result, hasFrame: !!host.querySelector('.scene-image-frame'), hasFallback: !!host.querySelector('.image-placeholder') };
  });

  const type = await page.evaluate(() => ({
    gif: window.UnitLoader.getMediaType('img/anim.gif'),
    webm: window.UnitLoader.getMediaType('video/demo.webm'),
    static: window.UnitLoader.getMediaType('images/figure.png')
  }));

  expect(blank.result).toBe(false);
  expect(blank.hasFrame).toBe(false);
  expect(blank.hasVisualNote).toBe(false);
  expect(missing.result).toBe(true);
  expect(missing.hasFrame).toBe(true);
  expect(missing.hasFallback).toBe(true);
  expect(type.gif).toBe('gif');
  expect(type.webm).toBe('video');
  expect(type.static).toBe('image');
});
