const chai = require('chai');
const dirtyChai = require('dirty-chai');
const sinonChai = require('sinon-chai');

chai.use(dirtyChai);
chai.use(sinonChai);

/* global before */
/*
 eslint mocha/no-top-level-hooks: "off", mocha/no-hooks-for-single-case: "off"
*/
before(() => {
  // process.stdout.write('\x1b[0f');
  process.stdout.write('\x1b[2J');
});
