'use client';

import React from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  DatabaseIcon,
  ServerIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { Alert } from '@/components/ui/alert';
import { CodeBlock } from '@/components/ui/code-block';
import { ConnectionTestResult, DatabaseDriver } from '@/components/database-service/types';

interface TestResultDisplayProps {
  /**
   * Connection test result data from the useConnectionTest hook
   */
  result: ConnectionTestResult;
  
  /**
   * Database driver type for context-specific troubleshooting
   */
  databaseType: DatabaseDriver;
  
  /**
   * Optional test configuration for displaying context
   */
  testConfig?: {
    host: string;
    port?: number;
    database: string;
    driver: DatabaseDriver;
  };
  
  /**
   * Whether to show detailed technical information
   */
  showDetails?: boolean;
  
  /**
   * Callback when retry action is triggered
   */
  onRetry?: () => void;
  
  /**
   * Custom CSS classes for styling
   */
  className?: string;
  
  /**
   * Test identifier for accessibility
   */
  'data-testid'?: string;
}

interface DatabaseTroubleshootingInfo {
  commonIssues: string[];
  diagnosticQueries?: string[];
  configurationTips: string[];
  documentationUrl: string;
}

interface ConnectionMetadata {
  serverVersion?: string;
  serverInfo?: string;
  databaseSize?: string;
  tableCount?: number;
  charset?: string;
  timezone?: string;
  maxConnections?: number;
  connectionPoolSize?: number;
}

/**
 * Database-specific troubleshooting information for error scenarios
 */
