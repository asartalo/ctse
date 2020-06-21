const { By, Key, until } = require('selenium-webdriver');
const chrome = require('../browser/chrome');
const firefox = require('../browser/firefox');

// TODO: Move test-related functions to a test object
class Base {
  constructor() {
    this.version = '0.1.0';
    this.drivers = [];
    this.seleniumUrl = 'http://localhost:4444/wd/hub';
    this.utilities = { By, Key, until };
  }

  // eslint-disable-next-line class-methods-use-this
  async addResolver(promiseInt) {
    const int = await promiseInt;
    return 1 + int;
  }

  // eslint-disable-next-line class-methods-use-this
  async one() {
    return 1;
  }

  // eslint-disable-next-line class-methods-use-this
  hello(name) {
    return name ? `Hello, ${name}!` : 'Hello from ctse!';
  }

  helloCallback(callback) {
    return callback(this.hello());
  }

  async chrome({ baseUrl, extensions = [] }) {
    const browser = await chrome({ selenium: this.seleniumUrl, baseUrl, extensions });
    this.drivers.push(browser.driver);
    return browser;
  }

  async firefox({ baseUrl, extensions = [] }) {
    const browser = await firefox({ selenium: this.seleniumUrl, baseUrl, extensions });
    this.drivers.push(browser.driver);
    return browser;
  }

  async reset() {
    try {
      await Promise.all(this.drivers.map(driver => driver.quit()));
    } catch (e) {
      if (e.name !== 'NoSuchSessionError') {
        throw e;
      }
    }
    this.drivers = [];
  }
}

module.exports = Base;
