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
   * Obtiene un dispositivo específico por su ID.
   */
  getDeviceById(id: number): Observable<Device> {
    return this.http.get<DeviceResource>(
      `${this.baseUrl}${environment.devicesEndpointPath}/${id}`
    ).pipe(
      map(res => this.deviceAssembler.toEntity(res)),
      catchError(err => throwError(() => new Error('Error al cargar dispositivo: ' + err.message)))
    );
  }

  /**
   * Registra un nuevo dispositivo en el sistema.
   */
  createDevice(device: Partial<DeviceResource>): Observable<Device> {
    return this.http.post<DeviceResource>(
      `${this.baseUrl}${environment.devicesEndpointPath}`,
      device
    ).pipe(
      map(res => this.deviceAssembler.toEntity(res)),
      catchError(err => throwError(() => new Error('Error al registrar dispositivo: ' + err.message)))
    );
  }

  /**
   * Actualiza parcialmente un dispositivo (ej. nombre, categoría).
   */
  updateDevice(id: number, partialDevice: Partial<DeviceResource>): Observable<Device> {
    return this.http.patch<DeviceResource>(
      `${this.baseUrl}${environment.devicesEndpointPath}/${id}`,
      partialDevice
    ).pipe(
      map(res => this.deviceAssembler.toEntity(res)),
      catchError(err => throwError(() => new Error('Error al actualizar dispositivo: ' + err.message)))
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

  /**
   * Elimina un dispositivo del sistema.
   * Los registros de consumo histórico acumulado permanecen intactos.
   */
  deleteDevice(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${environment.devicesEndpointPath}/${id}`
    ).pipe(
      catchError(err => throwError(() => new Error('Error al eliminar dispositivo: ' + err.message)))
    );
  }
}

