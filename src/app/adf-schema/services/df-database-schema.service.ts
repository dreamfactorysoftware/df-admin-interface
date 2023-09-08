import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL } from '../../core/constants/urls';

@Injectable()
export class DfDatabaseSchemaService {
  constructor(private http: HttpClient) {}

  getDatabaseSchemas(dbName: string) {
    const fieldParams = ['name', 'label'];
    return this.http.get(`${BASE_URL}/${dbName}/_schema`, {
      params: {
        fields: fieldParams.join(','),
        refresh: true,
      },
    });
  }

  getTableDetails(dbName: string, tableName: string) {
    console.log('getTableDetails', dbName, tableName);
    // return this.http.get(`${BASE_URL}/${dbName}/_schema/${tableName}`, {
    //   params: {
    //     refresh: true,
    //   },
    // });
  }
}
