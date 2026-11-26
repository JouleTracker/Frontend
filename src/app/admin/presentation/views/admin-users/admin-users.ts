import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
  private readonly translate = inject(TranslateService);
  private readonly baseUrl = environment.apiBaseUrl;

  users: User[] = [];
  toastMsg: string | null = null;

  ngOnInit(): void {
    this.iamApi.getUsers().subscribe({
      next: (data) => (this.users = data.filter((u) => u.role !== 'admin')),
      error: (err) => {
        this.toastMsg = extractHttpErrorMessage(err, this.translate.instant('ADMIN.USERS_LOAD_ERROR'));
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
          this.toastMsg = this.translate.instant(
            updated ? 'ADMIN.USER_BANNED_MSG' : 'ADMIN.USER_UNBANNED_MSG',
            { name: user.name }
          );
          setTimeout(() => (this.toastMsg = null), 3000);
        },
        error: () => {
          this.toastMsg = this.translate.instant('ADMIN.BAN_NOT_READY');
          setTimeout(() => (this.toastMsg = null), 4000);
        }
      });
  }
}
