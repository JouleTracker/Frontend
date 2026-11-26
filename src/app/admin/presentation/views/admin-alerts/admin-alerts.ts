import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';
import { IamApi } from '../../../../iam/infrastructure/iam-api';

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
      timeAgo: this.translate.instant('ALERTS.TIME_NOW'),
      actionUrl: '/consumo',
      timestamp: new Date().toISOString(),
      read: false
    };

    this.http.post(`${this.baseUrl}${environment.alertsEndpointPath}`, payload).subscribe({
      next: () => {
        this.toastMsg = this.translate.instant('ADMIN.ALERT_SENT');
        this.form.title = '';
        this.form.description = '';
        setTimeout(() => (this.toastMsg = null), 3000);
      },
      error: () => {
        this.toastMsg = this.translate.instant('ADMIN.ALERT_NOT_READY');
        setTimeout(() => (this.toastMsg = null), 4000);
      }
    });
  }
}