const DATABASE_TROUBLESHOOTING: Record<DatabaseDriver, DatabaseTroubleshootingInfo> = {
  mysql: {
    commonIssues: [
      'Verify MySQL server is running on the specified port',
      'Check firewall settings and network connectivity',
      'Ensure user has proper GRANT permissions',
      'Validate SSL configuration if using encrypted connections',
      'Confirm max_connections setting allows new connections'
    ],
    diagnosticQueries: [
      'SHOW VARIABLES LIKE "port"',
      'SHOW PROCESSLIST',
      'SHOW GRANTS FOR CURRENT_USER()',
      'SELECT @@max_connections'
    ],
    configurationTips: [
      'Default MySQL port is 3306',
      'Enable general_log for connection debugging',
      'Check bind-address in my.cnf configuration',
      'Ensure user account allows connections from client IP'
    ],
    documentationUrl: 'https://dev.mysql.com/doc/refman/8.0/en/connecting.html'
  },
  postgresql: {
    commonIssues: [
      'Verify PostgreSQL server is running and accepting connections',
      'Check pg_hba.conf for authentication method compatibility',
      'Ensure user has CONNECT privilege on database',
      'Validate SSL mode configuration matches server requirements',
      'Confirm max_connections setting in postgresql.conf'
    ],
    diagnosticQueries: [
      'SELECT version()',
      'SHOW port',
      'SELECT current_database(), current_user',
      'SELECT setting FROM pg_settings WHERE name = \'max_connections\''
    ],
    configurationTips: [
      'Default PostgreSQL port is 5432',
      'Check listen_addresses in postgresql.conf',
      'Enable log_connections for debugging',
      'Review authentication methods in pg_hba.conf'
    ],
    documentationUrl: 'https://www.postgresql.org/docs/current/runtime-config-connection.html'
  },
  oracle: {
    commonIssues: [
      'Verify Oracle listener is running and properly configured',
      'Check TNS names resolution and service name accuracy',
      'Ensure user account is unlocked and password is valid',
      'Validate network connectivity on Oracle listener port',
      'Confirm proper Oracle client installation and configuration'
    ],
    diagnosticQueries: [
      'SELECT * FROM v$version',
      'SELECT username, account_status FROM dba_users WHERE username = USER',
      'SELECT instance_name, status FROM v$instance',
      'SELECT name FROM v$database'
    ],
    configurationTips: [
      'Default Oracle listener port is 1521',
      'Use tnsping to test TNS connectivity',
      'Check listener.ora and tnsnames.ora configuration',
      'Enable logging in sqlnet.ora for debugging'
    ],
    documentationUrl: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/netag/'
  },
  mongodb: {
    commonIssues: [
      'Verify MongoDB server is running and accessible',
      'Check authentication database and user credentials',
      'Ensure proper read/write permissions on target database',
      'Validate SSL/TLS configuration if encryption is enabled',
      'Confirm connection string format and parameters'
    ],
    diagnosticQueries: [
      'db.version()',
      'db.runCommand("connectionStatus")',
      'db.stats()',
      'db.runCommand("serverStatus").connections'
    ],
    configurationTips: [
      'Default MongoDB port is 27017',
      'Use MongoDB Compass for visual connection testing',
      'Check mongod.conf for binding and security settings',
      'Enable verbose logging for connection debugging'
    ],
    documentationUrl: 'https://docs.mongodb.com/manual/reference/connection-string/'
  },
  snowflake: {
    commonIssues: [
      'Verify Snowflake account identifier and region',
      'Check user authentication method (password, key pair, SSO)',
      'Ensure warehouse is running and accessible',
      'Validate network policies and IP whitelisting',
      'Confirm proper role assignment and privileges'
    ],
    diagnosticQueries: [
      'SELECT CURRENT_VERSION()',
      'SELECT CURRENT_USER(), CURRENT_ROLE()',
      'SELECT CURRENT_WAREHOUSE(), CURRENT_DATABASE()',
      'SHOW PARAMETERS LIKE \'NETWORK_POLICY\''
    ],
    configurationTips: [
      'Use format: <account>.<region>.snowflakecomputing.com',
      'Enable MFA for enhanced security',
      'Check warehouse auto-suspend settings',
      'Review account usage for connection monitoring'
    ],
    documentationUrl: 'https://docs.snowflake.com/en/user-guide/admin-connection-management'
  },
  sqlite: {
    commonIssues: [
      'Verify database file path exists and is accessible',
      'Check file permissions for read/write access',
      'Ensure SQLite database file is not corrupted',
      'Validate file system space availability',
      'Confirm proper SQLite version compatibility'
    ],
    diagnosticQueries: [
      'SELECT sqlite_version()',
      'PRAGMA integrity_check',
      'PRAGMA database_list',
      'PRAGMA compile_options'
    ],
    configurationTips: [
      'Use absolute file paths for reliability',
      'Enable WAL mode for better concurrency',
      'Regular VACUUM operations for optimization',
      'Consider backup strategies for data protection'
    ],
    documentationUrl: 'https://sqlite.org/lang.html'
  },
  sqlserver: {
    commonIssues: [
      'Verify SQL Server instance is running and accessible',
      'Check Windows/SQL Server authentication mode',
      'Ensure user has proper login and database permissions',
      'Validate network configuration and firewall settings',
      'Confirm SQL Server Browser service if using named instances'
    ],
    diagnosticQueries: [
      'SELECT @@VERSION',
      'SELECT SYSTEM_USER, USER_NAME()',
      'SELECT name FROM sys.databases',
      'SELECT @@SERVERNAME, @@SERVICENAME'
    ],
    configurationTips: [
      'Default SQL Server port is 1433',
      'Enable TCP/IP protocol in SQL Server Configuration Manager',
      'Check SQL Server error log for connection issues',
      'Use SQL Server Management Studio for testing'
    ],
    documentationUrl: 'https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/server-network-configuration'
  },
  mariadb: {
    commonIssues: [
      'Verify MariaDB server is running on specified port',
      'Check firewall and network accessibility',
      'Ensure user has appropriate GRANT privileges',
      'Validate SSL/TLS configuration if required',
      'Confirm max_connections setting allows new connections'
    ],
    diagnosticQueries: [
      'SELECT VERSION()',
      'SHOW VARIABLES LIKE "port"',
      'SHOW GRANTS FOR CURRENT_USER()',
      'SELECT @@max_connections'
    ],
    configurationTips: [
      'Default MariaDB port is 3306',
      'Check bind-address in server configuration',
      'Enable general_log for connection debugging',
      'Review user account host restrictions'
    ],
    documentationUrl: 'https://mariadb.com/kb/en/configuring-mariadb-for-remote-client-access/'
  }
};

/**
 * Format test duration for display
 */
const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
};

/**
 * Extract connection metadata from successful test results
 */
const parseConnectionMetadata = (result: ConnectionTestResult): ConnectionMetadata => {
  const metadata: ConnectionMetadata = {};
  
  if (result.details) {
    try {
      const details = typeof result.details === 'string' ? JSON.parse(result.details) : result.details;
      
      // Extract common metadata fields
      metadata.serverVersion = details.serverVersion || details.version;
      metadata.serverInfo = details.serverInfo || details.info;
      metadata.databaseSize = details.databaseSize || details.size;
      metadata.tableCount = details.tableCount || details.tables;
      metadata.charset = details.charset || details.characterSet;
      metadata.timezone = details.timezone || details.timeZone;
      metadata.maxConnections = details.maxConnections || details.max_connections;
      metadata.connectionPoolSize = details.poolSize || details.pool_size;
    } catch (error) {
      // If details is not JSON, treat as plain text
      metadata.serverInfo = result.details;
    }
  }
  
  return metadata;
};

/**
 * Get performance indicator color based on test duration
 */
const getPerformanceColor = (duration: number): string => {
  if (duration <= 1000) return 'text-green-600'; // Excellent (≤1s)
  if (duration <= 3000) return 'text-yellow-600'; // Good (≤3s)
  if (duration <= 5000) return 'text-orange-600'; // Acceptable (≤5s)
  return 'text-red-600'; // Poor (>5s)
};

