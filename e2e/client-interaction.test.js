const { expect } = require('chai');
const wait = require('@sprnz/wait');
const ClientSession = require('../lib/ClientSession');
const Client = require('../lib/Client');
const CLI = require('../lib/CLI');

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

    beforeEach(async () => {
      // Start server
      cli = CLI.create({ se: false });
      ctse = cli.app;
      ctse.start();
      await wait(500);

      await client.connect();
    });

    afterEach(async () => {
      await ctse.stop();
      await client.disconnect();
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
        this.timeout = 5000;
        session = await client.requestSession();
      });

      it('creates it successfully', () => {
        expect(session).to.be.an.instanceof(ClientSession);
      });

      it('can be used to obtain hello function', async () => {
        const obj = await session.start();
        const { hello } = obj;
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
    });
  });
});
