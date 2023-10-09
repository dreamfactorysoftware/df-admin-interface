export const SESSION_TOKEN_HEADER = 'X-DreamFactory-Session-Token';
export const API_KEY_HEADER = 'X-DreamFactory-API-Key';
export const LICENSE_KEY_HEADER = 'X-DreamFactory-License-Key';

export const SHOW_LOADING_HEADER = {
  'show-loading': '',
};

export const HTTP_OPTION_LOGIN_FALSE = {
  headers: SHOW_LOADING_HEADER,
  params: {
    login: false,
  },
};

export const HTTP_OPTION_RESET_TRUE = {
  headers: SHOW_LOADING_HEADER,
  params: {
    reset: true,
  },
};
