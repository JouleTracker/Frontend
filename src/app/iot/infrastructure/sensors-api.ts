import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { SensorResource, ApplianceProfileResource, SensorSummaryResource } from './sensors-response';
import { SensorAssembler, ApplianceProfileAssembler, SensorSummaryAssembler } from './sensors-assembler';
import { Sensor } from '../domain/model/sensor.entity';
import { ApplianceProfile } from '../domain/model/appliance-profile.entity';
import { SensorSummary } from '../domain/model/sensor-summary.entity';

@Injectable({
  providedIn: 'root'
})
export class SensorsApi extends BaseApi {
  private readonly sensorAssembler = new SensorAssembler();
  private readonly profileAssembler = new ApplianceProfileAssembler();
  private readonly summaryAssembler = new SensorSummaryAssembler();

  constructor(private http: HttpClient) {
    super();
  }

  /**
   * Obtiene la lista completa de sensores IoT registrados.
   */
  getSensors(): Observable<Sensor[]> {
    return this.http.get<SensorResource[]>(
      `${this.baseUrl}${environment.sensorsEndpointPath}`
    ).pipe(
      map(res => this.sensorAssembler.toEntities(res)),
      catchError(err => throwError(() => new Error('Error al cargar sensores: ' + err.message)))
    );
  }

  /**
   * Obtiene un sensor específico por su ID.
   */
  getSensorById(id: number): Observable<Sensor> {
    return this.http.get<SensorResource>(
      `${this.baseUrl}${environment.sensorsEndpointPath}/${id}`
    ).pipe(
      map(res => this.sensorAssembler.toEntity(res)),
      catchError(err => throwError(() => new Error('Error al cargar sensor: ' + err.message)))
    );
  }

  /**
   * Registra un nuevo sensor IoT en el sistema.
   */
  createSensor(sensor: Partial<SensorResource>): Observable<Sensor> {
    return this.http.post<SensorResource>(
      `${this.baseUrl}${environment.sensorsEndpointPath}`,
      sensor
    ).pipe(
      map(res => this.sensorAssembler.toEntity(res)),
      catchError(err => throwError(() => new Error('Error al registrar nuevo sensor: ' + err.message)))
    );
  }

  /**
   * Actualiza parcialmente un sensor (ej. nombre, dispositivo asignado, perfil).
   */
  updateSensor(id: number, partialSensor: Partial<SensorResource>): Observable<Sensor> {
    return this.http.patch<SensorResource>(
      `${this.baseUrl}${environment.sensorsEndpointPath}/${id}`,
      partialSensor
    ).pipe(
      map(res => this.sensorAssembler.toEntity(res)),
      catchError(err => throwError(() => new Error('Error al actualizar sensor: ' + err.message)))
    );
  }

  /**
   * Obtiene el catálogo de perfiles recomendados de electrodomésticos recurrentes.
   */
  getApplianceProfiles(): Observable<ApplianceProfile[]> {
    return this.http.get<ApplianceProfileResource[]>(
      `${this.baseUrl}${environment.applianceProfilesEndpointPath}`
    ).pipe(
      map(res => this.profileAssembler.toEntities(res)),
      catchError(err => throwError(() => new Error('Error al cargar perfiles de aparatos: ' + err.message)))
    );
  }

  /**
   * Obtiene las métricas agregadas de los sensores IoT.
   */
  getSensorSummary(): Observable<SensorSummary> {
    return this.http.get<SensorSummaryResource[] | SensorSummaryResource>(
      `${this.baseUrl}${environment.sensorSummariesEndpointPath}`
    ).pipe(
      map(res => {
        const item = Array.isArray(res) ? res[0] : res;
        return this.summaryAssembler.toEntity(item);
      }),
      catchError(err => throwError(() => new Error('Error al cargar resumen de sensores: ' + err.message)))
    );
  }

  /**
   * Elimina un sensor IoT del sistema.
   * El consumo histórico previo registrado por el sensor permanece intacto en los reportes.
   */
  deleteSensor(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${environment.sensorsEndpointPath}/${id}`
    ).pipe(
      catchError(err => throwError(() => new Error('Error al eliminar sensor: ' + err.message)))
    );
  }
}

