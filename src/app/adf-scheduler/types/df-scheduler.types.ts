import { Service } from 'src/app/shared/types/service';

export type UpdateSchedulePayload = CreateSchedulePayload & {
  createdById: number;
  createdDate: string;
  hasLog: boolean;
  lastModifiedById: number | null;
  lastModifiedDate: string;
  taskLogByTaskId: {
    taskId: number;
    statusCode: number;
    lastModifiedDate: string;
    createdDate: string;
    content: string;
  } | null;
};

export type CreateSchedulePayload = {
  component: string;
  description: string | null;
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

export interface SchedulerTaskData {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  serviceId: number;
  component: string;
  frequency: number;
  payload: string | null;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
  verb: string;
  verbMask: number;
  taskLogByTaskId: {
    taskId: number;
    statusCode: number;
    lastModifiedDate: string;
    createdDate: string;
    content: string;
  } | null;
  serviceByServiceId: Service;
}
