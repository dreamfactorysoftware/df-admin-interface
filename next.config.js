/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 19 compiler optimizations and Partial Prerendering
  experimental: {
    reactCompiler: true,        // Automatic React optimizations
    ppr: true,                  // Partial Prerendering for enhanced performance
    turbo: {
      rules: {
        '*.svg': ['@svgr/webpack'], // SVG as React components
      },
    },
  },

  // Standalone deployment with custom base path for DreamFactory integration
  output: 'standalone',
  distDir: '.next',
  basePath: '/dreamfactory/dist',
  
  // Enhanced asset optimization for performance
  images: {
    formats: ['image/webp', 'image/avif'], // Modern image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost', 'api.dreamfactory.com'],
    unoptimized: false, // Enable optimization for SSR
  },

  // Server-only runtime configuration for sensitive data
  serverRuntimeConfig: {
    // Internal API endpoints not exposed to client
    internalApiUrl: process.env.INTERNAL_API_URL,
    jwtSecret: process.env.JWT_SECRET,
    csrfSecret: process.env.CSRF_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    databaseUrl: process.env.DATABASE_URL,
    serverSecret: process.env.SERVER_SECRET,
  },

  // Public runtime configuration for client-accessible variables
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80',
    dfApiKey: process.env.NEXT_PUBLIC_DF_API_KEY || '',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/dreamfactory/dist',
    version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Compiler optimizations for production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warning logs
    } : false,
  },

  // Enhanced security headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
              'fullscreen=(self)',
            ].join(', '),
          },
        ],
      },
      {
        // Long-term caching for static assets
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Optimized caching for images
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 24 hours
          },
        ],
      },
    ];
  },

  // API route rewrites for DreamFactory compatibility
  async rewrites() {
    return [
      {
        // Proxy DreamFactory API calls through Next.js
        source: '/api/v2/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80'}/api/v2/:path*`,
      },
      {
        // System API endpoints
        source: '/system/api/v2/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80'}/system/api/v2/:path*`,
      },
      {
        // File service endpoints
        source: '/api/files/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80'}/api/files/:path*`,
      },
    ];
  },

  // Webpack optimization for enhanced build performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for third-party libraries
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };

    // Add support for importing SVGs as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Optimize ACE editor builds
    config.module.rules.push({
      test: /ace-builds/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/ace/',
          outputPath: 'static/ace/',
        },
      },
    });

    return config;
  },

  // Environment configuration for different deployment scenarios
  env: {
    CUSTOM_KEY: 'dreamfactory-admin-interface',
    BUILD_TIME: new Date().toISOString(),
  },

  // TypeScript configuration
  typescript: {
    // Type checking is handled by separate tsc process
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // ESLint checking is handled by separate process
    ignoreDuringBuilds: false,
  },

  // Development server configuration
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Internationalization support (prepared for future use)
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
    localeDetection: false, // Disable automatic locale detection
  },

  // Redirects configuration for legacy URLs
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/home',
        permanent: true,
      },
      {
        source: '/',
        destination: '/home',
        permanent: false,
      },
    ];
  },

  // Performance monitoring configuration
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,

  // Power optimizations for build performance
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true,  // Enable React strict mode
  swcMinify: true,        // Use SWC for minification

  // Experimental features for enhanced performance
  modularizeImports: {
    '@fortawesome/react-fontawesome': {
      transform: '@fortawesome/react-fontawesome/{{member}}',
    },
    '@fortawesome/free-solid-svg-icons': {
      transform: '@fortawesome/free-solid-svg-icons/{{member}}',
    },
    '@fortawesome/free-regular-svg-icons': {
      transform: '@fortawesome/free-regular-svg-icons/{{member}}',
    },
    '@fortawesome/free-brands-svg-icons': {
      transform: '@fortawesome/free-brands-svg-icons/{{member}}',
    },
  },
};

module.exports = nextConfig;