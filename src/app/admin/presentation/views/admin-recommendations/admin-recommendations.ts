import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';
import { IamApi } from '../../../../iam/infrastructure/iam-api';

@Component({
  selector: 'app-admin-recommendations',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-recommendations.html',
  styleUrls: ['../admin-shared.css']
})
export class AdminRecommendationsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly iamApi = inject(IamApi);
  private readonly baseUrl = environment.apiBaseUrl;

  users: User[] = [];
  toastMsg: string | null = null;

  form = {
    userId: 1,
    title: '',
    category: 'Climatización',
    estimatedSavingsKwh: 3.5,
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
      estimatedSavingsKwh: Number(this.form.estimatedSavingsKwh),
      category: this.form.category
    };

    this.http.post(`${this.baseUrl}${environment.recommendationsEndpointPath}`, payload).subscribe({
      next: () => {
        this.toastMsg = 'Recomendación enviada con éxito.';
        this.form.title = '';
        this.form.description = '';
        setTimeout(() => (this.toastMsg = null), 3000);
      },
      error: () => {
        this.toastMsg = 'El envío manual de recomendaciones administrativas estará disponible en el próximo sprint del backend.';
        setTimeout(() => (this.toastMsg = null), 4000);
      }
    });
  }
}
