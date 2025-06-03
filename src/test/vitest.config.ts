/**
 * Vitest Configuration for DreamFactory Admin Interface
 * 
 * This configuration replaces jest.config.js from the Angular implementation and provides
 * 10x faster test execution compared to Jest/Karma through Vitest's native TypeScript
 * support and optimized runtime.
 * 
 * Key Features:
 * - Native TypeScript 5.8+ support with zero configuration overhead
 * - Enhanced React 19 component testing with Testing Library integration
 * - Built-in code coverage reporting targeting 90%+ coverage
 * - Mock Service Worker (MSW) integration for realistic API testing
 * - Path resolution matching Next.js 15.1 patterns
 * - Browser environment setup for DOM and Web API testing
 * - Snapshot testing with automatic cleanup
 * - Parallel test execution for < 30 second suite completion
 * 
 * Performance Targets:
 * - Complete unit test suite execution: < 30 seconds
 * - Coverage collection: 90%+ for React components and hooks
 * - Hot reload test execution: < 500ms for individual test changes
 * 
 * Migration Benefits:
 * - 10x faster execution compared to Jest/Karma
 * - Enhanced React 19 concurrent features testing support
 * - Better integration with Next.js 15.1 and Turbopack
 * - Improved debugging with native ES modules support
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    // React plugin with enhanced React 19 support
    react({
      // Enable React 19 concurrent features in tests
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      // Support for server components in test environment
      babel: {
        plugins: [
          // Enable React 19 concurrent features for testing
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
        ],
      },
    }),
  ],

  // Test configuration optimized for React/Next.js migration
  test: {
    // Test environment setup for browser APIs and DOM testing
    environment: 'jsdom',
    
    // Setup files for comprehensive test environment initialization
    setupFiles: ['./src/test/setup.ts'],
    
    // Global configuration for React Testing Library and MSW
    globals: true,
    
    // Include patterns for comprehensive test discovery
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    
    // Exclude patterns to avoid testing build artifacts and dependencies
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'build',
      'out',
      'coverage',
      'src/test/mocks/**',
      'src/test/fixtures/**',
      'src/test/utils/**',
      '**/*.d.ts',
      '**/*.config.{js,ts}',
    ],
    
    // Performance optimization for 10x faster execution
    pool: 'threads',
    poolOptions: {
      threads: {
        // Use optimal number of threads for CI/CD and local development
        minThreads: 1,
        maxThreads: process.env.CI ? 2 : require('os').cpus().length,
        // Enable isolation for consistent test results
        isolate: true,
      },
    },
    
    // Timeout configuration for database and API operations
    testTimeout: 15000, // 15 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    
    // Reporter configuration for comprehensive test output
    reporter: process.env.CI 
      ? ['json', 'junit', 'github-actions']
      : ['verbose', 'html'],
    
    // Output directory for test reports and coverage
    outputFile: {
      json: './coverage/test-results.json',
      junit: './coverage/junit.xml',
      html: './coverage/html/index.html',
    },
    
    // Mock configuration for browser APIs and Next.js features
    deps: {
      // Inline dependencies that need to be transformed
      inline: [
        '@testing-library/react',
        '@testing-library/jest-dom',
        '@testing-library/user-event',
        'next/router',
        'next/navigation',
        'next/image',
      ],
    },
    
    // Browser environment configuration for DOM testing
    environmentOptions: {
      jsdom: {
        // Enhanced JSDOM configuration for React 19 features
        url: 'http://localhost:3000',
        // Mock browser APIs used by React and Next.js
        pretendToBeVisual: true,
        resources: 'usable',
        // Configure viewport for responsive component testing
        beforeParse(window) {
          window.matchMedia = (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => {},
          });
          
          // Mock IntersectionObserver for virtual scrolling components
          window.IntersectionObserver = class IntersectionObserver {
            constructor() {}
            observe() {}
            unobserve() {}
            disconnect() {}
          };
          
          // Mock ResizeObserver for responsive components
          window.ResizeObserver = class ResizeObserver {
            constructor() {}
            observe() {}
            unobserve() {}
            disconnect() {}
          };
          
          // Mock Web Workers for background processing
          window.Worker = class Worker {
            constructor() {}
            postMessage() {}
            terminate() {}
            addEventListener() {}
            removeEventListener() {}
          };
        },
      },
    },
    
    // Snapshot testing configuration with automatic cleanup
    snapshot: {
      // Snapshot file naming convention
      resolveSnapshotPath: (testPath: string, snapExtension: string) => 
        testPath.replace(/\.test\.([tj]sx?)$/, `${snapExtension}.$1`),
      
      // Pretty formatting for better readability
      printBasicPrototype: false,
    },
    
    // CSS and asset handling for component testing
    css: {
      // Include CSS modules and Tailwind classes in tests
      include: ['**/*.css', '**/*.scss', '**/*.sass'],
      // Mock CSS-in-JS libraries for faster test execution
      modules: {
        classNameStrategy: 'stable',
      },
    },
    
    // Coverage configuration targeting 90%+ coverage
    coverage: {
      // Coverage provider with enhanced performance
      provider: 'v8',
      
      // Comprehensive coverage collection from React components and hooks
      include: [
        'src/components/**/*.{js,jsx,ts,tsx}',
        'src/hooks/**/*.{js,jsx,ts,tsx}',
        'src/lib/**/*.{js,jsx,ts,tsx}',
        'src/app/**/*.{js,jsx,ts,tsx}',
        'src/middleware/**/*.{js,jsx,ts,tsx}',
      ],
      
      // Exclude configuration files and test utilities
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.config.{js,ts}',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/test/**',
        'src/**/__tests__/**',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/types/**',
        'src/assets/**',
        'src/styles/**',
      ],
      
      // Coverage thresholds for quality assurance
      thresholds: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Higher thresholds for critical components
        'src/components/database-service/**': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/api-generation/**': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/hooks/**': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      
      // Coverage reporting formats
      reporter: ['text', 'html', 'lcov', 'json', 'json-summary'],
      
      // Coverage output configuration
      reportsDirectory: './coverage',
      
      // Exclude lines with specific comments from coverage
      excludeNodeModules: true,
      skipFull: false,
    },
    
    // Watch mode configuration for development
    watch: !process.env.CI,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'build/**',
      'out/**',
      'coverage/**',
    ],
  },
  
  // Path resolution matching Next.js 15.1 patterns
  resolve: {
    alias: {
      // Next.js-style path aliases for consistent imports
      '@': resolve(__dirname, '../'),
      '@/components': resolve(__dirname, '../components'),
      '@/hooks': resolve(__dirname, '../hooks'),
      '@/lib': resolve(__dirname, '../lib'),
      '@/utils': resolve(__dirname, '../lib/utils'),
      '@/types': resolve(__dirname, '../types'),
      '@/styles': resolve(__dirname, '../styles'),
      '@/config': resolve(__dirname, '../lib/config'),
      '@/test': resolve(__dirname, '../test'),
      '@/middleware': resolve(__dirname, '../middleware'),
      '@/app': resolve(__dirname, '../app'),
      
      // React and Next.js testing aliases
      'next/router': require.resolve('next/router'),
      'next/navigation': require.resolve('next/navigation'),
      'next/image': require.resolve('next/image'),
    },
  },
  
  // Define configuration for test-specific environment variables
  define: {
    // Test environment configuration
    __TEST__: true,
    __DEV__: false,
    
    // Next.js environment variables for testing
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.NEXT_PUBLIC_API_URL': JSON.stringify('http://localhost:3000/api'),
    'process.env.NEXT_PUBLIC_APP_ENV': JSON.stringify('test'),
    
    // Mock environment variables for DreamFactory API testing
    'process.env.DREAMFACTORY_API_URL': JSON.stringify('http://localhost:80/api/v2'),
    'process.env.DREAMFACTORY_SYSTEM_API_URL': JSON.stringify('http://localhost:80/system/api/v2'),
    
    // Performance testing configuration
    'process.env.TEST_TIMEOUT': JSON.stringify('15000'),
    'process.env.CONNECTION_TIMEOUT': JSON.stringify('5000'),
  },
  
  // Optimization configuration for enhanced performance
  optimizeDeps: {
    // Include dependencies that should be pre-bundled for faster testing
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'msw',
      'zustand',
    ],
    
    // Exclude dependencies that should remain external
    exclude: [
      'next',
      '@next/env',
    ],
  },
  
  // Build configuration for test environment
  build: {
    // Source map generation for debugging
    sourcemap: true,
    
    // Target configuration for modern browsers in testing
    target: 'esnext',
    
    // Minification disabled for better error messages
    minify: false,
  },
  
  // Server configuration for development testing
  server: {
    // File watching configuration
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  
  // ESBuild configuration for TypeScript transformation
  esbuild: {
    // Target modern JavaScript for faster execution
    target: 'esnext',
    
    // JSX configuration for React 19
    jsx: 'automatic',
    jsxFactory: undefined,
    jsxFragment: undefined,
    jsxImportSource: 'react',
    
    // Source map configuration for debugging
    sourcemap: true,
    
    // Drop console logs in CI environment for cleaner output
    drop: process.env.CI ? ['console', 'debugger'] : [],
  },
});