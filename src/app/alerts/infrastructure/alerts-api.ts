import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { AlertResource, AlertSummaryResource } from './alert-response';
import { AlertAssembler, AlertSummaryAssembler } from './alert-assembler';
import { Alert } from '../domain/model/alert.entity';
import { AlertSummary } from '../domain/model/alert-summary.entity';

@Injectable({
  providedIn: 'root'
})
export class AlertsApi extends BaseApi {
  private readonly alertAssembler = new AlertAssembler();
  private readonly summaryAssembler = new AlertSummaryAssembler();

  constructor(private http: HttpClient) {
    super();
  }

  /**
   * Obtiene la lista completa de alertas registradas.
   */
  getAlerts(): Observable<Alert[]> {
    return this.http.get<AlertResource[]>(`${this.baseUrl}${environment.alertsEndpointPath}`).pipe(
      map(res => this.alertAssembler.toEntities(res)),
      catchError(err => throwError(() => new Error('Error al cargar alertas: ' + err.message)))
    );
  }

  /**
   * Obtiene las alertas recientes (compatible con widgets de dashboard).
   */
  getRecentAlerts(): Observable<Alert[]> {
    return this.getAlerts();
  }

  /**
   * Obtiene las métricas agregadas del resumen de alertas.
   */
  getSummary(): Observable<AlertSummary> {
    return this.http.get<AlertSummaryResource[] | AlertSummaryResource>(
      `${this.baseUrl}${environment.alertSummariesEndpointPath}`
    ).pipe(
      map(res => {
        const item = Array.isArray(res) ? res[0] : res;
        return this.summaryAssembler.toEntity(item);
      }),
      catchError(err => throwError(() => new Error('Error al cargar resumen de alertas: ' + err.message)))
    );
  }
}
