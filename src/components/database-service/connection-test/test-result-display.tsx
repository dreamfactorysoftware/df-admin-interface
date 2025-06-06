/**
 * Connection Test Result Display Component
 * 
 * React component that renders detailed connection test results including success messages, 
 * error details, connection timing information, and database-specific metadata. Provides 
 * comprehensive feedback for troubleshooting failed connections and confirming successful 
 * database links with SWR integration for automatic updates.
 * 
 * Features:
 * - Detailed success and error state display with contextual feedback
 * - Database-specific error handling and troubleshooting hints
 * - Connection timing and performance metrics display
 * - Database version and schema summary information
 * - Responsive design with Tailwind CSS for multi-device support
 * - Accessibility compliance with WCAG 2.1 AA standards
 * - SWR integration for automatic result updates and error handling
 * - TypeScript interfaces for comprehensive type safety
 * 
 * @fileoverview Connection test result display component
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 2.1 - FEATURE CATALOG (F-001-RQ-002)
 * @see Technical Specification Section 7.1.1 - React/Next.js Integration Requirements
 */

'use client';

import React, { 
  forwardRef, 
  useCallback, 
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  ServerIcon,
  DatabaseIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
} from '@heroicons/react/24/solid';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { 
  ConnectionTestResult, 
  ConnectionMetadata,
  DatabaseDriver,
  ApiErrorResponse,
} from '../types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Test result display component props
 */
export interface TestResultDisplayProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Connection test result data */
  result: ConnectionTestResult | null;
  
  /** SWR error state */
  error?: ApiErrorResponse | Error | null;
  
  /** SWR loading state */
  loading?: boolean;
  
  /** Database type for specific error handling */
  databaseType?: DatabaseDriver;
  
  /** Show detailed metadata information */
  showDetails?: boolean;
  
  /** Show performance timing information */
  showTiming?: boolean;
  
  /** Show troubleshooting hints for errors */
  showTroubleshooting?: boolean;
  
  /** Show database-specific information */
  showDatabaseInfo?: boolean;
  
  /** Compact display mode */
  compact?: boolean;
  
  /** Allow result data copying */
  allowCopy?: boolean;
  
  /** Custom retry handler */
  onRetry?: () => void;
  
  /** Custom clear handler */
  onClear?: () => void;
  
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Database-specific error patterns and troubleshooting
 */
