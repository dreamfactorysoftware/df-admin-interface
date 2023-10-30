import { DEFAULT_LANGUAGE } from '../constants/languages';
import { detectUserLanguage } from './language';

describe('detectUserLanguage function', () => {
  const originalNavigator = global.navigator;

  afterAll(() => {
    global.navigator = originalNavigator;
  });

  it('should return a supported language code if it matches the user language', () => {
    global.navigator = {
      ...originalNavigator,
      language: 'en',
    };
    expect(detectUserLanguage()).toEqual('en');
  });

  it('should return a supported language code if it matches an alt code', () => {
    global.navigator = {
      ...originalNavigator,
      language: 'en-US',
    };
    expect(detectUserLanguage()).toEqual('en');
  });

  it('should return the default language if the user language is not supported', () => {
    global.navigator = {
      ...originalNavigator,
      language: 'fr',
    };
    expect(detectUserLanguage()).toEqual(DEFAULT_LANGUAGE);
  });

  it('should return the default language if the navigator language is undefined', () => {
    global.navigator = {
      ...originalNavigator,
      language: '',
    };
    expect(detectUserLanguage()).toEqual(DEFAULT_LANGUAGE);
  });
});
