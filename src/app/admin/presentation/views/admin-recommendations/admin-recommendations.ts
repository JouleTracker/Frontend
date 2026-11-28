import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../iam/domain/model/user.entity';
import { IamApi } from '../../../../iam/infrastructure/iam-api';
import { extractHttpErrorMessage } from '../../../../shared/infrastructure/http-error.util';
import { ELECTRICITY_TARIFF_PER_KWH } from '../../../../shared/domain/model/energy-calculation.constants';

/**
 * Administrative recommendations view allowing admins to send targeted
 * energy-saving suggestions to users.
 */
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
  private readonly translate = inject(TranslateService);
  private readonly baseUrl = environment.apiBaseUrl;

  users: User[] = [];
  toastMsg: string | null = null;
  toastIsError = false;

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
    const kwh = Number(this.form.estimatedSavingsKwh) || 0;
    const payload = {
      userId: Number(this.form.userId),
      title: this.form.title,
      description: this.form.description,
      estimatedSavingKwh: kwh,
      estimatedSavingAmount: Number((kwh * ELECTRICITY_TARIFF_PER_KWH).toFixed(2)),
      category: this.form.category
    };

    this.http.post(`${this.baseUrl}${environment.recommendationsEndpointPath}`, payload).subscribe({
      next: () => {
        this.toastIsError = false;
        this.toastMsg = this.t('ADMIN.TOAST_REC_SENT', 'Recommendation sent successfully.');
        this.form.title = '';
        this.form.description = '';
        setTimeout(() => (this.toastMsg = null), 3500);
      },
      error: (err) => {
        this.toastIsError = true;
        const fallback = this.t(
          'ADMIN.TOAST_REC_ERROR',
          'Could not send the recommendation. Please try again.'
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
