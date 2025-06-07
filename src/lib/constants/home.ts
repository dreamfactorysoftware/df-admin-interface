/**
 * @fileoverview Home page constants for DreamFactory Admin Interface
 * @description Provides resource links, tutorial links, and SDK information for the home module
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19.0.0
 */

import {
  BookOpen,
  Video,
  MessageSquare,
  Bug,
  Twitter,
  Edit3,
  LifeBuoy,
  FileText,
  type LucideIcon,
} from 'lucide-react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Interface for resource link items
 * Supports external navigation with accessibility features
 */
export interface ResourceLink {
  /** Translation key for the resource name */
  name: string;
  /** Lucide React icon component */
  icon: LucideIcon;
  /** External URL for the resource */
  link: string;
}

/**
 * Interface for SDK and tutorial links
 * Includes local assets for platform branding
 */
export interface ExampleLink {
  /** Translation key for the platform name */
  name: string;
  /** External URL for the SDK or tutorial */
  url: string;
  /** Local image asset path */
  icon: string;
}

// =============================================================================
// RESOURCE LINK DEFINITIONS
// =============================================================================

/**
 * Getting Started Guide
 * Primary entry point for new users
 */
const gettingStartedGuide: ResourceLink = {
  name: 'home.resourceLinks.gettingStartedGuide',
  icon: FileText,
  link: 'https://guide.dreamfactory.com',
};

/**
 * Written Tutorials
 * Comprehensive step-by-step documentation
 */
const writtenTutorials: ResourceLink = {
  name: 'home.resourceLinks.writtenTutorials',
  icon: FileText,
  link: 'http://wiki.dreamfactory.com/DreamFactory/Tutorials',
};

/**
 * Video Tutorials
 * Visual learning resources and walkthroughs
 */
const videoTutorials: ResourceLink = {
  name: 'home.resourceLinks.videoTutorials',
  icon: Video,
  link: 'https://wiki.dreamfactory.com/DreamFactory/Videos',
};

/**
 * Full Documentation
 * Complete API and platform documentation
 */
const fullDocumentation: ResourceLink = {
  name: 'home.resourceLinks.fullDocumentation',
  icon: BookOpen,
  link: 'https://wiki.dreamfactory.com/',
};

/**
 * Community Forum
 * User support and discussion platform
 */
const communityForum: ResourceLink = {
  name: 'home.resourceLinks.communityForum',
  icon: MessageSquare,
  link: 'http://community.dreamfactory.com/',
};

/**
 * Bug and Feature Requests
 * GitHub issues for bug reports and feature requests
 */
const bugFeatureRequests: ResourceLink = {
  name: 'home.resourceLinks.bugFeatureRequests',
  icon: Bug,
  link: 'https://github.com/dreamfactorysoftware/dreamfactory/issues',
};

/**
 * DreamFactory Twitter
 * Official Twitter account for updates and announcements
 */
const dreamFactoryTwitter: ResourceLink = {
  name: 'home.resourceLinks.twitter',
  icon: Twitter,
  link: 'https://twitter.com/dfsoftwareinc',
};

/**
 * DreamFactory Blog
 * Technical articles and company updates
 */
const dreamFactoryBlog: ResourceLink = {
  name: 'home.resourceLinks.blog',
  icon: Edit3,
  link: 'https://blog.dreamfactory.com/',
};

/**
 * Contact Support
 * Direct support and professional services
 */
const contactSupport: ResourceLink = {
  name: 'home.resourceLinks.contactSupport',
  icon: LifeBuoy,
  link: 'https://www.dreamfactory.com/support',
};

// =============================================================================
// EXPORTED RESOURCE COLLECTIONS
// =============================================================================

/**
 * Welcome page resource links
 * Curated list for first-time users and dashboard
 */
export const welcomePageResources: readonly ResourceLink[] = [
  gettingStartedGuide,
  videoTutorials,
  fullDocumentation,
  communityForum,
  bugFeatureRequests,
  dreamFactoryTwitter,
  dreamFactoryBlog,
  contactSupport,
] as const;

/**
 * Resources page resource links
 * Comprehensive list for dedicated resources page
 */
