import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MonthlyConsumptionThreshold,
  UpdateMonthlyConsumptionThreshold,
  MonthlyConsumptionStatus
} from '../domain/model/monthly-consumption-threshold.entity';

@Injectable({ providedIn: 'root' })
export class MonthlyConsumptionThresholdApi {
  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.apiBaseUrl}/api/v1/monthly-consumption-threshold`;

  getThreshold(): Observable<MonthlyConsumptionThreshold> {
    return this.http.get<MonthlyConsumptionThreshold>(this.endpoint);
  }

  updateThreshold(
    threshold: UpdateMonthlyConsumptionThreshold
  ): Observable<MonthlyConsumptionThreshold> {
    return this.http.put<MonthlyConsumptionThreshold>(
      this.endpoint,
      threshold
    );
  }

  getStatus(): Observable<MonthlyConsumptionStatus> {
    return this.http.get<MonthlyConsumptionStatus>(
      `${this.endpoint}/status`
    );
  }
}
