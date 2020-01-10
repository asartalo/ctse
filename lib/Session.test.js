const { expect } = require('chai');
const Session = require('./Session');

describe('Session', () => {
  let session;

  it('can be instantiated', () => {
    session = new Session();
    expect(session).to.equal(session);
  });
});
