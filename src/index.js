const Koa = require('koa');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const crypto = require('crypto');

const app = new Koa();

const staticDir = path.resolve(__dirname, './static/');
const viewsDir = path.resolve(__dirname, './views/');

app.use(ctx => {
    const url = ctx.req.url.trim();

    console.log(url);

    if (url === '/') {
        ctx.body = fs.readFileSync(path.resolve(viewsDir, 'index.html'));
        ctx.res.setHeader('content-type', 'text/html');
        return;
    }

    if (/^\/pages/.test(url)) {
        ctx.res.setHeader('content-type', 'text/html');
        ctx.body = fs.readFileSync(path.join(viewsDir, url.replace('/pages', '')));
        return;
    }

    if (url == '/redirect') {
        ctx.res.statusCode = '302';
        ctx.res.setHeader('Location', 'http://localhost:3000/pages/a.html');
        return;
    }

    const filePath = path.join(staticDir, decodeURIComponent(url));

    if (!fs.statSync(filePath).isFile) {
        ctx.res.statusCode = 404;
        return (ctx.res.body = '404');
    }

    ctx.res.setHeader('Content-Type', mime.getType(filePath));

    // 强缓存
    // const ONE_DAY = 24 * 60 * 60 * 1000;
    // ctx.res.setHeader('Cache-Control', 'max-age=10,private');
    // ctx.res.setHeader('Expires', new Date(+new Date() + ONE_DAY).toGMTString());

    // 不缓存
    // ctx.res.setHeader('Cache-Control', 'no-store');

    /** 协商缓存 */
    ctx.res.setHeader('Cache-Control', 'no-cache');
    /** 协商缓存 */
    // ctx.res.setHeader('Cache-Control', 'mas-age=0, must-revalidate');

    /** Last-Modified & if-modified-since */
    const ModifiedTime = fs.statSync(filePath).mtime.toGMTString();
    if (ctx.req.headers['if-modified-since'] === ModifiedTime) {
        ctx.res.statusCode = 304;
        return;
    }
    ctx.res.setHeader('Last-Modified', ModifiedTime);

    // Etag & if-none-match
    const data = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5');
    hash.update(data);
    const ETag = `"${hash.digest('hex')}"`;

    if (ctx.req.headers['if-none-match'] === ETag) {
        ctx.res.statusCode = 304;
        return;
    }
    ctx.res.setHeader('ETag', ETag);

    ctx.body = data;
});

app.listen(3000, () => console.log('http serve: http://localhost:3000'));
