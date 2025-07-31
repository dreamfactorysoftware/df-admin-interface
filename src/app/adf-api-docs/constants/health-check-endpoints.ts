export const healthCheckEndpointsInfo: {
  [key: string]: { endpoint: string; title: string; description: string }[];
} = {
  Database: [
    {
      endpoint: '/_schema',
      title: 'View Available Schemas',
      description:
        'This command fetches a list of schemas from your connected database',
    },
    {
      endpoint: '/_table',
      title: 'View Tables in Your Database',
      description: 'This command lists all tables in your database',
    },
  ],
  File: [
    {
      endpoint: '/',
      title: 'View Available Folders',
      description:
        'This command fetches a list of folders from your connected file storage',
    },
  ],
};