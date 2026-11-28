import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsumptionRecord } from '../domain/consumption-record.entity';
import { IamStore } from '../../iam/application/iam.store';

import { extractHttpErrorMessage } from '../../shared/infrastructure/http-error.util';

interface ConsumptionHistoryResource {
  id: number;
  userId?: number;
  recordedAt?: string;
  energyKwh?: number;
  date?: string;
  consumption?: number | string;
  cost?: number | string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);
  private readonly baseUrl = environment.apiBaseUrl;

  getConsumptionRecords(from?: string, to?: string): Observable<ConsumptionRecord[]> {
    const userId = this.iamStore.currentUserId();
    const query = this.buildQueryString(userId, from, to);
    return this.http.get<ConsumptionHistoryResource[]>(
      `${this.baseUrl}${environment.consumptionHistoriesEndpointPath}${query}`
    ).pipe(
      map(resources => (resources ?? []).map(r => this.toRecord(r))),
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error loading consumption history.')))
      )
    );
  }

  exportConsumptionCsv(from?: string, to?: string): Observable<Blob> {
    const userId = this.iamStore.currentUserId();
    const query = this.buildQueryString(userId, from, to);
    return this.http.get(
      `${this.baseUrl}${environment.consumptionHistoriesEndpointPath}/export${query}`,
      { responseType: 'blob' }
    ).pipe(
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error exporting consumption CSV.')))
      )
    );
  }

  private buildQueryString(userId?: number | null, from?: string, to?: string): string {
    const params = new URLSearchParams();
    if (userId) {
      params.set('userId', String(userId));
    }
    if (from && from.trim()) {
      params.set('from', from.trim());
    }
    if (to && to.trim()) {
      params.set('to', to.trim());
    }
    const serialized = params.toString();
    return serialized ? `?${serialized}` : '';
  }

  private toRecord(resource: ConsumptionHistoryResource): ConsumptionRecord {
    const rawDate = resource.recordedAt ? resource.recordedAt.slice(0, 10) : (resource.date ?? '');
    let isoDate = rawDate;
    if (rawDate && rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    let kwh = 0;
    if (typeof resource.energyKwh === 'number') {
      kwh = resource.energyKwh;
    } else if (typeof resource.consumption === 'number') {
      kwh = resource.consumption;
    } else if (typeof resource.consumption === 'string') {
      const cleaned = resource.consumption.replace(/[^\d.,-]/g, '').replace(',', '.');
      kwh = parseFloat(cleaned) || 0;
    }

    return {
      id: resource.id,
      date: isoDate,
      consumptionKwh: Number(kwh.toFixed(2))
    };
  }
}
