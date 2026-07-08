import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent } from 'src/app/shared/utilities/http-contexts';
import { ArtifactKeyOption } from 'src/app/shared/components/df-artifact-card/df-artifact-card.component';

/** Resolved Live API Card inputs. `apiKey` is the first working key (the one
 *  the default curl renders with); '' when nothing probed 200. `keys` sorts
 *  working keys first so the card's default selection returns 200 out of the
 *  box. `sampleTable` is the table the top key was proven against, else the
 *  first introspected table, else the caller's fallback. */
export interface ArtifactResolution {
  apiKey: string;
  sampleTable: string;
  keys: ArtifactKeyOption[];
}

interface ArtifactCandidate {
  label: string;
  apiKey: string;
  tables: string[];
  grantsAll: boolean;
}

/**
 * Resolves a key + sample table for the Live API Card (`df-artifact-card`)
 * whose curl PROVABLY returns 200. Extracted verbatim from
 * df-service-details so Home, service Overview, Docs, and post-create can all
 * mount the card off one probe.
 *
 * Embedding any key whose role claims access is not enough: seed keys can be
 * expired (agent keys have a TTL) or scoped to tables other than the
 * auto-picked one, so the on-screen curl 400/403'd. This probes each candidate
 * key (raw fetch, API key only, no session token) on a table its role grants
 * and surfaces the first that returns 200.
 */
@Injectable({ providedIn: 'root' })
export class DfArtifactResolverService {
  private http = inject(HttpClient);

  /**
   * @param serviceId   numeric service id
   * @param serviceName service name (path segment for the base URL)
   * @param fallbackTable table to keep when introspection/probing find nothing
   *                      (the card's placeholder); defaults to 'your_table'.
   */
  async resolveWorkingKeyAndTable(
    serviceId: number,
    serviceName: string,
    fallbackTable = 'your_table'
  ): Promise<ArtifactResolution> {
    let sampleTable = fallbackTable;
    if (!serviceName || typeof serviceId !== 'number') {
      return { apiKey: '', sampleTable, keys: [] };
    }
    try {
      const tables = await this.introspectTables(serviceName);
      if (tables[0]) {
        sampleTable = tables[0];
      }
      const candidates = await this.resolveCandidates(serviceId);
      if (!candidates.length) {
        return { apiKey: '', sampleTable, keys: [] };
      }
      const origin = window.location.origin;
      const working: Array<{ option: ArtifactKeyOption; table: string }> = [];
      const rest: ArtifactKeyOption[] = [];
      for (const c of candidates) {
        const option: ArtifactKeyOption = {
          label: c.label,
          apiKey: c.apiKey,
        };
        const tryTables = (
          c.grantsAll ? tables : c.tables.filter(t => tables.includes(t))
        ).slice(0, 5);
        let hit = '';
        for (const t of tryTables) {
          try {
            const r = await fetch(
              `${origin}${BASE_URL}/${serviceName}/_table/${encodeURIComponent(
                t
              )}?limit=1`,
              {
                headers: { 'X-DreamFactory-API-Key': c.apiKey },
                // Omit the admin session cookie so the probe tests the API key
                // ALONE - the same honest request the copyable curl makes.
                credentials: 'omit',
              }
            );
            if (r.ok) {
              hit = t;
              break;
            }
          } catch {
            // network hiccup; try the next table
          }
        }
        if (hit) {
          // Proven 200: this is the only kind of key the card may claim runs.
          working.push({ option: { ...option, verified: true }, table: hit });
        } else {
          rest.push(option);
        }
      }
      // Nothing probed 200 (e.g. every candidate key is expired or scoped away):
      // never surface an unproven key as the default that "returns 200". Fall
      // back to the card's YOUR_API_KEY placeholder instead of fabricating a hit.
      if (!working.length) {
        return { apiKey: '', sampleTable, keys: [] };
      }
      sampleTable = working[0].table;
      const keys = [...working.map(w => w.option), ...rest];
      return { apiKey: keys[0].apiKey, sampleTable, keys };
    } catch {
      return { apiKey: '', sampleTable, keys: [] };
    }
  }

  // Roles that can reach this service, resolved to their apps' keys plus the
  // GET-granted table names parsed from each role's service access (grantsAll
  // when the role grants _table/* or *). Own two-step query because
  // ApiKeysService drops the access components this needs.
  private async resolveCandidates(
    serviceId: number
  ): Promise<ArtifactCandidate[]> {
    const rolesRes = await firstValueFrom(
      this.http.get<any>(
        `${BASE_URL}/system/role?related=role_service_access_by_role_id&limit=200`,
        { context: silent() }
      )
    );
    const perRole = new Map<number, { tables: string[]; grantsAll: boolean }>();
    for (const role of rolesRes?.resource ?? []) {
      if (role?.isActive === false) {
        continue;
      }
      let grantsAll = false;
      const tables: string[] = [];
      for (const a of role?.roleServiceAccessByRoleId ?? []) {
        // A null/undefined service_id is DreamFactory's "all services" grant
        // (e.g. the API Explorer role). It reaches this service too, so the key
        // that actually returns 200 session-less isn't skipped for lacking an
        // exact service_id row. GET bit (verbMask & 1) still required.
        const svc = a?.serviceId;
        const appliesToService =
          svc === serviceId || svc === null || svc === undefined;
        if (!appliesToService || ((a?.verbMask ?? 0) & 1) === 0) {
          continue;
        }
        const comp: string = a?.component ?? '';
        if (comp === '' || comp === '*' || comp === '_table/*') {
          grantsAll = true;
        } else if (comp.startsWith('_table/')) {
          const t = comp
            .slice('_table/'.length)
            .replace(/\/\*$/, '')
            .replace(/\/$/, '');
          if (t && t !== '*') {
            tables.push(t);
          }
        }
      }
      if (grantsAll || tables.length) {
        perRole.set(role.id, { tables, grantsAll });
      }
    }
    if (!perRole.size) {
      return [];
    }
    const roleIds = [...perRole.keys()];
    const appResps = await Promise.all(
      roleIds.map(roleId =>
        firstValueFrom(
          this.http.get<any>(
            `${BASE_URL}/system/app?filter=role_id=${roleId}&fields=*`,
            { context: silent() }
          )
        ).catch(() => ({ resource: [] }))
      )
    );
    const out: ArtifactCandidate[] = [];
    roleIds.forEach((roleId, i) => {
      const grant = perRole.get(roleId);
      if (!grant) {
        return;
      }
      for (const app of appResps[i]?.resource ?? []) {
        if (app?.isActive === false || !app?.apiKey) {
          continue;
        }
        out.push({
          label: app.name || 'API key',
          apiKey: app.apiKey,
          tables: grant.tables,
          grantsAll: grant.grantsAll,
        });
      }
    });
    return out;
  }

  // Table names for the service (admin session lists them even when a scoped
  // key cannot). Empty on failure; the card keeps its placeholder table.
  private async introspectTables(name: string): Promise<string[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${BASE_URL}/${name}/_table`, { context: silent() })
      );
      return (res?.resource ?? [])
        .map((t: any) => (typeof t === 'string' ? t : t?.name))
        .filter((t: any): t is string => !!t);
    } catch {
      return [];
    }
  }
}
