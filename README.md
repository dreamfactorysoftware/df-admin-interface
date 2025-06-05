# DreamFactory Admin Interface

Modern React 19/Next.js 15.1-based admin interface for managing DreamFactory instances, delivering enhanced performance, superior developer experience, and production-ready scalability.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Development](#development)
  - [Linting and Formatting](#linting-and-formatting)
    - [Lint](#lint)
    - [Lint and Fix](#lint-and-fix)
    - [Format](#format)
- [Running the tests](#running-the-tests)
  - [Testing Examples](#testing-examples)
- [Building the Project](#building-the-project)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Styling with Tailwind CSS](#styling-with-tailwind-css)
- [API Mocking with MSW](#api-mocking-with-msw)
- [Technology Stack](#technology-stack)
- [Adding additional languages](#adding-additional-languages)

## Getting Started

### Prerequisites

- Node.js 20.x LTS or higher
- npm (included with Node.js) or pnpm (recommended for faster installations)

### Installation

Using npm:
```bash
npm install
```

Using pnpm (recommended for better performance):
```bash
npm install -g pnpm
pnpm install
```

#### Setup Development Environment

After installation, set up the development environment:

```bash
# Copy environment variables template
cp .env.example .env.local

# Install git hooks for code quality checks
npm run prepare
```

[husky](https://typicode.github.io/husky/) runs git hooks for formatting and linting checks prior to committing code.

## Usage

### Development

Start the development server with hot reloading:

```bash
npm run dev
```

For enhanced build performance with Turbopack:
```bash
npm run dev -- --turbo
```

Using pnpm:
```bash
pnpm dev
```

The development server runs at `http://localhost:3000` with API proxying configured in [next.config.js](./next.config.js) to route `/api/*` requests to your DreamFactory instance.

### Linting and Formatting

#### Lint

```bash
npm run lint
```

#### Lint and Fix

```bash
npm run lint:fix
```

#### Format

```bash
npm run prettier
```

## Running the tests

[Vitest](https://vitest.dev/) is used for unit testing with React Testing Library for component testing. Tests are named with the following convention: [name].test.ts or [name].test.tsx

#### Run Unit Tests

```bash
npm run test
```

#### Run and Watch Unit Tests

```bash
npm run test:watch
```

#### Run Unit Tests with Coverage

```bash
npm run test:coverage
```

#### Run Tests in UI Mode

```bash
npm run test:ui
```

### Testing Examples

**Component Testing with React Testing Library:**
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DatabaseConnection from '@/components/database-service/DatabaseConnection'

describe('DatabaseConnection', () => {
  it('renders connection form', () => {
    render(<DatabaseConnection />)
    expect(screen.getByRole('form')).toBeInTheDocument()
  })
})
```

**API Mocking with MSW (Mock Service Worker):**
```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('/api/v2/system/database', (req, res, ctx) => {
    return res(ctx.json({ resource: [] }))
  })
)
```

## Building the Project

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Static Export (for CDN deployment)

```bash
npm run export
```

### Build Commands with pnpm

```bash
pnpm build
pnpm start
```

The build process leverages Next.js 15.1 with Turbopack for up to 700% faster build times compared to traditional webpack-based builds.

## Project Structure

The project follows Next.js 15.1 app router conventions with a clean separation of concerns:

```
df-admin-interface/
├── src/
│   ├── app/                           # Next.js app router pages
│   │   ├── layout.tsx                 # Root layout with providers
│   │   ├── page.tsx                   # Dashboard home page
│   │   ├── api-connections/
│   │   │   └── database/
│   │   │       ├── page.tsx           # Database service list
│   │   │       ├── create/
│   │   │       └── [service]/
│   │   │           ├── schema/
│   │   │           └── generate/
│   │   ├── admin-settings/
│   │   └── api-docs/
│   ├── components/                    # React components
│   │   ├── database-service/          # Database connection components
│   │   ├── schema-discovery/          # Schema exploration components
│   │   ├── api-generation/            # API generation workflow
│   │   ├── layout/                    # Layout components
│   │   └── ui/                        # Reusable UI components
│   ├── hooks/                         # Custom React hooks
│   ├── lib/                           # Core libraries and utilities
│   ├── middleware/                    # Next.js middleware for auth
│   ├── styles/                        # Global styles and Tailwind
│   ├── test/                          # Test utilities and mocks
│   └── types/                         # TypeScript definitions
├── public/                            # Static assets
├── tests/                             # E2E tests with Playwright
├── next.config.js                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── vitest.config.ts                   # Test configuration
└── package.json                       # Dependencies and scripts
```

## Environment Configuration

Environment variables follow Next.js conventions with proper client/server separation:

### Client-side Variables (accessible in browser)
- `NEXT_PUBLIC_API_URL` - DreamFactory API endpoint
- `NEXT_PUBLIC_DF_API_KEY` - Public API key (if required)
- `NEXT_PUBLIC_VERSION` - Application version

### Server-side Variables (secure, server-only)
- `SERVER_SECRET` - Internal server secret
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - Internal database connection

### Environment Files
- `.env.local` - Development environment variables
- `.env.example` - Template for required variables
- `.env.production` - Production environment variables

**Example .env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:80
NEXT_PUBLIC_DF_API_KEY=your_api_key_here
NEXT_PUBLIC_VERSION=1.0.0

# Server-only variables
SERVER_SECRET=your_server_secret
JWT_SECRET=your_jwt_secret
```

## Styling with Tailwind CSS

The project uses Tailwind CSS 4.1+ for utility-first styling with Headless UI for accessible components:

### Basic Component Styling

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function DatabaseForm() {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Database Connection
      </h2>
      <Input 
        className="mb-4" 
        placeholder="Connection name"
      />
      <Button className="w-full bg-blue-600 hover:bg-blue-700">
        Test Connection
      </Button>
    </div>
  )
}
```

### Dynamic Styling with Class Variance Authority

```tsx
import { cva } from 'class-variance-authority'

const connectionStatusVariants = cva(
  "px-3 py-1 rounded-full text-sm font-medium",
  {
    variants: {
      status: {
        connecting: "bg-blue-100 text-blue-700 animate-pulse",
        success: "bg-green-100 text-green-700",
        error: "bg-red-100 text-red-700",
      }
    }
  }
)

function ConnectionStatus({ status }: { status: 'connecting' | 'success' | 'error' }) {
  return (
    <span className={connectionStatusVariants({ status })}>
      {status === 'connecting' && 'Connecting...'}
      {status === 'success' && 'Connected'}
      {status === 'error' && 'Connection Failed'}
    </span>
  )
}
```

## API Mocking with MSW

Mock Service Worker (MSW) enables realistic API mocking during development and testing:

### Setup MSW for Development

1. **Install MSW handlers** in `src/test/mocks/handlers.ts`:

```typescript
import { rest } from 'msw'

export const handlers = [
  // Database services
  rest.get('/api/v2/system/database', (req, res, ctx) => {
    return res(
      ctx.json({
        resource: [
          { name: 'mysql_service', type: 'mysql', label: 'MySQL Database' },
          { name: 'postgres_service', type: 'postgresql', label: 'PostgreSQL Database' }
        ]
      })
    )
  }),

  // Schema discovery
  rest.get('/api/v2/mysql_service/_schema', (req, res, ctx) => {
    return res(
      ctx.json({
        table: [
          { name: 'users', label: 'Users' },
          { name: 'products', label: 'Products' }
        ]
      })
    )
  }),

  // Connection testing
  rest.post('/api/v2/system/database/:service/_test', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  })
]
```

2. **Start MSW in development** by adding to your development workflow:

```typescript
// src/test/mocks/browser.ts
import { setupWorker } from 'msw'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

3. **Enable MSW conditionally** in your app:

```typescript
// src/app/layout.tsx
if (process.env.NODE_ENV === 'development') {
  import('../test/mocks/browser').then(({ worker }) => {
    worker.start()
  })
}
```

### MSW in Testing

```typescript
// tests/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../src/test/mocks/handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Technology Stack

This project has been modernized from Angular 16 to React 19 with Next.js 15.1 for enhanced performance and developer experience:

### Core Technologies
- **React 19** - Component library with enhanced concurrent features
- **Next.js 15.1** - Full-stack framework with SSR/SSG capabilities and Turbopack
- **TypeScript 5.8+** - Type safety and enhanced tooling
- **Tailwind CSS 4.1+** - Utility-first CSS framework
- **Headless UI 2.0+** - Accessible, unstyled UI components

### State Management & Data Fetching
- **Zustand** - Simplified global state management
- **TanStack React Query** - Server state management with intelligent caching
- **SWR** - Alternative data fetching with stale-while-revalidate semantics
- **React Hook Form** - Performant form handling with validation

### Testing & Development
- **Vitest** - Fast unit testing framework (10x faster than Jest)
- **React Testing Library** - Component testing utilities
- **Mock Service Worker (MSW)** - API mocking for development and testing
- **Playwright** - End-to-end testing
- **pnpm** - Fast, efficient package manager (recommended)

### Performance Benefits
- 700% faster builds with Turbopack
- Enhanced hot reload (< 500ms for changes)
- Improved bundle optimization and code splitting
- Server-side rendering for better SEO and initial load times

### Quick Start Examples

**Development with environment setup:**
```bash
# Clone and setup
git clone <repository>
cd df-admin-interface

# Install dependencies (pnpm recommended)
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your DreamFactory API URL

# Start development server
pnpm dev
```

**Testing workflow:**
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

**Production build:**
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Adding additional languages

When more than one language is supported, the language selector will be displayed in the top right corner of the application.

- User language will be detected from preference provided by browser. If browser preference is a supported language it will be selected by default.
- If language selector is enabled and user change language manually, their preference is stored in `localStorage` for future reference. If language preference is found in `localStorage`, than it is treated as default language.

- To add a new language, follow these steps:
  1. Add a new entry to the `SUPPORTED_LANGUAGES` array in [src/lib/constants/languages.ts](src/lib/constants/languages.ts).
     - code: The language code. This is used to identify the language in the application.
     - altCode: Alternative language code that might be provided by browser. eg en-US, en-CA.
  2. Create new translation files in [src/assets/i18n](./src/assets/i18n/) and every sub-folder.
     - Ensure label for languages are created in alternative language in [src/assets/i18n/en.json](src/assets/i18n/en.json)
       ```json
       "languages": {
         "en": "English"
       }
       ```
     - These are used to display language label in dropdown.

For detailed documentation on Next.js features, React 19 patterns, and Tailwind CSS usage, see the respective framework documentation and examples provided in this README.