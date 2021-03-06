// this file is for stubbing out libraries from code services for when tests are run

global.log = (arg: string): void => console.log(arg);

global.Promise.runQueue = (): void => {
    return;
};

global.ClearBlade = {
    // add any utilized ClearBlade methods, ts-ignores are required due to partial implementations
    init: (): void => undefined,
    Collection: (): {
        remove: () => void;
    } => ({
        remove: (): void => undefined,
    }),
    Query: function(): { equalTo: () => void; or: () => void } {
        return {
            equalTo: (): void => undefined,
            or: (): void => undefined,
        };
    },
    Messaging: (): {
        publish: () => void;
        subscribe: () => void;
        waitForMessage: () => void;
        cancelCBTimeout: () => void;
    } => ({
        publish: (): void => undefined,
        subscribe: (): void => undefined,
        waitForMessage: (): void => undefined,
        cancelCBTimeout: (): void => undefined,
    }),
    Cache: (): void => undefined,
};
