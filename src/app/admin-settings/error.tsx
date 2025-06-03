'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ChevronLeft, 
  Shield, 
  Server, 
  Activity,
  Bell,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react'

interface AdminErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Administrative Error Boundary Component for DreamFactory Admin Interface
 * 
 * Specialized error boundary for administrative operations handling system-level errors,
 * permission issues, audit failures, and administrative workflow errors. Provides
 * comprehensive error recovery options with admin-specific error messaging, logging
 * capabilities, and escalation workflows.
 * 
 * Key Features:
 * - React 19 error boundary capabilities with admin-specific error handling
 * - Comprehensive error classification and contextual recovery options
 * - Audit trail integration for compliance tracking and security monitoring
 * - System administrator error escalation workflows with automated notifications
 * - Administrative error recovery workflows including system health assessment
 * - Integration with monitoring and alerting systems for critical error notification
 * - Enhanced logging with admin context and system impact assessment
 * - Maintenance mode activation and system restart options
 * - WCAG 2.1 AA compliant interface with enterprise security considerations
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @requires React 19+ Error Boundaries
 * @requires Next.js 15.1+ App Router
 */

// Administrative error types for specialized handling
enum AdminErrorType {
  SYSTEM_FAILURE = 'SYSTEM_FAILURE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  AUDIT_FAILURE = 'AUDIT_FAILURE',
  CONFIG_ERROR = 'CONFIG_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED',
  UNKNOWN_ADMIN_ERROR = 'UNKNOWN_ADMIN_ERROR'
}

// Error severity levels for administrative context
enum AdminErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY'
}

// Administrative recovery actions
enum AdminRecoveryAction {
  RETRY_OPERATION = 'RETRY_OPERATION',
  REFRESH_PERMISSIONS = 'REFRESH_PERMISSIONS',
  CHECK_SYSTEM_STATUS = 'CHECK_SYSTEM_STATUS',
  ACTIVATE_MAINTENANCE = 'ACTIVATE_MAINTENANCE',
  RESTART_SERVICES = 'RESTART_SERVICES',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  ESCALATE_TO_ROOT_ADMIN = 'ESCALATE_TO_ROOT_ADMIN',
  EXPORT_ERROR_REPORT = 'EXPORT_ERROR_REPORT'
}

interface AdminErrorDetails {
  type: AdminErrorType
  severity: AdminErrorSeverity
  title: string
  description: string
  technicalDetails: string
  suggestedActions: AdminRecoveryAction[]
  requiresEscalation: boolean
  systemImpact: string
  complianceImplications: string
  estimatedRecoveryTime: string
}

interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical'
  database: 'connected' | 'degraded' | 'disconnected'
  authentication: 'operational' | 'limited' | 'failed'
  services: 'all_running' | 'some_degraded' | 'critical_failure'
  lastChecked: Date
}

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  const [errorDetails, setErrorDetails] = useState<AdminErrorDetails | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null)
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [auditLogged, setAuditLogged] = useState(false)
  const [escalationSent, setEscalationSent] = useState(false)
  const [errorReportGenerated, setErrorReportGenerated] = useState(false)

  // Classify administrative error and determine handling strategy
  const classifyAdminError = useCallback((error: Error): AdminErrorDetails => {
    const message = error.message.toLowerCase()
    const stack = error.stack || ''

    // System failure patterns
    if (message.includes('system') && (message.includes('failure') || message.includes('crash'))) {
      return {
        type: AdminErrorType.SYSTEM_FAILURE,
        severity: AdminErrorSeverity.CRITICAL,
        title: 'Critical System Failure',
        description: 'A critical system component has failed and requires immediate administrative attention.',
        technicalDetails: `System failure detected: ${error.message}`,
        suggestedActions: [
          AdminRecoveryAction.CHECK_SYSTEM_STATUS,
          AdminRecoveryAction.RESTART_SERVICES,
          AdminRecoveryAction.ACTIVATE_MAINTENANCE,
          AdminRecoveryAction.ESCALATE_TO_ROOT_ADMIN
        ],
        requiresEscalation: true,
        systemImpact: 'High - Core system functionality may be compromised',
        complianceImplications: 'Service availability monitoring required for compliance reporting',
        estimatedRecoveryTime: '15-30 minutes with administrative intervention'
      }
    }

    // Permission and authentication errors
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        type: AdminErrorType.PERMISSION_DENIED,
        severity: AdminErrorSeverity.HIGH,
        title: 'Administrative Permission Error',
        description: 'Access denied due to insufficient administrative privileges or expired session.',
        technicalDetails: `Permission error: ${error.message}`,
        suggestedActions: [
          AdminRecoveryAction.REFRESH_PERMISSIONS,
          AdminRecoveryAction.CHECK_SYSTEM_STATUS,
          AdminRecoveryAction.CONTACT_SUPPORT
        ],
        requiresEscalation: false,
        systemImpact: 'Medium - Administrative operations may be limited',
        complianceImplications: 'Access control violations must be logged for security audit',
        estimatedRecoveryTime: '5-10 minutes with permission refresh'
      }
    }

    // Audit system failures
    if (message.includes('audit') || message.includes('logging') || message.includes('compliance')) {
      return {
        type: AdminErrorType.AUDIT_FAILURE,
        severity: AdminErrorSeverity.HIGH,
        title: 'Audit System Failure',
        description: 'Critical failure in audit logging system affecting compliance and security monitoring.',
        technicalDetails: `Audit failure: ${error.message}`,
        suggestedActions: [
          AdminRecoveryAction.CHECK_SYSTEM_STATUS,
          AdminRecoveryAction.ESCALATE_TO_ROOT_ADMIN,
          AdminRecoveryAction.EXPORT_ERROR_REPORT
        ],
        requiresEscalation: true,
        systemImpact: 'High - Compliance monitoring compromised',
        complianceImplications: 'CRITICAL - Audit trail interruption must be documented for regulatory compliance',
        estimatedRecoveryTime: '30-60 minutes with system administrator intervention'
      }
    }

    // Database connection errors
    if (message.includes('database') || message.includes('connection') || message.includes('sql')) {
      return {
        type: AdminErrorType.DATABASE_ERROR,
        severity: AdminErrorSeverity.CRITICAL,
        title: 'Database Connection Failure',
        description: 'Critical database connectivity issue affecting core administrative operations.',
        technicalDetails: `Database error: ${error.message}`,
        suggestedActions: [
          AdminRecoveryAction.CHECK_SYSTEM_STATUS,
          AdminRecoveryAction.RESTART_SERVICES,
          AdminRecoveryAction.ESCALATE_TO_ROOT_ADMIN
        ],
        requiresEscalation: true,
        systemImpact: 'Critical - All database operations affected',
        complianceImplications: 'Data access interruption requires incident documentation',
        estimatedRecoveryTime: '10-45 minutes depending on database recovery'
      }
    }

    // Configuration errors
    if (message.includes('config') || message.includes('settings') || message.includes('environment')) {
      return {
        type: AdminErrorType.CONFIG_ERROR,
        severity: AdminErrorSeverity.MEDIUM,
        title: 'Configuration Error',
        description: 'System configuration error affecting administrative functionality.',
        technicalDetails: `Configuration error: ${error.message}`,
        suggestedActions: [
          AdminRecoveryAction.CHECK_SYSTEM_STATUS,
          AdminRecoveryAction.CONTACT_SUPPORT,
          AdminRecoveryAction.EXPORT_ERROR_REPORT
        ],
        requiresEscalation: false,
        systemImpact: 'Medium - Specific administrative features may be unavailable',
        complianceImplications: 'Configuration changes must be logged for audit trail',
        estimatedRecoveryTime: '5-15 minutes with configuration correction'
      }
    }

    // Security violations
    if (message.includes('security') || message.includes('violation') || message.includes('breach')) {
      return {
        type: AdminErrorType.SECURITY_VIOLATION,
        severity: AdminErrorSeverity.EMERGENCY,
        title: 'Security Violation Detected',
        description: 'Potential security violation detected requiring immediate administrative review.',
        technicalDetails: `Security issue: ${error.message}`,
        suggestedActions: [
          AdminRecoveryAction.CHECK_SYSTEM_STATUS,
          AdminRecoveryAction.ESCALATE_TO_ROOT_ADMIN,
          AdminRecoveryAction.EXPORT_ERROR_REPORT,
          AdminRecoveryAction.ACTIVATE_MAINTENANCE
        ],
        requiresEscalation: true,
        systemImpact: 'Critical - Security posture may be compromised',
        complianceImplications: 'EMERGENCY - Security incident reporting required immediately',
        estimatedRecoveryTime: 'Immediate escalation required - recovery time TBD'
      }
    }

    // Default administrative error handling
    return {
      type: AdminErrorType.UNKNOWN_ADMIN_ERROR,
      severity: AdminErrorSeverity.MEDIUM,
      title: 'Administrative Error',
      description: 'An unexpected error occurred in the administrative interface.',
      technicalDetails: `Error details: ${error.message}`,
      suggestedActions: [
        AdminRecoveryAction.RETRY_OPERATION,
        AdminRecoveryAction.CHECK_SYSTEM_STATUS,
        AdminRecoveryAction.CONTACT_SUPPORT
      ],
      requiresEscalation: false,
      systemImpact: 'Low to Medium - Specific administrative operations may be affected',
      complianceImplications: 'Standard error logging for operational monitoring',
      estimatedRecoveryTime: '2-10 minutes with retry or support assistance'
    }
  }, [])

  // System health check functionality
  const checkSystemHealth = useCallback(async (): Promise<SystemHealthStatus> => {
    setIsCheckingHealth(true)
    
    try {
      // Simulate system health check - in production this would call actual health endpoints
      const healthCheckResults = await Promise.allSettled([
        // Database connectivity check
        fetch('/api/v2/system/health/database', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => res.ok),
        
        // Authentication service check
        fetch('/api/v2/system/health/auth', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => res.ok),
        
        // Core services check
        fetch('/api/v2/system/health/services', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => res.ok)
      ])

      const [dbCheck, authCheck, servicesCheck] = healthCheckResults

      const health: SystemHealthStatus = {
        database: dbCheck.status === 'fulfilled' && dbCheck.value ? 'connected' : 'disconnected',
        authentication: authCheck.status === 'fulfilled' && authCheck.value ? 'operational' : 'failed',
        services: servicesCheck.status === 'fulfilled' && servicesCheck.value ? 'all_running' : 'critical_failure',
        overall: 'healthy',
        lastChecked: new Date()
      }

      // Determine overall health status
      const failures = [health.database, health.authentication, health.services].filter(
        status => status.includes('failed') || status.includes('disconnected') || status.includes('critical')
      ).length

      if (failures === 0) {
        health.overall = 'healthy'
      } else if (failures <= 1) {
        health.overall = 'degraded'
      } else {
        health.overall = 'critical'
      }

      setSystemHealth(health)
      return health
    } catch (healthError) {
      console.error('System health check failed:', healthError)
      const criticalHealth: SystemHealthStatus = {
        database: 'disconnected',
        authentication: 'failed',
        services: 'critical_failure',
        overall: 'critical',
        lastChecked: new Date()
      }
      setSystemHealth(criticalHealth)
      return criticalHealth
    } finally {
      setIsCheckingHealth(false)
    }
  }, [])

  // Audit logging functionality
  const logAuditEvent = useCallback(async (errorDetails: AdminErrorDetails) => {
    try {
      const auditEntry = {
        eventType: 'ADMIN_ERROR',
        severity: errorDetails.severity,
        errorType: errorDetails.type,
        message: errorDetails.title,
        technicalDetails: errorDetails.technicalDetails,
        systemImpact: errorDetails.systemImpact,
        complianceImplications: errorDetails.complianceImplications,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorDigest: error.digest,
        sessionContext: {
          // This would be populated from actual session data
          userId: null,
          sessionId: null,
          isAdmin: true,
          ipAddress: null
        }
      }

      // Attempt to log to audit system
      await fetch('/api/v2/system/audit/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditEntry)
      })

      setAuditLogged(true)
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError)
      // Fallback to localStorage for critical audit data if remote logging fails
      try {
        const fallbackAudit = {
          timestamp: new Date().toISOString(),
          errorType: errorDetails.type,
          severity: errorDetails.severity,
          message: errorDetails.title,
          requiresEscalation: errorDetails.requiresEscalation
        }
        localStorage.setItem('admin_error_audit_fallback', JSON.stringify(fallbackAudit))
      } catch (storageError) {
        console.error('Fallback audit logging also failed:', storageError)
      }
    }
  }, [error.digest])

  // Error escalation functionality
  const escalateError = useCallback(async (errorDetails: AdminErrorDetails) => {
    try {
      const escalationPayload = {
        errorType: errorDetails.type,
        severity: errorDetails.severity,
        title: errorDetails.title,
        description: errorDetails.description,
        technicalDetails: errorDetails.technicalDetails,
        systemImpact: errorDetails.systemImpact,
        complianceImplications: errorDetails.complianceImplications,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        errorDigest: error.digest,
        systemHealth: systemHealth,
        requiresImmediateAttention: errorDetails.severity === AdminErrorSeverity.EMERGENCY
      }

      // Send escalation notification
      await fetch('/api/v2/system/escalation/admin-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(escalationPayload)
      })

      setEscalationSent(true)
    } catch (escalationError) {
      console.error('Failed to send error escalation:', escalationError)
    }
  }, [error.digest, systemHealth])

  // Error report generation
  const generateErrorReport = useCallback(async (errorDetails: AdminErrorDetails) => {
    try {
      const errorReport = {
        reportId: `admin-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        errorDetails,
        systemHealth,
        browserInfo: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        },
        errorContext: {
          message: error.message,
          stack: error.stack,
          digest: error.digest
        }
      }

      // Generate downloadable report
      const reportBlob = new Blob([JSON.stringify(errorReport, null, 2)], {
        type: 'application/json'
      })
      
      const downloadUrl = URL.createObjectURL(reportBlob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `admin-error-report-${errorReport.reportId}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      setErrorReportGenerated(true)
    } catch (reportError) {
      console.error('Failed to generate error report:', reportError)
    }
  }, [error, systemHealth])

  // Initialize error analysis and logging
  useEffect(() => {
    const details = classifyAdminError(error)
    setErrorDetails(details)

    // Perform initial system health check
    checkSystemHealth()

    // Log audit event
    logAuditEvent(details)

    // Auto-escalate critical errors
    if (details.requiresEscalation) {
      escalateError(details)
    }
  }, [error, classifyAdminError, checkSystemHealth, logAuditEvent, escalateError])

  // Recovery action handlers
  const handleRecoveryAction = useCallback(async (action: AdminRecoveryAction) => {
    switch (action) {
      case AdminRecoveryAction.RETRY_OPERATION:
        reset()
        break
        
      case AdminRecoveryAction.REFRESH_PERMISSIONS:
        // Refresh user permissions and session
        try {
          await fetch('/api/v2/system/auth/refresh', { method: 'POST' })
          reset()
        } catch (refreshError) {
          console.error('Permission refresh failed:', refreshError)
        }
        break
        
      case AdminRecoveryAction.CHECK_SYSTEM_STATUS:
        await checkSystemHealth()
        break
        
      case AdminRecoveryAction.ACTIVATE_MAINTENANCE:
        // Activate maintenance mode
        try {
          await fetch('/api/v2/system/maintenance/activate', { method: 'POST' })
          alert('Maintenance mode activated. Please check system status.')
        } catch (maintenanceError) {
          console.error('Failed to activate maintenance mode:', maintenanceError)
        }
        break
        
      case AdminRecoveryAction.RESTART_SERVICES:
        // Restart system services
        try {
          await fetch('/api/v2/system/services/restart', { method: 'POST' })
          alert('Service restart initiated. Please wait and check system status.')
          setTimeout(() => checkSystemHealth(), 30000) // Check health after 30 seconds
        } catch (restartError) {
          console.error('Failed to restart services:', restartError)
        }
        break
        
      case AdminRecoveryAction.ESCALATE_TO_ROOT_ADMIN:
        if (errorDetails) {
          await escalateError(errorDetails)
        }
        break
        
      case AdminRecoveryAction.EXPORT_ERROR_REPORT:
        if (errorDetails) {
          await generateErrorReport(errorDetails)
        }
        break
        
      case AdminRecoveryAction.CONTACT_SUPPORT:
        window.open('/admin-settings/support', '_blank')
        break
        
      default:
        console.warn('Unknown recovery action:', action)
    }
  }, [reset, checkSystemHealth, escalateError, generateErrorReport, errorDetails])

  // Handle standard navigation actions
  const handleGoHome = () => window.location.href = '/'
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/admin-settings'
    }
  }

  // Determine severity-based styling
  const getSeverityStyles = (severity: AdminErrorSeverity) => {
    switch (severity) {
      case AdminErrorSeverity.EMERGENCY:
        return {
          iconBg: 'bg-red-600 dark:bg-red-700',
          iconColor: 'text-white',
          titleColor: 'text-red-900 dark:text-red-100',
          borderColor: 'border-red-300 dark:border-red-600'
        }
      case AdminErrorSeverity.CRITICAL:
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-red-900 dark:text-red-100',
          borderColor: 'border-red-200 dark:border-red-700'
        }
      case AdminErrorSeverity.HIGH:
        return {
          iconBg: 'bg-orange-100 dark:bg-orange-900/20',
          iconColor: 'text-orange-600 dark:text-orange-400',
          titleColor: 'text-orange-900 dark:text-orange-100',
          borderColor: 'border-orange-200 dark:border-orange-700'
        }
      case AdminErrorSeverity.MEDIUM:
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          titleColor: 'text-yellow-900 dark:text-yellow-100',
          borderColor: 'border-yellow-200 dark:border-yellow-700'
        }
      default:
        return {
          iconBg: 'bg-gray-100 dark:bg-gray-800',
          iconColor: 'text-gray-600 dark:text-gray-400',
          titleColor: 'text-gray-900 dark:text-gray-100',
          borderColor: 'border-gray-200 dark:border-gray-700'
        }
    }
  }

  const severityStyles = errorDetails ? getSeverityStyles(errorDetails.severity) : getSeverityStyles(AdminErrorSeverity.MEDIUM)

  if (!errorDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Analyzing administrative error...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className={`mx-auto w-20 h-20 ${severityStyles.iconBg} rounded-full flex items-center justify-center mb-6`}>
            <Shield className={`w-10 h-10 ${severityStyles.iconColor}`} aria-hidden="true" />
          </div>
          <h1 className={`text-4xl font-bold ${severityStyles.titleColor} mb-3`}>
            {errorDetails.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            {errorDetails.description}
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${severityStyles.iconBg} ${severityStyles.iconColor}`}>
              <AlertCircle className="w-3 h-3 mr-1" />
              {errorDetails.severity} SEVERITY
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Error ID: {error.digest || 'N/A'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Error Details */}
          <div className="lg:col-span-2">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${severityStyles.borderColor} p-6 mb-6`}>
              <div className="space-y-6">
                {/* Error Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Error Details
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Technical Details</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{errorDetails.technicalDetails}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">System Impact</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{errorDetails.systemImpact}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Recovery Time</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{errorDetails.estimatedRecoveryTime}</p>
                    </div>
                  </div>
                </div>

                {/* Compliance Information */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compliance Implications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{errorDetails.complianceImplications}</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs">
                    <span className={`flex items-center ${auditLogged ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {auditLogged ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      Audit {auditLogged ? 'Logged' : 'Pending'}
                    </span>
                    {errorDetails.requiresEscalation && (
                      <span className={`flex items-center ${escalationSent ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {escalationSent ? <CheckCircle className="w-3 h-3 mr-1" /> : <Bell className="w-3 h-3 mr-1" />}
                        Escalation {escalationSent ? 'Sent' : 'Required'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Development Mode Details */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                      Development Mode Error Details
                    </summary>
                    <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-auto">
                      <div className="space-y-2">
                        <div><strong>Message:</strong> {error.message}</div>
                        {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
                        {error.stack && (
                          <div>
                            <strong>Stack:</strong>
                            <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Administrative Recovery Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {errorDetails.suggestedActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => handleRecoveryAction(action)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
                  >
                    {action === AdminRecoveryAction.RETRY_OPERATION && <RefreshCw className="w-4 h-4 mr-2" />}
                    {action === AdminRecoveryAction.CHECK_SYSTEM_STATUS && <Activity className="w-4 h-4 mr-2" />}
                    {action === AdminRecoveryAction.RESTART_SERVICES && <Server className="w-4 h-4 mr-2" />}
                    {action === AdminRecoveryAction.ESCALATE_TO_ROOT_ADMIN && <Bell className="w-4 h-4 mr-2" />}
                    {action === AdminRecoveryAction.EXPORT_ERROR_REPORT && <Download className="w-4 h-4 mr-2" />}
                    {action === AdminRecoveryAction.CONTACT_SUPPORT && <ExternalLink className="w-4 h-4 mr-2" />}
                    {action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* System Health Sidebar */}
          <div className="space-y-6">
            {/* System Health Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  System Health
                </h2>
                <button
                  onClick={checkSystemHealth}
                  disabled={isCheckingHealth}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50"
                >
                  {isCheckingHealth ? 'Checking...' : 'Refresh'}
                </button>
              </div>

              {systemHealth && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overall Status</span>
                    <span className={`text-sm font-medium ${
                      systemHealth.overall === 'healthy' ? 'text-green-600 dark:text-green-400' :
                      systemHealth.overall === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {systemHealth.overall.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                    <span className={`text-sm font-medium ${
                      systemHealth.database === 'connected' ? 'text-green-600 dark:text-green-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {systemHealth.database.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Authentication</span>
                    <span className={`text-sm font-medium ${
                      systemHealth.authentication === 'operational' ? 'text-green-600 dark:text-green-400' :
                      systemHealth.authentication === 'limited' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {systemHealth.authentication.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Services</span>
                    <span className={`text-sm font-medium ${
                      systemHealth.services === 'all_running' ? 'text-green-600 dark:text-green-400' :
                      systemHealth.services === 'some_degraded' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {systemHealth.services.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                    Last checked: {systemHealth.lastChecked.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleRecoveryAction(AdminRecoveryAction.EXPORT_ERROR_REPORT)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Error Report
                </button>
                <button
                  onClick={handleGoBack}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard Home
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Administrative Error Boundary - DreamFactory Admin Interface
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Error Time: {new Date().toLocaleString()} | 
            Session: Admin | 
            {errorReportGenerated && ' Error Report Generated | '}
            {auditLogged && ' Audit Logged | '}
            {escalationSent && ' Escalation Sent'}
          </p>
          {errorDetails.requiresEscalation && !escalationSent && (
            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                This error requires immediate escalation to system administrators.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}