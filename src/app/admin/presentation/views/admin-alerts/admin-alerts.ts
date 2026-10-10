import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';

@Component({
  selector: 'app-admin-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-alerts.html',
  styleUrls: ['../admin-shared.css']
})
export class AdminAlertsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl || 'http://localhost:3000';

  users: User[] = [];
  toastMsg: string | null = null;

  form = {
    userId: 1,
    title: '',
    severity: 'warning',
    description: ''
  };

  ngOnInit(): void {
    this.http.get<User[]>(`${this.baseUrl}/users`).subscribe({
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

    this.http.post(`${this.baseUrl}/alerts`, payload).subscribe({
      next: () => {
        this.toastMsg = 'Alerta emitida con éxito.';
        this.form.title = '';
        this.form.description = '';
        setTimeout(() => (this.toastMsg = null), 3000);
      }
    });
  }
}
