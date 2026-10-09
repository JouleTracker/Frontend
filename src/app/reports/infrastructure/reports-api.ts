import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsumptionRecord, ReportsConfig } from '../domain/consumption-record.entity';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getConsumptionRecords(): Observable<ConsumptionRecord[]> {
    return this.http.get<ConsumptionRecord[]>(`${this.baseUrl}/consumption-records`);
  }

  getConfig(): Observable<ReportsConfig> {
    return this.http.get<ReportsConfig>(`${this.baseUrl}/reports-config`);
  }
}
