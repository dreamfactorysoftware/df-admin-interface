import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, expect } from '@storybook/test';
import { useState } from 'react';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  CogIcon,
  UserIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { ThemeToggle, CompactThemeToggle, ThemeToggleVariants } from './theme-toggle';
import { ThemeProvider } from '@/components/layout/theme/theme-provider';
import type { ThemeMode } from '@/types/theme';

/**
 * Mock theme provider for isolated Storybook testing
 * Provides controlled theme state without relying on global context
 */
function MockThemeProvider({ 
  children, 
  initialTheme = 'system',
  forceResolved 
}: { 
  children: React.ReactNode;
  initialTheme?: ThemeMode;
  forceResolved?: 'light' | 'dark';
}) {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [mounted, setMounted] = useState(true);
  
  // Mock system theme detection
  const systemTheme = forceResolved || 'light';
  const resolvedTheme = theme === 'system' ? systemTheme : (theme as 'light' | 'dark');

  const mockContext = {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme: (newTheme: ThemeMode) => {
      setTheme(newTheme);
      action('theme-changed')(newTheme);
    },
    mounted,
    isTheme: (mode: ThemeMode) => theme === mode,
    isResolvedTheme: (mode: 'light' | 'dark') => resolvedTheme === mode,
  };

  return (
    <div className={resolvedTheme === 'dark' ? 'dark' : ''}>
      <div data-theme-context={JSON.stringify(mockContext)}>
        {children}
      </div>
    </div>
  );
}

