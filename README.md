# KucoinNewListingNotifier
Simple puppeteer app that checks for new token listings on Kucoin's new listing page

###Getting Started
* Make sure nodejs is installed
* Run ``npm install``
* Download Wirepusher for Android from [here](https://wirepusher.com/)
* Once you have your Wirepusher id, run ``node scripts/generate_env_file.js`` 
    * this will generate an env file with all the variables that you can change in the program. Set WIREPUSHER_KEY to your Wirepusher id. Default checking interval is 5 minutes but can be changed. Make sure you enter it in seconds.
* Run ``node init_history.js``
    * This will fill the history.json file with entries for any existing token listings on the website so you don't receive a bunch of notifications for old listings
* Run ``node src/index.js``
