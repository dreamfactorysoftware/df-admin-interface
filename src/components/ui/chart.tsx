/**
 * Chart Component for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Accessible chart components using Recharts library with WCAG 2.1 AA compliance.
 * Provides line charts, bar charts, pie charts, and area charts with proper
 * keyboard navigation, screen reader support, and color contrast requirements.
 * 
 * @author DreamFactory Admin Interface Team  
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ChartDataPoint {
  name: string
  value: number
  timestamp?: string
  [key: string]: unknown
}

export interface ChartProps {
  data: ChartDataPoint[]
  className?: string
  height?: number
  width?: string | number
  title?: string
  description?: string
  colors?: string[]
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  animate?: boolean
  loading?: boolean
  error?: string
}

export interface LineChartProps extends ChartProps {
  dataKey: string
  strokeWidth?: number
  dot?: boolean
  smooth?: boolean
}

export interface AreaChartProps extends ChartProps {
  dataKey: string
  strokeWidth?: number
  smooth?: boolean
  fillOpacity?: number
}

export interface BarChartProps extends ChartProps {
  dataKey: string
  barSize?: number
  radius?: [number, number, number, number]
}

export interface PieChartProps extends ChartProps {
  dataKey: string
  innerRadius?: number
  outerRadius?: number
  showLabels?: boolean
  labelKey?: string
}

// =============================================================================
// DESIGN TOKENS AND COLORS
// =============================================================================

const CHART_COLORS = {
  primary: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
  success: ['#10b981', '#059669', '#047857', '#065f46'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
  neutral: ['#6b7280', '#4b5563', '#374151', '#1f2937'],
}

const ACCESSIBLE_COLORS = {
  // High contrast colors for WCAG AA compliance
  light: ['#1f2937', '#7c3aed', '#0891b2', '#059669', '#dc6a00', '#dc2626'],
  dark: ['#f9fafb', '#a78bfa', '#67e8f9', '#6ee7b7', '#fbbf24', '#fca5a5'],
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Loading state for charts
 */
const ChartSkeleton: React.FC<{ height: number; className?: string }> = ({
  height,
  className,
}) => (
  <div
    className={cn(
      'flex items-center justify-center rounded-lg border bg-gray-50 dark:bg-gray-900',
      className
    )}
    style={{ height }}
    role="status"
    aria-label="Loading chart data"
  >
    <div className="flex flex-col items-center space-y-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
    </div>
  </div>
)

/**
 * Error state for charts
 */
const ChartError: React.FC<{ message: string; height: number; className?: string }> = ({
  message,
  height,
  className,
}) => (
  <div
    className={cn(
      'flex items-center justify-center rounded-lg border border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-950',
      className
    )}
    style={{ height }}
    role="alert"
    aria-live="polite"
  >
    <div className="flex flex-col items-center space-y-2 text-center">
      <div className="rounded-full bg-error-100 p-2 dark:bg-error-900">
        <svg
          className="h-5 w-5 text-error-600 dark:text-error-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-error-800 dark:text-error-200">
        Failed to load chart
      </p>
      <p className="text-xs text-error-600 dark:text-error-400">{message}</p>
    </div>
  </div>
)

/**
 * Custom tooltip component with accessibility
 */
