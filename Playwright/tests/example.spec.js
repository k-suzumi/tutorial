import { test, expect } from '@playwright/test';
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config2.json', 'utf-8'));
require('dotenv').config();

const { v2FreeToken, v2GoldToken, v2PlatinumToken, v2DiamondToken, ProdFreeToken, ProdGoldToken, ProdPlatinumToken, ProdDiamondToken } = process.env;
const v2Tokens = [" ", v2FreeToken, v2GoldToken, v2PlatinumToken, v2DiamondToken];
const ProdTokens = [" ", ProdFreeToken, ProdGoldToken, ProdPlatinumToken, ProdDiamondToken];

const environments = {
  prod: config.environments[0],
  stage: config.environments[1],
  dev: config.environments[2],
  gcdev: config.environments[3],
};
const pages = config.pages;
const status = ["guest", "free", "gold", "platinum", "diamond"];

const createTestForEnvironments = (env1, env2) => {
  for (let l = 0; l < v2Tokens.length; l++) {
    test.describe(`${status[l]}`, () => {
      test.describe(`${env1.name} vs ${env2.name}`, () => {
        const env = [
          { host: env1.host, name: env1.name },
          { host: env2.host, name: env2.name }
        ];

        for (let i = 0; i < pages.length; i++) {
          const testName = `${pages[i].path}`;
          test(testName, async ({ page }, testInfo) => {
            if (l !== 0) {
              await page.context().addCookies([
                {
                  name: 'prod_v2_access_token',
                  value: ProdTokens[l],
                  domain: 'v2.spaia-keiba.com',
                  path: '/'
                },
                {
                  name: 'v2_access_token',
                  value: v2Tokens[l],
                  domain: 'staging-beta.spaia-keiba.com',
                  path: '/'
                },
                {
                  name: 'v2_access_token',
                  value: v2Tokens[l],
                  domain: 'gcdev-keiba-beta.spaia.net',
                  path: '/'
                },
                {
                  name: 'v2_access_token',
                  value: v2Tokens[l],
                  domain: 'dev-keiba-beta.spaia.net',
                  path: '/'
                }
              ]);
            }

            for (let j = 0; j < env.length; j++) {
              await page.goto(env[j].host + pages[i].path);
              const steps = pages[i].steps;

              for (let k = 0; k < steps.length; k++) {
                const step = steps[k];

                switch (step.action) {
                  case 'load':
                    await page.waitForLoadState('networkidle');
                    break;

                  case 'screenshot':
                    const resultScreenshot = `${env[0].name}vs${env[1].name}${i}-${k}${status[l]}.png`;
                    if (j === 0) {
                      await page.screenshot({
                        path: testInfo.snapshotPath(resultScreenshot),
                        fullPage: true,
                      });
                    } else {
                      await expect(page).toHaveScreenshot(resultScreenshot, {
                        fullPage: true,
                        maxDiffPixelRatio: 0.05
                      });
                    }
                    break;

                  case 'click':
                    await page.click(step.target);
                    await page.waitForLoadState('networkidle');
                    break;

                  default:
                    console.log('Unknown action:', step.action);
                }
              }
            }
          });
        }
      })
    })
  }
}

const envKeys = Object.keys(environments);
for (let i = 0; i < envKeys.length; i++) {
  for (let j = i + 1; j < envKeys.length; j++) {
    createTestForEnvironments(environments[envKeys[i]], environments[envKeys[j]]);
  }
}