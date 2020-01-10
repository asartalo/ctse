/* global before */
/*
 eslint mocha/no-top-level-hooks: "off", mocha/no-hooks-for-single-case: "off"
*/
before(() => {
  // process.stdout.write('\x1b[0f');
  process.stdout.write('\x1b[2J');
});
