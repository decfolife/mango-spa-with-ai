const fs = require("fs-extra");
const concat = require("concat");
const path = require(`path`);

const JS_EXTENSION = `.js`;
const CSS_EXTENSION = `.css`;

const appName = process.argv[2]

if (!appName) {
  console.error(`ERROR: Error while building the Angular element, please enter the application name as first parameter`)
  process.exit()
}

const outputJsFile = process.argv[3] || appName;
const outputPrefixPath = process.argv[4];

const distPath = path.join(__dirname, `dist/apps/mango-crem-features/${appName}/`);
const cremDistPath = path.join(__dirname, `dist/cremDist/${outputPrefixPath || appName}/`);
const cremDistElementPath = path.join(__dirname, `dist/cremDist/${outputPrefixPath || appName}/${outputJsFile}.js`);


(async function build() {
  const files = await fs.readdir(distPath);
  
  const jsFles = files
    .filter(file => path.extname(file).toLowerCase() === JS_EXTENSION)
    .map(jsFile => path.join(distPath, jsFile));
  
  await fs.ensureDir(cremDistPath);
  await concat(jsFles, cremDistElementPath);
  
  // Find the CSS file (handles both styles.css and styles.<hash>.css)
  const cssFile = files.find(file => 
    file.startsWith('styles') && path.extname(file).toLowerCase() === CSS_EXTENSION
  );
  
  if (cssFile) {
    const outputCssName = appName === 'alerts-rules' ? 'alerts-rules.css' : 'styles.css';
    await fs.copyFile(`./dist/apps/mango-crem-features/${appName}/styles.css`, `dist/cremDist/${outputPrefixPath || appName}/${outputCssName}`)
  } else {
    console.warn(`WARNING: No CSS file found for ${appName}`);
  }
  
  await fs.copyFile(`./dist/apps/mango-crem-features/${appName}/3rdpartylicenses.txt`, `dist/cremDist/${outputPrefixPath || appName}/3rdpartylicenses.txt`)

  console.log('Angular build element script run with success!')
})();
