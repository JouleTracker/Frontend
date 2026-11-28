import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  HomeConfiguration,
  UpdateHomeConfiguration
} from '../domain/model/home-configuration.entity';

@Injectable({ providedIn: 'root' })
export class HomeConfigurationApi {
  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.apiBaseUrl}/api/v1/monitoring-spaces/home`;

  getConfiguration(): Observable<HomeConfiguration> {
    return this.http.get<HomeConfiguration>(this.endpoint);
  }

  updateConfiguration(
    configuration: UpdateHomeConfiguration
  ): Observable<HomeConfiguration> {
    return this.http.put<HomeConfiguration>(
      this.endpoint,
      configuration
    );
  }
}
