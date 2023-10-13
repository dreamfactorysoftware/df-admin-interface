import { ScriptEventResponse } from '../types/scripts';
import { addGroupEntries, groupEvents } from './eventScripts';

describe('groupEvents function', () => {
  it('should group events correctly', () => {
    const input: ScriptEventResponse = {
      eventGroup1: {
        specificEvent1: {
          type: 'event_type',
          endpoints: ['/path/to/endpoint/{param1}', '/path/to/another'],
          parameter: {
            param1: ['value1', 'value2'],
          },
        },
      },
    };

    const result = groupEvents(input);
    expect(result).toEqual([
      {
        name: 'specific_event1',
        endpoints: [
          '/path/to/endpoint/{param1}',
          '/path/to/endpoint/value1',
          '/path/to/endpoint/value2',
          '/path/to/another',
        ],
      },
    ]);
  });

  it('should add group entries correctly', () => {
    const input = [
      'eventGroup1.specificEvent1',
      'eventGroup1.specificEvent2',
      'eventGroup2.specificEvent1',
    ];
    const result = addGroupEntries(input);
    expect(result).toEqual([
      'eventGroup1.*',
      'eventGroup1.specificEvent1',
      'eventGroup1.specificEvent2',
      'eventGroup2.*',
      'eventGroup2.specificEvent1',
    ]);
  });
});
