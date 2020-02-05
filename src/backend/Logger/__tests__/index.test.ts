import { createPrettyLogWithName, prettyLog, Logger } from '..';
import { LogLevels } from '../../global-config';

const publishMock = jest.fn();

describe('Logger', () => {
    beforeAll(() => {
        global.ClearBlade.Messaging = () => ({
            publish: publishMock,
        });
    });
    beforeEach(() => {
        publishMock.mockReset();
    });
    it('createPrettyLogWithName', () => {
        expect(createPrettyLogWithName({ name: 'myName' }, 'one', 'two')).toBe('myName one two');
    });

    it('prettLog', () => {
        expect(prettyLog('one', 'two', 'three')).toBe('one two three');
    });

    it('publish', () => {
        const logger = new Logger({ name: 'testService', logSetting: LogLevels.DEBUG });
        logger.publishLog(LogLevels.INFO, 'hello');
        expect(publishMock).toHaveBeenCalledWith(LogLevels.INFO, 'testService ["hello"]');
    });
    it('noPublish', () => {
        const logger = new Logger({ name: 'testService', logSetting: LogLevels.INFO });
        logger.publishLog(LogLevels.DEBUG, 'hello');
        expect(publishMock).not.toHaveBeenCalled();
    });
});
