import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { RecommendationsViewComponent } from './recommendations-view';
import { RecommendationsStore } from '../../../application/recommendations.store';
import { IamStore } from '../../../../iam/application/iam.store';

describe('RecommendationsViewComponent', () => {
  let component: RecommendationsViewComponent;
  let fixture: ComponentFixture<RecommendationsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationsViewComponent],
      providers: [
        {
          provide: RecommendationsStore,
          useValue: {
            loadAll: () => {},
            setCategory: () => {},
            setSort: () => {},
            selectedCategory: signal('Todas'),
            filteredRecommendations: signal([]),
            metrics: signal({
              potentialSavings: 'S/ 0.00',
              estimatedReduction: '0%',
              co2Avoided: '0 Kg',
              activeCount: 0,
            }),
            isLoading: signal(false),
            errorMessage: signal(null),
          },
        },
        {
          provide: IamStore,
          useValue: {
            hasPlusAccess: signal(true),
            currentPlan: signal('plus'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
