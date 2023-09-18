export type FilterQueryType =
  | 'user'
  | 'apiDocs'
  | 'apps'
  | 'cache'
  | 'emailTemplates'
  | 'serviceReports'
  | 'roles'
  | 'limits'
  | 'services';

export const getFilterQuery = (type?: FilterQueryType) => (value: string) => {
  switch (type) {
    case 'user':
      return `(first_name like "%${value}%") or (last_name like "%${value}%") or (name like "%${value}%") or (email like "%${value}%")`;
    case 'apiDocs':
      return `((name like "%${value}%") or (label like "%${value}%") or (description like "%${value}%"))`;
    case 'apps':
      return `(name like "%${value}%") or (description like "%${value}%")`;
    case 'cache':
      return `(label like "%${value}%")`;
    case 'emailTemplates':
      return `(name like "%${value}%") or (description like "%${value}%")`;
    case 'serviceReports':
      return `(id like ${value}) or (service_id like ${value}) or (service_name like "%${value}%") or (user_email like "%${value}%") or (action like "%${value}%") or (request_verb like "%${value}%")`;
    case 'roles':
      return `(id like "%${value}%") or (name like "%${value}%") or (description like "%${value}%")`;
    case 'limits':
      return `(name like "%${value}%")`;
    case 'services':
      return `((name like "%${value}%") or (label like "%${value}%") or (description like "%${value}%") or (type like "%${value}%"))`;
    default:
      return '';
  }
};
