import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanUpgradeRequired } from './plan-upgrade-required';

describe('PlanUpgradeRequired', () => {
  let component: PlanUpgradeRequired;
  let fixture: ComponentFixture<PlanUpgradeRequired>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanUpgradeRequired],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanUpgradeRequired);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
