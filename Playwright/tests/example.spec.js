// @ts-check
import { test, expect } from '@playwright/test';

test("本番環境と検証環境のスクリーンショット比較", async ({ page }, testInfo) => {
  await page.goto("https://v2.spaia-keiba.com/races/20250301")
  await page.waitForFunction(() => document.fonts.ready);
  await page.screenshot({ path: `${testInfo.snapshotPath("result.png")}`, fullPage: true })

  await page.goto("https://staging-beta.spaia-keiba.com/races/20250301")
  await page.waitForFunction(() => document.fonts.ready);
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot({ name: "result.png" })
})
