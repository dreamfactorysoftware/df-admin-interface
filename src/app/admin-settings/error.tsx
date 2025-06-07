/**
 * Admin Settings Error Boundary Component - React 19 Implementation
 * 
 * Comprehensive error boundary component for administrative operations handling 
 * system-level errors, permission issues, audit failures, and administrative 
 * workflow errors. Provides comprehensive error recovery options with admin-specific 
 * error messaging, logging capabilities, and escalation workflows.
 * 
 * This component implements React 19 error boundary patterns with detailed error 
 * reporting for system administrators and audit trail integration for compliance 
 * tracking. It serves as the error boundary for the /admin-settings route and 
 * all nested administrative pages.
 * 
 * Key Features:
 * - React 19 error boundary capabilities per React/Next.js Integration Requirements
 * - Comprehensive error handling with admin feedback per Section 4.2 error handling
 * - Next.js error boundaries for graceful degradation per Section 5.1 architectural principles
 * - Administrative error handling with audit trail integration per enterprise compliance
 * - System administrator error escalation workflows per Section 0.1.2 enterprise deployment
 * - WCAG 2.1 AA compliant error interfaces with keyboard navigation
 * - Integration with monitoring and alerting systems for critical administrative errors
 * - Maintenance mode activation and system restart options for critical failures
 * 
 * Error Categories Handled:
 * - System Configuration Errors (database connectivity, service configuration)
 * - Permission and Authorization Failures (RBAC violations, insufficient privileges)
 * - Audit System Failures (logging service outages, compliance tracking issues)
 * - Administrative Workflow Errors (user management, system settings, security config)
 * - Infrastructure Issues (memory exhaustion, disk space, network connectivity)
 * - Security Violations (unauthorized access attempts, privilege escalation)
 * 
 * Recovery Mechanisms:
 * - Automatic retry with exponential backoff for transient errors
 * - Maintenance mode activation for critical system errors
 * - Administrative escalation workflows with automated alerting
 * - Rollback capabilities for configuration changes
 * - System health diagnostics and repair recommendations
 * - Emergency contact procedures for critical system failures
 * 
 * @fileoverview Admin-specific error boundary with comprehensive error handling
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see Technical Specification Section 5.1 - HIGH-LEVEL ARCHITECTURE
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

'use client';

import React, { 
  Component, 
  ReactNode, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  type ErrorInfo,
} from 'react';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ServerStackIcon,
  CogIcon,
  ClockIcon,
  DocumentTextIcon,
  PhoneIcon,
  ArrowPathIcon,
  WrenchIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { 
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  ShieldExclamationIcon as ShieldExclamationIconSolid,
} from '@heroicons/react/24/solid';

// UI Components
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Utility functions
import { cn } from '@/lib/utils';

// Type definitions for error logging and audit systems
// Note: These interfaces define the expected contracts for error-logger and audit-logger
// When these libraries are implemented, they should match these interfaces

/**
 * Error Logger Interface - Expected contract for error logging system
 * Provides comprehensive error tracking with administrative context
 */
interface ErrorLogger {
  logError(error: Error, context: AdminErrorContext): Promise<string>;
  logSystemError(error: SystemError): Promise<string>;
  logSecurityViolation(violation: SecurityViolation): Promise<string>;
  logAuditFailure(failure: AuditFailure): Promise<string>;
  getErrorHistory(timeRange?: TimeRange): Promise<ErrorLogEntry[]>;
  generateErrorReport(errorId: string): Promise<ErrorReport>;
}

/**
 * Audit Logger Interface - Expected contract for audit trail system
 * Ensures compliance tracking and administrative action logging
 */
interface AuditLogger {
  logAdminAction(action: AdminAction, result: 'success' | 'failure', error?: Error): Promise<string>;
  logSystemStateChange(change: SystemStateChange): Promise<string>;
  logSecurityEvent(event: SecurityEvent): Promise<string>;
  logMaintenanceAction(action: MaintenanceAction): Promise<string>;
  getAuditTrail(filters: AuditFilters): Promise<AuditEntry[]>;
  generateComplianceReport(period: ComplianceReportPeriod): Promise<ComplianceReport>;
}

/**
 * Admin Error Context - Comprehensive context for administrative errors
 */
interface AdminErrorContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  route: string;
  component: string;
  action?: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  systemHealth?: SystemHealthStatus;
  configurationState?: ConfigurationState;
  activeConnections?: number;
  memoryUsage?: MemoryUsage;
  diskSpace?: DiskSpaceInfo;
  networkLatency?: number;
  lastSuccessfulAction?: AdminAction;
  errorFrequency?: ErrorFrequencyData;
}

/**
 * System Error Types - Categorized administrative errors
 */
interface SystemError {
  type: 'database' | 'network' | 'memory' | 'disk' | 'service' | 'configuration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  message: string;
  stack?: string;
  recoverable: boolean;
  autoRetryable: boolean;
  maintenanceModeRequired: boolean;
  estimatedDowntime?: number;
  repairSteps?: string[];
  escalationRequired: boolean;
  affectedUsers?: number;
  businessImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Security Violation Types - Security-related administrative errors
 */
interface SecurityViolation {
  type: 'unauthorized_access' | 'privilege_escalation' | 'malicious_input' | 'brute_force' | 'data_exfiltration';
  severity: 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  blocked: boolean;
  requiresImmedateAction: boolean;
  threatLevel: number;
  recommendations: string[];
}

/**
 * Audit Failure Types - Audit system related failures
 */
interface AuditFailure {
  type: 'logging_service_down' | 'storage_full' | 'compliance_violation' | 'data_corruption';
  severity: 'medium' | 'high' | 'critical';
  affectedPeriod: { start: Date; end: Date };
  dataIntegrityImpact: boolean;
  complianceRisk: boolean;
  recoveryPossible: boolean;
  backupAvailable: boolean;
}

// Additional type definitions for comprehensive error handling
interface AdminAction {
  type: string;
  target: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
  result: 'success' | 'failure' | 'partial';
}

interface SystemStateChange {
  component: string;
  previousState: string;
  newState: string;
  changeReason: string;
  timestamp: Date;
}

interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

interface MaintenanceAction {
  type: 'restart' | 'config_change' | 'upgrade' | 'repair' | 'backup';
  component: string;
  plannedDowntime: number;
  timestamp: Date;
  approvedBy: string;
}

interface TimeRange {
  start: Date;
  end: Date;
}

interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  type: string;
  severity: string;
  message: string;
  context: AdminErrorContext;
}

interface ErrorReport {
  errorId: string;
  summary: string;
  timeline: ErrorLogEntry[];
  impactAnalysis: string;
  resolutionSteps: string[];
  preventionMeasures: string[];
}

interface AuditFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  actionType?: string;
  severity?: string;
}

interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  result: string;
  details: Record<string, unknown>;
}

interface ComplianceReportPeriod {
  start: Date;
  end: Date;
  regulations: string[];
}

