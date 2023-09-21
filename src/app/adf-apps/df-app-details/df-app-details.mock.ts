export const ROLES = [
  { name: 'test', id: 1 },
  { name: 'test2', id: 2 },
];

export const CREATE_ACTIVATED_ROUTE = {
  data: {
    pipe: () => {
      return {
        subscribe: (fn: (value: any) => void) =>
          fn({
            roles: {
              resource: [...ROLES],
            },
          }),
      };
    },
  },
};

export const EDIT_ACTIVATED_ROUTE = {
  data: {
    pipe: () => {
      return {
        subscribe: (fn: (value: any) => void) =>
          fn({
            roles: {
              resource: [...ROLES],
            },
            appData: {
              name: 'test',
              description: 'test',
              defaultRole: 1,
              active: true,
              appLocation: 1,
              storgeServiceId: 3,
              storageContainer: 'applications',
              path: 'test',
              url: 'test',
              apiKey: 'test_api_key',
            },
          }),
      };
    },
  },
};
