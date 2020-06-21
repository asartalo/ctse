const { expect } = require('chai');
const ClientSession = require('../lib/ClientSession');
const Client = require('../lib/Client');
const CLI = require('../lib/CLI');
const createServer = require('./support/createServer.js');

const server = createServer(4000);

describe('Client end-to-end', () => {
  let client;
  let cli;

  beforeEach(() => {
    client = Client.create();
  });

  it('is not connected at first', () => {
    expect(client.connected).to.eql(false);
  });

  describe('when it connects to a running server', () => {
    let ctse;

    beforeEach(async function () {
      this.timeout(5000);
      // Start server
      cli = CLI.create({ foreground: true });
      ctse = cli.app;
      ctse.start();
      await server.start();
      await client.connect();
    });

    afterEach(async function () {
      this.timeout(5000);
      await ctse.stop();
      await client.disconnect();
      await server.stop();
    });

    it('connects', async () => {
      expect(client.connected).to.eql(true);
    });

    it('can disconnect', async () => {
      await client.disconnect();
      expect(client.connected).to.eql(false);
    });

    describe('when it creates a session', () => {
      let session;

      beforeEach(async function () {
        this.timeout(5000);
        session = await client.requestSession();
      });

      afterEach(() => session.reset());

      it('creates it successfully', () => {
        expect(session).to.be.an.instanceof(ClientSession);
      });

      it('can be used to obtain hello function', async () => {
        const { hello } = await session.start();
        expect(await hello()).to.eql('Hello from ctse!');
      });

      it('can pass basic arguments to function', async () => {
        const obj = await session.start();
        const { hello } = obj;
        expect(await hello('Alia')).to.eql('Hello, Alia!');
      });

      it('can call complex async calls', async () => {
        const obj = await session.start();
        const { addResolver, one } = obj;
        expect(await addResolver(one())).to.eql(2);
      });

      it('can get the web page', async function () {
        this.timeout(60000 * 5);
        const { chrome } = await session.start();
        const browser = await chrome({ baseUrl: server.url });
        const paragraph = await browser.find('p');
        const text = await paragraph.getText();
        expect(text).to.eql('This page is just for testing');
      });
    });
  });
});