interface DatabaseErrorConfig {
  commonErrors: Record<string, {
    pattern: RegExp;
    description: string;
    solutions: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  defaultPort: number;
  documentation: string;
  connectionChecklist: string[];
}

/**
 * Expandable section props
 */
interface ExpandableSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

// =============================================================================
// DATABASE-SPECIFIC ERROR HANDLING
// =============================================================================

/**
 * Database-specific error configurations with troubleshooting guidance
 */
const DATABASE_ERROR_CONFIGS: Record<DatabaseDriver, DatabaseErrorConfig> = {
  mysql: {
    commonErrors: {
      'CONNECTION_REFUSED': {
        pattern: /connect.*refused|ECONNREFUSED|Can't connect/i,
        description: 'MySQL server is not running or not accepting connections',
        solutions: [
          'Verify MySQL server is running (sudo systemctl status mysql)',
          'Check if MySQL is listening on the correct port (netstat -tlnp | grep :3306)',
          'Verify firewall settings allow connections to port 3306',
          'Check MySQL configuration file (my.cnf) for bind-address settings',
        ],
        severity: 'high',
      },
      'ACCESS_DENIED': {
        pattern: /Access denied.*using password|authentication.*failed/i,
        description: 'Invalid username or password credentials',
        solutions: [
          'Verify username and password are correct',
          'Check user exists: SELECT User FROM mysql.user WHERE User = \'username\'',
          'Verify user has proper permissions: SHOW GRANTS FOR \'username\'@\'host\'',
          'Ensure user can connect from your IP address',
        ],
        severity: 'medium',
      },
      'DATABASE_NOT_FOUND': {
        pattern: /Unknown database|database.*not.*exist|database.*does.*not.*exist/i,
        description: 'The specified database does not exist',
        solutions: [
          'Check database name spelling and case sensitivity',
          'List available databases: SHOW DATABASES',
          'Create database if needed: CREATE DATABASE database_name',
          'Verify you have access to the database',
        ],
        severity: 'medium',
      },
      'TIMEOUT': {
        pattern: /timeout|timed.*out|connection.*timeout/i,
        description: 'Connection attempt timed out',
        solutions: [
          'Check network connectivity to MySQL server',
          'Verify MySQL server is not overloaded',
          'Increase connection timeout settings',
          'Check for network latency issues',
        ],
        severity: 'medium',
      },
    },
    defaultPort: 3306,
    documentation: 'https://dev.mysql.com/doc/refman/8.0/en/connection-access.html',
    connectionChecklist: [
      'MySQL server is running',
      'Port 3306 is accessible',
      'Credentials are valid',
      'Database exists',
      'User has proper permissions',
    ],
  },
  postgresql: {
    commonErrors: {
      'CONNECTION_REFUSED': {
        pattern: /connect.*refused|ECONNREFUSED|could not connect/i,
        description: 'PostgreSQL server is not running or not accepting connections',
        solutions: [
          'Verify PostgreSQL server is running (sudo systemctl status postgresql)',
          'Check if PostgreSQL is listening on the correct port (netstat -tlnp | grep :5432)',
          'Verify firewall settings allow connections to port 5432',
          'Check postgresql.conf for listen_addresses setting',
        ],
        severity: 'high',
      },
      'AUTHENTICATION_FAILED': {
        pattern: /authentication.*failed|password authentication failed|role.*does.*not.*exist/i,
        description: 'Authentication failed with provided credentials',
        solutions: [
          'Verify username and password are correct',
          'Check pg_hba.conf authentication methods',
          'Ensure user role exists: \\du in psql',
          'Verify connection is allowed from your IP address',
        ],
        severity: 'medium',
      },
      'DATABASE_NOT_FOUND': {
        pattern: /database.*does.*not.*exist|fatal.*database/i,
        description: 'The specified database does not exist',
        solutions: [
          'Check database name spelling and case sensitivity',
          'List available databases: \\l in psql',
          'Create database if needed: CREATE DATABASE database_name',
          'Connect to default postgres database first',
        ],
        severity: 'medium',
      },
      'SSL_ERROR': {
        pattern: /SSL.*required|SSL.*not.*supported|sslmode/i,
        description: 'SSL configuration mismatch',
        solutions: [
          'Check SSL mode settings (disable, allow, prefer, require)',
          'Verify server SSL configuration',
          'Check SSL certificates if using verify-ca or verify-full',
          'Try different SSL modes to isolate the issue',
        ],
        severity: 'medium',
      },
    },
    defaultPort: 5432,
    documentation: 'https://www.postgresql.org/docs/current/client-authentication.html',
    connectionChecklist: [
      'PostgreSQL server is running',
      'Port 5432 is accessible',
      'Credentials are valid',
      'Database exists',
      'pg_hba.conf allows connection',
      'SSL settings are correct',
    ],
  },
  sqlserver: {
    commonErrors: {
      'CONNECTION_REFUSED': {
        pattern: /connect.*refused|ECONNREFUSED|network.*related.*error/i,
        description: 'SQL Server is not accessible or not running',
        solutions: [
          'Verify SQL Server service is running',
          'Check SQL Server Configuration Manager for network protocols',
          'Ensure TCP/IP protocol is enabled',
          'Verify firewall allows connections to port 1433',
        ],
        severity: 'high',
      },
      'LOGIN_FAILED': {
        pattern: /login.*failed|authentication.*failed|cannot.*open.*database/i,
        description: 'Login failed for the specified user',
        solutions: [
          'Verify username and password are correct',
          'Check if SQL Server authentication is enabled',
          'Ensure user has connect permissions to the database',
          'Check if user account is not locked',
        ],
        severity: 'medium',
      },
      'DATABASE_NOT_ACCESSIBLE': {
        pattern: /cannot.*open.*database|database.*not.*accessible/i,
        description: 'Database is not accessible or does not exist',
        solutions: [
          'Verify database name is correct',
          'Check if database is online: SELECT state_desc FROM sys.databases',
          'Ensure user has access to the specific database',
          'Verify database is not in recovery mode',
        ],
        severity: 'medium',
      },
    },
    defaultPort: 1433,
    documentation: 'https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/troubleshoot-connecting-to-the-sql-server-database-engine',
    connectionChecklist: [
      'SQL Server service is running',
      'TCP/IP protocol is enabled',
      'Port 1433 is accessible',
      'Credentials are valid',
      'Database exists and is online',
      'User has connect permissions',
    ],
  },
  oracle: {
    commonErrors: {
      'TNS_LISTENER_ERROR': {
        pattern: /TNS.*could.*not.*resolve|listener.*does.*not.*currently.*know/i,
        description: 'TNS listener is not running or misconfigured',
        solutions: [
          'Verify TNS listener is running (lsnrctl status)',
          'Check tnsnames.ora configuration',
          'Verify service name or SID is correct',
          'Check listener.ora configuration',
        ],
        severity: 'high',
      },
      'INVALID_USERNAME_PASSWORD': {
        pattern: /invalid.*username.*password|ORA-01017/i,
        description: 'Invalid username or password',
        solutions: [
          'Verify username and password are correct',
          'Check if account is locked: SELECT account_status FROM dba_users',
          'Verify user exists in the correct database',
          'Check password expiration policies',
        ],
        severity: 'medium',
      },
      'DATABASE_NOT_AVAILABLE': {
        pattern: /database.*not.*available|ORA-01034|ORA-27101/i,
        description: 'Oracle database instance is not available',
        solutions: [
          'Check if Oracle instance is started (sqlplus / as sysdba)',
          'Verify ORACLE_SID environment variable',
          'Check alert log for database errors',
          'Ensure database is mounted and open',
        ],
        severity: 'high',
      },
    },
    defaultPort: 1521,
    documentation: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/netag/troubleshooting-oracle-net-services.html',
    connectionChecklist: [
      'Oracle instance is running',
      'TNS listener is active',
      'Service name/SID is correct',
      'Port 1521 is accessible',
      'Credentials are valid',
      'Database is open',
    ],
  },
  mongodb: {
    commonErrors: {
      'CONNECTION_REFUSED': {
        pattern: /connect.*refused|ECONNREFUSED|failed.*to.*connect/i,
        description: 'MongoDB server is not running or not accessible',
        solutions: [
          'Verify MongoDB service is running (sudo systemctl status mongod)',
          'Check if MongoDB is listening on the correct port (netstat -tlnp | grep :27017)',
          'Verify firewall settings allow connections',
          'Check MongoDB configuration file (mongod.conf)',
        ],
        severity: 'high',
      },
      'AUTHENTICATION_FAILED': {
        pattern: /authentication.*failed|auth.*failed|unauthorized/i,
        description: 'Authentication failed with provided credentials',
        solutions: [
          'Verify username and password are correct',
          'Check authentication database (usually admin)',
          'Ensure user has proper roles and permissions',
          'Verify authentication mechanism (SCRAM-SHA-256, etc.)',
        ],
        severity: 'medium',
      },
      'DATABASE_NOT_FOUND': {
        pattern: /database.*not.*found|database.*does.*not.*exist/i,
        description: 'The specified database does not exist',
        solutions: [
          'Database will be created automatically on first write operation',
          'Verify database name spelling',
          'Check user permissions to access the database',
          'List available databases: show dbs',
        ],
        severity: 'low',
      },
    },
    defaultPort: 27017,
    documentation: 'https://docs.mongodb.com/manual/reference/connection-string/',
    connectionChecklist: [
      'MongoDB service is running',
      'Port 27017 is accessible',
      'Credentials are valid',
      'Authentication database is correct',
      'User has proper roles',
    ],
  },
  snowflake: {
    commonErrors: {
      'ACCOUNT_NOT_FOUND': {
        pattern: /account.*not.*found|incorrect.*account.*name/i,
        description: 'Snowflake account identifier is incorrect',
        solutions: [
          'Verify account identifier format (account.region.cloud)',
          'Check account name in Snowflake web interface',
          'Ensure region and cloud provider are correct',
          'Contact Snowflake administrator for correct account details',
        ],
        severity: 'medium',
      },
      'AUTHENTICATION_FAILED': {
        pattern: /authentication.*failed|invalid.*credentials|incorrect.*username.*password/i,
        description: 'Invalid username or password credentials',
        solutions: [
          'Verify username and password are correct',
          'Check if account is locked or suspended',
          'Verify user exists in Snowflake account',
          'Check if multi-factor authentication is required',
        ],
        severity: 'medium',
      },
      'SSL_CONNECTION_ERROR': {
        pattern: /SSL.*error|certificate.*verify.*failed|ssl.*connection/i,
        description: 'SSL connection issues with Snowflake',
        solutions: [
          'Ensure SSL is enabled (required for Snowflake)',
          'Check system certificate store',
          'Verify network allows HTTPS connections',
          'Contact network administrator about SSL/TLS policies',
        ],
        severity: 'medium',
      },
    },
    defaultPort: 443,
    documentation: 'https://docs.snowflake.com/en/user-guide/troubleshooting-connects.html',
    connectionChecklist: [
      'Account identifier is correct',
      'Credentials are valid',
      'SSL/TLS is enabled',
      'Port 443 is accessible',
      'User has login permissions',
    ],
  },
  sqlite: {
    commonErrors: {
      'FILE_NOT_FOUND': {
        pattern: /no such file|file.*not.*found|unable.*to.*open.*database/i,
        description: 'SQLite database file does not exist or is not accessible',
        solutions: [
          'Verify database file path is correct',
          'Check file permissions (read/write access)',
          'Ensure directory exists for the database file',
          'Database file will be created if it doesn\'t exist',
        ],
        severity: 'medium',
      },
      'PERMISSION_DENIED': {
        pattern: /permission.*denied|access.*denied|readonly.*database/i,
        description: 'Insufficient permissions to access database file',
        solutions: [
          'Check file system permissions for database file',
          'Verify directory permissions for database location',
          'Ensure application has read/write access',
          'Check if file system is mounted read-only',
        ],
        severity: 'medium',
      },
      'DATABASE_LOCKED': {
        pattern: /database.*locked|database.*busy/i,
        description: 'Database file is locked by another process',
        solutions: [
          'Check if another application is using the database',
          'Look for .db-wal and .db-shm files (WAL mode)',
          'Restart application or process using the database',
          'Check for long-running transactions',
        ],
        severity: 'low',
      },
    },
    defaultPort: 0, // SQLite doesn't use network ports
    documentation: 'https://www.sqlite.org/lang.html',
    connectionChecklist: [
      'Database file path is correct',
      'File permissions allow access',
      'Directory exists',
      'No file system locks',
    ],
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Analyze error message and provide database-specific troubleshooting
 */
const analyzeError = (
  errorMessage: string, 
  databaseType?: DatabaseDriver
): {
  category: string;
  description: string;
  solutions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  documentation?: string;
} => {
  if (!databaseType) {
    return {
      category: 'GENERIC_ERROR',
      description: 'Connection failed with an unknown error',
      solutions: [
        'Check network connectivity',
        'Verify server is running',
        'Check credentials',
        'Review server logs',
      ],
      severity: 'medium',
    };
  }

  const config = DATABASE_ERROR_CONFIGS[databaseType];
  
  // Check against known error patterns
  for (const [category, errorConfig] of Object.entries(config.commonErrors)) {
    if (errorConfig.pattern.test(errorMessage)) {
      return {
        category,
        description: errorConfig.description,
        solutions: errorConfig.solutions,
        severity: errorConfig.severity,
        documentation: config.documentation,
      };
    }
  }

  // Default error analysis
  return {
    category: 'UNKNOWN_ERROR',
    description: 'Connection failed with an unrecognized error',
    solutions: [
      `Check ${databaseType.toUpperCase()} server status`,
      `Verify port ${config.defaultPort} is accessible`,
      'Check credentials and permissions',
      'Review error message for specific details',
      'Consult database documentation',
    ],
    severity: 'medium',
    documentation: config.documentation,
  };
};

/**
 * Format duration in milliseconds to human-readable string
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
};

/**
 * Get performance assessment based on test duration
 */
const getPerformanceAssessment = (duration: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  color: string;
} => {
  if (duration < 500) {
    return {
      level: 'excellent',
      message: 'Excellent connection speed',
      color: 'text-green-600 dark:text-green-400',
    };
  } else if (duration < 1500) {
    return {
      level: 'good',
      message: 'Good connection speed',
      color: 'text-blue-600 dark:text-blue-400',
    };
  } else if (duration < 3000) {
    return {
      level: 'fair',
      message: 'Acceptable connection speed',
      color: 'text-yellow-600 dark:text-yellow-400',
    };
  } else {
    return {
      level: 'poor',
      message: 'Slow connection - consider optimization',
      color: 'text-orange-600 dark:text-orange-400',
    };
  }
};

/**
 * Format metadata for display
 */
const formatMetadata = (metadata: ConnectionMetadata): Array<{
  label: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'date';
}> => {
  const formatted: Array<{ label: string; value: string; type: 'text' | 'number' | 'boolean' | 'date' }> = [];

  if (metadata.serverVersion) {
    formatted.push({
      label: 'Server Version',
      value: metadata.serverVersion,
      type: 'text',
    });
  }

  if (metadata.databaseVersion) {
    formatted.push({
      label: 'Database Version',
      value: metadata.databaseVersion,
      type: 'text',
    });
  }

  if (metadata.protocol) {
    formatted.push({
      label: 'Protocol',
      value: metadata.protocol,
      type: 'text',
    });
  }

  if (metadata.charset) {
    formatted.push({
      label: 'Character Set',
      value: metadata.charset,
      type: 'text',
    });
  }

  if (metadata.timezone) {
    formatted.push({
      label: 'Timezone',
      value: metadata.timezone,
      type: 'text',
    });
  }

  if (metadata.maxConnections !== undefined) {
    formatted.push({
      label: 'Max Connections',
      value: metadata.maxConnections.toString(),
      type: 'number',
    });
  }

  if (metadata.currentConnections !== undefined) {
    formatted.push({
      label: 'Current Connections',
      value: metadata.currentConnections.toString(),
      type: 'number',
    });
  }

  if (metadata.uptime !== undefined) {
    formatted.push({
      label: 'Server Uptime',
      value: formatDuration(metadata.uptime * 1000),
      type: 'text',
    });
  }

  if (metadata.schemas && Array.isArray(metadata.schemas)) {
    formatted.push({
      label: 'Available Schemas',
      value: metadata.schemas.join(', '),
      type: 'text',
    });
  }

  if (metadata.tableCount !== undefined) {
    formatted.push({
      label: 'Total Tables',
      value: metadata.tableCount.toString(),
      type: 'number',
    });
  }

  if (metadata.ssl !== undefined) {
    formatted.push({
      label: 'SSL Enabled',
      value: metadata.ssl ? 'Yes' : 'No',
      type: 'boolean',
    });
  }

  return formatted;
};

/**
 * Copy text to clipboard with fallback
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// =============================================================================
// EXPANDABLE SECTION COMPONENT
// =============================================================================

/**
 * Expandable section component for organizing detailed information
 */
const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon: Icon,
  defaultExpanded = false,
  children,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className={cn('border border-gray-200 dark:border-gray-700 rounded-lg', className)}>
      <button
        type="button"
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
          'transition-colors duration-200 rounded-t-lg',
          isExpanded && 'border-b border-gray-200 dark:border-gray-700'
        )}
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-900 rounded-b-lg">
          {children}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Connection Test Result Display Component
 * 
 * Comprehensive display component for database connection test results with
 * detailed success/error feedback, troubleshooting guidance, and performance metrics.
 */
export const TestResultDisplay = forwardRef<HTMLDivElement, TestResultDisplayProps>(
  (
    {
      result,
      error,
      loading = false,
      databaseType,
      showDetails = true,
      showTiming = true,
      showTroubleshooting = true,
      showDatabaseInfo = true,
      compact = false,
      allowCopy = true,
      onRetry,
      onClear,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Memoized error analysis
    const errorAnalysis = useMemo(() => {
      if (!result || result.success || !result.message) return null;
      return analyzeError(result.message, databaseType);
    }, [result, databaseType]);

    // Memoized performance assessment
    const performanceAssessment = useMemo(() => {
      if (!result?.testDuration) return null;
      return getPerformanceAssessment(result.testDuration);
    }, [result?.testDuration]);

    // Memoized formatted metadata
    const formattedMetadata = useMemo(() => {
      if (!result?.metadata) return [];
      return formatMetadata(result.metadata);
    }, [result?.metadata]);

    // Handle copy result data
    const handleCopyResult = useCallback(async () => {
      if (!result || !allowCopy) return;

      const resultData = {
        success: result.success,
        message: result.message,
        details: result.details,
        testDuration: result.testDuration,
        timestamp: result.timestamp,
        errorCode: result.errorCode,
        metadata: result.metadata,
      };

      const success = await copyToClipboard(JSON.stringify(resultData, null, 2));
      
      if (success) {
        // You could add a toast notification here
        console.log('Result data copied to clipboard');
      }
    }, [result, allowCopy]);

    // Handle copy error details
    const handleCopyError = useCallback(async () => {
      if (!errorAnalysis || !allowCopy) return;

      const errorData = {
        category: errorAnalysis.category,
        description: errorAnalysis.description,
        solutions: errorAnalysis.solutions,
        severity: errorAnalysis.severity,
        originalMessage: result?.message,
        databaseType,
      };

      const success = await copyToClipboard(JSON.stringify(errorData, null, 2));
      
      if (success) {
        console.log('Error details copied to clipboard');
      }
    }, [errorAnalysis, result?.message, databaseType, allowCopy]);

    // Loading state
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(
            'animate-pulse space-y-4',
            compact ? 'p-3' : 'p-4',
            className
          )}
          data-testid={testId}
          {...props}
        >
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      );
    }

