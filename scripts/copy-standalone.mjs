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
} catch (error) {
  console.error('Error copying static assets:', error);
}
