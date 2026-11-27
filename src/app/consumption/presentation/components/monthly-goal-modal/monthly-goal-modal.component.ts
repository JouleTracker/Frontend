import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MonthlyGoal } from '../../../domain/model/monthly-goal.entity';

export interface MonthlyGoalFormSubmit {
  targetKwh: number;
  year: number;
  month: number;
}

@Component({
  selector: 'app-monthly-goal-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './monthly-goal-modal.component.html',
  styleUrl: './monthly-goal-modal.component.css'
})
export class MonthlyGoalModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() goal: MonthlyGoal | null = null;
  @Input() saving: boolean = false;
  @Input() errorMessage: string | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveGoal = new EventEmitter<MonthlyGoalFormSubmit>();
  @Output() deleteGoal = new EventEmitter<void>();

  targetKwhInput: number = 250;
  yearInput: number = new Date().getFullYear();
  monthInput: number = new Date().getMonth() + 1;
  validationError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] || changes['goal']) {
      if (this.isOpen) {
        const now = new Date();
        this.targetKwhInput = this.goal ? this.goal.targetKwh : 250;
        this.yearInput = this.goal ? this.goal.year : now.getFullYear();
        this.monthInput = this.goal ? this.goal.month : now.getMonth() + 1;
        this.validationError = null;
      }
    }
  }

  onSubmit(): void {
    if (!this.targetKwhInput || Number(this.targetKwhInput) <= 0) {
      this.validationError = 'Ingresa una meta mensual mayor a 0 kWh.';
      return;
    }
    this.validationError = null;
    this.saveGoal.emit({
      targetKwh: Number(this.targetKwhInput),
      year: Number(this.yearInput),
      month: Number(this.monthInput)
    });
  }

  onDelete(): void {
    this.deleteGoal.emit();
  }

  onClose(): void {
    if (!this.saving) {
      this.closeModal.emit();
    }
  }
}