import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';

/**
 * Administrative broadcast alerts view allowing platform admins to emit
 * consumption warnings and notifications to target user accounts.
 */
@Component({
  selector: 'app-admin-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-alerts.html',
  styleUrls: ['../admin-shared.css']
})
export class AdminAlertsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly iamApi = inject(IamApi);
  private readonly translate = inject(TranslateService);
  private readonly baseUrl = environment.apiBaseUrl;

  users: User[] = [];
  toastMsg: string | null = null;
  toastIsError = false;

  form = {
    userId: 1,
    title: '',
    severity: 'warning',
    description: ''
  };

  ngOnInit(): void {
    this.iamApi.getUsers().subscribe({
      next: (data) => {
        this.users = data.filter((u) => u.role !== 'admin');
        if (this.users.length > 0) this.form.userId = this.users[0].id;
      }
    });
  }

  submit(): void {
    const payload = {
      userId: Number(this.form.userId),
      title: this.form.title,
      description: this.form.description,
      message: this.form.description,
      severity: this.form.severity,
      status: 'Activa',
      timeAgo: 'Reciente',
      actionUrl: '/consumo',
      timestamp: new Date().toISOString(),
      read: false
    };

    this.http.post(`${this.baseUrl}${environment.alertsEndpointPath}`, payload).subscribe({
      next: () => {
        this.toastIsError = false;
        this.toastMsg = this.t('ADMIN.TOAST_ALERT_SENT', 'Alerta enviada exitosamente.');
        this.form.title = '';
        this.form.description = '';
        setTimeout(() => (this.toastMsg = null), 3500);
      },
      error: (err) => {
        this.toastIsError = true;
        const fallback = this.t(
          'ADMIN.TOAST_ALERT_ERROR',
          'No se pudo enviar la alerta. Inténtalo nuevamente.'
        );
        this.toastMsg = extractHttpErrorMessage(err, fallback);
        setTimeout(() => {
          this.toastMsg = null;
          this.toastIsError = false;
        }, 4000);
      }
    });
  }

  private t(key: string, fallback: string): string {
    const translated = this.translate.instant(key);
    return translated && translated !== key ? translated : fallback;
  }
}
