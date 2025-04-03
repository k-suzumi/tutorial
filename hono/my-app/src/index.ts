import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { prettyJSON } from 'hono/pretty-json';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

const app = new Hono();

const keibadata = [
  {
    id: "1",
    name: "家康",
    color: "black"
  },
  {
    id: "2",
    name: "信長",
    color: "white"
  },
  {
    id: "3",
    name: "秀吉",
    color: "brown"
  }
]

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'user',
  password: 'p@ssw0rd',
  database: 'hoge-db',
  port: 3306,
  namedPlaceholders:true,
});

app.use(prettyJSON());

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hono App</title>
    </head>
    <body>
      <h1>Hello HONO!!</h1>
      <a href="./playwright">playwright</a>
      <a href="./configs">config</a>
      <a href="./database">database</a>
      <a href="./add-request">add-request</a>
    </body>
    </html>
  `);
});
app.use('/static/*', serveStatic({ root: './src' }));
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))

app.get("/posts", (c) => c.json({ posts: keibadata }));

app.get("/posts/:id", (c) => {
  const id = c.req.param("id");
  const post = keibadata.find((p) => p.id === id);
  if (post) {
    return c.json(post);
  } else {
    return c.json({ message: "not found this page" }, 404)
  }
})

//playwrightテスト結果のページ
app.get("/playwright", async (c) => {
  const html = fs.readFileSync('./playwright-report/index.html', 'utf8')
  return c.html(html);
})

//テスト結果のスクショ等
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

const config2 = JSON.stringify(config, null, 2);
app.get("/configs", (c) => c.html(config2));

app.get('/database', async (c) => {
  try {
    const [results] = await connection.query('SELECT * FROM test_results');
    return c.json(results);
  } catch (err) {
    console.error('Error executing query:', err);
    return c.json({ success: false, message: 'エラーが発生しました。' }, 500);
  }
});

// リクエスト追加ページ
app.get('/add-request', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Playwrightキュー追加</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1>Playwrightのキューを送るページ</h1>
      <form action="/submit-queue" method="POST">
        <label for="request">リクエスト:</label>
        <input type="text" id="request" name="request" required />
        <input type="submit" value="リクエストを送信" />
      </form>
    </body>
    </html>
  `)
})
// キューにリクエストを追加するエンドポイント
app.post('/submit-queue', async (c) => {
  try {
    const body = await c.req.parseBody();
    const request = JSON.stringify(body.request);

    if (!request) {
      console.log("リクエストが空です");
    }

    const [result] = await connection.query(
      'INSERT INTO queue (config,is_executed) VALUES (:request,:flag)',
      {request:request,flag:0}
    );
    return c.json({
      success: true,
      message: 'リクエストが正常に保存されました。',
      id: (result as mysql.ResultSetHeader).insertId,
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