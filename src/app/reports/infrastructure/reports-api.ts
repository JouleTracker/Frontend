import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsumptionRecord } from '../domain/consumption-record.entity';
import { IamStore } from '../../iam/application/iam.store';

interface ConsumptionHistoryResource {
  id: number;
  userId?: number;
  date: string;
  consumption: number | string;
  cost?: number | string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);
  private readonly baseUrl = environment.apiBaseUrl;

  getConsumptionRecords(): Observable<ConsumptionRecord[]> {
    const userId = this.iamStore.currentUserId();
    const query = userId ? `?userId=${userId}` : '';
    return this.http.get<ConsumptionHistoryResource[]>(
      `${this.baseUrl}${environment.consumptionHistoriesEndpointPath}${query}`
    ).pipe(
      map(resources => (resources ?? []).map(r => this.toRecord(r))),
      catchError(err => throwError(() => new Error('Error al cargar el historial de consumo: ' + err.message)))
    );
  }

  private toRecord(resource: ConsumptionHistoryResource): ConsumptionRecord {
    // Normalizar fecha: soporta tanto "DD/MM/YYYY" como "YYYY-MM-DD"
    let isoDate = resource.date;
    if (resource.date && resource.date.includes('/')) {
      const parts = resource.date.split('/');
      if (parts.length === 3) {
        isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // Normalizar consumo: soporta number puro (4.5) o string ("4.5kWh")
    let kwh = 0;
    if (typeof resource.consumption === 'number') {
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