const CustomTooltip: React.FC<TooltipProps<number, string> & { title?: string }> = ({
  active,
  payload,
  label,
  title,
}) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      role="tooltip"
      aria-label={`Chart data for ${label}`}
    >
      {title && (
        <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </p>
      )}
      <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">{label}</p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-sm font-medium"
          style={{ color: entry.color }}
        >
          {`${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  )
}

// =============================================================================
// CHART COMPONENTS
// =============================================================================

/**
 * Line Chart Component
 */
export const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  dataKey,
  className,
  height = 300,
  width = '100%',
  title,
  description,
  colors = ACCESSIBLE_COLORS.light,
  strokeWidth = 2,
  dot = false,
  smooth = true,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  animate = true,
  loading = false,
  error,
}) => {
  if (loading) {
    return <ChartSkeleton height={height} className={className} />
  }

  if (error) {
    return <ChartError message={error} height={height} className={className} />
  }

  return (
    <div className={cn('w-full', className)} role="img" aria-label={title || 'Line chart'}>
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}
      {description && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-gray-200 dark:stroke-gray-700"
            />
          )}
          <XAxis 
            dataKey="name" 
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          {showTooltip && <Tooltip content={<CustomTooltip title={title} />} />}
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
          )}
          <Line
            type={smooth ? 'monotone' : 'linear'}
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
            dot={dot}
            activeDot={{ r: 6, fill: colors[0] }}
            isAnimationActive={animate}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Area Chart Component
 */
export const AreaChartComponent: React.FC<AreaChartProps> = ({
  data,
  dataKey,
  className,
  height = 300,
  width = '100%',
  title,
  description,
  colors = ACCESSIBLE_COLORS.light,
  strokeWidth = 2,
  smooth = true,
  fillOpacity = 0.3,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  animate = true,
  loading = false,
  error,
}) => {
  if (loading) {
    return <ChartSkeleton height={height} className={className} />
  }

  if (error) {
    return <ChartError message={error} height={height} className={className} />
  }

  return (
    <div className={cn('w-full', className)} role="img" aria-label={title || 'Area chart'}>
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}
      {description && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-gray-200 dark:stroke-gray-700"
            />
          )}
          <XAxis 
            dataKey="name" 
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          {showTooltip && <Tooltip content={<CustomTooltip title={title} />} />}
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />
          )}
          <Area
            type={smooth ? 'monotone' : 'linear'}
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
            fill={colors[0]}
            fillOpacity={fillOpacity}
            isAnimationActive={animate}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Bar Chart Component
 */
export const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  dataKey,
  className,
  height = 300,
  width = '100%',
  title,
  description,
  colors = ACCESSIBLE_COLORS.light,
  barSize,
  radius = [4, 4, 0, 0],
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  animate = true,
  loading = false,
  error,
}) => {
  if (loading) {
    return <ChartSkeleton height={height} className={className} />
  }

  if (error) {
    return <ChartError message={error} height={height} className={className} />
  }

  return (
    <div className={cn('w-full', className)} role="img" aria-label={title || 'Bar chart'}>
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}
      {description && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}
      <ResponsiveContainer width={width} height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-gray-200 dark:stroke-gray-700"
            />
          )}
          <XAxis 
            dataKey="name" 
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          {showTooltip && <Tooltip content={<CustomTooltip title={title} />} />}
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />
          )}
          <Bar
            dataKey={dataKey}
            fill={colors[0]}
            radius={radius}
            maxBarSize={barSize}
            isAnimationActive={animate}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Pie Chart Component
 */
export const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  dataKey,
  className,
  height = 300,
  width = '100%',
  title,
  description,
  colors = ACCESSIBLE_COLORS.light,
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true,
  labelKey = 'name',
  showLegend = true,
  showTooltip = true,
  animate = true,
  loading = false,
  error,
}) => {
  if (loading) {
    return <ChartSkeleton height={height} className={className} />
  }

  if (error) {
    return <ChartError message={error} height={height} className={className} />
  }

  return (
    <div className={cn('w-full', className)} role="img" aria-label={title || 'Pie chart'}>
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}
      {description && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}
      <ResponsiveContainer width={width} height={height}>
        <PieChart>
          {showTooltip && <Tooltip content={<CustomTooltip title={title} />} />}
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />
          )}
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={labelKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill={colors[0]}
            label={showLabels}
            isAnimationActive={animate}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// =============================================================================
// COMPOSITE CHART COMPONENT
// =============================================================================

export interface CompositiveChartProps {
  type: 'line' | 'area' | 'bar' | 'pie'
  data: ChartDataPoint[]
  dataKey: string
  className?: string
  height?: number
  title?: string
  description?: string
  loading?: boolean
  error?: string
  [key: string]: unknown
}

/**
 * Composite Chart Component that renders the appropriate chart type
 */
export const Chart: React.FC<CompositiveChartProps> = ({ type, ...props }) => {
  switch (type) {
    case 'line':
      return <LineChartComponent {...(props as LineChartProps)} />
    case 'area':
      return <AreaChartComponent {...(props as AreaChartProps)} />
    case 'bar':
      return <BarChartComponent {...(props as BarChartProps)} />
    case 'pie':
      return <PieChartComponent {...(props as PieChartProps)} />
    default:
      return <LineChartComponent {...(props as LineChartProps)} />
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  LineChartComponent as LineChart,
  AreaChartComponent as AreaChart,
  BarChartComponent as BarChart,
  PieChartComponent as PieChart,
  CHART_COLORS,
  ACCESSIBLE_COLORS,
}

export type {
  ChartDataPoint,
  ChartProps,
  LineChartProps,
  AreaChartProps,
  BarChartProps,
  PieChartProps,
  CompositiveChartProps,
}