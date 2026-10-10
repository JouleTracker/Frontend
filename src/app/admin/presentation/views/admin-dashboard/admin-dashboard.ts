import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';
import { TranslatePipe } from '@ngx-translate/core';

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
    const url = `${this.baseUrl}${environment.usersEndpointPath || '/users'}`;
    this.http.get<User[]>(url).subscribe({
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
    const url = `${this.baseUrl}${environment.usersEndpointPath || '/users'}/${user.id}`;
    this.http.patch<User>(url, { banned: updatedStatus }).subscribe({
      next: () => {
        user.banned = updatedStatus;
        this.notify(`Usuario ${user.name} ${updatedStatus ? 'baneado' : 'desbaneado'}.`);
      },
      error: (err) => console.error('Error al actualizar estado:', err),
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
      read: false,
    };

    const url = `${this.baseUrl}${environment.alertsEndpointPath || '/alerts'}`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.notify('Alerta enviada exitosamente.');
        this.alertForm.title = '';
        this.alertForm.description = '';
      },
      error: (err) => console.error('Error al enviar alerta:', err),
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
        this.notify('Recomendación enviada exitosamente.');
        this.recForm.title = '';
        this.recForm.description = '';
      },
      error: (err) => console.error('Error al enviar recomendación:', err),
    });
  }

  private notify(msg: string): void {
    this.notificationMessage = msg;
    setTimeout(() => (this.notificationMessage = null), 3500);
  }
}
