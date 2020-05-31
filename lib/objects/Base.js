class Base {
  constructor() {
    this.version = '0.1.0';
    this.arrayOfStuff = [1, 2, '3', { foo: 'bar' }];
  }

  // eslint-disable-next-line class-methods-use-this
  hello() {
    return 'Hello from ctse!';
  }
}

module.exports = Base;
