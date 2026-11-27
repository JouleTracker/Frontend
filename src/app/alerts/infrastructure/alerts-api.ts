import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
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

  private getCurrentUserId(): number {
    try {
      const raw = localStorage.getItem('userId') || localStorage.getItem('currentUserId');
      if (raw) {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore storage errors in tests
    }
    return 1;
  }

  getAlerts(userId: number = this.getCurrentUserId()): Observable<Alert[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<AlertResource[]>(`${this.baseUrl}${environment.alertsEndpointPath}`, { params }).pipe(
      map(res => this.alertAssembler.toEntities(res)),
      catchError(err => throwError(() => new Error('Error al cargar alertas: ' + err.message)))
    );
  }

  getCriticalAlerts(userId: number = this.getCurrentUserId()): Observable<Alert[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<AlertResource[]>(`${this.baseUrl}${environment.alertsEndpointPath}/critical`, { params }).pipe(
      map(res => this.alertAssembler.toEntities(res)),
      catchError(() =>
        this.getAlerts(userId).pipe(
          map(alerts => alerts.filter(a => a.isCritical)),
          catchError(() => of([]))
        )
      )
    );
  }

  markAsRead(alertId: number): Observable<Alert> {
    return this.http.patch<AlertResource>(
      `${this.baseUrl}${environment.alertsEndpointPath}/${alertId}/read`,
      {}
    ).pipe(
      map(res => this.alertAssembler.toEntity(res)),
      catchError(err => throwError(() => new Error('Error al marcar alerta como leída: ' + err.message)))
    );
  }

  getRecentAlerts(userId: number = this.getCurrentUserId()): Observable<Alert[]> {
    return this.getAlerts(userId);
  }

  getSummary(userId: number = this.getCurrentUserId()): Observable<AlertSummary> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<AlertSummaryResource[] | AlertSummaryResource>(
      `${this.baseUrl}${environment.alertSummariesEndpointPath}`,
      { params }
    ).pipe(
      map(res => {
        const item = Array.isArray(res) ? res[0] : res;
        return this.summaryAssembler.toEntity(item);
      }),
      catchError(err => throwError(() => new Error('Error al cargar resumen de alertas: ' + err.message)))
    );
  }
}