import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { AlertResource } from './alert-response';
import { AlertAssembler } from './alert-assembler';
import { Alert } from '../domain/model/alert.entity';

@Injectable({
  providedIn: 'root'
})
export class AlertsApi extends BaseApi {
  private readonly assembler = new AlertAssembler();

  constructor(private http: HttpClient) {
    super();
  }

  getRecentAlerts(): Observable<Alert[]> {
    return this.http.get<AlertResource[]>(`${this.baseUrl}${environment.alertsEndpointPath}`).pipe(
      map(res => this.assembler.toEntities(res)),
      catchError(err => throwError(() => new Error('Error al cargar alertas: ' + err.message)))
    );
  }
}
