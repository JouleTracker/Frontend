import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './admin-users.html',
  styleUrls: ['../admin-shared.css']
})
export class AdminUsersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly iamApi = inject(IamApi);
  private readonly baseUrl = environment.apiBaseUrl;

  users: User[] = [];
  toastMsg: string | null = null;

  ngOnInit(): void {
    this.iamApi.getUsers().subscribe({
      next: (data) => (this.users = data.filter((u) => u.role !== 'admin')),
      error: (err) => {
        this.toastMsg = extractHttpErrorMessage(err, 'No se pudieron cargar los usuarios.');
      }
    });
  }

  toggleBan(user: User): void {
    const updated = !user.banned;
    this.http
      .patch<User>(`${this.baseUrl}${environment.usersEndpointPath}/${user.id}`, { banned: updated })
      .subscribe({
        next: () => {
          user.banned = updated;
          this.toastMsg = `Usuario ${user.name} ${updated ? 'baneado' : 'desbaneado'}.`;
          setTimeout(() => (this.toastMsg = null), 3000);
        },
        error: () => {
          this.toastMsg = 'La suspensión administrativa de cuentas estará disponible en el próximo sprint del backend.';
          setTimeout(() => (this.toastMsg = null), 4000);
        }
      });
  }
}
