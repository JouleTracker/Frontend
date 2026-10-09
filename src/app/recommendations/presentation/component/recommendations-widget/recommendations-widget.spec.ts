import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { RecommendationsWidgetComponent } from './recommendations-widget';
import { RecommendationsStore } from '../../../application/recommendations.store';

describe('RecommendationsWidgetComponent', () => {
  let component: RecommendationsWidgetComponent;
  let fixture: ComponentFixture<RecommendationsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationsWidgetComponent],
      providers: [
        {
          provide: RecommendationsStore,
          useValue: {
            filteredRecommendations: signal([]),
          },
        },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsWidgetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
