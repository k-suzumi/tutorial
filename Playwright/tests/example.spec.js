
import { test, expect } from '@playwright/test';
import mysql from 'mysql2';

// connection.connect((err) => {
//   if (err) {
//     console.error('データベース接続エラー: ' + err.stack);
//     return;
//   }
//   console.log('データベース接続成功: ID ' + connection.threadId);
// });

await test("本番環境と検証環境のスクリーンショット比較", async ({ page }, testInfo) => {
  //sqlと接続する関数
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'p@ssw0rd',
    database: 'hoge-db',
    port: 3306,
  });
  
  let testResult = '';
  let testError = null;
  const title = 'スクリーンショット比較テスト';

  try {
    await page.goto("https://v2.spaia-keiba.com/races", { waitUntil: 'networkidle' })
    await page.screenshot({ path: `${testInfo.snapshotPath("result.png")}`, fullPage: true })

    await page.goto("https://staging-beta.spaia-keiba.com/races", { waitUntil: 'networkidle' });
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot({ name: "result.png" })

    testResult = `Test passed, Title: ${title}`;
  } catch (error) {
    testError = error.message;
    testResult = `Test failed, Error: ${testError}`;
  }

  //テスト結果を送信する関数（開発用のログ）
  finally {
    if (connection) {
      const query = 'INSERT INTO test_results (test_name, result, error_message) VALUES (?, ?, ?)';

      return new Promise((resolve, reject) => {
        connection.execute(query, [title, testResult, testError || null], (err, results) => {
          if (err) {
            console.error('データベースへの挿入エラー:', err);
            reject(err);
          } else {
            console.log('テスト結果がデータベースに保存されました:', results);
            connection.end();
            resolve();
          }
        });
      });
    }
  }
});