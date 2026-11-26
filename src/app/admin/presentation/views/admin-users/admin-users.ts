import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { User, UserStatus } from '../../../../iam/domain/model/user.entity';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { IamStore } from '../../../../iam/application/iam.store';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

/**
 * Standalone Admin Users moderation component implementing US-49
 * (`PATCH /api/v1/users/{id}/status`).
 */
@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-users.html',
  styleUrls: ['../admin-shared.css']
})
export class AdminUsersComponent implements OnInit {
  private readonly iamApi = inject(IamApi);
  private readonly iamStore = inject(IamStore);
  private readonly translate = inject(TranslateService);

  readonly availableStatuses: readonly UserStatus[] = [
    'ACTIVE',
    'SUSPENDED',
    'BANNED',
    'INACTIVE'
  ];

  users: User[] = [];
  toastMsg: string | null = null;
  toastIsError = false;
  readonly updatingUserIds = new Set<number>();

  ngOnInit(): void {
    this.iamApi.getUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (err: unknown) => {
        const fallback = this.t('ADMIN.TOAST_LOAD_USERS_ERROR', 'No se pudieron cargar los usuarios.');
        this.showToast(extractHttpErrorMessage(err, fallback), true);
      }
    });
  }

  isCurrentAdmin(user: User): boolean {
    const currentId = this.iamStore.currentUserId();
    return currentId !== null && user.id === currentId;
  }

  getUserStatus(user: User): UserStatus {
    return user.status ?? (user.banned ? 'BANNED' : 'ACTIVE');
  }

  getStatusTranslationKey(status: UserStatus): string {
    return `ADMIN.STATUS_${status}`;
  }

  toggleBan(user: User): void {
    const currentStatus = this.getUserStatus(user);
    const nextStatus: UserStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    this.updateUserStatus(user, nextStatus);
  }

  updateUserStatus(user: User, targetStatus: UserStatus): void {
    if (this.isCurrentAdmin(user)) {
      this.showToast(
        this.t(
          'ADMIN.CANNOT_BAN_SELF',
          'No puedes banear ni modificar tu propia cuenta de administrador.'
        ),
        true
      );
      return;
    }

    if (this.updatingUserIds.has(user.id) || this.getUserStatus(user) === targetStatus) {
      return;
    }

    this.updatingUserIds.add(user.id);
    this.iamApi.updateUserStatus(user.id, targetStatus).subscribe({
      next: (updatedUser) => {
        this.updatingUserIds.delete(user.id);
        const resolvedStatus = updatedUser.status ?? targetStatus;
        user.status = resolvedStatus;
        user.banned = resolvedStatus === 'BANNED' || resolvedStatus === 'SUSPENDED';
        const statusLabel = this.t(this.getStatusTranslationKey(resolvedStatus), resolvedStatus);
        this.showToast(
          this.t(
            'ADMIN.TOAST_STATUS_UPDATED',
            `Estado de ${user.name} actualizado a ${statusLabel}.`,
            { name: user.name, status: statusLabel }
          )
        );
      },
      error: (err: unknown) => {
        this.updatingUserIds.delete(user.id);
        const fallback = this.t(
          'ADMIN.TOAST_STATUS_ERROR',
          'No se pudo actualizar el estado del usuario.'
        );
        this.showToast(extractHttpErrorMessage(err, fallback), true);
      }
    });
  }

  private t(key: string, fallback: string, params?: Record<string, string>): string {
    const translated = this.translate.instant(key, params);
    return translated && translated !== key ? translated : fallback;
  }

  private showToast(message: string, isError = false): void {
    this.toastMsg = message;
    this.toastIsError = isError;
    setTimeout(() => {
      if (this.toastMsg === message) {
        this.toastMsg = null;
        this.toastIsError = false;
      }
    }, 4000);
  }
}
