import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { prettyJSON } from 'hono/pretty-json';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2';
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

const app = new Hono();

// import { exec } from 'child_process';

// exec('npx playwright test', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`実行エラー: ${error.message}`);
//     return;
//   }
// });

const keibadata = [
  {
    id:"1",
    name:"家康",
    color:"black"
  },
  {
    id:"2",
    name:"信長",
    color:"white"
  },
  {
    id:"3",
    name:"秀吉",
    color:"brown"
  }
]
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
    </body>
    </html>
  `);
});
app.use('/static/*', serveStatic({ root: './src' }));
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))

app.get("/posts", (c) => c.json({ posts:keibadata}));

app.get("/posts/:id", (c) => {
  const id = c.req.param("id");
  const post = keibadata.find((p) => p.id === id);
  if(post){
    return c.json(post);
  }else{
    return c.json({message:"not found this page"},404)
  }
})

app.get("/playwright", async(c) => {
  const html = fs.readFileSync('./playwright-report/index.html', 'utf8')
  return c.html(html);
})

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
const config2 = JSON.stringify(config,null, 2);
app.get("/configs", (c) => c.html(config2));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'user',
  password: 'p@ssw0rd',
  database: 'hoge-db',
  port: 3306,
});

app.get('/database', (c) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM user', (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        reject(err);
      } else {
        resolve(c.json(results));
      }
    });
  });
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`サーバーが http://localhost:${info.port} で起動しました`);
});
