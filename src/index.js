const fs = require('fs');
const util = require('util');
const fs_writeFile = util.promisify(fs.writeFile);
const fs_readFile = util.promisify(fs.readFile);
const puppeteer = require('puppeteer');
const _ = require('lodash');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const got = require('got');
const moment = require('moment');
require('dotenv').config();
const history = require('./history.json');
const node_url = require('url');

const listingSelector = '.item___2ffLg';
const titleSelector = '.mainTitle___mbpq1';
const badgeSelector = '.status___3Dmlk';
const dateSelector = '.datetime___3qYYG';
const imgSelector = '.pic___OBkJy';

const generateUrlParamsStr = (urlParamsObj) => {
  const urlParams = _.keys(urlParamsObj).map((k) => {
    if (urlParamsObj[k] === undefined) return undefined;
    return `${k}=${urlParamsObj[k]}`;
  }).filter(o=>o).join('&');
  return urlParams;
};

const sendNotification = async (title, badge, listDate, image_url) => {
  if (!process.env.WIREPUSHER_KEY) {
    console.log('Wirepusher not setup....');
    return;
  }
  const message = `New (${badge}) listing. List date: ${listDate} Found date: ${moment().format('MM DD YY hh:mm:ss')}`;
  const urlParamsObj = {title, message, image_url, id: process.env.WIREPUSHER_KEY, type: badge};
  const paramdUrl = node_url.format((`${process.env.WIREPUSHER_URL}?${generateUrlParamsStr(urlParamsObj)}`));
  try {
    const response = await got(paramdUrl);
  } catch (error) {
    console.log(` #### WIREPUSHER REQUEST ERROR: ${error} ####`);
  }
};

async function kmap(collection, fn) {
  return new Promise(async function (resolve) {
    const newCollection = [];
    for (let i=0; i<collection.length; i+=1) {
      newCollection.push(await fn(collection[i], i));
    }
    resolve(newCollection);
  });
}

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

let keepRunning = true;
const url = process.env.URL;
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.setViewport({ width: 1366, height: 768 });
  await page.setCacheEnabled(false);
  await page.goto(url);

  while(keepRunning) {
    try {
      // wait 2 seconds for shit to load
      await ktimeout(2000);

      const listings = await page.$$(`${listingSelector}`);

      await keach(listings, async (listing) => {
        const title = (await listing.$$(titleSelector))[0];
        let titleText = await page.evaluate(e => e.innerText, title);
        titleText = titleText.split('\n')[0];
        // record doesn't exist in history. add it and send notification
        if (!history[titleText]) {
          history[titleText] = 1;
          console.log('NEW TOKEN FOUND: %o', titleText);

          const badge = (await listing.$$(badgeSelector))[0];
          let badgeText = 'No Badge';
          if (badge) {
            badgeText = await page.evaluate(e => e.innerText, badge);
          }
          const listDateEl = (await listing.$$(dateSelector))[0];
          const listDate = await page.evaluate(e => e.innerText, listDateEl);
          const imgEl = (await listing.$$(imgSelector))[0];
          const imgLink = (await page.evaluate(e => e.getAttribute('style'), imgEl)).slice(23, -3);

          await sendNotification(titleText, badgeText, listDate, imgLink);
        }
      });
      await fs_writeFile('src/history.json', JSON.stringify(history));

      // wait set interval before checking again
      await ktimeout(process.env.INTERVAL_IN_SECONDS * 1000);
      await page.reload();
    } catch (e) {
      console.log('##### FATAL ERROR: %o ######', e);
    }
  }
})();