import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly iamApi = inject(IamApi);
  private readonly translate = inject(TranslateService);

  // Usar apiBaseUrl directamente desde environment
  private readonly baseUrl = environment.apiBaseUrl;

  users: User[] = [];
  selectedTab: 'users' | 'alert' | 'recommendation' = 'users';
  notificationMessage: string | null = null;

  alertForm = {
    userId: 1,
    title: '',
    description: '',
    severity: 'warning',
  };

  recForm = {
    userId: 1,
    title: '',
    category: 'General',
    estimatedSavingsKwh: 1.5,
    description: '',
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
        this.users = data.filter((u) => u.role !== 'admin');
        if (this.users.length > 0) {
          this.alertForm.userId = this.users[0].id;
          this.recForm.userId = this.users[0].id;
        }
      },
      error: (err) => console.error('Error al cargar usuarios:', err),
    });
  }

  toggleBan(user: User): void {
    const updatedStatus = !user.banned;
    const url = `${this.baseUrl}${environment.usersEndpointPath}/${user.id}`;
    this.http.patch<User>(url, { banned: updatedStatus }).subscribe({
      next: () => {
        user.banned = updatedStatus;
        this.notify(
          this.translate.instant(
            updatedStatus ? 'ADMIN.USER_BANNED_MSG' : 'ADMIN.USER_UNBANNED_MSG',
            { name: user.name }
          )
        );
      },
      error: () =>
        this.notify(this.translate.instant('ADMIN.BAN_NOT_READY')),
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
      timeAgo: this.translate.instant('ALERTS.TIME_NOW'),
      actionUrl: '/consumo',
      timestamp: new Date().toISOString(),
      read: false,
    };

    const url = `${this.baseUrl}${environment.alertsEndpointPath || '/alerts'}`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.notify(this.translate.instant('ADMIN.ALERT_SENT'));
        this.alertForm.title = '';
        this.alertForm.description = '';
      },
      error: (err) => {
        console.error('Error sending alert:', err);
        this.notify(this.translate.instant('ADMIN.ALERT_NOT_READY'));
      },
    });
  }

  submitRecommendation(): void {
    const payload = {
      userId: Number(this.recForm.userId),
      title: this.recForm.title,
      description: this.recForm.description,
      estimatedSavingsKwh: Number(this.recForm.estimatedSavingsKwh),
      category: this.recForm.category,
    };

    const url = `${this.baseUrl}${environment.recommendationsEndpointPath || '/recommendations'}`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.notify(this.translate.instant('ADMIN.REC_SENT'));
        this.recForm.title = '';
        this.recForm.description = '';
      },
      error: (err) => {
        console.error('Error sending recommendation:', err);
        this.notify(this.translate.instant('ADMIN.REC_NOT_READY'));
      },
    });
  }

  private notify(msg: string): void {
    this.notificationMessage = msg;
    setTimeout(() => (this.notificationMessage = null), 3500);
  }
}
