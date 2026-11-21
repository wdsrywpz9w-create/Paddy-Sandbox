// Copies the web app into www/, the folder Capacitor packages into the iPhone app.
// Run: npm run build:web
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');
const files = ['index.html', 'help.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const dirs = ['css', 'js', 'help'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of files) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of dirs) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
// The service worker is for the website only: inside the app everything is already on the phone.
console.log(`Copied ${files.length} files and ${dirs.join(', ')} into www/`);
