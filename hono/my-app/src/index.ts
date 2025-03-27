import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { prettyJSON } from 'hono/pretty-json';
import fs from 'fs';
import path from 'path'

const app = new Hono();

// import { exec } from 'child_process';

// exec('npx playwright test', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`実行エラー: ${error.message}`);
//     return;
//   }
// });

const TestResultIMG = fs.readdirSync('playwright-report/data');
console.log(TestResultIMG);

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
  const url = 'http://localhost:9323';
  const response = await fetch(url);
  const htmlContent = await response.text();
  return c.html(htmlContent);
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


app.get('/images', (c) => {
  const reportDataPath = path.resolve('./playwright-report/data')
  
  try {
    const imageLinks = fs.readdirSync(reportDataPath)
      .filter(file => file.toLowerCase().endsWith('.png'))
      .map(filename => `/data/${filename}`)
    
    return c.text(imageLinks.join('\n'))
  } catch (error) {
    return c.text('Could not read image directory', 500)
  }
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`サーバーが http://localhost:${info.port} で起動しました`);
});
