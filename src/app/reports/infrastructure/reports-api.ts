import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsumptionRecord } from '../domain/consumption-record.entity';
import { IamStore } from '../../iam/application/iam.store';

/**
 * Forma real de un registro en la colección `consumption-histories` de db.json.
 */
interface ConsumptionHistoryResource {
  id: number;
  userId?: number;
  date: string; // DD/MM/YYYY
  consumption: string; // ej. "82.4kWh"
  cost: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Obtiene el historial de consumo del usuario autenticado desde la colección
   * `consumption-histories` de db.json y lo adapta a registros de reporte.
   */
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

  /**
   * Adapta el registro de db.json al modelo de dominio:
   * - date: DD/MM/YYYY → YYYY-MM-DD (ISO) para ordenar y filtrar correctamente
   * - consumption: "82.4kWh" → 82.4 (number)
   */
  private toRecord(resource: ConsumptionHistoryResource): ConsumptionRecord {
    const parts = (resource.date ?? '').split('/');
    const isoDate = parts.length === 3
      ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      : resource.date;
    const parsed = Number(String(resource.consumption).replace(/[^\d.,-]/g, '').replace(',', '.'));
    return {
      id: resource.id,
      date: isoDate,
      consumptionKwh: isNaN(parsed) ? 0 : parsed
    };
  }
}
