import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { prettyJSON } from 'hono/pretty-json';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

const app = new Hono();

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'user',
  password: 'p@ssw0rd',
  database: 'hoge-db',
  port: 3306,
  namedPlaceholders: true,
});

app.use(prettyJSON());

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <title>Hono App</title>
    </head>
    <body>
      <h1>Hello HONO!!</h1>
      <a href="./playwright">playwright</a>
      <a href="./configs">config</a>
      <a href="./database">database</a>
      <a href="./edit-config">edit-config</a>
    </body>
    </html>
  `);
});

//playwrightテスト結果のページ
app.get("/playwright", async (c) => {
  const html = fs.readFileSync('./playwright-report/index.html', 'utf8')
  return c.html(html);
})

//テスト結果の画像
app.get('/data/*', (c) => {
  const filePath = decodeURIComponent(c.req.path.replace('/data/', ''))
  const fullPath = path.resolve('./playwright-report/data', filePath)

  if (!fs.existsSync(fullPath)) {
    return c.notFound()
  }
  return c.body(fs.readFileSync(fullPath), {
    headers: {
      'Content-Type': 'image/png'
    }
  })
})

const configString = JSON.stringify(config, null, 2);
app.get("/configs", (c) => c.html(configString));

// リクエスト追加ページ
app.get('/edit-config', (c) => {

  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <title>テスト設定</title>
      <meta charset="utf-8">
      <style>
        textarea {
          width: 100%;
          height: 70vh;
          font-size: 14px;
          white-space: pre-wrap;
          overflow: auto;
        }
      </style>
    </head>
    <body>
      <h1>config編集</h1>
      <form action="/submit-config" method="POST">
        <label for="config">設定内容:</label><br>
        <textarea id="config" name="config" required>${configString}</textarea><br><br>
        <input type="submit" value="リクエストを送信" />
      </form>
    </body>
    </html>
  `);
});

app.post('/submit-config', async (c) => {
  try {
    const body = await c.req.parseBody();
    const config = body.config;

    if (!config) {
      console.log("Configが空です");
      return c.json({ success: false, message: 'Configが提供されていません。' }, 400);
    }
      fs.writeFile('config.json', config, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('ローカルファイルへの書き込みエラー:', writeErr);
        } else {
          console.log('ローカルファイルにJSONを書き込みました。');
        }
      });

    return c.json({
      success: true,
      message: 'リクエストが正常に保存されました。'
    });

  } catch (error) {
    console.error('エラー:', error);
    return c.json({ success: false, message: 'エラーが発生しました。' }, 500);
  }
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`サーバーが http://localhost:${info.port} で起動しました`);
});