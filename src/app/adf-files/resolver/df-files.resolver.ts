import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Files } from '../df-files.types';
import { FILE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

export const DfFilesResolver: ResolveFn<Files> = (
  route: ActivatedRouteSnapshot
) => {
  console.log('files resolver', route.paramMap);
  const crudService = inject(FILE_SERVICE_TOKEN);
  return crudService.getAll<Files>();
};

export const DfFolderResolver: ResolveFn<Files> = (
  route: ActivatedRouteSnapshot
) => {
  console.log('folder resolver', route.paramMap);
  const folderName = route.paramMap.get('folderName') ?? '';
  const crudService = inject(FILE_SERVICE_TOKEN);
  return crudService.get<Files>(`${folderName}/`, {
    limit: 0,
  });
};

export const DfFileResolver: ResolveFn<Files> = (
  route: ActivatedRouteSnapshot
) => {
  console.log('file resolver', route.paramMap);
  const folderName = route.paramMap.get('folderName') ?? '';
  const fileName = route.paramMap.get('fileName') ?? '';
  const crudService = inject(FILE_SERVICE_TOKEN);
  return crudService.get<Files>(`${folderName}/${fileName}`, {
    limit: 0,
  });
};