export const resourcesPageResources: readonly ResourceLink[] = [
  writtenTutorials,
  videoTutorials,
  fullDocumentation,
  communityForum,
  bugFeatureRequests,
  dreamFactoryTwitter,
  dreamFactoryBlog,
  contactSupport,
] as const;

// =============================================================================
// SDK AND TUTORIAL LINKS
// =============================================================================

/**
 * Native platform SDK examples
 * Mobile and desktop development resources
 */
export const nativeExampleLinks: readonly ExampleLink[] = [
  {
    name: 'home.brandNames.objectiveC',
    url: 'https://github.com/dreamfactorysoftware/ios-sdk',
    icon: 'in_product_apple_lil.png',
  },
  {
    name: 'home.brandNames.appleSwift',
    url: 'https://github.com/dreamfactorysoftware/ios-swift-sdk',
    icon: 'in_product_swift_lil.png',
  },
  {
    name: 'home.brandNames.androidJava',
    url: 'https://github.com/dreamfactorysoftware/android-sdk',
    icon: 'in_product_android_lil.png',
  },
  {
    name: 'home.brandNames.microsoftNet',
    url: 'https://github.com/dreamfactorysoftware/.net-sdk',
    icon: 'in_product_dotnet_lil.png',
  },
] as const;

/**
 * JavaScript framework SDK examples
 * Web development and hybrid mobile resources
 */
export const javaScriptExampleLinks: readonly ExampleLink[] = [
  {
    name: 'home.brandNames.javaScript',
    url: 'https://github.com/dreamfactorysoftware/javascript-sdk',
    icon: 'in_product_javascript_lil.png',
  },
  {
    name: 'home.brandNames.ionic',
    url: 'https://github.com/dreamfactorysoftware/ionic-sdk',
    icon: 'in_product_ionic_lil.png',
  },
  {
    name: 'home.brandNames.titanium',
    url: 'https://github.com/dreamfactorysoftware/titanium-sdk',
    icon: 'in_product_titanium_lil.png',
  },
  {
    name: 'home.brandNames.angularJs',
    url: 'https://github.com/dreamfactorysoftware/angular-sdk',
    icon: 'in_product_angular_lil.svg',
  },
  {
    name: 'home.brandNames.angular2',
    url: 'https://github.com/dreamfactorysoftware/angular2-sdk',
    icon: 'in_product_angular2_lil.png',
  },
  {
    name: 'home.brandNames.react',
    url: 'https://github.com/dreamfactorysoftware/reactjs-sdk',
    icon: 'in_product_reactjs_lil.png',
  },
] as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get resource link by name
 * Utility function for programmatic access to specific resources
 */
export function getResourceByName(name: string): ResourceLink | undefined {
  return resourcesPageResources.find(resource => resource.name === name);
}

/**
 * Get all resource link URLs
 * Utility function for SEO and preloading purposes
 */
export function getAllResourceUrls(): string[] {
  return resourcesPageResources.map(resource => resource.link);
}

/**
 * Get all SDK URLs
 * Utility function for developer onboarding tracking
 */
export function getAllSDKUrls(): string[] {
  return [
    ...nativeExampleLinks.map(link => link.url),
    ...javaScriptExampleLinks.map(link => link.url),
  ];
}

// =============================================================================
// METADATA FOR SEO AND ANALYTICS
// =============================================================================

/**
 * Resource categories for analytics and organization
 */
export const resourceCategories = {
  documentation: ['gettingStartedGuide', 'writtenTutorials', 'fullDocumentation'],
  multimedia: ['videoTutorials'],
  community: ['communityForum', 'dreamFactoryTwitter', 'dreamFactoryBlog'],
  support: ['bugFeatureRequests', 'contactSupport'],
} as const;

/**
 * Platform categories for SDK tracking
 */
export const platformCategories = {
  mobile: ['objectiveC', 'appleSwift', 'androidJava', 'ionic'],
  web: ['javaScript', 'angularJs', 'angular2', 'react'],
  desktop: ['microsoftNet'],
  crossPlatform: ['titanium'],
} as const;