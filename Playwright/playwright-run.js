import { exec } from 'child_process';
import mysql from 'mysql2';

//sqlと接続する関数
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'user',
  password: 'p@ssw0rd',
  database: 'hoge-db',
  port: 3306,
});

// connection.connect((err) => {
//   if (err) {
//     console.error('データベース接続エラー: ' + err.stack);
//     return;
//   }
//   console.log('データベース接続成功: ID ' + connection.threadId);
// });

//PLaywrightを実行する関数
async function runTest() {
    exec('npx playwright test', (error) => {
      if (error) {
        console.error(`実行エラー: ${error.message}`);
        return;
      }
    });
  }

// データベースを監視する関数
async function checkDatabase() {
    try {
      const [rows] = await connection.promise().query('SELECT * FROM queue WHERE is_executed = 0');
  
      if (Array.isArray(rows) && rows.length > 0) {
        console.log('テスト実行！');
        await runTest();
  
        await connection.promise().query('UPDATE queue SET is_executed = 1 WHERE is_executed = 0');
      } else {
        console.log('実行待ちのテストはありません');
      }
    } catch (error) {
      console.error('Error checking database:', error);
    }
  }
  
  // 定期的にデータベースをチェックする
  setInterval(checkDatabase, 1000); // 10秒ごとにチェック