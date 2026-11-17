'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const release = path.join(root, 'release');
const sourceHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(dist, 'styles.css'), 'utf8').replace(/<\/style/gi, '<\\/style');
const script = fs.readFileSync(path.join(dist, 'app.js'), 'utf8').replace(/<\/script/gi, '<\\/script');

const portableCsp = "default-src 'self'; script-src 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' blob: data: https:; connect-src https://idea.chicsdata.shop; object-src 'none'; base-uri 'none'; form-action 'self'";

let html = sourceHtml
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, `<meta http-equiv="Content-Security-Policy" content="${portableCsp}">`)
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>\n${styles}\n</style>`)
  .replace('<script src="./app-desktop-20261117.js"></script>', `<script>\n${script}\n</script>`)
  .replace('<title>Thumb Desk</title>', '<title>Thumb Desk Web</title>');

if (html.includes('./styles.css') || html.includes('./app-desktop-20261117.js')) {
  throw new Error('Portable build vẫn còn tham chiếu tới file bên ngoài.');
}

fs.mkdirSync(release, { recursive: true });
const output = path.join(release, 'Thumb-Desk-Web.html');
fs.writeFileSync(output, html, 'utf8');
console.log(`Created ${output} (${fs.statSync(output).size} bytes)`);
