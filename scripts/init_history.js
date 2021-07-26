const fs = require('fs');
const util = require('util');
const fs_writeFile = util.promisify(fs.writeFile);
const puppeteer = require('puppeteer');
require('dotenv').config();

const listingSelector = '.item___2ffLg';
const titleSelector = '.mainTitle___mbpq1';

async function keach(collection, fn) {
  return new Promise(async function (resolve) {
    for (let i=0; i<collection.length; i+=1) {
      await fn(collection[i], i);
    }
    resolve();
  });
}

function ktimeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const url = process.env.URL;
const history = {};
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.setViewport({ width: 1366, height: 768 });
  await page.setCacheEnabled(false);
  await page.goto(url);

    try {
      // wait 2 seconds for shit to load
      await ktimeout(2000);

      const listings = await page.$$(`${listingSelector}`);

      await keach(listings, async (listing) => {
        const title = (await listing.$$(titleSelector))[0];
        let titleText = await page.evaluate(e => e.innerText, title);
        titleText = titleText.split('\n')[0];
        history[titleText] = 1;
      });
      await fs_writeFile('src/history.json', JSON.stringify(history));
    } catch (e) {
      console.log('##### FATAL ERROR: %o ######', e);
    }

    await browser.close();
})();