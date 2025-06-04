/**
 * @fileoverview Home page constants for DreamFactory resources and example links
 * 
 * Migrated from Angular to React/Next.js implementation, replacing FontAwesome icons
 * with Lucide React icons for better React integration and bundle optimization.
 * Maintains all resource links and documentation references from the original Angular version.
 * 
 * Key Features:
 * - Resource links for documentation, tutorials, and community support
 * - SDK example links for native and JavaScript development
 * - Lucide React icons for consistent React ecosystem integration
 * - TypeScript interfaces for type safety
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import {
  Book,
  Bug,
  FileText,
  Video,
  MessageCircle,
  LifeBuoy,
  PenTool,
  Twitter,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Interface for resource link items
 * Replaces FontAwesome icon references with Lucide React icons
 */
export interface ResourceLink {
  name: string;
  icon: LucideIcon;
  link: string;
  description?: string;
  category?: 'documentation' | 'tutorial' | 'community' | 'support' | 'social';
}

/**
 * Interface for SDK example links
 * Maintains compatibility with existing image assets
 */
export interface ExampleLink {
  name: string;
  url: string;
  icon: string; // Image filename in assets/img/
  description?: string;
  category?: 'native' | 'javascript' | 'mobile' | 'web';
}

/**
 * Core resource definitions with Lucide React icons
 * Maintains all original URLs and translation keys from Angular version
 */
const gettingStartedGuide: ResourceLink = {
  name: 'home.resourceLinks.gettingStartedGuide',
  icon: FileText,
  link: 'https://guide.dreamfactory.com',
  description: 'Complete getting started guide for DreamFactory',
  category: 'documentation',
};

const writtenTutorials: ResourceLink = {
  name: 'home.resourceLinks.writtenTutorials',
  icon: FileText,
  link: 'http://wiki.dreamfactory.com/DreamFactory/Tutorials',
  description: 'Step-by-step written tutorials for common use cases',
  category: 'tutorial',
};

const videoTutorials: ResourceLink = {
  name: 'home.resourceLinks.videoTutorials',
  icon: Video,
  link: 'https://wiki.dreamfactory.com/DreamFactory/Videos',
  description: 'Video tutorials and demonstrations',
  category: 'tutorial',
};

const fullDocumentation: ResourceLink = {
  name: 'home.resourceLinks.fullDocumentation',
  icon: Book,
  link: 'https://wiki.dreamfactory.com/',
  description: 'Complete API documentation and reference materials',
  category: 'documentation',
};

const communityForum: ResourceLink = {
  name: 'home.resourceLinks.communityForum',
  icon: MessageCircle,
  link: 'http://community.dreamfactory.com/',
  description: 'Community support forum and discussions',
  category: 'community',
};

const bugFeatureRequests: ResourceLink = {
  name: 'home.resourceLinks.bugFeatureRequests',
  icon: Bug,
  link: 'https://github.com/dreamfactorysoftware/dreamfactory/issues',
  description: 'Report bugs and request new features',
  category: 'support',
};

const dreamFactoryTwitter: ResourceLink = {
  name: 'home.resourceLinks.twitter',
  icon: Twitter,
  link: 'https://twitter.com/dfsoftwareinc',
  description: 'Follow DreamFactory on Twitter for updates',
  category: 'social',
};

const dreamFactoryBlog: ResourceLink = {
  name: 'home.resourceLinks.blog',
  icon: PenTool,
  link: 'https://blog.dreamfactory.com/',
  description: 'Latest news, updates, and technical articles',
  category: 'social',
};

const contactSupport: ResourceLink = {
  name: 'home.resourceLinks.contactSupport',
  icon: LifeBuoy,
  link: 'https://www.dreamfactory.com/support',
  description: 'Contact our support team for help',
  category: 'support',
};

/**
 * SDK example link definitions
 * Maintains all original URLs and image references from Angular version
 */
export const nativeExampleLinks: ExampleLink[] = [
  {
    name: 'home.brandNames.objectiveC',
    url: 'https://github.com/dreamfactorysoftware/ios-sdk',
    icon: 'in_product_apple_lil.png',
    description: 'iOS SDK for Objective-C development',
    category: 'native',
  },
  {
    name: 'home.brandNames.appleSwift',
    url: 'https://github.com/dreamfactorysoftware/ios-swift-sdk',
    icon: 'in_product_swift_lil.png',
    description: 'iOS SDK for Swift development',
    category: 'native',
  },
  {
    name: 'home.brandNames.androidJava',
    url: 'https://github.com/dreamfactorysoftware/android-sdk',
    icon: 'in_product_android_lil.png',
    description: 'Android SDK for Java development',
    category: 'mobile',
  },
  {
    name: 'home.brandNames.microsoftNet',
    url: 'https://github.com/dreamfactorysoftware/.net-sdk',
    icon: 'in_product_dotnet_lil.png',
    description: '.NET SDK for Microsoft development',
    category: 'native',
  },
];

