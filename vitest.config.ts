import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      // Enable React 19 features including automatic JSX runtime
      jsxRuntime: 'automatic',
      // Enable React development tools integration
      jsxImportSource: 'react',
    }),
  ],
  
  test: {
    // Test environment configuration for DOM testing with jsdom
    environment: 'jsdom',
    
    // Global test setup files
    setupFiles: [
      './src/test/setup.ts', // Global test configuration
      './src/test/mocks/setup.ts', // MSW mock setup
    ],
    
    // Test file patterns - matches React component and utility testing conventions
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    
    // Exclude patterns for non-test files and build artifacts
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'build',
      'e2e',
      'playwright-tests',
      'public',
      '**/*.config.{js,ts}',
      '**/*.d.ts',
    ],
    
    // Global test configuration
    globals: true,
    
    // Enhanced test output with detailed reporting
    reporter: ['verbose', 'json', 'html'],
    
    // Test execution configuration optimized for React 19 components
    testTimeout: 10000, // 10 seconds for complex component tests
    hookTimeout: 10000, // 10 seconds for setup/teardown hooks
    
    // Performance optimization for large test suites
    pool: 'threads',
    poolOptions: {
      threads: {
        // Utilize multiple CPU cores for parallel test execution
        minThreads: 1,
        maxThreads: 4,
        // Isolate tests to prevent state leakage
        isolate: true,
      },
    },
    
    // Test retry configuration for flaky tests
    retry: 1,
    
    // Test filtering and organization
    sequence: {
      // Run tests in parallel for faster execution
      concurrent: true,
      // Randomize test order to catch order dependencies
      shuffle: true,
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // File watching configuration for development
    watch: true,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      'build/**',
    ],
    
    // Coverage reporting configuration with c8
    coverage: {
      // Use v8 coverage provider for native Node.js coverage
      provider: 'v8',
      
      // Coverage reporters
      reporter: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'json',
        'json-summary',
      ],
      
      // Coverage output directory
      reportsDirectory: './coverage',
      
      // Files to include in coverage analysis
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
      ],
      
      // Files to exclude from coverage
      exclude: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/**/*.config.{js,ts}',
        'src/**/*.d.ts',
        'src/test/**',
        'src/**/index.{js,ts}',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/not-found.tsx',
        'src/app/**/error.tsx',
        'src/app/**/page.tsx',
        'src/middleware.ts',
        'src/styles/**',
        'src/types/**',
      ],
      
      // Coverage thresholds to ensure comprehensive testing
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
        // Component-specific thresholds
        'src/components/**': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
        // Business logic thresholds
        'src/lib/**': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        // Hook-specific thresholds
        'src/hooks/**': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
      },
      
      // Coverage exclusion patterns
      excludeNodeModules: true,
      skipCovered: false,
      all: true,
    },
    
    // Browser-like environment configuration
    environmentOptions: {
      jsdom: {
        // Configure jsdom for React 19 compatibility
        resources: 'usable',
        runScripts: 'dangerously',
        // Simulate browser APIs
        pretendToBeVisual: true,
        // Enable modern web APIs
        url: 'http://localhost:3000',
        // Configure storage APIs
        storageQuota: 10000000, // 10MB
      },
    },
    
    // Type checking integration
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', '.next'],
    },
  },
  
  // Module resolution configuration matching Next.js setup
  resolve: {
    alias: {
      // Path mappings from tsconfig.json for seamless integration
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/middleware': path.resolve(__dirname, './src/middleware'),
      '@/test': path.resolve(__dirname, './src/test'),
    },
  },
  
  // Build configuration for test dependencies
  esbuild: {
    // Target ES2023 for modern JavaScript features
    target: 'es2023',
    // JSX transformation for React 19
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  
  // Define global constants for testing environment
  define: {
    // Environment variables for testing
    'process.env.NODE_ENV': '"test"',
    'process.env.NEXT_PUBLIC_API_URL': '"http://localhost:3000/api"',
    // Mock Next.js specific globals
    'process.env.__NEXT_TEST_MODE': 'true',
  },
  
  // Server configuration for test utilities
  server: {
    // Configure dev server for test utilities if needed
    deps: {
      // Inline dependencies that need to be processed by Vite
      inline: [
        // React Testing Library dependencies
        '@testing-library/react',
        '@testing-library/jest-dom',
        '@testing-library/user-event',
        // MSW dependencies for proper ESM handling
        'msw',
        // Next.js specific dependencies
        'next/router',
        'next/navigation',
        // UI library dependencies
        '@headlessui/react',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
      ],
    },
  },
  
  // Optimizations for test performance
  optimizeDeps: {
    // Pre-bundle testing dependencies for faster startup
    include: [
      'react',
      'react-dom',
      'react-dom/test-utils',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'msw',
      'jsdom',
    ],
    exclude: [
      // Exclude Next.js internals from optimization
      'next',
      '@next/env',
    ],
  },
})