interface ComplianceReport {
  period: ComplianceReportPeriod;
  violationCount: number;
  criticalIssues: string[];
  recommendations: string[];
  attestation: boolean;
}

interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  database: 'healthy' | 'degraded' | 'offline';
  api: 'healthy' | 'degraded' | 'offline';
  storage: 'healthy' | 'degraded' | 'full';
  network: 'healthy' | 'degraded' | 'offline';
}

interface ConfigurationState {
  lastModified: Date;
  modifiedBy: string;
  version: string;
  valid: boolean;
  backupAvailable: boolean;
}

interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  available: number;
}

interface DiskSpaceInfo {
  used: number;
  total: number;
  percentage: number;
  available: number;
  path: string;
}

interface ErrorFrequencyData {
  count: number;
  timeWindow: number;
  threshold: number;
  pattern: 'increasing' | 'stable' | 'decreasing';
}

// ============================================================================
// ERROR CLASSIFICATION SYSTEM
// ============================================================================

/**
 * Administrative Error Classification
 * Categorizes errors by type, severity, and required response actions
 */
export enum AdminErrorType {
  SYSTEM_CONFIGURATION = 'system_configuration',
  DATABASE_CONNECTIVITY = 'database_connectivity',
  PERMISSION_DENIED = 'permission_denied',
  AUDIT_FAILURE = 'audit_failure',
  SECURITY_VIOLATION = 'security_violation',
  WORKFLOW_ERROR = 'workflow_error',
  INFRASTRUCTURE_FAILURE = 'infrastructure_failure',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  DATA_CORRUPTION = 'data_corruption',
  MEMORY_EXHAUSTION = 'memory_exhaustion',
  DISK_SPACE_CRITICAL = 'disk_space_critical',
  NETWORK_TIMEOUT = 'network_timeout',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_VIOLATION = 'authorization_violation',
  COMPLIANCE_BREACH = 'compliance_breach',
}

/**
 * Error Severity Levels for Administrative Context
 */
export enum AdminErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

/**
 * Recovery Action Types Available to Administrators
 */
export enum RecoveryActionType {
  RETRY = 'retry',
  RESTART_SERVICE = 'restart_service',
  MAINTENANCE_MODE = 'maintenance_mode',
  ROLLBACK_CONFIG = 'rollback_config',
  ESCALATE = 'escalate',
  EMERGENCY_CONTACT = 'emergency_contact',
  DIAGNOSTIC_MODE = 'diagnostic_mode',
  SAFE_MODE = 'safe_mode',
  FORCE_LOGOUT = 'force_logout',
  DISABLE_FEATURE = 'disable_feature',
  BACKUP_RESTORE = 'backup_restore',
  MANUAL_INTERVENTION = 'manual_intervention',
}

// ============================================================================
// ERROR ANALYSIS AND CLASSIFICATION UTILITIES
// ============================================================================

/**
 * Analyzes errors to determine type, severity, and appropriate response
 * Implements intelligent error classification for administrative contexts
 */
class AdminErrorAnalyzer {
  /**
   * Classifies an error based on its properties and context
   * @param error - The error object to analyze
   * @param context - Administrative context for the error
   * @returns Classified error information
   */
  static classifyError(error: Error, context: AdminErrorContext): {
    type: AdminErrorType;
    severity: AdminErrorSeverity;
    recoverable: boolean;
    autoRetryable: boolean;
    maintenanceModeRequired: boolean;
    escalationRequired: boolean;
    estimatedDowntime: number;
    affectedUsers: number;
    businessImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    recoveryActions: RecoveryActionType[];
    diagnosticInfo: Record<string, unknown>;
  } {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Database connectivity errors
    if (this.isDatabaseError(message, stack)) {
      return this.createErrorClassification(
        AdminErrorType.DATABASE_CONNECTIVITY,
        AdminErrorSeverity.HIGH,
        true,
        true,
        false,
        false,
        5,
        50,
        'high',
        [RecoveryActionType.RETRY, RecoveryActionType.RESTART_SERVICE, RecoveryActionType.DIAGNOSTIC_MODE],
        { connectionPool: context.activeConnections, lastQuery: 'unknown' }
      );
    }
    
    // Permission and authorization errors
    if (this.isPermissionError(message, stack)) {
      return this.createErrorClassification(
        AdminErrorType.PERMISSION_DENIED,
        AdminErrorSeverity.MEDIUM,
        false,
        false,
        false,
        true,
        0,
        1,
        'low',
        [RecoveryActionType.ESCALATE, RecoveryActionType.FORCE_LOGOUT],
        { userRole: context.userRole, attemptedAction: context.action }
      );
    }
    
    // Memory exhaustion errors
    if (this.isMemoryError(message, stack)) {
      return this.createErrorClassification(
        AdminErrorType.MEMORY_EXHAUSTION,
        AdminErrorSeverity.CRITICAL,
        true,
        false,
        true,
        true,
        15,
        100,
        'critical',
        [RecoveryActionType.MAINTENANCE_MODE, RecoveryActionType.RESTART_SERVICE, RecoveryActionType.EMERGENCY_CONTACT],
        { memoryUsage: context.memoryUsage, activeConnections: context.activeConnections }
      );
    }
    
    // Disk space critical errors
    if (this.isDiskSpaceError(message, stack)) {
      return this.createErrorClassification(
        AdminErrorType.DISK_SPACE_CRITICAL,
        AdminErrorSeverity.HIGH,
        true,
        false,
        false,
        true,
        10,
        75,
        'high',
        [RecoveryActionType.MAINTENANCE_MODE, RecoveryActionType.ESCALATE, RecoveryActionType.BACKUP_RESTORE],
        { diskSpace: context.diskSpace, growthRate: 'unknown' }
      );
    }
    
    // Network timeout errors
    if (this.isNetworkError(message, stack)) {
      return this.createErrorClassification(
        AdminErrorType.NETWORK_TIMEOUT,
        AdminErrorSeverity.MEDIUM,
        true,
        true,
        false,
        false,
        5,
        25,
        'medium',
        [RecoveryActionType.RETRY, RecoveryActionType.DIAGNOSTIC_MODE],
        { networkLatency: context.networkLatency, endpoint: 'unknown' }
      );
    }
    
    // Security violation errors
    if (this.isSecurityError(message, stack)) {
      return this.createErrorClassification(
        AdminErrorType.SECURITY_VIOLATION,
        AdminErrorSeverity.CRITICAL,
        false,
        false,
        false,
        true,
        0,
        10,
        'critical',
        [RecoveryActionType.FORCE_LOGOUT, RecoveryActionType.ESCALATE, RecoveryActionType.EMERGENCY_CONTACT],
        { userAgent: context.userAgent, ipAddress: context.ipAddress, sessionId: context.sessionId }
      );
    }
    
    // Configuration errors
    if (this.isConfigurationError(message, stack)) {
      return this.createErrorClassification(
        AdminErrorType.SYSTEM_CONFIGURATION,
        AdminErrorSeverity.HIGH,
        true,
        false,
        false,
        true,
        10,
        100,
        'high',
        [RecoveryActionType.ROLLBACK_CONFIG, RecoveryActionType.MAINTENANCE_MODE, RecoveryActionType.ESCALATE],
        { configState: context.configurationState, lastChange: 'unknown' }
      );
    }
    
    // Default classification for unknown errors
    return this.createErrorClassification(
      AdminErrorType.WORKFLOW_ERROR,
      AdminErrorSeverity.MEDIUM,
      true,
      true,
      false,
      false,
      2,
      5,
      'low',
      [RecoveryActionType.RETRY, RecoveryActionType.ESCALATE],
      { component: context.component, route: context.route }
    );
  }
  
