import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { DeviceResource, DeviceSummaryResource } from './devices-response';
import { DeviceAssembler, DeviceSummaryAssembler } from './devices-assembler';
import { Device } from '../domain/model/device.entity';
import { DeviceSummary } from '../domain/model/device-summary.entity';

@Injectable({
  providedIn: 'root'
})
export class DevicesApi extends BaseApi {
  private readonly deviceAssembler = new DeviceAssembler();
  private readonly summaryAssembler = new DeviceSummaryAssembler();

  constructor(private http: HttpClient) {
    super();
  }

  /**
   * Obtiene la lista completa de dispositivos registrados.
   */
  getDevices(): Observable<Device[]> {
    return this.http.get<DeviceResource[]>(
      `${this.baseUrl}${environment.devicesEndpointPath}`
    ).pipe(
      map(res => this.deviceAssembler.toEntities(res)),
      catchError(err => throwError(() => new Error('Error al cargar dispositivos: ' + err.message)))
    );
  }

  /**
   * Obtiene las métricas agregadas de los dispositivos.
   */
  getDeviceSummary(): Observable<DeviceSummary> {
    return this.http.get<DeviceSummaryResource[] | DeviceSummaryResource>(
      `${this.baseUrl}${environment.deviceSummariesEndpointPath}`
    ).pipe(
      map(res => {
        const item = Array.isArray(res) ? res[0] : res;
        return this.summaryAssembler.toEntity(item);
      }),
      catchError(err => throwError(() => new Error('Error al cargar resumen de dispositivos: ' + err.message)))
    );
  }
}
