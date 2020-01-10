#!/usr/bin/env node

/* eslint-disable no-console */
const { Command } = require('commander');

const Selenium = require('./lib/Selenium');
const SeleniumBackground = require('./lib/SeleniumBackground');
const Ctsn = require('./lib/Ctsn.js');

const program = new Command();

program
  .version('0.0.1')
  .option('-f, --foreground', 'Run in the foreground')
  .action(async ({ foreground }) => {
    const SeleniumRunner = foreground ? Selenium : SeleniumBackground;
    const runner = new SeleniumRunner(__dirname);
    const app = Ctsn.create();

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

    const snPromise = runner.start();
    app.start();

    const result = await snPromise;
    console.log(result.stderr, result.stdout);
  });

program.parse(process.argv);
