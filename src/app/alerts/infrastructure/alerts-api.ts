import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { AlertResource } from './alert-response';
import { AlertAssembler } from './alert-assembler';
import { Alert } from '../domain/model/alert.entity';
import { IamStore } from '../../iam/application/iam.store';
import { extractHttpErrorMessage } from '../../shared/infrastructure/http-error.util';

@Injectable({
  providedIn: 'root'
})
export class AlertsApi extends BaseApi {
  private readonly alertAssembler = new AlertAssembler();
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);

  private get userQuery(): string {
    const userId = this.iamStore.currentUserId();
    return userId ? `?userId=${userId}` : '';
  }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<AlertResource[]>(
      `${this.baseUrl}${environment.alertsEndpointPath}${this.userQuery}`
    ).pipe(
      map(res => this.alertAssembler.toEntities(res)),
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al cargar alertas.')))
      )
    );
  }

  getRecentAlerts(): Observable<Alert[]> {
    return this.getAlerts();
  }

  markAsRead(id: number): Observable<Alert> {
    return this.http.patch<AlertResource>(
      `${this.baseUrl}${environment.alertsEndpointPath}/${id}/read`,
      {}
    ).pipe(
      map(res => this.alertAssembler.toEntity(res)),
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al marcar alerta como leída.')))
      )
    );
  }
}