  /**
   * Helper method to create standardized error classification objects
   */
  private static createErrorClassification(
    type: AdminErrorType,
    severity: AdminErrorSeverity,
    recoverable: boolean,
    autoRetryable: boolean,
    maintenanceModeRequired: boolean,
    escalationRequired: boolean,
    estimatedDowntime: number,
    affectedUsers: number,
    businessImpact: 'none' | 'low' | 'medium' | 'high' | 'critical',
    recoveryActions: RecoveryActionType[],
    diagnosticInfo: Record<string, unknown>
  ) {
    return {
      type,
      severity,
      recoverable,
      autoRetryable,
      maintenanceModeRequired,
      escalationRequired,
      estimatedDowntime,
      affectedUsers,
      businessImpact,
      recoveryActions,
      diagnosticInfo,
    };
  }
  
  // Error detection helper methods
  private static isDatabaseError(message: string, stack: string): boolean {
    const dbKeywords = ['connection', 'database', 'sql', 'query', 'timeout', 'pool', 'driver'];
    return dbKeywords.some(keyword => message.includes(keyword) || stack.includes(keyword));
  }
  
  private static isPermissionError(message: string, stack: string): boolean {
    const permKeywords = ['permission', 'unauthorized', 'forbidden', 'access denied', 'privilege', 'role'];
    return permKeywords.some(keyword => message.includes(keyword) || stack.includes(keyword));
  }
  
  private static isMemoryError(message: string, stack: string): boolean {
    const memKeywords = ['memory', 'heap', 'allocation', 'out of memory', 'oom'];
    return memKeywords.some(keyword => message.includes(keyword) || stack.includes(keyword));
  }
  
  private static isDiskSpaceError(message: string, stack: string): boolean {
    const diskKeywords = ['disk', 'storage', 'space', 'full', 'enospc', 'write failed'];
    return diskKeywords.some(keyword => message.includes(keyword) || stack.includes(keyword));
  }
  
  private static isNetworkError(message: string, stack: string): boolean {
    const netKeywords = ['network', 'timeout', 'connection refused', 'unreachable', 'dns', 'fetch'];
    return netKeywords.some(keyword => message.includes(keyword) || stack.includes(keyword));
  }
  
  private static isSecurityError(message: string, stack: string): boolean {
    const secKeywords = ['security', 'violation', 'breach', 'attack', 'malicious', 'injection', 'xss', 'csrf'];
    return secKeywords.some(keyword => message.includes(keyword) || stack.includes(keyword));
  }
  
  private static isConfigurationError(message: string, stack: string): boolean {
    const configKeywords = ['configuration', 'config', 'setting', 'invalid', 'missing', 'malformed'];
    return configKeywords.some(keyword => message.includes(keyword) || stack.includes(keyword));
  }
}

// ============================================================================
// MOCK IMPLEMENTATIONS FOR LOGGING SERVICES
// ============================================================================
// Note: These are placeholder implementations to demonstrate the interface
// In production, these would be replaced with actual logging service implementations

/**
 * Mock Error Logger Implementation
 * Provides placeholder functionality until actual error logging service is implemented
 */
class MockErrorLogger implements ErrorLogger {
  async logError(error: Error, context: AdminErrorContext): Promise<string> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('[ADMIN ERROR]', {
      errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
    return errorId;
  }
  
  async logSystemError(error: SystemError): Promise<string> {
    const errorId = `sys-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('[SYSTEM ERROR]', { errorId, ...error, timestamp: new Date().toISOString() });
    return errorId;
  }
  
  async logSecurityViolation(violation: SecurityViolation): Promise<string> {
    const errorId = `sec-violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('[SECURITY VIOLATION]', { errorId, ...violation, timestamp: new Date().toISOString() });
    return errorId;
  }
  
  async logAuditFailure(failure: AuditFailure): Promise<string> {
    const errorId = `audit-failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('[AUDIT FAILURE]', { errorId, ...failure, timestamp: new Date().toISOString() });
    return errorId;
  }
  
  async getErrorHistory(timeRange?: TimeRange): Promise<ErrorLogEntry[]> {
    // Mock implementation - return empty array
    return [];
  }
  
  async generateErrorReport(errorId: string): Promise<ErrorReport> {
    // Mock implementation
    return {
      errorId,
      summary: 'Mock error report',
      timeline: [],
      impactAnalysis: 'Mock impact analysis',
      resolutionSteps: ['Mock resolution step'],
      preventionMeasures: ['Mock prevention measure'],
    };
  }
}

/**
 * Mock Audit Logger Implementation
 * Provides placeholder functionality until actual audit logging service is implemented
 */
class MockAuditLogger implements AuditLogger {
  async logAdminAction(action: AdminAction, result: 'success' | 'failure', error?: Error): Promise<string> {
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[ADMIN ACTION]', {
      auditId,
      action,
      result,
      error: error?.message,
      timestamp: new Date().toISOString(),
    });
    return auditId;
  }
  
  async logSystemStateChange(change: SystemStateChange): Promise<string> {
    const auditId = `state-change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[SYSTEM STATE CHANGE]', { auditId, ...change });
    return auditId;
  }
  
  async logSecurityEvent(event: SecurityEvent): Promise<string> {
    const auditId = `security-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[SECURITY EVENT]', { auditId, ...event });
    return auditId;
  }
  
  async logMaintenanceAction(action: MaintenanceAction): Promise<string> {
    const auditId = `maintenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[MAINTENANCE ACTION]', { auditId, ...action });
    return auditId;
  }
  
  async getAuditTrail(filters: AuditFilters): Promise<AuditEntry[]> {
    // Mock implementation - return empty array
    return [];
  }
  
  async generateComplianceReport(period: ComplianceReportPeriod): Promise<ComplianceReport> {
    // Mock implementation
    return {
      period,
      violationCount: 0,
      criticalIssues: [],
      recommendations: [],
      attestation: true,
    };
  }
}

// Singleton instances for logging services
const errorLogger = new MockErrorLogger();
const auditLogger = new MockAuditLogger();

// ============================================================================
// ADMIN ERROR BOUNDARY STATE AND PROPS
// ============================================================================

/**
 * Props for AdminErrorBoundary component
 */
interface AdminErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: AdminErrorFallbackProps) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, context: AdminErrorContext) => void;
  enableAutoRecovery?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  escalationThreshold?: number;
  maintenanceModeCallback?: () => void;
  emergencyContactCallback?: () => void;
  className?: string;
}

