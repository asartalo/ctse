module.exports = {
  is: obj => obj.type === 'function',
  thus: (context, obj, receiver) => (...args) => context.call({
    func: obj,
    args: args.map(arg => {
      if (arg.__ctseCallId > -1) {
        return { __ctseCallId: arg.__ctseCallId };
      }
      return arg.__ctseOriginal || arg;
    }),
    receiver: { ctseObjectId: receiver.ctseObjectId },
  }),
};
