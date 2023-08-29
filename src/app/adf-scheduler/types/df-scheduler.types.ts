export type UpdateSchedulePayload = {
  component: string;
  createdById: number;
  createdDate: string;
  description: string;
  frequency: number;
  hasLog: boolean;
  id: number;
  isActive: boolean;
  lastModifiedById: number | null;
  lastModifiedDate: string;
  name: string;
  payload: string;
  service: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
  serviceId: number;
  serviceName: string;
  verb: string;
  verbMask: number;
};

export type CreateSchedulePayload = {
  component: string;
  description: string;
  frequency: number;
  id: number | null;
  isActive: boolean;
  name: string;
  payload: string;
  service: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
  serviceId: number;
  serviceName: string;
  verb: string;
  verbMask: number;
};
