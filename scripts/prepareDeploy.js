const fs = require('fs');

const packageRaw = fs.readFileSync('./package.json', 'utf8');
const packageJson = JSON.parse(packageRaw);

packageJson.main = './src/index.js';
packageJson.types = './src/index.d.ts';

delete packageJson.scripts;

fs.writeFileSync('./build/package.json', JSON.stringify(packageJson, null, 2));

if (fs.existsSync('./build/tsconfig.tsbuildinfo')) {
  fs.unlinkSync('./build/tsconfig.tsbuildinfo');
}

fs.copyFileSync('./.npmignore', './build/.npmignore');
fs.copyFileSync('./LICENSE', './build/LICENSE');
fs.copyFileSync('./.github/translation/readme-enUS.md', './build/README.md');
