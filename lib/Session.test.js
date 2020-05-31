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

  it('starts with no objects stored', () => {
    expect(session.objectCount()).to.equal(0);
  });

  describe('addObject()', () => {
    let object;
    let objectId;
    beforeEach(() => {
      object = { foo: 'bar' };
      objectId = session.addObject(object);
    });

    it('returns id that can be used to retrieve object', () => {
      expect(session.getObject(objectId)).to.equal(object);
    });

    it('increments object count', () => {
      expect(session.objectCount()).to.equal(1);
    });

    it('has unique id for each object', () => {
      const object2 = { fn2: () => {} };
      const objectId2 = session.addObject(object2);
      expect(session.getObject(objectId2)).to.equal(object2);
      expect(session.getObject(objectId)).to.equal(object);
    });

    describe('when session is reset', () => {
      beforeEach(() => {
        session.reset();
      });

      it('makes previously added objects inaccessible', () => {
        expect(session.getObject(objectId)).to.equal(undefined);
      });

      it('makes object count turn to zero', () => {
        expect(session.objectCount()).to.equal(0);
      });
    });
  });
});
