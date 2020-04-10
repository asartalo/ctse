#!/usr/bin/env node

/* eslint-disable no-console */
const { Command } = require('commander');
const CLI = require('./lib/CLI');

const program = new Command();

program
  .version('0.0.1')
  .option('-f, --foreground', 'Run in the foreground')
  .action(options => {
    CLI.create(options).start();
  });

program.parse(process.argv);
