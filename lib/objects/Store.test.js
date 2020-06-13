const { expect } = require('chai');
const Store = require('./Store');

describe('Store', () => {
  let store;

  beforeEach(() => {
    store = new Store();
  });

  it('can be instantiated', () => {
    expect(store).to.be.an.instanceof(Store);
  });

  it('starts with no objects stored', () => {
    expect(store.objectCount()).to.equal(0);
  });

  describe('addObject()', () => {
    let object;
    let objectId;
    beforeEach(() => {
      object = { foo: 'bar' };
      objectId = store.addObject(object);
    });

    it('returns id that can be used to retrieve object', () => {
      expect(store.getObject(objectId)).to.equal(object);
    });

    it('increments object count', () => {
      expect(store.objectCount()).to.equal(1);
    });

    it('has unique id for each object', () => {
      const object2 = { fn2: () => {} };
      const objectId2 = store.addObject(object2);
      expect(store.getObject(objectId2)).to.equal(object2);
      expect(store.getObject(objectId)).to.equal(object);
    });

    describe('when store is cleared()', () => {
      beforeEach(() => {
        store.clear();
      });

      it('makes previously added objects inaccessible', () => {
        expect(store.getObject(objectId)).to.equal(undefined);
      });

      it('makes object count turn to zero', () => {
        expect(store.objectCount()).to.equal(0);
      });
    });
  });
});
