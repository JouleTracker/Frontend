import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device, DeviceSummary } from '../../domain/model/device.model';

/** Service for device data management */
@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private apiUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  /** Fetch all registered devices */
  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/devices`);
  }

  /** Fetch device summary metrics */
  getDeviceSummaries(): Observable<DeviceSummary[]> {
    return this.http.get<DeviceSummary[]>(`${this.apiUrl}/device-summaries`);
  }
}