const meta = {
  title: 'UI Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ThemeToggle Component System

A comprehensive three-state theme switcher implementing WCAG 2.1 AA accessibility standards with 
React 19/Tailwind CSS implementation. Provides seamless light/dark/system theme management with 
smooth animations and complete keyboard accessibility.

## Features

- ✅ **Three-State Theme Selection**: Light, Dark, and System preference modes
- ✅ **WCAG 2.1 AA Compliant**: 4.5:1 contrast ratios, 44x44px minimum touch targets
- ✅ **Keyboard Navigation**: Full keyboard support with focus-visible indicators
- ✅ **Screen Reader Support**: Comprehensive ARIA labeling and announcements
- ✅ **System Theme Detection**: Automatic following of OS preference changes
- ✅ **Smooth Animations**: CSS transitions for theme state changes
- ✅ **React 19 Integration**: Modern hooks and context patterns
- ✅ **TypeScript 5.8+**: Full type safety with proper inference

## Theme Modes

- \`light\` - Light theme with bright backgrounds and dark text
- \`dark\` - Dark theme with dark backgrounds and light text  
- \`system\` - Automatically follows operating system preference

## Size Variants

- \`sm\` - Small toggles (44x44px minimum for accessibility)
- \`md\` - Medium toggles (48x48px default)
- \`lg\` - Large toggles (56x56px for prominent placement)

## Visual Variants

- \`default\` - Standard styling with subtle backgrounds
- \`outline\` - Outlined style with clear boundaries
- \`ghost\` - Minimal styling for subtle integration
- \`secondary\` - Alternative styling for secondary contexts

## Accessibility Features

All theme toggles meet WCAG 2.1 AA standards with:
- Minimum 44x44px touch targets for mobile accessibility
- High contrast focus indicators (3:1 minimum ratio)
- Comprehensive keyboard navigation support
- Screen reader announcements for theme changes
- Proper ARIA labeling and descriptions
- Role-based interaction patterns

## Integration

The ThemeToggle integrates seamlessly with the application's theme system:
- React Context integration via \`useTheme\` hook
- Persistent storage of user preferences
- Real-time system preference detection
- Theme transition animations
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost', 'secondary'],
      description: 'Visual style variant for the toggle component',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant (all maintain 44px minimum touch target)',
    },
    showLabels: {
      control: 'boolean',
      description: 'Display text labels alongside theme icons',
    },
    labelPosition: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Position of labels relative to the toggle buttons',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all theme toggle interactions',
    },
    enableSystem: {
      control: 'boolean',
      description: 'Include system theme preference option',
    },
    compact: {
      control: 'boolean',
      description: 'Use compact layout without labels',
    },
    showLoading: {
      control: 'boolean',
      description: 'Show loading state during theme transitions',
    },
    onThemeChange: {
      action: 'theme-changed',
      description: 'Callback fired when theme selection changes',
    },
  },
  decorators: [
    (Story, context) => (
      <MockThemeProvider initialTheme={context.args.initialTheme || 'system'}>
        <Story />
      </MockThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic theme toggle variants
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    onThemeChange: action('theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default theme toggle with standard styling. Shows all three theme options (light, dark, system) with icon indicators.',
      },
    },
  },
};

export const WithLabels: Story = {
  args: {
    variant: 'default',
    size: 'md',
    showLabels: true,
    labelPosition: 'bottom',
    onThemeChange: action('theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Theme toggle with text labels for enhanced user understanding. Labels improve clarity of theme options.',
      },
    },
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    size: 'md',
    showLabels: true,
    labelPosition: 'bottom',
    onThemeChange: action('theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Outline variant with clear visual boundaries. Provides stronger visual separation between theme options.',
      },
    },
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    size: 'md',
    onThemeChange: action('theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Ghost variant with minimal styling. Perfect for subtle integration in headers or sidebars.',
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    showLabels: true,
    labelPosition: 'right',
    onThemeChange: action('theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary variant with alternative styling. Labels positioned to the right for different layout needs.',
      },
    },
  },
};

// Size variations
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Small (44px minimum)
        </h3>
        <ThemeToggle 
          size="sm" 
          showLabels 
          labelPosition="bottom"
          onThemeChange={action('small-theme-changed')}
        />
      </div>
      
      <div className="text-center">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Medium (48px default)
        </h3>
        <ThemeToggle 
          size="md" 
          showLabels 
          labelPosition="bottom"
          onThemeChange={action('medium-theme-changed')}
        />
      </div>
      
      <div className="text-center">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Large (56px prominent)
        </h3>
        <ThemeToggle 
          size="lg" 
          showLabels 
          labelPosition="bottom"
          onThemeChange={action('large-theme-changed')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All size variants maintain WCAG 2.1 AA minimum 44x44px touch targets for accessibility compliance.',
      },
    },
  },
};

// Label positioning
export const LabelPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 items-center">
      <div className="text-center">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Labels Top
        </h3>
        <ThemeToggle 
          showLabels 
          labelPosition="top"
          onThemeChange={action('top-labels-changed')}
        />
      </div>
      
      <div className="text-center">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Labels Bottom
        </h3>
        <ThemeToggle 
          showLabels 
          labelPosition="bottom"
          onThemeChange={action('bottom-labels-changed')}
        />
      </div>
      
      <div className="text-center">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Labels Left
        </h3>
        <ThemeToggle 
          showLabels 
          labelPosition="left"
          onThemeChange={action('left-labels-changed')}
        />
      </div>
      
      <div className="text-center">
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Labels Right
        </h3>
        <ThemeToggle 
          showLabels 
          labelPosition="right"
          onThemeChange={action('right-labels-changed')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Flexible label positioning for different layout requirements. Supports top, bottom, left, and right positioning.',
      },
    },
  },
};

// Component states
export const LoadingState: Story = {
  args: {
    showLoading: true,
    showLabels: true,
    labelPosition: 'bottom',
    onThemeChange: action('loading-theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner overlay. Disables interaction during theme transitions.',
      },
    },
  },
};

export const DisabledState: Story = {
  args: {
    disabled: true,
    showLabels: true,
    labelPosition: 'bottom',
    onThemeChange: action('disabled-theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state with reduced opacity and no interaction. Useful when theme switching is not available.',
      },
    },
  },
};

export const WithoutSystemOption: Story = {
  args: {
    enableSystem: false,
    showLabels: true,
    labelPosition: 'bottom',
    onThemeChange: action('no-system-theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Theme toggle without system preference option. Only shows light and dark theme choices.',
      },
    },
  },
};

// Compact variations
export const CompactVariant: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Compact Theme Toggle
        </h3>
        <CompactThemeToggle onThemeChange={action('compact-theme-changed')} />
      </div>
      
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Compact with Different Variants
        </h3>
        <div className="flex gap-4">
          <CompactThemeToggle 
            variant="outline" 
            onThemeChange={action('compact-outline-changed')}
          />
          <CompactThemeToggle 
            variant="ghost" 
            onThemeChange={action('compact-ghost-changed')}
          />
          <CompactThemeToggle 
            variant="secondary" 
            size="lg"
            onThemeChange={action('compact-secondary-changed')}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact variant for space-constrained layouts. Removes labels for minimal footprint while maintaining accessibility.',
      },
    },
  },
};

// Pre-configured variants
export const PreConfiguredVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Header Variant (Compact, Ghost, Small)
        </h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-900 dark:text-white font-medium">Application Header</span>
            <ThemeToggleVariants.Header onThemeChange={action('header-theme-changed')} />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Settings Variant (Outline, Medium, With Labels)
        </h3>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Theme Preference</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose your preferred color theme
              </p>
            </div>
            <ThemeToggleVariants.Settings onThemeChange={action('settings-theme-changed')} />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Mobile Variant (Large, Compact, Secondary)
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg md:hidden">
          <div className="flex justify-center">
            <ThemeToggleVariants.Mobile onThemeChange={action('mobile-theme-changed')} />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          High Contrast Variant (Large, Outline, Right Labels)
        </h3>
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 p-6 rounded-lg">
          <ThemeToggleVariants.HighContrast onThemeChange={action('high-contrast-theme-changed')} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured variants optimized for common use cases: header navigation, settings pages, mobile layouts, and high contrast needs.',
      },
    },
  },
};

// Custom icons
export const CustomIcons: Story = {
  args: {
    showLabels: true,
    labelPosition: 'bottom',
    icons: {
      light: SunIcon,
      dark: MoonIcon,
      system: CogIcon, // Custom icon for system preference
    },
    onThemeChange: action('custom-icons-theme-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Theme toggle with custom icons. Allows complete customization of theme indicators while maintaining accessibility.',
      },
    },
  },
};

// Dark mode demonstration
export const DarkModeDemo: Story = {
  render: () => (
    <div className="dark">
      <div className="bg-gray-900 p-8 rounded-lg">
        <div className="mb-6">
          <h3 className="text-white text-lg font-medium mb-2">
            Dark Mode Theme Toggle
          </h3>
          <p className="text-gray-300 text-sm">
            All variants adapt to dark mode with proper contrast ratios and accessibility.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-gray-200 font-medium">Standard Variants</h4>
            <ThemeToggle 
              variant="default" 
              showLabels 
              labelPosition="bottom"
              onThemeChange={action('dark-default-changed')}
            />
            <ThemeToggle 
              variant="outline" 
              showLabels 
              labelPosition="bottom"
              onThemeChange={action('dark-outline-changed')}
            />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-gray-200 font-medium">Alternative Variants</h4>
            <ThemeToggle 
              variant="ghost" 
              showLabels 
              labelPosition="bottom"
              onThemeChange={action('dark-ghost-changed')}
            />
            <ThemeToggle 
              variant="secondary" 
              showLabels 
              labelPosition="bottom"
              onThemeChange={action('dark-secondary-changed')}
            />
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-gray-200 font-medium mb-4">Compact Versions</h4>
          <div className="flex gap-4">
            <CompactThemeToggle 
              variant="outline"
              onThemeChange={action('dark-compact-outline')}
            />
            <CompactThemeToggle 
              variant="ghost"
              onThemeChange={action('dark-compact-ghost')}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dark mode variants maintaining WCAG 2.1 AA contrast ratios. All components adapt seamlessly to dark themes.',
      },
    },
  },
};

// Real-world integration scenarios
export const ApplicationHeaderScenario: Story = {
  render: () => (
    <div className="w-full max-w-6xl">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-600 text-white p-2 rounded">
                <ComputerDesktopIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  DreamFactory Admin
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Database API Management
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <BellIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <CogIcon className="h-5 w-5" />
              </button>
              <ThemeToggleVariants.Header onThemeChange={action('header-scenario-changed')} />
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <UserIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world application header integration showing theme toggle alongside other navigation elements.',
      },
    },
  },
};

export const SettingsPageScenario: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            User Preferences
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your DreamFactory Admin experience
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Color Theme
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose your preferred color theme or follow system settings
              </p>
            </div>
            <ThemeToggleVariants.Settings onThemeChange={action('settings-scenario-changed')} />
          </div>
          
          <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Language
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select your preferred language for the interface
              </p>
            </div>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Auto-refresh Schema
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically refresh database schemas every 5 minutes
              </p>
            </div>
            <input 
              type="checkbox" 
              className="h-4 w-4 text-primary-600 border-gray-300 rounded"
              defaultChecked
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Settings page integration showing theme toggle as part of comprehensive user preferences interface.',
      },
    },
  },
};

// Accessibility testing story
export const AccessibilityTesting: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Keyboard Navigation Test
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Use Tab to navigate between theme options and Enter/Space to select. Focus rings should be clearly visible with 3:1 contrast.
        </p>
        <ThemeToggle 
          showLabels 
          labelPosition="bottom"
          onThemeChange={action('keyboard-nav-changed')}
        />
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Touch Target Test
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          All theme toggle buttons maintain minimum 44x44px touch targets (outlined in red for testing).
        </p>
        <div className="space-y-4">
          <ThemeToggle 
            size="sm" 
            className="[&>div>button]:ring-2 [&>div>button]:ring-red-500"
            onThemeChange={action('touch-target-sm')}
          />
          <ThemeToggle 
            size="md" 
            className="[&>div>button]:ring-2 [&>div>button]:ring-red-500"
            onThemeChange={action('touch-target-md')}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Screen Reader Announcements
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Theme changes are announced to screen readers with proper ARIA labels and descriptions.
        </p>
        <ThemeToggle 
          showLabels 
          labelPosition="right"
          ariaLabel="Theme preference selection with screen reader support"
          onThemeChange={action('screen-reader-changed')}
        />
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          High Contrast Mode
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          High contrast variant with enhanced visual boundaries for users with visual impairments.
        </p>
        <ThemeToggleVariants.HighContrast onThemeChange={action('high-contrast-changed')} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility testing scenarios including keyboard navigation, touch targets, screen reader support, and high contrast mode.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation - find the first theme toggle button
    const themeButtons = canvas.getAllByRole('switch');
    if (themeButtons.length > 0) {
      await userEvent.tab();
      await expect(themeButtons[0]).toHaveFocus();
    }
    
    // Test touch targets for the small size variant
    const smallButtons = canvas.getAllByRole('switch');
    if (smallButtons.length > 3) { // Assuming the small variant comes after the main demo
      const buttonRect = smallButtons[3].getBoundingClientRect();
      await expect(buttonRect.width).toBeGreaterThanOrEqual(44);
      await expect(buttonRect.height).toBeGreaterThanOrEqual(44);
    }
  },
};

// Performance testing story
export const PerformanceTest: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Multiple Theme Toggles
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Testing performance with multiple theme toggle instances.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <ThemeToggle
              key={i}
              size={i % 3 === 0 ? 'sm' : i % 3 === 1 ? 'md' : 'lg'}
              variant={['default', 'outline', 'ghost'][i % 3] as any}
              onThemeChange={action(`performance-${i}`)}
            />
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Rapid State Changes
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Testing theme toggle responsiveness with rapid interactions.
        </p>
        <div className="flex gap-4">
          <ThemeToggle showLoading onThemeChange={action('rapid-1')} />
          <ThemeToggle disabled onThemeChange={action('rapid-2')} />
          <ThemeToggle showLabels labelPosition="top" onThemeChange={action('rapid-3')} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Performance testing with multiple theme toggle instances and rapid state changes to ensure smooth operation.',
      },
    },
  },
};

// System theme integration demo
export const SystemThemeIntegration: Story = {
  render: () => {
    const [currentSystemTheme, setCurrentSystemTheme] = useState<'light' | 'dark'>('light');
    
    return (
      <MockThemeProvider initialTheme="system" forceResolved={currentSystemTheme}>
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              System Theme Simulation
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Simulate system theme changes to see automatic theme following.
            </p>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setCurrentSystemTheme('light')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm"
              >
                Simulate Light System
              </button>
              <button
                onClick={() => setCurrentSystemTheme('dark')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm"
              >
                Simulate Dark System
              </button>
            </div>
            
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current system preference: <strong>{currentSystemTheme}</strong>
                </p>
              </div>
              <ThemeToggle 
                showLabels 
                labelPosition="bottom"
                onThemeChange={action('system-integration-changed')}
              />
            </div>
          </div>
        </div>
      </MockThemeProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of system theme integration with simulated OS preference changes. Shows automatic theme following when system mode is selected.',
      },
    },
  },
};