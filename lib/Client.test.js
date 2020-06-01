const { expect } = require('chai');
const sinon = require('sinon');
const Client = require('./Client');

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
