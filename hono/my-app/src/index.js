import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { prettyJSON } from 'hono/pretty-json';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { error } from 'console';
const app = new Hono();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'user',
  password: 'p@ssw0rd',
  database: 'hoge-db',
  port: 3306,
  namedPlaceholders: true,
});

app.use(prettyJSON());

app.use('/assets/*',serveStatic({root: './src'}))

app.use('*', serveStatic({ root: './src' }))

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
      <a href="./edit-config">edit-config</a>
    </body>
    </html>
  `);
});

//playwrightテスト結果のページ
app.get("/playwright", async (c) => {
  try {
    const html = fs.readFileSync('./playwright/playwright-report/index.html', 'utf8')
    return c.html(html);
  } catch (err) {
    console.error(error)
  }
})

//テスト結果の画像
app.get('/data/*', (c) => {
  const filePath = decodeURIComponent(c.req.path.replace('/data/', ''))
  const fullPath = path.resolve('./playwright/playwright-report/data', filePath)

  if (!fs.existsSync(fullPath)) {
    return c.notFound()
  }
  return c.body(fs.readFileSync(fullPath), {
    headers: {
      'Content-Type': 'image/png'
    }
  })
})


app.get("/configs", async (c) => {
  const [result] = await connection.query('SELECT config FROM queue')
  const config = result[0];
  return c.json(config)
});

// リクエスト追加ページ
app.get('/edit-config', async (c) => {
  try {
    const [results] = await connection.query('SELECT config FROM queue');
    const config = results[0];
    let configString = JSON.stringify(config, null, 2);
    configString = configString.replace('"config": {', "");
    configString = configString.slice(0, -1)
    const htmlPath = `${__dirname}/index.html`
    const html = fs.readFileSync(htmlPath, 'utf-8')
    return c.html(html);
  } catch (err) {
    console.error('Error executing query:', err);
    return c.json({ success: false, message: 'エラーが発生しました。' }, 500);
  }
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