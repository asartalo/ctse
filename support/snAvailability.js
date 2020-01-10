const { Builder, By } = require('selenium-webdriver');
const chromeSn = require('selenium-webdriver/chrome');

const Availability = require('./Availability.js');
const createServer = require('./createServer.js');
const shellRunner = require('../lib/shellRunner.js');

const server = createServer(4000);

const VERBOSE = false;
function vblog(...args) {
  if (VERBOSE) {
    console.log.apply(null, args); // eslint-disable-line no-console
  }
}

async function chrome(host, url) {
  const driver = await new Builder()
    .forBrowser('chrome')
    .usingServer(`http://${host}/wd/hub`)
    .setChromeOptions(new chromeSn.Options())
    .build();

  await driver.get(url);

  return {
    url,
    driver,
    find: selector => driver.findElement(By.css(selector)),
    stop: () => driver.quit(),
  };
}

function dockerCheck() {
  vblog('dockerCheck...');
  return new Promise(resolve => {
    let logs = '';
    let timeoutId;

    const cmd = shellRunner(
      'docker-compose',
      ['-f', './docker-compose-selenium.yml', 'top'],
      {
        logger: data => {
          vblog('dockerCheck checking...');
          const str = `${data}`;
          logs += str;
          if (str.match(/sn_hub/)) {
            vblog('dockerCheck success...');
            cmd.kill();
            clearTimeout(timeoutId);
            resolve(false);
          }
        },
      },
    );

    let checkTimes = 0;
    let running = false;
    const intervalId = setInterval(() => {
      checkTimes += 1;
      if (checkTimes > 10) {
        clearInterval(intervalId);
        cmd.kill();
        return;
      }
      vblog(`dockerCheck try ${checkTimes}...`);
      if (!running) {
        running = true;
        cmd.run().then(() => {
          running = false;
          if (logs !== '') {
            clearInterval(intervalId);
          }
          logs = '';
        });
      }
    }, 500);

    let result;
    timeoutId = setTimeout(async () => {
      clearInterval(intervalId);
      resolve(`Timed out checking Selenium through docker compose${result ? (result.stderr || result.stdout) : ''} ${logs}`);
    }, 5000);
  });
}

const browserCount = 2; // How many browsers are we expecting?
function snReadinessCheck(checkCommand, args = []) {
  const t0 = Date.now();
  vblog('snReadinessCheck...');
  return new Promise(resolve => {
    let cmd;
    let nodes = 0;
    let log = '';
    let timeoutId;

    function logger(data) {
      const str = `${data}`;
      log += str;
      nodes += ([...str.matchAll(/Registered a node/)]).length;
      const timePassed = (Date.now() - t0) / 1000;
      vblog(`${timePassed}s snReadinessCheck checking... nodes: ${nodes}`);
      if (nodes >= browserCount) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setTimeout(() => {
          vblog(log);
          resolve(false);
        }, 10000);
        cmd.kill();
      }
    }

    cmd = shellRunner(checkCommand, args, { logger });

    timeoutId = setTimeout(() => {
      cmd.kill();
      resolve(`Timed out checking selenium server is ready ${log}`);
    }, 14000);
    cmd.run();
  });
}

module.exports = async function snAvailability(host, options = {}) {
  vblog('snAvailability start');
  const { foreground } = { foreground: false, ...options };
  let availability = new Availability('selenium');

  if (!foreground) {
    const dockerCheckMessage = await dockerCheck();
    if (dockerCheckMessage) {
      return availability.set({ message: dockerCheckMessage });
    }
    const readinessMessage = await snReadinessCheck('docker', ['logs', '-f', 'ctsn_sn_hub_1']);
    if (readinessMessage) {
      return availability.set({ message: readinessMessage });
    }
  }

  let browser;
  async function stepWatch(failMessage, fn) {
    try {
      await fn();
    } catch (e) {
      server.stop();
      if (browser) {
        browser.stop();
      }
      return `${failMessage} ${e.message} ${e.stack}`;
    }
    return false;
  }

  let message = await stepWatch('Server start fail', async () => {
    vblog('Starting test server');
    await server.start();
  });
  if (message) {
    return availability.set({ message });
  }

  message = await stepWatch('Selenium client startup fail', async () => {
    vblog({ host });
    browser = await chrome(host, server.url);
  });
  if (message) {
    return availability.set({ message });
  }

  let paragraph;
  let text;
  message = await stepWatch('Test page reading fail', async () => {
    paragraph = await browser.find('p');
    text = await paragraph.getText();
  });
  if (message) {
    return availability.set({ message });
  }

  if (text !== 'This page is just for testing') {
    availability = availability.set({
      message: `Unable check test page. Found "${text}"`,
    });
  } else {
    availability = availability.set({
      available: true,
      noMessage: 'Selenium started successfully',
    });
  }

  server.stop();
  browser.stop();
  return availability;
};