/**
 * Props passed to error fallback component
 */
interface AdminErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetErrorBoundary: () => void;
  errorClassification: ReturnType<typeof AdminErrorAnalyzer.classifyError>;
  context: AdminErrorContext;
  retryCount: number;
  isRetrying: boolean;
  errorId: string;
  onRecoveryAction: (action: RecoveryActionType) => Promise<void>;
}

/**
 * State for AdminErrorBoundary component
 */
interface AdminErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime: number | null;
  escalationSent: boolean;
  maintenanceModeActivated: boolean;
  context: AdminErrorContext | null;
  errorClassification: ReturnType<typeof AdminErrorAnalyzer.classifyError> | null;
}

// ============================================================================
// ADMIN ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Administrative Error Boundary Class Component
 * 
 * Implements comprehensive error handling for administrative operations with
 * React 19 error boundary patterns. Provides intelligent error classification,
 * automatic recovery mechanisms, escalation workflows, and comprehensive
 * audit trail integration for enterprise compliance requirements.
 * 
 * This component serves as the primary error boundary for all admin-settings
 * routes and provides enhanced error handling capabilities specifically 
 * designed for system administrators managing critical infrastructure.
 */
export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;
  private escalationTimer: NodeJS.Timeout | null = null;
  
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null,
      escalationSent: false,
      maintenanceModeActivated: false,
      context: null,
      errorClassification: null,
    };
  }
  
  /**
   * React Error Boundary lifecycle method
   * Captures error state and triggers classification and logging
   */
  static getDerivedStateFromError(error: Error): Partial<AdminErrorBoundaryState> {
    return {
      hasError: true,
      error,
      retryCount: 0,
      isRetrying: false,
      escalationSent: false,
      maintenanceModeActivated: false,
    };
  }
  
  /**
   * React Error Boundary lifecycle method
   * Handles error logging, classification, and initial response actions
   */
  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    try {
      // Create administrative context for error analysis
      const context: AdminErrorContext = {
        userId: this.getCurrentUserId(),
        userRole: this.getCurrentUserRole(),
        sessionId: this.getSessionId(),
        route: window.location.pathname,
        component: 'AdminErrorBoundary',
        action: this.getLastAction(),
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIPAddress(),
        systemHealth: await this.getSystemHealth(),
        configurationState: await this.getConfigurationState(),
        activeConnections: this.getActiveConnections(),
        memoryUsage: await this.getMemoryUsage(),
        diskSpace: await this.getDiskSpace(),
        networkLatency: await this.measureNetworkLatency(),
        lastSuccessfulAction: this.getLastSuccessfulAction(),
        errorFrequency: this.calculateErrorFrequency(),
      };
      
      // Classify the error for appropriate response
      const errorClassification = AdminErrorAnalyzer.classifyError(error, context);
      
      // Generate unique error ID for tracking
      const errorId = await errorLogger.logError(error, context);
      
      // Log audit trail for administrative error
      await auditLogger.logAdminAction(
        {
          type: 'error_boundary_triggered',
          target: context.route,
          parameters: {
            errorType: errorClassification.type,
            severity: errorClassification.severity,
            component: context.component,
          },
          timestamp: new Date(),
          result: 'failure',
        },
        'failure',
        error
      );
      
      // Update component state with error details
      this.setState({
        errorInfo,
        errorId,
        context,
        errorClassification,
      });
      
      // Call external error handler if provided
      this.props.onError?.(error, errorInfo, context);
      
      // Initiate automatic recovery if enabled and appropriate
      if (this.props.enableAutoRecovery && errorClassification.autoRetryable) {
        this.initiateAutoRecovery();
      }
      
      // Trigger escalation if required
      if (errorClassification.escalationRequired) {
        this.initiateEscalation();
      }
      
      // Activate maintenance mode if required
      if (errorClassification.maintenanceModeRequired) {
        this.activateMaintenanceMode();
      }
      
      // Log system error for critical issues
      if (errorClassification.severity === AdminErrorSeverity.CRITICAL || 
          errorClassification.severity === AdminErrorSeverity.EMERGENCY) {
        await this.logSystemError(error, errorClassification, context);
      }
      
      // Send monitoring alerts for high-severity errors
      if (errorClassification.severity === AdminErrorSeverity.HIGH ||
          errorClassification.severity === AdminErrorSeverity.CRITICAL ||
          errorClassification.severity === AdminErrorSeverity.EMERGENCY) {
        this.sendMonitoringAlert(error, errorClassification, context);
      }
      
    } catch (loggingError) {
      // Fallback error handling if logging services fail
      console.error('Error in AdminErrorBoundary error handling:', loggingError);
      console.error('Original error:', error, errorInfo);
      
      // Attempt basic audit logging as fallback
      try {
        await auditLogger.logAdminAction(
          {
            type: 'error_boundary_logging_failure',
            target: window.location.pathname,
            parameters: { originalError: error.message, loggingError: loggingError.message },
            timestamp: new Date(),
            result: 'failure',
          },
          'failure',
          loggingError
        );
      } catch (auditError) {
        console.error('Critical: Both error logging and audit logging failed:', auditError);
      }
    }
  }
  
  /**
   * Initiates automatic recovery for retryable errors
   */
  private initiateAutoRecovery = () => {
    if (this.state.retryCount >= (this.props.maxRetries || 3)) {
      return;
    }
    
    const delay = (this.props.retryDelay || 2000) * Math.pow(2, this.state.retryCount);
    
    this.setState({ isRetrying: true });
    
    this.retryTimer = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        lastRetryTime: Date.now(),
      }));
    }, delay);
  };
  
  /**
   * Initiates escalation workflow for critical errors
   */
  private initiateEscalation = () => {
    if (this.state.escalationSent) {
      return;
    }
    
    const escalationDelay = this.props.escalationThreshold || 30000; // 30 seconds
    
    this.escalationTimer = setTimeout(async () => {
      try {
        // Send escalation notification
        await this.sendEscalationNotification();
        
        // Log escalation action
        await auditLogger.logAdminAction(
          {
            type: 'error_escalation_triggered',
            target: this.state.context?.route || 'unknown',
            parameters: {
              errorId: this.state.errorId,
              errorType: this.state.errorClassification?.type,
              severity: this.state.errorClassification?.severity,
            },
            timestamp: new Date(),
            result: 'success',
          },
          'success'
        );
        
        this.setState({ escalationSent: true });
      } catch (escalationError) {
        console.error('Failed to send escalation notification:', escalationError);
      }
    }, escalationDelay);
  };
  
  /**
   * Activates maintenance mode for critical system failures
   */
  private activateMaintenanceMode = async () => {
    try {
      // Log maintenance mode activation
      await auditLogger.logMaintenanceAction({
        type: 'maintenance_mode_activation',
        component: 'admin-settings',
        plannedDowntime: this.state.errorClassification?.estimatedDowntime || 900, // 15 minutes default
        timestamp: new Date(),
        approvedBy: this.getCurrentUserId() || 'system',
      });
      
      // Call maintenance mode callback if provided
      this.props.maintenanceModeCallback?.();
      
      this.setState({ maintenanceModeActivated: true });
      
      // Show maintenance mode notification to users
      this.showMaintenanceModeNotification();
      
    } catch (maintenanceError) {
      console.error('Failed to activate maintenance mode:', maintenanceError);
    }
  };
  
  /**
   * Logs detailed system error information
   */
  private logSystemError = async (error: Error, classification: ReturnType<typeof AdminErrorAnalyzer.classifyError>, context: AdminErrorContext) => {
    try {
      const systemError: SystemError = {
        type: this.mapErrorTypeToSystemType(classification.type),
        severity: classification.severity as 'low' | 'medium' | 'high' | 'critical',
        component: context.component,
        message: error.message,
        stack: error.stack,
        recoverable: classification.recoverable,
        autoRetryable: classification.autoRetryable,
        maintenanceModeRequired: classification.maintenanceModeRequired,
        estimatedDowntime: classification.estimatedDowntime,
        repairSteps: this.generateRepairSteps(classification),
        escalationRequired: classification.escalationRequired,
        affectedUsers: classification.affectedUsers,
        businessImpact: classification.businessImpact,
      };
      
      await errorLogger.logSystemError(systemError);
    } catch (loggingError) {
      console.error('Failed to log system error:', loggingError);
    }
  };
  
  /**
   * Sends monitoring alerts for critical errors
   */
  private sendMonitoringAlert = async (error: Error, classification: ReturnType<typeof AdminErrorAnalyzer.classifyError>, context: AdminErrorContext) => {
    try {
      // In production, this would integrate with monitoring systems like:
      // - Datadog, New Relic, or Sentry for error tracking
      // - PagerDuty or OpsGenie for incident management
      // - Slack or Microsoft Teams for real-time notifications
      
      const alertPayload = {
        severity: classification.severity,
        title: `Admin Settings Error: ${classification.type}`,
        description: error.message,
        context: {
          route: context.route,
          user: context.userId,
          component: context.component,
          errorId: this.state.errorId,
          timestamp: context.timestamp.toISOString(),
        },
        metadata: {
          affectedUsers: classification.affectedUsers,
          businessImpact: classification.businessImpact,
          estimatedDowntime: classification.estimatedDowntime,
          recoveryActions: classification.recoveryActions,
        },
      };
      
      // Mock monitoring alert - replace with actual monitoring service calls
      console.warn('[MONITORING ALERT]', alertPayload);
      
      // Log the monitoring alert action
      await auditLogger.logAdminAction(
        {
          type: 'monitoring_alert_sent',
          target: 'monitoring_system',
          parameters: alertPayload,
          timestamp: new Date(),
          result: 'success',
        },
        'success'
      );
      
    } catch (alertError) {
      console.error('Failed to send monitoring alert:', alertError);
    }
  };
  
  /**
   * Sends escalation notification to administrators
   */
  private sendEscalationNotification = async () => {
    // In production, this would send notifications via:
    // - Email to on-call administrators
    // - SMS for critical issues
    // - Push notifications to mobile admin apps
    // - Integration with incident management systems
    
    const escalationPayload = {
      type: 'admin_error_escalation',
      severity: this.state.errorClassification?.severity,
      errorId: this.state.errorId,
      route: this.state.context?.route,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
      estimatedDowntime: this.state.errorClassification?.estimatedDowntime,
      affectedUsers: this.state.errorClassification?.affectedUsers,
      businessImpact: this.state.errorClassification?.businessImpact,
    };
    
    // Mock escalation notification - replace with actual notification service
    console.error('[ESCALATION NOTIFICATION]', escalationPayload);
  };
  
  /**
   * Shows maintenance mode notification to users
   */
  private showMaintenanceModeNotification = () => {
    // In production, this would:
    // - Display banner notifications across the application
    // - Send notifications to active user sessions
    // - Update status page with maintenance information
    // - Notify users of estimated resolution time
    
    console.info('[MAINTENANCE MODE] Application entering maintenance mode due to critical error');
  };
  
  /**
   * Handles recovery actions triggered by administrators
   */
  private handleRecoveryAction = async (action: RecoveryActionType): Promise<void> => {
    try {
      const context = this.state.context;
      const errorId = this.state.errorId;
      
      // Log the recovery action attempt
      await auditLogger.logAdminAction(
        {
          type: `recovery_action_${action}`,
          target: context?.route || 'unknown',
          parameters: {
            errorId,
            action,
            errorType: this.state.errorClassification?.type,
          },
          timestamp: new Date(),
          result: 'success',
        },
        'success'
      );
      
      switch (action) {
        case RecoveryActionType.RETRY:
          this.resetErrorBoundary();
          break;
          
        case RecoveryActionType.RESTART_SERVICE:
          await this.restartService();
          break;
          
        case RecoveryActionType.MAINTENANCE_MODE:
          await this.activateMaintenanceMode();
          break;
          
        case RecoveryActionType.ROLLBACK_CONFIG:
          await this.rollbackConfiguration();
          break;
          
        case RecoveryActionType.ESCALATE:
          await this.sendEscalationNotification();
          this.setState({ escalationSent: true });
          break;
          
        case RecoveryActionType.EMERGENCY_CONTACT:
          this.props.emergencyContactCallback?.();
          break;
          
        case RecoveryActionType.DIAGNOSTIC_MODE:
          await this.activateDiagnosticMode();
          break;
          
        case RecoveryActionType.SAFE_MODE:
          await this.activateSafeMode();
          break;
          
        case RecoveryActionType.FORCE_LOGOUT:
          await this.forceUserLogout();
          break;
          
        case RecoveryActionType.DISABLE_FEATURE:
          await this.disableFeature();
          break;
          
        case RecoveryActionType.BACKUP_RESTORE:
          await this.initiateBackupRestore();
          break;
          
        case RecoveryActionType.MANUAL_INTERVENTION:
          await this.requestManualIntervention();
          break;
          
        default:
          console.warn(`Unknown recovery action: ${action}`);
      }
    } catch (recoveryError) {
      console.error(`Failed to execute recovery action ${action}:`, recoveryError);
      
      // Log failed recovery action
      await auditLogger.logAdminAction(
        {
          type: `recovery_action_${action}_failed`,
          target: this.state.context?.route || 'unknown',
          parameters: {
            errorId: this.state.errorId,
            action,
            failureReason: recoveryError.message,
          },
          timestamp: new Date(),
          result: 'failure',
        },
        'failure',
        recoveryError
      );
    }
  };
  
  /**
   * Resets the error boundary state to recover from errors
   */
  private resetErrorBoundary = () => {
    // Clear timers
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.escalationTimer) {
      clearTimeout(this.escalationTimer);
      this.escalationTimer = null;
    }
    
    // Reset state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRetrying: false,
      lastRetryTime: null,
    });
  };
  
  /**
   * Component cleanup
   */
  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    if (this.escalationTimer) {
      clearTimeout(this.escalationTimer);
    }
  }
  
  /**
   * Renders the error boundary component
   */
  render() {
    if (this.state.hasError && this.state.error && this.state.context && this.state.errorClassification) {
      const fallbackProps: AdminErrorFallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo!,
        resetErrorBoundary: this.resetErrorBoundary,
        errorClassification: this.state.errorClassification,
        context: this.state.context,
        retryCount: this.state.retryCount,
        isRetrying: this.state.isRetrying,
        errorId: this.state.errorId!,
        onRecoveryAction: this.handleRecoveryAction,
      };
      
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback(fallbackProps);
      }
      
      return <AdminErrorFallback {...fallbackProps} />;
    }
    
    return this.props.children;
  }
  
  // Helper methods for context gathering
  private getCurrentUserId(): string | undefined {
    // In production, get from authentication context
    return 'admin-user-mock';
  }
  
  private getCurrentUserRole(): string | undefined {
    // In production, get from authentication context
    return 'system-administrator';
  }
  
  private getSessionId(): string | undefined {
    // In production, get from session management
    return 'session-mock';
  }
  
  private getLastAction(): string | undefined {
    // In production, get from user activity tracking
    return 'view-admin-settings';
  }
  
  private async getClientIPAddress(): Promise<string | undefined> {
    // In production, get from request headers or geolocation API
    return '192.168.1.100';
  }
  
  private async getSystemHealth(): Promise<SystemHealthStatus | undefined> {
    // In production, query system health monitoring
    return {
      overall: 'degraded',
      database: 'healthy',
      api: 'degraded',
      storage: 'healthy',
      network: 'healthy',
    };
  }
  
  private async getConfigurationState(): Promise<ConfigurationState | undefined> {
    // In production, query configuration management system
    return {
      lastModified: new Date(Date.now() - 3600000), // 1 hour ago
      modifiedBy: 'admin-user',
      version: '1.2.3',
      valid: true,
      backupAvailable: true,
    };
  }
  
  private getActiveConnections(): number | undefined {
    // In production, get from connection pool monitoring
    return 25;
  }
  
  private async getMemoryUsage(): Promise<MemoryUsage | undefined> {
    // In production, get from system monitoring
    return {
      used: 1024 * 1024 * 1024 * 6, // 6GB
      total: 1024 * 1024 * 1024 * 8, // 8GB
      percentage: 75,
      available: 1024 * 1024 * 1024 * 2, // 2GB
    };
  }
  
  private async getDiskSpace(): Promise<DiskSpaceInfo | undefined> {
    // In production, get from system monitoring
    return {
      used: 1024 * 1024 * 1024 * 800, // 800GB
      total: 1024 * 1024 * 1024 * 1000, // 1TB
      percentage: 80,
      available: 1024 * 1024 * 1024 * 200, // 200GB
      path: '/var/log',
    };
  }
  
  private async measureNetworkLatency(): Promise<number | undefined> {
    // In production, measure actual network latency to key services
    return 150; // ms
  }
  
  private getLastSuccessfulAction(): AdminAction | undefined {
    // In production, get from user activity tracking
    return {
      type: 'view_user_list',
      target: '/admin-settings/users',
      parameters: { page: 1, limit: 25 },
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      result: 'success',
    };
  }
  
  private calculateErrorFrequency(): ErrorFrequencyData | undefined {
    // In production, calculate from error tracking data
    return {
      count: 3,
      timeWindow: 300000, // 5 minutes
      threshold: 5,
      pattern: 'increasing',
    };
  }
  
  private mapErrorTypeToSystemType(errorType: AdminErrorType): 'database' | 'network' | 'memory' | 'disk' | 'service' | 'configuration' {
    const mapping: Record<AdminErrorType, 'database' | 'network' | 'memory' | 'disk' | 'service' | 'configuration'> = {
      [AdminErrorType.DATABASE_CONNECTIVITY]: 'database',
      [AdminErrorType.NETWORK_TIMEOUT]: 'network',
      [AdminErrorType.MEMORY_EXHAUSTION]: 'memory',
      [AdminErrorType.DISK_SPACE_CRITICAL]: 'disk',
      [AdminErrorType.SERVICE_UNAVAILABLE]: 'service',
      [AdminErrorType.SYSTEM_CONFIGURATION]: 'configuration',
      [AdminErrorType.PERMISSION_DENIED]: 'service',
      [AdminErrorType.AUDIT_FAILURE]: 'service',
      [AdminErrorType.SECURITY_VIOLATION]: 'service',
      [AdminErrorType.WORKFLOW_ERROR]: 'service',
      [AdminErrorType.INFRASTRUCTURE_FAILURE]: 'service',
      [AdminErrorType.DATA_CORRUPTION]: 'database',
      [AdminErrorType.AUTHENTICATION_FAILURE]: 'service',
      [AdminErrorType.AUTHORIZATION_VIOLATION]: 'service',
      [AdminErrorType.COMPLIANCE_BREACH]: 'service',
    };
    
    return mapping[errorType] || 'service';
  }
  
  private generateRepairSteps(classification: ReturnType<typeof AdminErrorAnalyzer.classifyError>): string[] {
    const baseSteps = [
      'Review error logs and stack trace',
      'Check system resources (CPU, memory, disk)',
      'Verify network connectivity',
      'Validate configuration files',
    ];
    
    const typeSpecificSteps: Record<AdminErrorType, string[]> = {
      [AdminErrorType.DATABASE_CONNECTIVITY]: [
        'Check database service status',
        'Verify connection pool settings',
        'Test database credentials',
        'Review firewall rules',
      ],
      [AdminErrorType.MEMORY_EXHAUSTION]: [
        'Restart application services',
        'Clear temporary files and caches',
        'Review memory allocation settings',
        'Identify memory leaks',
      ],
      [AdminErrorType.DISK_SPACE_CRITICAL]: [
        'Clear log files and temporary data',
        'Archive old backup files',
        'Extend storage capacity',
        'Implement log rotation',
      ],
      [AdminErrorType.NETWORK_TIMEOUT]: [
        'Check network connectivity',
        'Verify DNS resolution',
        'Test endpoint availability',
        'Review timeout settings',
      ],
      [AdminErrorType.SECURITY_VIOLATION]: [
        'Block malicious IP addresses',
        'Review authentication logs',
        'Update security policies',
        'Reset compromised credentials',
      ],
      [AdminErrorType.SYSTEM_CONFIGURATION]: [
        'Rollback recent configuration changes',
        'Validate configuration syntax',
        'Restore from backup',
        'Apply security patches',
      ],
    };
    
    return [...baseSteps, ...(typeSpecificSteps[classification.type] || [])];
  }
  
  // Recovery action implementations (mocked for demonstration)
  private async restartService(): Promise<void> {
    console.log('[RECOVERY] Restarting service...');
  }
  
  private async rollbackConfiguration(): Promise<void> {
    console.log('[RECOVERY] Rolling back configuration...');
  }
  
  private async activateDiagnosticMode(): Promise<void> {
    console.log('[RECOVERY] Activating diagnostic mode...');
  }
  
  private async activateSafeMode(): Promise<void> {
    console.log('[RECOVERY] Activating safe mode...');
  }
  
  private async forceUserLogout(): Promise<void> {
    console.log('[RECOVERY] Forcing user logout...');
  }
  
  private async disableFeature(): Promise<void> {
    console.log('[RECOVERY] Disabling feature...');
  }
  
  private async initiateBackupRestore(): Promise<void> {
    console.log('[RECOVERY] Initiating backup restore...');
  }
  
  private async requestManualIntervention(): Promise<void> {
    console.log('[RECOVERY] Requesting manual intervention...');
  }
}

