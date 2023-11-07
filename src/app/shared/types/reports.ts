export type ServiceReportData = {
  id: number;
  serviceId: number | null;
  serviceName: string;
  userEmail: string;
  action: string;
  requestVerb: string;
  createdDate: string;
  lastModifiedDate: string;
};
