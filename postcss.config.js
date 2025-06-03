/**
 * PostCSS Configuration for DreamFactory Admin Interface
 * 
 * This configuration enables Tailwind CSS processing and CSS optimization
 * for the Next.js application. It integrates seamlessly with the Next.js
 * build pipeline to provide cross-browser compatibility, CSS optimization,
 * and production-ready CSS compilation.
 * 
 * Key Features:
 * - Tailwind CSS 4.1+ utility-first CSS processing
 * - Autoprefixer for cross-browser vendor prefix handling
 * - CSS optimization and minification for production builds
 * - Integration with Next.js build pipeline for SSR support
 * - CSS import resolution and path handling
 * 
 * @see https://nextjs.org/docs/pages/building-your-application/styling/css#postcss
 * @see https://tailwindcss.com/docs/installation/using-postcss
 */

const postcssConfig = {
  plugins: {
    /**
     * Tailwind CSS Plugin
     * 
     * Processes utility-first CSS classes and generates optimized CSS output.
     * Automatically handles CSS purging in production builds to remove unused styles.
     * 
     * Features:
     * - Utility-first CSS processing
     * - Automatic CSS purging for production optimization
     * - Dark mode support with class-based strategy
     * - Container query support via @tailwindcss/container-queries
     * - Enhanced form styling via @tailwindcss/forms
     * 
     * Performance Benefits:
     * - 5x faster builds compared to traditional CSS frameworks
     * - 100x faster incremental builds
     * - Automatic unused CSS removal
     * - Zero-configuration setup with Next.js
     */
    'tailwindcss': {},

    /**
     * Autoprefixer Plugin
     * 
     * Automatically adds vendor prefixes to CSS properties for cross-browser
     * compatibility. Uses browserslist configuration to determine which
     * prefixes are needed based on target browser support.
     * 
     * Features:
     * - Automatic vendor prefix addition (-webkit-, -moz-, -ms-, -o-)
     * - Browserslist integration for targeted browser support
     * - CSS Grid support with IE 11 compatibility when needed
     * - Flexbox prefixing for older browser versions
     * - CSS custom properties (variables) support
     * 
     * Browser Support:
     * - Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
     * - Optimized for modern browsers while maintaining compatibility
     */
    'autoprefixer': {},

    /**
     * CSS Nano Plugin (Production Only)
     * 
     * Provides CSS minification and optimization for production builds.
     * Only applied when NODE_ENV is set to 'production' to maintain
     * readable CSS during development.
     * 
     * Optimizations:
     * - CSS minification and whitespace removal
     * - Duplicate rule elimination
     * - CSS property value optimization
     * - Unused @import removal
     * - Color value normalization
     * - CSS selector optimization
     * 
     * Performance Impact:
     * - Up to 30% reduction in CSS file size
     * - Improved page load times
     * - Better Core Web Vitals scores (LCP, CLS)
     */
    ...(process.env.NODE_ENV === 'production' && {
      'cssnano': {
        preset: [
          'default',
          {
            // Preserve CSS custom properties for theme switching
            cssDeclarationSorter: false,
            // Maintain readable CSS class names for debugging
            reduceIdents: false,
            // Preserve important CSS comments (licenses, etc.)
            discardComments: {
              removeAll: false,
            },
            // Optimize CSS but maintain compatibility
            normalizeWhitespace: true,
            // Minify CSS values while preserving functionality
            minifySelectors: true,
            // Convert colors to shortest representation
            colormin: true,
            // Optimize font declarations
            minifyFontValues: true,
            // Remove unused CSS at-rules
            discardUnused: false, // Let Tailwind handle unused CSS removal
          },
        ],
      },
    }),

    /**
     * PostCSS Import Plugin
     * 
     * Enables CSS @import statement processing and resolution.
     * Handles import path resolution for component-scoped styles
     * and CSS modules integration.
     * 
     * Features:
     * - CSS @import statement processing
     * - Node.js-style path resolution
     * - CSS modules support
     * - Inline imported CSS files
     * 
     * Note: Next.js handles most import scenarios automatically,
     * but this provides additional flexibility for complex import patterns.
     */
    'postcss-import': {},

    /**
     * PostCSS Flexbugs Fixes Plugin
     * 
     * Applies fixes for known CSS Flexbox bugs across different browsers.
     * Ensures consistent Flexbox behavior, especially important for
     * database schema visualization and form layouts.
     * 
     * Fixes Applied:
     * - IE 10-11 Flexbox bugs
     * - Safari Flexbox rendering issues
     * - Chrome Flexbox percentage calculation bugs
     * - Firefox Flexbox baseline alignment issues
     */
    'postcss-flexbugs-fixes': {},

    /**
     * PostCSS Preset Env Plugin
     * 
     * Provides future CSS syntax support and browser compatibility.
     * Enables modern CSS features while maintaining backwards compatibility
     * through polyfills and transpilation.
     * 
     * Features:
     * - Modern CSS syntax support (custom properties, nesting, etc.)
     * - Automatic browser compatibility via browserslist
     * - CSS feature polyfills when needed
     * - Progressive enhancement approach
     * 
     * Configuration:
     * - Stage 2: Stable CSS features that are widely supported
     * - Autoprefixer integration disabled (handled separately above)
     * - Custom properties preserved for theme switching
     */
    'postcss-preset-env': {
      stage: 2,
      autoprefixer: false, // Handled by separate autoprefixer plugin above
      features: {
        // Enable CSS custom properties (CSS variables)
        'custom-properties': {
          preserve: true, // Preserve for runtime theme switching
        },
        // Enable CSS nesting for component styles
        'nesting-rules': true,
        // Enable CSS custom media queries
        'custom-media-queries': true,
        // Enable CSS color functions
        'color-function': true,
      },
    },
  },
};

module.exports = postcssConfig;