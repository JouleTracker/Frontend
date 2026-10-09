import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { RecommendationsApi } from '../infrastructure/recommendations-api';
import { RecommendationItem, RecommendationMetrics } from '../domain/model/recommendation.entity';
import { IamStore } from '../../iam/application/iam.store';
import { ConsumptionStore } from '../../consumption/application/consumption.store';
import { SensorsStore } from '../../iot/application/sensors.store';
import { DevicesStore } from '../../devices/application/devices.store';
import { EnergyCalculationService, ELECTRICITY_TARIFF_PER_KWH } from '../../shared/domain/model/energy-calculation.constants';

@Injectable({ providedIn: 'root' })
export class RecommendationsStore {
  private readonly api = inject(RecommendationsApi);
  private readonly iamStore = inject(IamStore);
  private readonly consumptionStore = inject(ConsumptionStore);
  private readonly sensorsStore = inject(SensorsStore);
  private readonly devicesStore = inject(DevicesStore);

  private readonly _apiItems = signal<RecommendationItem[]>([]);
  readonly selectedCategory = signal<string>('Todas');
  readonly selectedSort = signal<'impact' | 'name'>('impact');

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Generación reactiva de diagnósticos inteligentes a partir de la telemetría viva de sensores y dispositivos
   */
  readonly dynamicRecommendations = computed<RecommendationItem[]>(() => {
    const list: RecommendationItem[] = [];
    const sensors = this.sensorsStore.sensors();
    const devices = this.devicesStore.devices();

    sensors.forEach((s) => {
      const matchedDevice = devices.find(d => d.id === s.assignedDeviceId);
      const deviceName = matchedDevice?.name || s.assignedDeviceName || s.name;
      const category = matchedDevice?.category || s.assignedDeviceCategory || 'Hogar';

      // 1. REGLA: Sensor superó su límite recomendado diario
      if (s.recommendedDailyKwh && s.todayKwh > s.recommendedDailyKwh) {
        const excessKwh = Number((s.todayKwh - s.recommendedDailyKwh).toFixed(2));
        const excessPercent = Math.round((excessKwh / s.recommendedDailyKwh) * 100);
        const monthlyExcessKwh = Number((excessKwh * 30).toFixed(1));
        const estimatedMonthlySavingSoles = (monthlyExcessKwh * ELECTRICITY_TARIFF_PER_KWH).toFixed(2);
        const co2Kg = (monthlyExcessKwh * 0.25).toFixed(1);

        list.push({
          id: 8000 + s.id,
          title: `Optimizar consumo en ${deviceName}`,
          description: `Registra ${s.todayKwh.toFixed(2)} kWh hoy, superando la cuota de ${s.recommendedDailyKwh.toFixed(2)} kWh/día (+${excessPercent}%). Establecer un horario de apagado evitaría un sobrecosto mensual de S/ ${estimatedMonthlySavingSoles} (~${co2Kg} kg CO₂).`,
          potentialSaving: `${Math.min(excessPercent, 40)}%`,
          category: category,
          actionUrl: '/dispositivos'
        } as unknown as RecommendationItem);
      }

      // 2. REGLA: Consumo fantasma
      if (s.currentPowerKw > 0.015 && s.currentPowerKw < 0.08 && s.todayKwh > 0.3) {
        const watts = Math.round(s.currentPowerKw * 1000);
        const phantomMonthlyKwh = Number((s.currentPowerKw * 24 * 30).toFixed(1));
        const phantomSavingSoles = (phantomMonthlyKwh * ELECTRICITY_TARIFF_PER_KWH).toFixed(2);

        list.push({
          id: 8500 + s.id,
          title: `Consumo vampiro detectado: ${deviceName}`,
          description: `Consume ${watts} W continuos en modo reposo sin actividad registrada. Desconectarlo o programar el enchufe inteligente ahorraría S/ ${phantomSavingSoles} al mes.`,
          potentialSaving: '8%',
          category: 'Eficiencia',
          actionUrl: '/dispositivos'
        } as unknown as RecommendationItem);
      }

      // 3. REGLA: Climatización de alta potencia sostenida
      if (category.toLowerCase() === 'climatización' && s.currentPowerKw >= 0.8) {
        list.push({
          id: 8800 + s.id,
          title: `Ajuste térmico en ${deviceName}`,
          description: `El equipo opera a ${s.currentPowerKw.toFixed(2)} kW sostenidos. Subir el termostato a 24°C reduce el trabajo del compresor entre 10% y 15% sin perder confort.`,
          potentialSaving: '15%',
          category: 'Climatización',
          actionUrl: '/dispositivos'
        } as unknown as RecommendationItem);
      }
    });

    return list;
  });

  /** Lista unificada: Recomendaciones de analítica viva + catálogo de la API */
  readonly allRecommendations = computed<RecommendationItem[]>(() => {
    return [...this.dynamicRecommendations(), ...this._apiItems()];
  });

  /** Categorías dinámicas disponibles para el filtro */
  readonly availableCategories = computed<string[]>(() => {
    const set = new Set<string>();
    this.allRecommendations().forEach((r: RecommendationItem) => {
      if (r.category) {
        set.add(r.category);
      }
    });
    return ['Todas', ...Array.from(set)];
  });

  readonly filteredRecommendations = computed<RecommendationItem[]>(() => {
    let result = [...this.allRecommendations()];
    const category = this.selectedCategory();

    if (category !== 'Todas') {
      result = result.filter((item) =>
        this.normalizeText(item.category) === this.normalizeText(category)
      );
    }

    if (this.selectedSort() === 'impact') {
      result.sort((a, b) => this.parseSaving(b.potentialSaving) - this.parseSaving(a.potentialSaving));
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  });

  /** Métricas de impacto y ahorro proyectado */
  readonly metrics = computed<RecommendationMetrics>(() => {
    const items = this.allRecommendations();

    let savedKwhMonthly = this.consumptionStore.summary()?.savedKwhMonthly ?? 0;
    if (savedKwhMonthly === 0) {
      const dailyKwh = this.devicesStore.devices().reduce((acc, d) => acc + d.todayKwh, 0);
      savedKwhMonthly = Number((dailyKwh * 30 * 0.15).toFixed(2));
    }

    const maxReduction = items.reduce(
      (max, item) => Math.max(max, this.parseSaving(item.potentialSaving)),
      0
    );

    return {
      potentialSavings: `S/ ${EnergyCalculationService.calculateCost(savedKwhMonthly).toFixed(2)}`,
      estimatedReduction: `${maxReduction || 15}%`,
      co2Avoided: `${EnergyCalculationService.calculateAvoidedEmissions(savedKwhMonthly)} Kg`,
      activeCount: items.length
    };
  });

  constructor() {
    effect(() => {
      const userId = this.iamStore.currentUserId();
      if (userId) {
        this.loadAll();
      }
    });
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api.getRecommendations().subscribe({
      next: (items) => {
        this._apiItems.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar las recomendaciones');
        this.isLoading.set(false);
      }
    });
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  setSort(sort: 'impact' | 'name'): void {
    this.selectedSort.set(sort);
  }

  private parseSaving(potentialSaving: string | undefined): number {
    if (!potentialSaving) return 0;
    const parsed = Number(String(potentialSaving).replace('%', '').trim());
    return isNaN(parsed) ? 0 : parsed;
  }

  private normalizeText(text: string): string {
    return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
