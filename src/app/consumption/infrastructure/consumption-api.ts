import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import {
  ConsumptionSummaryResource,
  EnergyReadingResource,
  DeviceDistributionResource,
  ComparativeConsumptionResource,
  ConsumptionHistoryResource
} from './consumption-response';
import {
  ConsumptionSummaryAssembler,
  EnergyReadingAssembler,
  DeviceDistributionAssembler,
  ComparativeConsumptionAssembler,
  ConsumptionHistoryAssembler
} from './consumption-assembler';
import { ConsumptionSummary } from '../domain/model/consumption-summary.entity';
import { EnergyReading } from '../domain/model/energy-reading.entity';
import { DeviceDistribution } from '../domain/model/device-distribution.entity';
import { ComparativeConsumption } from '../domain/model/comparative-consumption.entity';
import { ConsumptionHistory } from '../domain/model/consumption-history.entity';
import { IamStore } from '../../iam/application/iam.store';
import { extractHttpErrorMessage } from '../../shared/infrastructure/http-error.util';

@Injectable({
  providedIn: 'root'
})
export class ConsumptionApi extends BaseApi {
  private readonly summaryAssembler = new ConsumptionSummaryAssembler();
  private readonly readingAssembler = new EnergyReadingAssembler();
  private readonly distributionAssembler = new DeviceDistributionAssembler();
  private readonly comparativeAssembler = new ComparativeConsumptionAssembler();
  private readonly historyAssembler = new ConsumptionHistoryAssembler();
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);

  /**
   * Cada usuario consulta únicamente sus propios datos (filtro por userId en db.json).
   */
  private get userQuery(): string {
    const userId = this.iamStore.currentUserId();
    return userId ? `userId=${userId}` : '';
  }

  private withUser(endpoint: string, extraQuery = ''): string {
    const parts = [this.userQuery, extraQuery].filter(Boolean);
    const query = parts.length ? `?${parts.join('&')}` : '';
    return `${this.baseUrl}${endpoint}${query}`;
  }

  getSummary(period: 'dia' | 'semana' | 'mes' | 'ano' = 'mes'): Observable<ConsumptionSummary | null> {
    return this.http.get<ConsumptionSummaryResource[] | ConsumptionSummaryResource>(
      this.withUser(environment.consumptionSummariesEndpointPath, `period=${period}`)
    ).pipe(
      map(res => {
        const item = Array.isArray(res) ? res[0] : res;
        return item ? this.summaryAssembler.toEntity(item) : null;
      }),
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al cargar resumen de consumo.')))
      )
    );
  }

  getEnergyReadings(period: 'dia' | 'semana' | 'mes' | 'ano' = 'semana'): Observable<EnergyReading> {
    return this.http.get<EnergyReadingResource[] | EnergyReadingResource>(
      this.withUser(environment.energyReadingsEndpointPath, `period=${period}`)
    ).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res ? [res] : []);
        if (list.length === 0) {
          return this.readingAssembler.toEntity({ id: 0, period, labels: [], values: [] });
        }
        // Legacy mock format: single item already containing { labels, values }
        if (Array.isArray(list[0].labels) && Array.isArray(list[0].values)) {
          return this.readingAssembler.toEntity(list[0]);
        }
        // Backend format: array of point-based readings { id, label, kwh, ... }
        const grouped: EnergyReadingResource = {
          id: list[0].id ?? 1,
          period,
          labels: list.map((point, i) => point.label ?? `#${i + 1}`),
          values: list.map(point => Number((point.kwh ?? 0).toFixed(2)))
        };
        return this.readingAssembler.toEntity(grouped);
      }),
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al cargar lecturas de energía.')))
      )
    );
  }

  getDeviceDistribution(period: 'dia' | 'semana' | 'mes' | 'ano' = 'mes'): Observable<DeviceDistribution[]> {
    return this.http.get<DeviceDistributionResource[]>(
      this.withUser(environment.deviceDistributionsEndpointPath, `period=${period}`)
    ).pipe(
      map(res => this.distributionAssembler.toEntities(res)),
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al cargar distribución por dispositivos.')))
      )
    );
  }

  getComparativeConsumption(period: 'dia' | 'semana' | 'mes' | 'ano' = 'mes'): Observable<ComparativeConsumption[]> {
    return this.http.get<ComparativeConsumptionResource[]>(
      this.withUser(environment.comparativeConsumptionsEndpointPath, `period=${period}`)
    ).pipe(
      map(res => this.comparativeAssembler.toEntities(res)),
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al cargar comparativa de consumo.')))
      )
    );
  }

  getConsumptionHistory(period: 'dia' | 'semana' | 'mes' | 'ano' = 'mes'): Observable<ConsumptionHistory[]> {
    return this.http.get<ConsumptionHistoryResource[]>(
      this.withUser(environment.consumptionHistoriesEndpointPath, `period=${period}`)
    ).pipe(
      map(res => this.historyAssembler.toEntities(res)),
      catchError(err =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al cargar historial de consumo.')))
      )
    );
  }
}
