/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  plugins: [],
  
  test: {
    // Test Environment Configuration
    environment: 'jsdom',
    
    // Setup Files
    setupFiles: [
      './src/test/setup.ts',
      './src/test/mocks/setup.ts'
    ],
    
    // Global Test Configuration
    globals: true,
    
    // Test File Patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'out',
      'build',
      'coverage',
      'playwright',
      'e2e',
      'src/test/fixtures/**/*',
      'src/**/*.d.ts',
      '**/*.config.*',
      '**/node_modules/**'
    ],
    
    // Coverage Configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Coverage Collection
      include: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.config.*',
        '!src/**/*.stories.*',
        '!src/test/**/*',
        '!src/app/globals.css',
        '!src/styles/**/*'
      ],
      
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        'public/',
        'src/test/',
        'src/**/*.config.*',
        'src/**/*.d.ts',
        'src/app/layout.tsx', // Root layout typically doesn't need coverage
        'src/app/not-found.tsx',
        'src/app/error.tsx',
        'src/app/loading.tsx',
        'src/middleware.ts' // Next.js middleware tested separately
      ],
      
      // Coverage Thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      
      // Watermarks for Visual Indicators
      watermarks: {
        statements: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        lines: [80, 95]
      }
    },
    
    // Test Execution Configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    
    // Parallel Execution for Performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Watch Mode Configuration
    watch: false,
    
    // Reporter Configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },
    
    // Browser API Mocking
    env: {
      NODE_ENV: 'test'
    },
    
    // Mock Configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Snapshot Configuration
    resolveSnapshotPath: (testPath: string, snapExtension: string) => {
      return testPath.replace(/\.test\.([tj]sx?)$/, `.test.$1${snapExtension}`)
    }
  },
  
  // Path Resolution Configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/app': resolve(__dirname, './src/app'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/styles': resolve(__dirname, './src/styles'),
      '@/utils': resolve(__dirname, './src/lib/utils'),
      '@/config': resolve(__dirname, './src/lib/config'),
      '@/test': resolve(__dirname, './src/test')
    }
  },
  
  // Optimized Dependency Handling
  optimizeDeps: {
    include: [
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'msw',
      'react',
      'react-dom',
      'react-hook-form',
      '@tanstack/react-query'
    ]
  },
  
  // Define Configuration for Better Type Support
  define: {
    'import.meta.vitest': 'undefined'
  },
  
  // ESBuild Configuration for TypeScript
  esbuild: {
    target: 'es2022',
    jsx: 'automatic',
    jsxImportSource: 'react'
  }
})