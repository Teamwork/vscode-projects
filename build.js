require('dotenv').config();
const fs = require('fs');
const { execSync } = require('child_process');

console.log('Compiling extension...');
execSync('node_modules/.bin/tsc -p ./');
console.log('Compiled!');

fs.readFile('./out/teamworkProjectsAPI.js', 'utf8', function (err, data) {
  if (err) {
    return console.error(err);
  }
  console.log('Overwriting credentials...');
  data = data.replace(/process.env.DEVPORTAL_CLIENT_ID/g, `'${process.env.DEVPORTAL_CLIENT_ID}'`);
  data = data.replace(/process.env.DEVPORTAL_CLIENT_SECRET/g, `'${process.env.DEVPORTAL_CLIENT_SECRET}'`);

  fs.writeFile('./out/teamworkProjectsAPI.js', data, 'utf8', function (err) {
    if (err) return console.error(err);
  });
  console.log('Done!');
});
