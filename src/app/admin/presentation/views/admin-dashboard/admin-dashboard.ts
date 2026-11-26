import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { User, UserStatus } from '../../../../iam/domain/model/user.entity';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { IamStore } from '../../../../iam/application/iam.store';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

/**
 * Administrative dashboard routed at `/admin/usuarios`, `/admin/alertas`,
 * and `/admin/recomendaciones`.
 *
 * Implements US-49 User Moderation (`PATCH /api/v1/users/{id}/status`) supporting
 * `ACTIVE`, `BANNED`, `SUSPENDED`, and `INACTIVE` statuses with self-moderation protection.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly iamApi = inject(IamApi);
  private readonly iamStore = inject(IamStore);
  private readonly translate = inject(TranslateService);

  private readonly baseUrl = environment.apiBaseUrl;

  readonly availableStatuses: readonly UserStatus[] = [
    'ACTIVE',
    'SUSPENDED',
    'BANNED',
    'INACTIVE'
  ];

  users: User[] = [];
  clientUsers: User[] = [];
  selectedTab: 'users' | 'alert' | 'recommendation' = 'users';
  notificationMessage: string | null = null;
  notificationIsError = false;
  readonly updatingUserIds = new Set<number>();

  alertForm = {
    userId: 1,
    title: '',
    description: '',
    severity: 'warning'
  };

  recForm = {
    userId: 1,
    title: '',
    category: 'General',
    estimatedSavingsKwh: 1.5,
    description: ''
  };

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      if (data['tab']) {
        this.selectedTab = data['tab'];
      }
    });

    this.loadUsers();
  }

  loadUsers(): void {
    this.iamApi.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.clientUsers = data.filter((u) => u.role !== 'admin');
        if (this.clientUsers.length > 0) {
          this.alertForm.userId = this.clientUsers[0].id;
          this.recForm.userId = this.clientUsers[0].id;
        }
      },
      error: (err: unknown) => {
        const fallback = this.t('ADMIN.TOAST_LOAD_USERS_ERROR', 'No se pudieron cargar los usuarios.');
        this.notify(extractHttpErrorMessage(err, fallback), true);
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

  /**
   * US-49: Toggles a user's status between `BANNED` and `ACTIVE`.
   */
  toggleBan(user: User): void {
    const currentStatus = this.getUserStatus(user);
    const nextStatus: UserStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    this.updateUserStatus(user, nextStatus);
  }

  /**
   * US-49: Updates a user's status via `PATCH /api/v1/users/{id}/status` (`ROLE_ADMIN`).
   * Prevents the logged-in administrator from modifying or banning their own account.
   */
  updateUserStatus(user: User, targetStatus: UserStatus): void {
    if (this.isCurrentAdmin(user)) {
      this.notify(
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
        this.notify(
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
        this.notify(extractHttpErrorMessage(err, fallback), true);
      }
    });
  }

  submitAlert(): void {
    const payload = {
      userId: Number(this.alertForm.userId),
      title: this.alertForm.title,
      description: this.alertForm.description,
      message: this.alertForm.description,
      severity: this.alertForm.severity,
      status: 'Activa',
      timeAgo: 'Reciente',
      actionUrl: '/consumo',
      timestamp: new Date().toISOString(),
      read: false
    };

    const url = `${this.baseUrl}${environment.alertsEndpointPath || '/api/v1/alerts'}`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.notify(this.t('ADMIN.TOAST_ALERT_SENT', 'Alerta enviada exitosamente.'));
        this.alertForm.title = '';
        this.alertForm.description = '';
      },
      error: (err) => {
        const fallback = this.t(
          'ADMIN.TOAST_ALERT_ERROR',
          'No se pudo enviar la alerta. Inténtalo nuevamente.'
        );
        this.notify(extractHttpErrorMessage(err, fallback), true);
      }
    });
  }

  submitRecommendation(): void {
    const payload = {
      userId: Number(this.recForm.userId),
      title: this.recForm.title,
      description: this.recForm.description,
      estimatedSavingsKwh: Number(this.recForm.estimatedSavingsKwh),
      category: this.recForm.category
    };

    const url = `${this.baseUrl}${environment.recommendationsEndpointPath || '/recommendations'}`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.notify(this.t('ADMIN.TOAST_REC_SENT', 'Recomendación enviada exitosamente.'));
        this.recForm.title = '';
        this.recForm.description = '';
      },
      error: (err) => {
        const fallback = this.t(
          'ADMIN.TOAST_REC_ERROR',
          'No se pudo enviar la recomendación. Inténtalo nuevamente.'
        );
        this.notify(extractHttpErrorMessage(err, fallback), true);
      }
    });
  }

  private t(key: string, fallback: string, params?: Record<string, string>): string {
    const translated = this.translate.instant(key, params);
    return translated && translated !== key ? translated : fallback;
  }

  private notify(msg: string, isError = false): void {
    this.notificationMessage = msg;
    this.notificationIsError = isError;
    setTimeout(() => {
      if (this.notificationMessage === msg) {
        this.notificationMessage = null;
        this.notificationIsError = false;
      }
    }, 4000);
  }
}