    // No result state
    if (!result && !error) {
      return (
        <div
          ref={ref}
          className={cn(
            'text-center py-8 text-gray-500 dark:text-gray-400',
            compact && 'py-4',
            className
          )}
          data-testid={testId}
          {...props}
        >
          <InformationCircleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No connection test results available</p>
          <p className="text-xs mt-1">Run a connection test to see detailed results here</p>
        </div>
      );
    }

    // SWR error state (different from connection test error)
    if (error && !result) {
      const errorMessage = error instanceof Error ? error.message : 
                          (error as ApiErrorResponse)?.error?.message || 'Unknown error occurred';
      
      return (
        <div ref={ref} className={className} data-testid={testId} {...props}>
          <Alert type="error" dismissible={false}>
            <Alert.Content
              title="Failed to Load Test Results"
              description={`Error: ${errorMessage}`}
            />
            {onRetry && (
              <Alert.Actions>
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-sm text-error-700 dark:text-error-300 hover:text-error-800 dark:hover:text-error-200 font-medium"
                >
                  Retry
                </button>
              </Alert.Actions>
            )}
          </Alert>
        </div>
      );
    }

    // Success state
    if (result?.success) {
      return (
        <div
          ref={ref}
          className={cn('space-y-4', className)}
          data-testid={testId}
          {...props}
        >
          {/* Success Alert */}
          <Alert type="success" variant="soft">
            <Alert.Icon />
            <Alert.Content
              title="Connection Successful"
              description={result.message || 'Database connection established successfully'}
            />
            {(onClear || allowCopy) && (
              <Alert.Actions>
                {allowCopy && (
                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="text-sm text-success-700 dark:text-success-300 hover:text-success-800 dark:hover:text-success-200 font-medium"
                    title="Copy result data"
                  >
                    Copy Details
                  </button>
                )}
                {onClear && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="text-sm text-success-700 dark:text-success-300 hover:text-success-800 dark:hover:text-success-200 font-medium"
                  >
                    Clear
                  </button>
                )}
              </Alert.Actions>
            )}
          </Alert>

          {/* Performance Information */}
          {showTiming && result.testDuration !== undefined && performanceAssessment && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-900 dark:text-green-100">Performance</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 dark:text-green-300">Duration:</span>
                  <span className="ml-2 font-mono">{formatDuration(result.testDuration)}</span>
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300">Assessment:</span>
                  <span className={cn('ml-2 font-medium', performanceAssessment.color)}>
                    {performanceAssessment.message}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Database Information */}
          {showDatabaseInfo && formattedMetadata.length > 0 && (
            <ExpandableSection
              title="Database Information"
              icon={DatabaseIcon}
              defaultExpanded={!compact}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {formattedMetadata.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{item.label}:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}

          {/* Additional Details */}
          {showDetails && result.details && (
            <ExpandableSection
              title="Additional Details"
              icon={DocumentTextIcon}
              defaultExpanded={false}
            >
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                  {result.details}
                </pre>
              </div>
            </ExpandableSection>
          )}
        </div>
      );
    }

    // Error state
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        data-testid={testId}
        {...props}
      >
        {/* Error Alert */}
        <Alert type="error" variant="soft">
          <Alert.Icon />
          <Alert.Content
            title="Connection Failed"
            description={result?.message || 'Database connection could not be established'}
          />
          {(onRetry || onClear || allowCopy) && (
            <Alert.Actions>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-sm text-error-700 dark:text-error-300 hover:text-error-800 dark:hover:text-error-200 font-medium"
                >
                  Retry
                </button>
              )}
              {allowCopy && (
                <button
                  type="button"
                  onClick={handleCopyError}
                  className="text-sm text-error-700 dark:text-error-300 hover:text-error-800 dark:hover:text-error-200 font-medium"
                  title="Copy error details"
                >
                  Copy Error
                </button>
              )}
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-sm text-error-700 dark:text-error-300 hover:text-error-800 dark:hover:text-error-200 font-medium"
                >
                  Clear
                </button>
              )}
            </Alert.Actions>
          )}
        </Alert>

        {/* Error Analysis and Troubleshooting */}
        {showTroubleshooting && errorAnalysis && (
          <ExpandableSection
            title="Troubleshooting Guide"
            icon={WrenchScrewdriverIcon}
            defaultExpanded={!compact}
          >
            <div className="space-y-4">
              {/* Error Category and Description */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                    {errorAnalysis.category.replace(/_/g, ' ')}
                  </span>
                  <span className={cn(
                    'text-xs font-medium',
                    errorAnalysis.severity === 'critical' && 'text-red-600 dark:text-red-400',
                    errorAnalysis.severity === 'high' && 'text-orange-600 dark:text-orange-400',
                    errorAnalysis.severity === 'medium' && 'text-yellow-600 dark:text-yellow-400',
                    errorAnalysis.severity === 'low' && 'text-blue-600 dark:text-blue-400'
                  )}>
                    {errorAnalysis.severity.toUpperCase()} SEVERITY
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {errorAnalysis.description}
                </p>
              </div>

              {/* Solutions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Recommended Solutions:
                </h4>
                <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {errorAnalysis.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{solution}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Connection Checklist */}
              {databaseType && DATABASE_ERROR_CONFIGS[databaseType] && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Connection Checklist:
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {DATABASE_ERROR_CONFIGS[databaseType].connectionChecklist.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Documentation Link */}
              {errorAnalysis.documentation && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={errorAnalysis.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    View Official Documentation
                  </a>
                </div>
              )}
            </div>
          </ExpandableSection>
        )}

        {/* Performance Information (even for failed connections) */}
        {showTiming && result?.testDuration !== undefined && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-900 dark:text-red-100">Test Duration</span>
            </div>
            <div className="text-sm">
              <span className="text-red-700 dark:text-red-300">Failed after:</span>
              <span className="ml-2 font-mono">{formatDuration(result.testDuration)}</span>
            </div>
          </div>
        )}

        {/* Error Details */}
        {showDetails && result?.details && (
          <ExpandableSection
            title="Error Details"
            icon={ExclamationCircleIcon}
            defaultExpanded={false}
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                {result.details}
              </pre>
            </div>
          </ExpandableSection>
        )}
      </div>
    );
  }
);

TestResultDisplay.displayName = 'TestResultDisplay';

// =============================================================================
// EXPORTS
// =============================================================================

export default TestResultDisplay;

export type {
  TestResultDisplayProps,
  DatabaseErrorConfig,
  ExpandableSectionProps,
};

export {
  DATABASE_ERROR_CONFIGS,
  analyzeError,
  formatDuration,
  getPerformanceAssessment,
  formatMetadata,
};