import { ServiceType } from '../types/service';

export const SILVER_SERVICES: Array<ServiceType> = [
  {
    name: 'adldap',
    label: 'Active Directory',
    description: 'A service for supporting Active Directory integration',
    group: 'LDAP',
    configSchema: [],
  },
  {
    name: 'ldap',
    label: 'Standard LDAP',
    description: 'A service for supporting Open LDAP integration',
    group: 'LDAP',
    configSchema: [],
  },
  {
    name: 'oidc',
    label: 'OpenID Connect',
    description: 'OpenID Connect service supporting SSO.',
    group: 'OAuth',
    configSchema: [],
  },
  {
    name: 'oauth_azure_ad',
    label: 'Azure Active Directory OAuth',
    description:
      'OAuth service for supporting Azure Active Directory authentication and API access.',
    group: 'OAuth',
    configSchema: [],
  },
  {
    name: 'saml',
    label: 'SAML 2.0',
    description: 'SAML 2.0 service supporting SSO.',
    group: 'SSO',
    configSchema: [],
  },
  {
    name: 'okta_saml',
    label: 'Okta SAML',
    description: 'Okta service supporting SSO.',
    group: 'SSO',
    configSchema: [],
  },
  {
    name: 'auth0_sso',
    label: 'Auth0 SSO',
    description: 'Auth0 service supporting SSO.',
    group: 'SSO',
    configSchema: [],
  },
  {
    name: 'ibmdb2',
    label: 'IBM DB2',
    description: 'Database service supporting IBM DB2 SQL connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'informix',
    label: 'IBM Informix',
    description: 'Database service supporting IBM Informix SQL connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'oracle',
    label: 'Oracle',
    description: 'Database service supporting SQL connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'salesforce_db',
    label: 'Salesforce',
    description:
      'Database service with SOAP and/or OAuth authentication support for Salesforce connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'soap',
    label: 'SOAP Service',
    description: 'A service to handle SOAP Services',
    group: 'Remote Service',
    configSchema: [],
  },
  {
    name: 'sqlanywhere',
    label: 'SAP SQL Anywhere',
    description: 'Database service supporting SAP SQL Anywhere connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'sqlsrv',
    label: 'SQL Server',
    description: 'Database service supporting SQL Server connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'memsql',
    label: 'MemSQL',
    description: 'Database service supporting MemSQL connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'apns',
    label: 'Apple Push Notification',
    description: 'Apple Push Notification Service Provider.',
    group: 'Notification',
    configSchema: [],
  },
  {
    name: 'gcm',
    label: 'GCM Push Notification',
    description: 'GCM Push Notification Service Provider.',
    group: 'Notification',
    configSchema: [],
  },
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'Database service supporting MySLQ connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'mariadb',
    label: 'MariaDB',
    description: 'Database service supporting MariaDB connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'nodejs',
    label: 'Node.js',
    description:
      'Service that allows client-callable scripts utilizing the system scripting.',
    group: 'Script',
    configSchema: [],
  },
  {
    name: 'php',
    label: 'PHP',
    description:
      'Service that allows client-callable scripts utilizing the system scripting.',
    group: 'Script',
    configSchema: [],
  },
  // {
  //   name: 'python',
  //   label: 'Python',
  //   description:
  //     'Service that allows client-callable scripts utilizing the system scripting.',
  //   group: 'Script',
  //   configSchema: [],
  // },
  {
    name: 'python3',
    label: 'Python3',
    description:
      'Service that allows client-callable scripts utilizing the system scripting.',
    group: 'Script',
    configSchema: [],
  },
  {
    name: 'mongodb',
    label: 'MongoDB',
    description: 'Database service for MongoDB connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'gridfs',
    label: 'GridFS',
    description: 'GridFS File Storage services.',
    group: 'File',
    configSchema: [],
  },
];

export const GOLD_SERVICES: Array<ServiceType> = [
  {
    name: 'logstash',
    label: 'Logstash',
    description: 'Logstash service.',
    group: 'Log',
    configSchema: [],
  },
  {
    name: 'snowflake',
    label: 'Snowflake',
    description: 'Database service supporting Snowflake connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'apache_hive',
    label: 'Apache Hive',
    description:
      'The Apache Hive data warehouse software facilitates reading, writing, and managing large datasets residing in distributed storage using SQL',
    group: 'Big Data',
    configSchema: [],
  },
  {
    name: 'databricks',
    label: 'Databricks',
    description:
      'The Databricks data intelligence platform simplifies data engineering, analytics, and AI workloads by providing scalable compute and SQL-based access to large datasets in a unified environment.',
    group: 'Big Data',
    configSchema: [],
  },
  {
    name: 'dremio',
    label: 'Dremio',
    description:
      'The Dremio data lakehouse platform enables fast querying, data exploration, and analytics on large datasets across various storage systems using SQL.',
    group: 'Big Data',
    configSchema: [],
  },
  {
    name: 'hadoop_hdfs',
    label: 'Hadoop HDFS',
    description: 'Hadoop Distributed File System',
    group: 'File',
    configSchema: [],
  },
  {
    name: 'hana',
    label: 'SAP HANA',
    description: 'SAP HANA service.',
    group: 'Big Data',
    configSchema: [],
  },
];
