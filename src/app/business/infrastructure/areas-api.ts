import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { environment } from '../../../environments/environment';
import { extractHttpErrorMessage } from '../../shared/infrastructure/http-error.util';
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

  private get endpoint(): string {
    return `${this.baseUrl}${environment.areasEndpointPath}`;
  }

  private get userQuery(): string {
    const userId = this.iamStore.currentUserId();
    return userId ? `?userId=${userId}` : '';
  }

  getAreas(): Observable<Area[]> {
    return this.http.get<AreaResource[]>(`${this.endpoint}${this.userQuery}`).pipe(
      map((res) => (res ?? []).map((r) => this.assembler.toEntity(r))),
      catchError((err) =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al cargar áreas.')))
      )
    );
  }

  getAreaById(id: number): Observable<Area> {
    return this.http.get<AreaResource>(`${this.endpoint}/${id}${this.userQuery}`).pipe(
      map((res) => this.assembler.toEntity(res)),
      catchError((err) =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al cargar área.')))
      )
    );
  }

  createArea(payload: Partial<AreaResource>): Observable<Area> {
    const userId = this.iamStore.currentUserId() ?? 1;
    const body = { ...payload, userId };
    return this.http.post<AreaResource>(this.endpoint, body).pipe(
      map((res) => this.assembler.toEntity(res)),
      catchError((err) =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al registrar área.')))
      )
    );
  }

  updateArea(id: number, changes: Partial<AreaResource>): Observable<Area> {
    return this.http.patch<AreaResource>(`${this.endpoint}/${id}${this.userQuery}`, changes).pipe(
      map((res) => this.assembler.toEntity(res)),
      catchError((err) =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al actualizar área.')))
      )
    );
  }

  deleteArea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}${this.userQuery}`).pipe(
      catchError((err) =>
        throwError(() => new Error(extractHttpErrorMessage(err, 'Error al eliminar área.')))
      )
    );
  }
}
