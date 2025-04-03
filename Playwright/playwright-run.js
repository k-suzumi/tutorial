import { exec } from 'child_process';

//PLaywrightを実行する関数
function runTest() {
  exec('npx playwright test', (error) => {
    if (error) {
      console.error(`実行エラー: ${error.message}`);
      return;
    }
  });
}

runTest();