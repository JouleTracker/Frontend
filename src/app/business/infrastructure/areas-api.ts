import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AreaResource } from './area-response';
import { AreaAssembler } from './area-assembler';
import { Area } from '../domain/model/area.entity';
import { IamStore } from '../../iam/application/iam.store';

@Injectable({
  providedIn: 'root'
})
export class AreasApi extends BaseApi {
  private readonly assembler = new AreaAssembler();
  private readonly http = inject(HttpClient);
  private readonly iamStore = inject(IamStore);

  private get userQuery(): string {
    const userId = this.iamStore.currentUserId();
    return userId ? `?userId=${userId}` : '';
  }

  getAreas(): Observable<Area[]> {
    return this.http.get<AreaResource[]>(`${this.baseUrl}/areas${this.userQuery}`).pipe(
      map((res) => res.map((r) => this.assembler.toEntity(r))),
      catchError((err) => throwError(() => new Error('Error al cargar áreas: ' + err.message)))
    );
  }

  getAreaById(id: number): Observable<Area> {
    return this.http.get<AreaResource>(`${this.baseUrl}/areas/${id}`).pipe(
      map((res) => this.assembler.toEntity(res)),
      catchError((err) => throwError(() => new Error('Error al cargar área: ' + err.message)))
    );
  }

  createArea(payload: Partial<AreaResource>): Observable<Area> {
    const userId = this.iamStore.currentUserId() ?? 1;
    const body = { ...payload, userId };
    return this.http.post<AreaResource>(`${this.baseUrl}/areas`, body).pipe(
      map((res) => this.assembler.toEntity(res)),
      catchError((err) => throwError(() => new Error('Error al registrar área: ' + err.message)))
    );
  }

  updateArea(id: number, changes: Partial<AreaResource>): Observable<Area> {
    return this.http.patch<AreaResource>(`${this.baseUrl}/areas/${id}`, changes).pipe(
      map((res) => this.assembler.toEntity(res)),
      catchError((err) => throwError(() => new Error('Error al actualizar área: ' + err.message)))
    );
  }

  deleteArea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/areas/${id}`).pipe(
      catchError((err) => throwError(() => new Error('Error al eliminar área: ' + err.message)))
    );
  }
}
