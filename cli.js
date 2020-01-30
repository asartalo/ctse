#!/usr/bin/env node

/* eslint-disable no-console */
const { Command } = require('commander');

const Selenium = require('./lib/Selenium');
const SeleniumBackground = require('./lib/SeleniumBackground');
const CtSe = require('./lib/CtSe.js');

const program = new Command();

function createLogger(...observers) {
  return data => {
    const toLog = `${data}`.trimEnd(/[\r\n]/);
    console.log(toLog);
    observers.forEach(observer => observer(toLog));
  };
}

function createSeleniumChecker(foreground = false) {
  let ready = false;
  const readyMessage = 'CtSe: Selenium Server Ready';

  if (foreground) {
    return str => {
      if (!ready) {
        if (str.match(/Selenium started/)) {
          ready = true;
          console.log(readyMessage);
        }
      }
    };
  }

  const nBrowsers = 2;
  let registered = 0;

  return str => {
    if (!ready) {
      registered += ([...str.matchAll(/Registered a node/)]).length;
      if (registered >= nBrowsers) {
        ready = true;
        console.log(readyMessage);
      }
    }
  };
}

program
  .version('0.0.1')
  .option('-f, --foreground', 'Run in the foreground')
  .action(({ foreground }) => {
    const SeleniumRunner = foreground ? Selenium : SeleniumBackground;
    const seReady = createSeleniumChecker(foreground);
    const logger = createLogger(seReady);
    const runner = new SeleniumRunner(__dirname, { logger });
    const app = CtSe.create();

    process.on('beforeExit', () => runner.stop().then(() => {
      console.log('STOPPED WITH BEFOREEXIT');
      process.exit();
    }));

    process.on('SIGINT', () => {
      runner.stop().then(() => {
        console.log('STOPPED WITH SIGINT');
        process.exit();
      });
    });

    process.on('SIGTERM', () => {
      runner.stop().then(() => {
        console.log('STOPPED WITH SIGTERM');
        process.exit();
      });
    });

    runner.start();
    app.start();
  });

program.parse(process.argv);
