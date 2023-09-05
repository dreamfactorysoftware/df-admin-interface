import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { inject } from '@angular/core';
import { EMAIL_TEMPLATES_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { EmailTemplate } from '../df-email-templates/df-email-templates.types';

export const DfEmailTemplatesResolver: ResolveFn<
  GenericListResponse<EmailTemplate>
> = () => {
  const crudService = inject(EMAIL_TEMPLATES_SERVICE_TOKEN);
  return crudService.getAll<GenericListResponse<EmailTemplate>>({
    // include_count: true,
  });
};

export const DfEmailTemplateDetailsResolver: ResolveFn<EmailTemplate> = (
  route: ActivatedRouteSnapshot
) => {
  const id = route.paramMap.get('id') ?? 0;
  const crudService = inject(EMAIL_TEMPLATES_SERVICE_TOKEN);
  return crudService.get<EmailTemplate>(id, {
    // related: 'role_by_role_id',
    fields: '*',
  });
};
