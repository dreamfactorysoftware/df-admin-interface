import {
  faGithub,
  faGoogle,
  faMicrosoft,
  faAmazon,
  faApple,
  faLinkedin,
  faBitbucket,
  faFacebook,
  faSalesforce,
  faTwitch,
  faOpenid,
  IconDefinition,
} from '@fortawesome/free-brands-svg-icons';

const supportedIcons: { [keys: string]: IconDefinition } = {
  google: faGoogle,
  github: faGithub,
  microsoft: faMicrosoft,
  amazon: faAmazon,
  apple: faApple,
  linkedin: faLinkedin,
  bitbucket: faBitbucket,
  facebook: faFacebook,
  salesforce: faSalesforce,
  twitch: faTwitch,
  openid: faOpenid,
};

export function iconExist(icon: string) {
  return Object.keys(supportedIcons).includes(icon);
}

export function getIcon(icon: string) {
  return supportedIcons[icon];
}
