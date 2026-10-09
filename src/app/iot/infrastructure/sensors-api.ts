import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { SensorResource, ApplianceProfileResource, SensorSummaryResource } from './sensors-response';
import { SensorAssembler, ApplianceProfileAssembler, SensorSummaryAssembler } from './sensors-assembler';
import { Sensor } from '../domain/model/sensor.entity';
import { ApplianceProfile } from '../domain/model/appliance-profile.entity';
import { SensorSummary } from '../domain/model/sensor-summary.entity';
import { IamStore } from '../../iam/application/iam.store';

@Injectable({
  providedIn: 'root'
})
export class SensorsApi extends BaseApi {
  private readonly sensorAssembler = new SensorAssembler();
  private readonly profileAssembler = new ApplianceProfileAssembler();
  private readonly summaryAssembler = new SensorSummaryAssembler();
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);

  /**
   * Cada usuario consulta únicamente sus propios sensores (filtro por userId en db.json).
   */
  private get userQuery(): string {
    const userId = this.iamStore.currentUserId();
    return userId ? `?userId=${userId}` : '';
  }

  /**
   * Obtiene la lista de sensores IoT registrados por el usuario autenticado.
   */
  getSensors(): Observable<Sensor[]> {
    return this.http.get<SensorResource[]>(
      `${this.baseUrl}${environment.sensorsEndpointPath}${this.userQuery}`
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
   * Registra un nuevo sensor IoT en el sistema (queda asociado al usuario autenticado).
   */
  createSensor(sensor: Partial<SensorResource>): Observable<Sensor> {
    const userId = this.iamStore.currentUserId();
    const payload = userId ? { ...sensor, userId } : sensor;
    return this.http.post<SensorResource>(
      `${this.baseUrl}${environment.sensorsEndpointPath}`,
      payload
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
   * (Catálogo global compartido por todos los usuarios.)
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
   * Obtiene las métricas agregadas de los sensores IoT del usuario autenticado.
   */
  getSensorSummary(): Observable<SensorSummary | null> {
    return this.http.get<SensorSummaryResource[] | SensorSummaryResource>(
      `${this.baseUrl}${environment.sensorSummariesEndpointPath}${this.userQuery}`
    ).pipe(
      map(res => {
        const item = Array.isArray(res) ? res[0] : res;
        return item ? this.summaryAssembler.toEntity(item) : null;
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