// ============================================================================
// ADMIN ERROR FALLBACK COMPONENT
// ============================================================================

/**
 * Default fallback component for administrative errors
 * Provides comprehensive error information and recovery options for administrators
 */
function AdminErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
  errorClassification,
  context,
  retryCount,
  isRetrying,
  errorId,
  onRecoveryAction,
}: AdminErrorFallbackProps) {
  // State for managing recovery actions
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [expandedDiagnostics, setExpandedDiagnostics] = useState(false);
  const [activeRecoveryAction, setActiveRecoveryAction] = useState<RecoveryActionType | null>(null);
  const [lastActionTimestamp, setLastActionTimestamp] = useState<Date | null>(null);
  
  // Get error type icon and styling
  const getErrorIcon = useCallback(() => {
    switch (errorClassification.severity) {
      case AdminErrorSeverity.CRITICAL:
      case AdminErrorSeverity.EMERGENCY:
        return <ExclamationTriangleIconSolid className="h-8 w-8 text-red-600 dark:text-red-400" />;
      case AdminErrorSeverity.HIGH:
        return <ShieldExclamationIconSolid className="h-8 w-8 text-orange-600 dark:text-orange-400" />;
      default:
        return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />;
    }
  }, [errorClassification.severity]);
  
  // Get severity styling
  const getSeverityBadgeColor = useCallback(() => {
    switch (errorClassification.severity) {
      case AdminErrorSeverity.CRITICAL:
      case AdminErrorSeverity.EMERGENCY:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case AdminErrorSeverity.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case AdminErrorSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  }, [errorClassification.severity]);
  
  // Format error type for display
  const formatErrorType = useCallback((type: AdminErrorType) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);
  
  // Handle recovery action execution
  const handleRecoveryAction = useCallback(async (action: RecoveryActionType) => {
    setActiveRecoveryAction(action);
    setLastActionTimestamp(new Date());
    
    try {
      await onRecoveryAction(action);
    } catch (actionError) {
      console.error(`Recovery action ${action} failed:`, actionError);
    } finally {
      setActiveRecoveryAction(null);
    }
  }, [onRecoveryAction]);
  
  // Get recovery action icon
  const getRecoveryActionIcon = useCallback((action: RecoveryActionType) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (action) {
      case RecoveryActionType.RETRY:
        return <ArrowPathIcon {...iconProps} />;
      case RecoveryActionType.RESTART_SERVICE:
        return <ServerStackIcon {...iconProps} />;
      case RecoveryActionType.MAINTENANCE_MODE:
        return <WrenchIcon {...iconProps} />;
      case RecoveryActionType.ESCALATE:
        return <BellAlertIcon {...iconProps} />;
      case RecoveryActionType.EMERGENCY_CONTACT:
        return <PhoneIcon {...iconProps} />;
      case RecoveryActionType.DIAGNOSTIC_MODE:
        return <CogIcon {...iconProps} />;
      default:
        return <CogIcon {...iconProps} />;
    }
  }, []);
  
  // Format recovery action for display
  const formatRecoveryAction = useCallback((action: RecoveryActionType) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);
  
  // Calculate estimated resolution time
  const getEstimatedResolutionTime = useMemo(() => {
    const baseTime = errorClassification.estimatedDowntime;
    const multiplier = Math.max(1, retryCount * 0.5);
    return Math.round(baseTime * multiplier);
  }, [errorClassification.estimatedDowntime, retryCount]);
  
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Error Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            {/* Error Icon */}
            <div className="flex-shrink-0">
              {getErrorIcon()}
            </div>
            
            {/* Error Title and Basic Info */}
            <div className="flex-1 min-w-0">
              <h1 
                id="error-title"
                className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
              >
                Administrative Error Detected
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {/* Error Type Badge */}
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                  getSeverityBadgeColor()
                )}>
                  {formatErrorType(errorClassification.type)}
                </span>
                
                {/* Severity Badge */}
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                  getSeverityBadgeColor()
                )}>
                  {errorClassification.severity.toUpperCase()} SEVERITY
                </span>
                
                {/* Error ID */}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  ID: {errorId}
                </span>
              </div>
              
              {/* Error Description */}
              <p 
                id="error-description"
                className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
              >
                {error.message}
              </p>
              
              {/* Impact Summary */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Est. Resolution: {getEstimatedResolutionTime}min
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <ServerStackIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Affected Users: {errorClassification.affectedUsers}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <ShieldExclamationIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Business Impact: {errorClassification.businessImpact.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error Content */}
        <div className="p-6 space-y-6">
          {/* Retry Status */}
          {(isRetrying || retryCount > 0) && (
            <Alert type="info" variant="soft" dismissible={false}>
              <Alert.Content
                title="Automatic Recovery Status"
                description={
                  isRetrying 
                    ? "Attempting automatic recovery..."
                    : `Recovery attempts: ${retryCount}`
                }
              />
            </Alert>
          )}
          
          {/* Recovery Actions */}
          {errorClassification.recoveryActions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Available Recovery Actions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {errorClassification.recoveryActions.map((action) => (
                  <Button
                    key={action}
                    variant={action === RecoveryActionType.EMERGENCY_CONTACT ? "error" : "outline"}
                    size="sm"
                    onClick={() => handleRecoveryAction(action)}
                    disabled={activeRecoveryAction === action}
                    className="justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-2">
                      {getRecoveryActionIcon(action)}
                      <span className="text-sm font-medium">
                        {formatRecoveryAction(action)}
                      </span>
                    </div>
                    {activeRecoveryAction === action && (
                      <div className="ml-auto">
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Error Details */}
          <div>
            <button
              onClick={() => setExpandedDetails(!expandedDetails)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5" />
              Error Details
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({expandedDetails ? 'Hide' : 'Show'})
              </span>
            </button>
            
            {expandedDetails && (
              <div className="mt-4 space-y-4">
                {/* Error Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Route</dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100 font-mono">{context.route}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Component</dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100 font-mono">{context.component}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">{context.timestamp.toLocaleString()}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100 font-mono">{context.sessionId}</dd>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User Role</dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">{context.userRole}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Recoverable</dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {errorClassification.recoverable ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto-retryable</dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {errorClassification.autoRetryable ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Escalation Required</dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        {errorClassification.escalationRequired ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </div>
                </div>
                
                {/* Error Stack Trace */}
                {process.env.NODE_ENV === 'development' && error.stack && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Stack Trace (Development)
                    </h4>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto max-h-48 text-red-600 dark:text-red-400 border">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* System Diagnostics */}
          <div>
            <button
              onClick={() => setExpandedDiagnostics(!expandedDiagnostics)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <CogIcon className="h-5 w-5" />
              System Diagnostics
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({expandedDiagnostics ? 'Hide' : 'Show'})
              </span>
            </button>
            
            {expandedDiagnostics && (
              <div className="mt-4 space-y-4">
                {/* System Health Status */}
                {context.systemHealth && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      System Health Status
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(context.systemHealth).map(([component, status]) => (
                        <div key={component} className="text-center">
                          <div className={cn(
                            "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2",
                            status === 'healthy' ? "bg-green-100 dark:bg-green-900/30" :
                            status === 'degraded' ? "bg-yellow-100 dark:bg-yellow-900/30" :
                            "bg-red-100 dark:bg-red-900/30"
                          )}>
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              status === 'healthy' ? "bg-green-500" :
                              status === 'degraded' ? "bg-yellow-500" :
                              "bg-red-500"
                            )} />
                          </div>
                          <div className="text-xs font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {component}
                          </div>
                          <div className={cn(
                            "text-xs capitalize",
                            status === 'healthy' ? "text-green-600 dark:text-green-400" :
                            status === 'degraded' ? "text-yellow-600 dark:text-yellow-400" :
                            "text-red-600 dark:text-red-400"
                          )}>
                            {status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Resource Usage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Memory Usage */}
                  {context.memoryUsage && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Memory Usage
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Used</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {Math.round(context.memoryUsage.used / (1024 * 1024 * 1024))}GB / {Math.round(context.memoryUsage.total / (1024 * 1024 * 1024))}GB
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full transition-all",
                              context.memoryUsage.percentage > 90 ? "bg-red-500" :
                              context.memoryUsage.percentage > 75 ? "bg-yellow-500" :
                              "bg-green-500"
                            )}
                            style={{ width: `${context.memoryUsage.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {context.memoryUsage.percentage}% used
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Disk Space */}
                  {context.diskSpace && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Disk Space ({context.diskSpace.path})
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Used</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {Math.round(context.diskSpace.used / (1024 * 1024 * 1024))}GB / {Math.round(context.diskSpace.total / (1024 * 1024 * 1024))}GB
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full transition-all",
                              context.diskSpace.percentage > 90 ? "bg-red-500" :
                              context.diskSpace.percentage > 75 ? "bg-yellow-500" :
                              "bg-green-500"
                            )}
                            style={{ width: `${context.diskSpace.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {context.diskSpace.percentage}% used
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Additional Diagnostic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Active Connections</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{context.activeConnections}</dd>
                  </div>
                  
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Network Latency</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{context.networkLatency}ms</dd>
                  </div>
                  
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Error Frequency</dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      {context.errorFrequency?.count || 0} errors in {(context.errorFrequency?.timeWindow || 0) / 60000}min
                    </dd>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Timestamp */}
          {lastActionTimestamp && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last action performed at: {lastActionTimestamp.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONVENIENCE HOOK FOR USING ADMIN ERROR BOUNDARY
// ============================================================================

/**
 * Hook for triggering administrative error handling from components
 * Provides programmatic access to error logging and escalation workflows
 */
export function useAdminErrorHandler() {
  const logAdminError = useCallback(async (
    error: Error,
    context: Partial<AdminErrorContext> = {}
  ) => {
    try {
      const fullContext: AdminErrorContext = {
        route: window.location.pathname,
        component: 'useAdminErrorHandler',
        timestamp: new Date(),
        ...context,
      };
      
      const errorId = await errorLogger.logError(error, fullContext);
      const classification = AdminErrorAnalyzer.classifyError(error, fullContext);
      
      return {
        errorId,
        classification,
        context: fullContext,
      };
    } catch (loggingError) {
      console.error('Failed to log admin error:', loggingError);
      throw loggingError;
    }
  }, []);
  
  const logSecurityViolation = useCallback(async (violation: Partial<SecurityViolation>) => {
    try {
      const fullViolation: SecurityViolation = {
        type: 'unauthorized_access',
        severity: 'medium',
        source: 'unknown',
        target: 'unknown',
        blocked: false,
        requiresImmedateAction: false,
        threatLevel: 1,
        recommendations: [],
        ...violation,
      };
      
      return await errorLogger.logSecurityViolation(fullViolation);
    } catch (loggingError) {
      console.error('Failed to log security violation:', loggingError);
      throw loggingError;
    }
  }, []);
  
  const logAuditFailure = useCallback(async (failure: Partial<AuditFailure>) => {
    try {
      const fullFailure: AuditFailure = {
        type: 'logging_service_down',
        severity: 'medium',
        affectedPeriod: { start: new Date(), end: new Date() },
        dataIntegrityImpact: false,
        complianceRisk: false,
        recoveryPossible: true,
        backupAvailable: true,
        ...failure,
      };
      
      return await errorLogger.logAuditFailure(fullFailure);
    } catch (loggingError) {
      console.error('Failed to log audit failure:', loggingError);
      throw loggingError;
    }
  }, []);
  
  return {
    logAdminError,
    logSecurityViolation,
    logAuditFailure,
    errorLogger,
    auditLogger,
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default function AdminErrorPage() {
  return (
    <AdminErrorBoundary
      enableAutoRecovery={true}
      maxRetries={3}
      retryDelay={2000}
      escalationThreshold={30000}
      onError={(error, errorInfo, context) => {
        // Additional error handling logic can be added here
        console.error('Admin settings error:', { error, errorInfo, context });
      }}
    >
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Admin Settings Error Boundary Active
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This error boundary is ready to handle administrative errors.
          If you're seeing this message, there was likely an error in the admin settings route.
        </p>
      </div>
    </AdminErrorBoundary>
  );
}

/**
 * Named exports for component composition and testing
 */
export { 
  AdminErrorBoundary,
  AdminErrorFallback,
  AdminErrorAnalyzer,
  useAdminErrorHandler,
  AdminErrorType,
  AdminErrorSeverity,
  RecoveryActionType,
};

/**
 * Type exports for TypeScript integration
 */
export type {
  AdminErrorBoundaryProps,
  AdminErrorFallbackProps,
  AdminErrorBoundaryState,
  AdminErrorContext,
  SystemError,
  SecurityViolation,
  AuditFailure,
  ErrorLogger,
  AuditLogger,
};