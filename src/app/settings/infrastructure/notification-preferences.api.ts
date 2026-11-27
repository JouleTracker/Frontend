import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  NotificationPreferences,
  UpdateNotificationPreferences
} from '../domain/model/notification-preferences.entity';

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesApi {
  private readonly http = inject(HttpClient);

  private readonly endpoint =
    `${environment.apiBaseUrl}/api/v1/notification-preferences`;

  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(this.endpoint);
  }

  updatePreferences(
    preferences: UpdateNotificationPreferences
  ): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(
      this.endpoint,
      preferences
    );
  }
}
