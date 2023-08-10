import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import {
  faBook,
  faBug,
  faComments,
  faFileLines,
  faLifeRing,
  faPenToSquare,
  faVideo,
} from '@fortawesome/free-solid-svg-icons';

const gettingStartedGuide = {
  name: 'home.resourceLinks.gettingStartedGuide',
  icon: faFileLines,
  link: 'https://guide.dreamfactory.com',
};

const writtenTutorials = {
  name: 'home.resourceLinks.writtenTutorials',
  icon: faFileLines,
  link: 'http://wiki.dreamfactory.com/DreamFactory/Tutorials',
};

const videoTutorials = {
  name: 'home.resourceLinks.videoTutorials',
  icon: faVideo,
  link: 'https://wiki.dreamfactory.com/DreamFactory/Videos',
};

const fullDocumentation = {
  name: 'home.resourceLinks.fullDocumentation',
  icon: faBook,
  link: 'https://wiki.dreamfactory.com/',
};

const communityForum = {
  name: 'home.resourceLinks.communityForum',
  icon: faComments,
  link: 'http://community.dreamfactory.com/',
};

const bugFeatureRequests = {
  name: 'home.resourceLinks.bugFeatureRequests',
  icon: faBug,
  link: 'https://github.com/dreamfactorysoftware/dreamfactory/issues',
};

const dreamFactoryTwitter = {
  name: 'home.resourceLinks.twitter',
  icon: faTwitter,
  link: 'https://twitter.com/dfsoftwareinc',
};

const dreamFactoryBlog = {
  name: 'home.resourceLinks.blog',
  icon: faPenToSquare,
  link: 'https://blog.dreamfactory.com/',
};

const contactSupport = {
  name: 'home.resourceLinks.contactSupport',
  icon: faLifeRing,
  link: 'https://www.dreamfactory.com/support',
};

export const welcomePageResources = [
  gettingStartedGuide,
  videoTutorials,
  fullDocumentation,
  communityForum,
  bugFeatureRequests,
  dreamFactoryTwitter,
  dreamFactoryBlog,
  contactSupport,
];
export const resourcesPageResources = [
  writtenTutorials,
  videoTutorials,
  fullDocumentation,
  communityForum,
  bugFeatureRequests,
  dreamFactoryTwitter,
  dreamFactoryBlog,
  contactSupport,
];

export const nativeExampleLinks = [
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
];

export const javaScriptExampleLinks = [
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
];
