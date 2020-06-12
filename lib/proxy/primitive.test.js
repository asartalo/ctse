const { expect } = require('chai');
const { is } = require('./primitive');

describe('primitive', () => {
  describe('#is()', () => {
    [false, true, 1, -1, 1000, 'foo', undefined, null, {}].forEach(item => {
      it(`returns true for ${item}`, () => {
        expect(is(item)).to.be.true();
      });
    });

    it('returns false for objects that have ctseObjectId property', () => {
      expect(is({ ctseObjectId: 0 })).to.be.false();
    });
  });
});
