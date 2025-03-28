import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { prettyJSON } from 'hono/pretty-json';
import fs from 'fs';
const app = new Hono();
// import { exec } from 'child_process';
// exec('DEBUG=pw:api npx playwright test', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`実行エラー: ${error.message}`);
//     return;
//   }
// });
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
];
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
    </body>
    </html>
  `);
});
app.use('/static/*', serveStatic({ root: './src' }));
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }));
app.get("/posts", (c) => c.json({ posts: keibadata }));
app.get("/posts/:id", (c) => {
    const id = c.req.param("id");
    const post = keibadata.find((p) => p.id === id);
    if (post) {
        return c.json(post);
    }
    else {
        return c.json({ message: "not found this page" }, 404);
    }
});
app.get("/data", (c) => {
    let result = '';
    for (let i = 0; i < Object.keys(keibadata).length; i++) {
        result += JSON.stringify(keibadata[i], null, 2);
    }
    return c.html(result);
});
app.get("/data/:id", (c) => {
    const id = Number(c.req.param("id"));
    const data = keibadata[id - 1];
    if (data) {
        return c.html(JSON.stringify(data, null, 2));
    }
    else {
        return c.html("Data not found");
    }
});
app.get("/playwright", async (c) => {
    const url = 'http://localhost:9323';
    const response = await fetch(url);
    const htmlContent = await response.text();
    return c.html(htmlContent);
});
serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    console.log(`サーバーが http://localhost:${info.port} で起動しました`);
});
