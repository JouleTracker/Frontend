import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './admin-users.html',
  styleUrls: ['../admin-shared.css']
})
export class AdminUsersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl || 'http://localhost:3000';

  users: User[] = [];
  toastMsg: string | null = null;

  ngOnInit(): void {
    this.http.get<User[]>(`${this.baseUrl}/users`).subscribe({
      next: (data) => (this.users = data.filter((u) => u.role !== 'admin')),
      error: (err) => console.error(err)
    });
  }

  toggleBan(user: User): void {
    const updated = !user.banned;
    this.http.patch<User>(`${this.baseUrl}/users/${user.id}`, { banned: updated }).subscribe({
      next: () => {
        user.banned = updated;
        this.toastMsg = `Usuario ${user.name} ${updated ? 'baneado' : 'desbaneado'}.`;
        setTimeout(() => (this.toastMsg = null), 3000);
      }
    });
  }
}
