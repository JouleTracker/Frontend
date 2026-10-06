import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device, DeviceSummary } from '../../domain/model/device.model';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private apiUrl = 'http://localhost:3000'; // Ajusta al puerto de tu server.js

  constructor(private http: HttpClient) {}

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/devices`);
  }

  getDeviceSummaries(): Observable<DeviceSummary[]> {
    return this.http.get<DeviceSummary[]>(`${this.apiUrl}/device-summaries`);
  }
}
