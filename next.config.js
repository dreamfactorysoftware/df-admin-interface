/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 19 stable optimizations and experimental features
  experimental: {
    reactCompiler: true,       // Automatic React optimizations for enhanced performance
    ppr: true,                 // Partial Prerendering for hybrid SSR/SSG capabilities
    turbo: {
      // Turbopack configuration for 700% faster builds
      rules: {
        // SVG handling for icon components
        '*.svg': ['@svgr/webpack'],
        // CSS module handling with Tailwind CSS integration
        '*.module.css': {
          loaders: ['css-loader'],
          as: '*.css',
        },
      },
    },
  },
  
  // SSR-first deployment with standalone capability
  output: 'standalone',
  distDir: 'dist',
  basePath: '/dreamfactory/dist',
  
  // Server runtime configuration for server-only settings
  // These variables are not exposed to the client and only available in middleware/API routes
  serverRuntimeConfig: {
    // Internal API URL for server-side requests
    internalApiUrl: process.env.INTERNAL_API_URL,
    // Server secret for JWT token validation
    serverSecret: process.env.SERVER_SECRET,
    // Database connection string for server operations
    databaseConnectionString: process.env.DATABASE_URL,
    // CSRF secret for token generation
    csrfSecret: process.env.CSRF_SECRET,
    // JWT secret for authentication
    jwtSecret: process.env.JWT_SECRET,
  },
  
  // Public runtime configuration for client-accessible variables
  // These are available on both client and server
  publicRuntimeConfig: {
    // Public API URL for client-side requests
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    // Application version for debugging and monitoring
    version: process.env.NEXT_PUBLIC_VERSION,
    // Base path for routing and asset serving
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/dreamfactory/dist',
    // Environment indicator for conditional logic
    environment: process.env.NODE_ENV,
  },
  
  // Enhanced asset optimization for SSR deployment
  images: {
    // Modern image formats for optimal performance
    formats: ['image/webp', 'image/avif'],
    // Responsive device sizes for optimal image delivery
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different layout contexts
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allowed domains for external images
    domains: ['localhost', 'api.dreamfactory.com'],
    // Enable optimization for SSR while maintaining CDN compatibility
    unoptimized: false,
    // Quality setting for optimized images
    quality: 85,
  },
  
  // Performance optimizations with SSR support
  compiler: {
    // Remove console statements in production for cleaner output
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enhanced security headers with CSP nonce support
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' assets.calendly.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: assets.calendly.com",
              "font-src 'self' data:",
              "connect-src 'self' api.dreamfactory.com ws: wss:",
              "frame-src calendly.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "block-all-mixed-content",
              "upgrade-insecure-requests"
            ].join('; '),
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
              'picture-in-picture=()'
            ].join(', '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // Cache static assets for optimal performance
        source: '/dist/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache API responses with shorter duration
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  
  // API route rewrites to maintain compatibility with existing DreamFactory API integration patterns
  async rewrites() {
    return [
      {
        // Preserve Next.js API routes
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        // Proxy DreamFactory system API calls for seamless integration
        source: '/system/api/v2/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80'}/api/v2/system/:path*`,
      },
      {
        // Proxy DreamFactory service API calls
        source: '/service/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80'}/api/v2/:path*`,
      },
    ];
  },
  
  // Redirect configuration for proper routing
  async redirects() {
    return [
      {
        // Redirect root to admin interface when accessed directly
        source: '/',
        destination: '/dreamfactory/dist',
        basePath: false,
        permanent: false,
      },
    ];
  },
  
  // Environment variable validation for enhanced security
  env: {
    // Validate that required public environment variables are present
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION,
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  },
  
  // Webpack configuration for additional optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack plugins and loaders if needed
    if (!isServer) {
      // Client-side bundle optimizations
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Add support for SVG imports as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  
  // TypeScript configuration for enhanced type checking
  typescript: {
    // Enable strict type checking in development
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration for code quality
  eslint: {
    // Enforce ESLint rules during build
    ignoreDuringBuilds: false,
    // Apply ESLint to all pages and API routes
    dirs: ['src/app', 'src/components', 'src/lib', 'src/hooks'],
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Bundle analyzer configuration for monitoring bundle size
  ...(process.env.ANALYZE === 'true' && {
    bundleAnalyzer: {
      enabled: true,
      openAnalyzer: true,
    },
  }),
};

// Validate required environment variables at build time
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
    'Please ensure all required environment variables are set before building the application.'
  );
}

module.exports = nextConfig;