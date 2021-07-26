const fs = require('fs');
const util = require('util');
const fs_writeFile = util.promisify(fs.writeFile);

const envStr =
  `
URL=https://www.kucoin.com/news/categories/listing?lang=en_US
WIREPUSHER_KEY=''
WIREPUSHER_URL='https://wirepusher.com/send'
INTERVAL_IN_SECONDS=300
  `;

fs.writeFile('.env', envStr, (err) => {
  if (err) {
    console.log('error creating file!: %o', err);
  }
});