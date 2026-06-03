import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { URLS } from 'src/app/shared/constants/urls';
import {
  LockResponse,
  PromoteResponse,
  ServiceSummary,
  SnapshotHistoryResponse,
  TableDiffResponse,
  TableOpenApiResponse,
  TablesResponse,
  TestResponse,
  UnlockServiceResponse,
  UpdateServiceConfigBody,
} from '../types';

/**
 * HTTP client for the schema-contracts system resource. Auth is supplied by
 * the session-token interceptor, so this service only deals with URL shape
 * and response typing.
 *
 * Endpoints follow the design in df-schema-contracts/docs/SYSTEM_API.md.
 */
@Injectable({ providedIn: 'root' })
export class DfSchemaContractsService {
  private http = inject(HttpClient);

  listTables(serviceName: string): Observable<TablesResponse> {
    return this.http.get<TablesResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/tables`
    );
  }

  getServiceSummary(serviceName: string): Observable<ServiceSummary> {
    return this.http.get<ServiceSummary>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}`
    );
  }

  updateServiceConfig(
    serviceName: string,
    body: UpdateServiceConfigBody
  ): Observable<ServiceSummary> {
    return this.http.patch<ServiceSummary>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}`,
      body
    );
  }

  promoteService(serviceName: string): Observable<PromoteResponse> {
    return this.http.post<PromoteResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/promote`,
      {}
    );
  }

  unlockService(serviceName: string): Observable<UnlockServiceResponse> {
    return this.http.delete<UnlockServiceResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}`
    );
  }

  getTableDiff(
    serviceName: string,
    tableName: string
  ): Observable<TableDiffResponse> {
    return this.http.get<TableDiffResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/tables/${encodeURIComponent(tableName)}/diff`
    );
  }

  getTableOpenApi(
    serviceName: string,
    tableName: string
  ): Observable<TableOpenApiResponse> {
    return this.http.get<TableOpenApiResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/tables/${encodeURIComponent(tableName)}/openapi`
    );
  }

  lockTable(serviceName: string, tableName: string): Observable<LockResponse> {
    return this.http.post<LockResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/tables/${encodeURIComponent(tableName)}/lock`,
      {}
    );
  }

  unlockTable(serviceName: string, tableName: string): Observable<void> {
    return this.http.delete<void>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/tables/${encodeURIComponent(tableName)}`
    );
  }

  /**
   * Dry-run preview. Returns what Lock would do without actually writing.
   * Works whether or not the table is currently locked.
   */
  testTable(serviceName: string, tableName: string): Observable<TestResponse> {
    return this.http.post<TestResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/tables/${encodeURIComponent(tableName)}/test`,
      {}
    );
  }

  /**
   * List every snapshot version (active + archived) for one table. Metadata
   * only — fetch a specific version's full schema via getSnapshotVersion.
   */
  listSnapshots(
    serviceName: string,
    tableName: string
  ): Observable<SnapshotHistoryResponse> {
    return this.http.get<SnapshotHistoryResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/tables/${encodeURIComponent(tableName)}/snapshots`
    );
  }

  /**
   * Fetch a specific snapshot version (active or archived). Returns full
   * snapshot row including decoded canonical schema.
   */
  getSnapshotVersion(
    serviceName: string,
    tableName: string,
    version: number
  ): Observable<LockResponse> {
    return this.http.get<LockResponse>(
      `${URLS.SCHEMA_CONTRACT}/${encodeURIComponent(serviceName)}/tables/${encodeURIComponent(tableName)}/snapshots/${version}`
    );
  }
}
