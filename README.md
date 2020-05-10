# ctse: Continuous Testing with Selenium

[![CircleCI](https://circleci.com/gh/asartalo/ctse.svg?style=svg)](https://circleci.com/gh/asartalo/ctse)
[![Maintainability](https://api.codeclimate.com/v1/badges/5d5bd2435aee4a409cc3/maintainability)](https://codeclimate.com/github/asartalo/ctse/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/5d5bd2435aee4a409cc3/test_coverage)](https://codeclimate.com/github/asartalo/ctse/test_coverage)

A wrapper for Selenium and session manager

## The Problem:

- I want to run selenium tests every time I save a file (e.g. like `mocha --watch`)
- Running end-to-end tests with regular Selenium on the same machine shifts window focus to the test browser which disrupts what I'm doing
- If I do another save while a test is still running, Selenium test sessions aren't closed properly leading to multiple browser windows open
- I don't have a separate machine that can run a Selenium server

### Non-problems:

- Speed: I don't need it to be fast, I just need it to run in parallel while I'm coding

### The Idea:

- Run Selenium in the background using docker!
- Manage Selenium sessions and communicate with the manager only

## Usage

Run the server with:

```sh
ctse
```

On your mocha tests:

```javascript
import ctse, { mocha } from 'ctse';

describe('Smoke test', () => {
  before(ctse.start);

  after(ctse.stop);

  describe('It shows the homepage', () => {
    mocha.runIt(async ({ browser, element }) => {
      await browser.get('http://localhost:3000/');
      expect(element('h1')).hasText();
    });
  });
});
```

## Development

### Requirements

- node
- docker

### Preparing the Development Environment

```sh
npm install
npm run install-selenium
```
