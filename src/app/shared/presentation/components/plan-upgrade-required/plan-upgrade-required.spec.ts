import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PlanUpgradeRequiredComponent } from './plan-upgrade-required';

describe('PlanUpgradeRequiredComponent', () => {
  let component: PlanUpgradeRequiredComponent;
  let fixture: ComponentFixture<PlanUpgradeRequiredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanUpgradeRequiredComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanUpgradeRequiredComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
