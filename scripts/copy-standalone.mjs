import fs from 'fs';
import path from 'path';

const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

try {
  console.log('Copying static assets to standalone directory...');
  copyRecursiveSync('./public', './.next/standalone/public');
  copyRecursiveSync('./.next/static', './.next/standalone/.next/static');
  console.log('Static assets copied successfully!');

  // Patch server.js to support cPanel LiteSpeed named pipes in process.env.PORT
  const serverJsPath = path.join('./.next/standalone/server.js');
  if (fs.existsSync(serverJsPath)) {
    let serverJs = fs.readFileSync(serverJsPath, 'utf8');
    // Ganti parseInt(process.env.PORT, 10) dengan process.env.PORT agar string socket tidak jadi NaN
    serverJs = serverJs.replace(
      /parseInt\(process\.env\.PORT,\s*10\)/g,
      'process.env.PORT'
    );
    fs.writeFileSync(serverJsPath, serverJs, 'utf8');
    console.log('Patched standalone/server.js for LiteSpeed socket compatibility!');
  }
} catch (error) {
  console.error('Error copying static assets:', error);
}
