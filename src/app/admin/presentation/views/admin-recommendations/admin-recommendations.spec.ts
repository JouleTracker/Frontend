import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminRecommendations } from './admin-recommendations';

describe('AdminRecommendations', () => {
  let component: AdminRecommendations;
  let fixture: ComponentFixture<AdminRecommendations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRecommendations],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRecommendations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
