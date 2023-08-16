import * as RegularIcons from '@fortawesome/free-regular-svg-icons';
import * as SolidIcons from '@fortawesome/free-solid-svg-icons';
import * as BrandIcons from '@fortawesome/free-brands-svg-icons';

export function iconExist(icon: string) {
  return (
    Object.keys(RegularIcons).includes(icon) ||
    Object.keys(SolidIcons).includes(icon) ||
    Object.keys(BrandIcons).includes(icon)
  );
}

export function getIcon(icon: string) {
  return (
    (BrandIcons as any)[icon] ||
    (SolidIcons as any)[icon] ||
    (RegularIcons as any)[icon]
  );
}
