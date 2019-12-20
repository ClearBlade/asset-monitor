// this file is for stubbing out libraries from code services for when tests are run

global.log = (arg: string): void => console.log(arg);

global.Promise.runQueue = (): void => {
    return;
};

global.ClearBlade = {
    // add any utilized ClearBlade methods, ts-ignores are required due to partial implementations
    init: arg => undefined,
    Collection: function(arg: { collectionName?: string }) {
        return {};
    },
    Query: function() {
        return {
            equalTo: (column, val) => undefined,
        };
    },
    Messaging: (options, callback) => ({
        publish: (topic, payload) => {},
        subscribe: (topic, callback) => {},
        waitForMessage: (topics, wfmCallback) => {},
    }),
};