/**
 * TestResultDisplay Component
 * 
 * Displays comprehensive connection test results with success/error states,
 * detailed error troubleshooting, connection metadata, and responsive design.
 */
export const TestResultDisplay: React.FC<TestResultDisplayProps> = ({
  result,
  databaseType,
  testConfig,
  showDetails = true,
  onRetry,
  className = '',
  'data-testid': testId = 'connection-test-result'
}) => {
  const troubleshooting = DATABASE_TROUBLESHOOTING[databaseType];
  const metadata = result.success ? parseConnectionMetadata(result) : null;
  const performanceColor = result.testDuration ? getPerformanceColor(result.testDuration) : '';

  return (
    <div 
      className={`space-y-6 ${className}`}
      data-testid={testId}
      role="region"
      aria-label="Connection test results"
    >
      {/* Primary Result Alert */}
      <Alert variant={result.success ? 'success' : 'error'} className="animate-fade-in">
        <div className="flex items-start space-x-3">
          {result.success ? (
            <CheckCircleIconSolid className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {result.success ? 'Connection Successful' : 'Connection Failed'}
              </h3>
              
              {result.testDuration && (
                <div className="flex items-center space-x-1 text-sm">
                  <ClockIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  <span className={`font-medium ${performanceColor}`}>
                    {formatDuration(result.testDuration)}
                  </span>
                </div>
              )}
            </div>
            
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {result.message}
            </p>
            
            {result.timestamp && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Test completed at {new Date(result.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Alert>

      {/* Success State: Connection Metadata */}
      {result.success && metadata && showDetails && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <DatabaseIcon className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
              Database Information
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {metadata.serverVersion && (
              <div className="flex items-center space-x-2">
                <ServerIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Version:</span> {metadata.serverVersion}
                </span>
              </div>
            )}
            
            {testConfig && (
              <div className="flex items-center space-x-2">
                <GlobeAltIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Host:</span> {testConfig.host}:{testConfig.port || 'default'}
                </span>
              </div>
            )}
            
            {metadata.tableCount !== undefined && (
              <div className="flex items-center space-x-2">
                <DatabaseIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Tables:</span> {metadata.tableCount.toLocaleString()}
                </span>
              </div>
            )}
            
            {metadata.charset && (
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Charset:</span> {metadata.charset}
                </span>
              </div>
            )}
            
            {metadata.timezone && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Timezone:</span> {metadata.timezone}
                </span>
              </div>
            )}
            
            {metadata.maxConnections && (
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Max Connections:</span> {metadata.maxConnections.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          {metadata.serverInfo && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300 font-mono">
                {metadata.serverInfo}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error State: Troubleshooting Information */}
      {!result.success && showDetails && (
        <div className="space-y-4">
          {/* Error Details */}
          {result.details && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Details
                  {result.errorCode && (
                    <span className="ml-2 text-xs font-mono bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">
                      {result.errorCode}
                    </span>
                  )}
                </h4>
              </div>
              
              <CodeBlock
                code={result.details}
                language="text"
                className="text-sm"
                showLineNumbers={false}
              />
            </div>
          )}

          {/* Database-Specific Troubleshooting */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <WrenchScrewdriverIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {databaseType.toUpperCase()} Troubleshooting Guide
              </h4>
            </div>
            
            <div className="space-y-4">
              {/* Common Issues */}
              <div>
                <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Common Connection Issues:
                </h5>
                <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {troubleshooting.commonIssues.map((issue, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-amber-500 dark:text-amber-400 mt-1.5 block w-1 h-1 bg-current rounded-full flex-shrink-0" aria-hidden="true" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Configuration Tips */}
              <div>
                <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Configuration Tips:
                </h5>
                <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {troubleshooting.configurationTips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-amber-500 dark:text-amber-400 mt-1.5 block w-1 h-1 bg-current rounded-full flex-shrink-0" aria-hidden="true" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Diagnostic Queries */}
              {troubleshooting.diagnosticQueries && troubleshooting.diagnosticQueries.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Diagnostic Queries:
                  </h5>
                  <div className="space-y-2">
                    {troubleshooting.diagnosticQueries.map((query, index) => (
                      <CodeBlock
                        key={index}
                        code={query}
                        language="sql"
                        className="text-sm"
                        showLineNumbers={false}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Documentation Link */}
              <div className="pt-3 border-t border-amber-200 dark:border-amber-800">
                <a
                  href={troubleshooting.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors duration-200"
                >
                  <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                  <span>View Official Documentation</span>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retry Button for Failed Connections */}
      {!result.success && onRetry && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            data-testid="retry-connection-button"
          >
            <ClockIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};

export default TestResultDisplay;