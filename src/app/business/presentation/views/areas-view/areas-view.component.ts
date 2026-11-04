import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AreasStore, AreaMetrics } from '../../../application/areas.store';
import { Area } from '../../../domain/model/area.entity';
import { AreaResource } from '../../../infrastructure/area-response';
import { AreasComparisonChartComponent } from '../../components/areas-comparison-chart/areas-comparison-chart.component';

@Component({
  selector: 'app-areas-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    TranslatePipe,
    AreasComparisonChartComponent
  ],
  templateUrl: './areas-view.component.html',
  styleUrls: ['./areas-view.component.css']
})
export class AreasViewComponent {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(AreasStore);

  readonly showModal = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  readonly editingAreaId = signal<number | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly formError = signal<string | null>(null);

  readonly showDeleteModal = signal<boolean>(false);
  readonly areaToDelete = signal<Area | null>(null);

  readonly availableIcons: string[] = [
    'storefront',
    'restaurant',
    'business_center',
    'local_laundry_service',
    'bathtub',
    'meeting_room',
    'warehouse',
    'inventory_2',
    'kitchen',
    'coffee'
  ];

  readonly availableFloors: string[] = ['Piso 1', 'Piso 2', 'Piso 3', 'Sótano', 'Azotea'];

  readonly form = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    floor: new FormControl<string>('Piso 1', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    icon: new FormControl<string>('storefront', { nonNullable: true })
  });

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingAreaId.set(null);
    this.formError.set(null);
    this.form.reset({
      name: '',
      floor: 'Piso 1',
      description: '',
      icon: 'storefront'
    });
    this.showModal.set(true);
  }

  openEditModal(area: Area): void {
    this.isEditing.set(true);
    this.editingAreaId.set(area.id);
    this.formError.set(null);
    this.form.patchValue({
      name: area.name,
      floor: area.floor,
      description: area.description,
      icon: area.icon
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isSubmitting.set(false);
    this.formError.set(null);
  }

  saveArea(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    const formValues = this.form.getRawValue();
    const payload: Partial<AreaResource> = {
      name: formValues.name.trim(),
      floor: formValues.floor,
      description: formValues.description.trim(),
      icon: formValues.icon
    };

    if (this.isEditing() && this.editingAreaId()) {
      this.store.updateArea(this.editingAreaId()!, payload).subscribe({
        next: () => {
          this.closeModal();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(err.message);
        }
      });
    } else {
      this.store.createArea(payload).subscribe({
        next: () => {
          this.closeModal();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.formError.set(err.message);
        }
      });
    }
  }

  openDeleteModal(area: Area): void {
    this.areaToDelete.set(area);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.areaToDelete.set(null);
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    const area = this.areaToDelete();
    if (!area) return;

    this.store.deleteArea(area.id).subscribe({
      next: () => {
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error al eliminar área:', err);
        this.closeDeleteModal();
      }
    });
  }
}
