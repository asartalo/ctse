const { expect } = require('chai');
const Session = require('./Session');

describe('Session', () => {
  let session;
  let id;

  beforeEach(() => {
    id = 'randomSessionId';
    session = new Session(id);
  });

  it('can be instantiated', () => {
    expect(session).to.be.an.instanceof(Session);
  });

  it('stores session id', () => {
    expect(session.id).to.equal(id);
  });
});
