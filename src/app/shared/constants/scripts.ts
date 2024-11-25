import { translate } from '@ngneat/transloco';
import { AceEditorMode } from '../types/scripts';

export const SCRIPT_TYPES = [
  {
    label: translate('scriptTypes.nodejs'),
    value: AceEditorMode.NODEJS,
    extension: 'js',
  },
  {
    label: translate('scriptTypes.php'),
    value: AceEditorMode.PHP,
    extension: 'php',
  },
  {
    label: translate('scriptTypes.python3'),
    value: AceEditorMode.PYTHON3,
    extension: 'py',
  },
];
