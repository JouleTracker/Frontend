import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendationsView } from './recommendations-view';

describe('RecommendationsView', () => {
  let component: RecommendationsView;
  let fixture: ComponentFixture<RecommendationsView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationsView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecommendationsView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
