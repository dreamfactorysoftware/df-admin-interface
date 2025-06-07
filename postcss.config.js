/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind CSS 4.1+ processing for utility-first CSS framework
    // Enables tree-shaking of unused CSS classes and compilation of utility classes
    tailwindcss: {
      // Enhanced configuration for React components and Next.js app router
      content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/hooks/**/*.{js,ts,jsx,tsx}',
        './src/lib/**/*.{js,ts,jsx,tsx}',
        './src/middleware/**/*.{js,ts,jsx,tsx}',
        './src/styles/**/*.{css,scss}',
        './public/**/*.html',
      ],
      // Safelist for dynamic classes that might not be detected during build
      safelist: [
        // Preserve utility classes used dynamically in components
        'bg-red-50',
        'bg-green-50',
        'bg-blue-50',
        'bg-yellow-50',
        'border-red-500',
        'border-green-500',
        'border-blue-500',
        'border-yellow-500',
        'text-red-700',
        'text-green-700',
        'text-blue-700',
        'text-yellow-700',
        // Dynamic grid and flex classes for responsive layouts
        {
          pattern: /^(grid-cols-|col-span-|row-span-)/,
          variants: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        // Focus and state management classes for accessibility
        {
          pattern: /^(focus|hover|active|disabled):/,
        },
        // Animation classes for loading states and transitions
        {
          pattern: /^animate-/,
        },
      ],
    },

    // Autoprefixer for cross-browser CSS compatibility
    // Automatically adds vendor prefixes based on browserslist configuration
    autoprefixer: {
      // Target browsers for vendor prefix generation
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'Chrome >= 90',
        'Firefox >= 90',
        'Safari >= 14',
        'Edge >= 90',
      ],
      // Grid support for modern layouts
      grid: 'autoplace',
      // Flexbox support with legacy fallbacks
      flexbox: 'no-2009',
      // Remove outdated vendor prefixes
      remove: true,
    },

    // CSS optimization and minification for production builds
    ...(process.env.NODE_ENV === 'production' && {
      // CSS Nano for production optimization
      cssnano: {
        preset: [
          'default',
          {
            // Preserve important comments like license headers
            discardComments: {
              removeAll: false,
              removeAllButFirst: true,
            },
            // Optimize font declarations
            minifyFontValues: true,
            // Optimize gradient declarations
            minifyGradients: true,
            // Optimize selector sorting
            minifySelectors: true,
            // Normalize display values
            normalizeDisplayValues: true,
            // Normalize positions
            normalizePositions: true,
            // Normalize repeat style declarations
            normalizeRepeatStyle: true,
            // Normalize string values
            normalizeString: true,
            // Normalize timing functions
            normalizeTimingFunctions: true,
            // Normalize Unicode descriptors
            normalizeUnicode: true,
            // Normalize URL formatting
            normalizeUrl: false, // Disabled to prevent breaking relative URLs
            // Normalize whitespace
            normalizeWhitespace: true,
            // Order properties alphabetically for better compression
            orderedValues: true,
            // Reduce calc() expressions
            reduceInitial: true,
            // Reduce transform functions
            reduceTransforms: true,
            // Sort media queries
            sortMediaQueries: true,
            // Unique selectors
            uniqueSelectors: true,
            // Z-index optimization
            zindex: false, // Disabled to prevent breaking z-index stacking contexts
          },
        ],
      },

      // PurgeCSS integration for removing unused CSS
      '@fullhuman/postcss-purgecss': {
        content: [
          './src/**/*.{js,ts,jsx,tsx,mdx}',
          './public/**/*.html',
        ],
        // Default extractors for different file types
        defaultExtractor: (content) => {
          // Extract classes from HTML class attributes and JavaScript strings
          const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
          const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
          return broadMatches.concat(innerMatches);
        },
        // Safelist for dynamic classes and framework-specific patterns
        safelist: {
          standard: [
            /^(bg|text|border|ring)-(red|green|blue|yellow|gray)-(50|100|200|300|400|500|600|700|800|900)$/,
            /^(focus|hover|active|disabled):/,
            /^animate-/,
            /^transition-/,
            /^duration-/,
            /^ease-/,
            'sr-only',
            'not-sr-only',
          ],
          deep: [
            // Preserve all Headless UI classes for dynamic component states
            /headlessui-/,
            // Preserve React Hook Form classes
            /react-hook-form/,
            // Preserve Next.js specific classes
            /__next/,
          ],
          greedy: [
            // Preserve dynamic grid and layout classes
            /^grid-/,
            /^col-/,
            /^row-/,
            /^gap-/,
            // Preserve responsive variants
            /^(sm|md|lg|xl|2xl):/,
          ],
        },
        // Skip purging for certain file patterns
        skippedContentGlobs: [
          'node_modules/**',
          'src/test/**',
          '**/*.test.*',
          '**/*.spec.*',
        ],
      },
    }),

    // PostCSS Import for handling @import statements
    'postcss-import': {
      // Resolve imports relative to the CSS file location
      resolve: (id, basedir) => {
        // Handle Tailwind CSS imports
        if (id.startsWith('tailwindcss/')) {
          return id;
        }
        
        // Handle relative imports from components
        if (id.startsWith('./') || id.startsWith('../')) {
          return id;
        }
        
        // Handle absolute imports from src directory
        if (id.startsWith('~')) {
          return id.replace('~', './src/');
        }
        
        return id;
      },
    },

    // PostCSS Nested for handling nested CSS syntax (Tailwind CSS 4.1+ feature)
    'postcss-nested': {
      // Enable nested rules for better CSS organization
      bubble: ['screen'],
      unwrap: ['screen'],
    },

    // PostCSS Custom Properties for CSS variables support
    'postcss-custom-properties': {
      // Preserve CSS custom properties for runtime theme switching
      preserve: true,
      // Import custom properties from design tokens
      importFrom: [
        'src/styles/design-tokens.ts',
      ],
    },

    // PostCSS Focus Visible for enhanced accessibility
    'postcss-focus-visible': {
      // Add focus-visible polyfill for better keyboard navigation
      replaceWith: '[data-focus-visible-added]',
      preserve: true,
    },
  },
};

module.exports = config;