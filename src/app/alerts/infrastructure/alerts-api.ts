import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { AlertResource } from './alert-response';
import { AlertAssembler } from './alert-assembler';
import { Alert } from '../domain/model/alert.entity';
import { IamStore } from '../../iam/application/iam.store';

@Injectable({
  providedIn: 'root'
})
export class AlertsApi extends BaseApi {
  private readonly alertAssembler = new AlertAssembler();
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);

  /**
   * Cada usuario consulta únicamente sus propias alertas (filtro por userId en db.json).
   */
  private get userQuery(): string {
    const userId = this.iamStore.currentUserId();
    return userId ? `?userId=${userId}` : '';
  }

  /**
   * Obtiene la lista de alertas registradas por el usuario autenticado.
   */
  getAlerts(): Observable<Alert[]> {
    return this.http.get<AlertResource[]>(
      `${this.baseUrl}${environment.alertsEndpointPath}${this.userQuery}`
    ).pipe(
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
}
