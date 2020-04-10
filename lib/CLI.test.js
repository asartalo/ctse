const { expect } = require('chai');
const CLI = require('./CLI');
const CtSe = require('./CtSe');
const SeleniumBackground = require('./SeleniumBackground');
const Selenium = require('./Selenium');

describe('CLI.create()', () => {
  let cli;

  describe('When {foreground: false} @slow', () => {
    before(() => {
      cli = CLI.create({ foreground: false });
    });

    it('instantiates with a CtSe app', () => {
      expect(cli.app).to.be.an.instanceof(CtSe);
    });

    it('instantiates with a background selenium runner', () => {
      expect(cli.runner).to.be.an.instanceof(SeleniumBackground);
    });
  });

  describe('When {foreground: true} @slow', () => {
    before(() => {
      cli = CLI.create({ foreground: true });
    });

    it('instantiates with a CtSe app', () => {
      expect(cli.app).to.be.an.instanceof(CtSe);
    });

    it('instantiates with a foreground selenium runner', () => {
      expect(cli.runner).to.be.an.instanceof(Selenium);
    });
  });
});
