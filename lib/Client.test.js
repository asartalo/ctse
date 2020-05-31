/* eslint-disable mocha/max-top-level-suites */
const { expect } = require('chai');
const sinon = require('sinon');
const wait = require('@sprnz/wait');
const Client = require('./Client');
const ClientSession = require('./ClientSession');
const CLI = require('./CLI');

// TODO: Move this to a dedicated e2e tests folder
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
    });
  });
});

describe('Client', () => {
  let client;
  let ipcClient;
  let id;

  beforeEach(() => {
    ipcClient = {
      connect: sinon.spy(),
      disconnect: sinon.spy(),
      send: sinon.spy(),
    };
    id = 'random_string_to_identify_client';
    client = new Client(ipcClient, { id, extensions: [] });
  });

  it('instantiates', () => {
    expect(client).to.be.an.instanceOf(Client);
  });

  describe('when it attempts to connect', () => {
    beforeEach(async () => {
      await client.connect();
    });

    afterEach(() => client.disconnect());

    it('connects through IpcClient', () => {
      expect(ipcClient.connect).to.have.been.calledOnce();
    });

    describe('when it then disconnects', () => {
      beforeEach(async () => {
        await client.disconnect();
      });

      it('calls ipc.disconnect', () => {
        expect(ipcClient.disconnect).to.have.been.calledOnce();
      });
    });
  });

  describe('#requestSession()', () => {
    describe('when it is not connected', () => {
      it('throws an error', () => {
        client
          .requestSession()
          .then(() => {
            throw Error('It should not succeed');
          })
          .catch(e => {
            expect(e.message).to.eql('Client is not connected');
          });
      });
    });
  });
});