export const javaScriptExampleLinks: ExampleLink[] = [
  {
    name: 'home.brandNames.javaScript',
    url: 'https://github.com/dreamfactorysoftware/javascript-sdk',
    icon: 'in_product_javascript_lil.png',
    description: 'JavaScript SDK for web development',
    category: 'javascript',
  },
  {
    name: 'home.brandNames.ionic',
    url: 'https://github.com/dreamfactorysoftware/ionic-sdk',
    icon: 'in_product_ionic_lil.png',
    description: 'Ionic SDK for hybrid mobile apps',
    category: 'mobile',
  },
  {
    name: 'home.brandNames.titanium',
    url: 'https://github.com/dreamfactorysoftware/titanium-sdk',
    icon: 'in_product_titanium_lil.png',
    description: 'Titanium SDK for cross-platform development',
    category: 'mobile',
  },
  {
    name: 'home.brandNames.angularJs',
    url: 'https://github.com/dreamfactorysoftware/angular-sdk',
    icon: 'in_product_angular_lil.svg',
    description: 'AngularJS SDK for web applications',
    category: 'web',
  },
  {
    name: 'home.brandNames.angular2',
    url: 'https://github.com/dreamfactorysoftware/angular2-sdk',
    icon: 'in_product_angular2_lil.png',
    description: 'Angular 2+ SDK for modern web apps',
    category: 'web',
  },
  {
    name: 'home.brandNames.react',
    url: 'https://github.com/dreamfactorysoftware/reactjs-sdk',
    icon: 'in_product_reactjs_lil.png',
    description: 'React SDK for component-based development',
    category: 'web',
  },
];

/**
 * Welcome page resources (first-time user focused)
 * Subset of resources optimized for new users
 */
export const welcomePageResources: ResourceLink[] = [
  gettingStartedGuide,
  videoTutorials,
  fullDocumentation,
  communityForum,
  bugFeatureRequests,
  dreamFactoryTwitter,
  dreamFactoryBlog,
  contactSupport,
];

/**
 * Resources page resources (comprehensive list)
 * Complete list of all available resources and documentation
 */
export const resourcesPageResources: ResourceLink[] = [
  writtenTutorials,
  videoTutorials,
  fullDocumentation,
  communityForum,
  bugFeatureRequests,
  dreamFactoryTwitter,
  dreamFactoryBlog,
  contactSupport,
];

/**
 * Helper function to group resources by category
 * Useful for organizing resources in the UI
 */
export function groupResourcesByCategory(resources: ResourceLink[]): Record<string, ResourceLink[]> {
  return resources.reduce((groups, resource) => {
    const category = resource.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(resource);
    return groups;
  }, {} as Record<string, ResourceLink[]>);
}

/**
 * Helper function to get resources by category
 * Returns filtered list of resources for a specific category
 */
export function getResourcesByCategory(
  resources: ResourceLink[], 
  category: ResourceLink['category']
): ResourceLink[] {
  return resources.filter(resource => resource.category === category);
}

/**
 * Helper function to get all resource categories
 * Returns unique list of all categories used
 */
export function getResourceCategories(resources: ResourceLink[]): string[] {
  const categories = resources
    .map(resource => resource.category || 'other')
    .filter((category, index, array) => array.indexOf(category) === index);
  
  return categories.sort();
}

/**
 * Translation keys for resource categories
 * Used for internationalization of category labels
 */
export const resourceCategoryLabels = {
  documentation: 'home.resourceCategories.documentation',
  tutorial: 'home.resourceCategories.tutorial',
  community: 'home.resourceCategories.community',
  support: 'home.resourceCategories.support',
  social: 'home.resourceCategories.social',
  other: 'home.resourceCategories.other',
} as const;

/**
 * Default export for convenience
 * Exports all major resource arrays and utility functions
 */
export default {
  welcomePageResources,
  resourcesPageResources,
  nativeExampleLinks,
  javaScriptExampleLinks,
  groupResourcesByCategory,
  getResourcesByCategory,
  getResourceCategories,
  resourceCategoryLabels,
};