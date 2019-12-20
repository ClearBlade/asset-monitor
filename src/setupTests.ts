// this file is for stubbing out libraries from code services for when tests are run
// @ts-ignore
global.log = (arg: string) => console.log(arg);

// @ts-ignore
global.Promise.runQueue = () => '';

// @ts-ignore
global.ClearBlade = {
  // add any utilized ClearBlade methods, ts-ignores are required due to partial implementations
  init: arg => undefined,
  // @ts-ignore - only a parial implimentation
  Collection: function(arg: { collectionName?: string }) {
    return {};
  },
  // @ts-ignore- only a parial implimentation
  Query: function() {
    return {
      equalTo: (column, val) => undefined
    };
  },
  // @ts-ignore- only a parial implimentation
  Messaging: (options, callback) => ({
    publish: (topic, payload) => {},
    subscribe: (topic, callback) => {},
    waitForMessage: (topics, wfmCallback) => {}
  })
};
