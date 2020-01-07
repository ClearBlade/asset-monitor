import { TimeFrame, TimeFrameTypes, Days } from '../types';
import { DoesTimeframeMatchRule } from '../timeframe';

const timestamp = '2019-09-26T10:20:30Z';
const timeframe: TimeFrame = {
  type: TimeFrameTypes.REPEATBYDAY,
  startTime: '10:00',
  endTime: '13:00',
  days: [Days.MONDAY, Days.TUESDAY, Days.WEDNESDAY, Days.THURSDAY, Days.FRIDAY]
}

describe('Timeframe for Rules', () => {
  it('validates valid repeatByDay', () => {
      const matchesRule = DoesTimeframeMatchRule(timestamp, timeframe);
      expect(matchesRule).toBe(true);
  });

  it('does not validate invalid repeatByDay by time', () => {
    const matchesRule = DoesTimeframeMatchRule(timestamp, {
      ...timeframe,
      startTime: '11:00'
    });
    expect(matchesRule).toBe(false);
  });

  it('does not validate invalid repeatByDay by day', () => {
    const matchesRule = DoesTimeframeMatchRule(timestamp, {
      ...timeframe,
      days: [Days.MONDAY, Days.TUESDAY]
    });
    expect(matchesRule).toBe(false);
  });

  it('validates valid repeatEachWeek', () => {
    const matchesRule = DoesTimeframeMatchRule(timestamp, {
      ...timeframe,
      type: TimeFrameTypes.REPEATEACHWEEK,
      endTime: '10:30',
      days: [Days.WEDNESDAY, Days.THURSDAY]
    });
    expect(matchesRule).toBe(true);
  });

  it('does not validate invalid repeatEachWeek by time', () => {
    const matchesRule = DoesTimeframeMatchRule(timestamp, {
      ...timeframe,
      endTime: '10:00',
      days: [Days.WEDNESDAY, Days.THURSDAY]
    });
    expect(matchesRule).toBe(false);
  });

  it('does not validate invalid repeatEachWeek by day', () => {
    const matchesRule = DoesTimeframeMatchRule(timestamp, {
      ...timeframe,
      days: [Days.MONDAY, Days.TUESDAY, Days.WEDNESDAY]
    });
    expect(matchesRule).toBe(false);
  });
});