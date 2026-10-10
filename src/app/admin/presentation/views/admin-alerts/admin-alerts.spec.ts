import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAlerts } from './admin-alerts';

describe('AdminAlerts', () => {
  let component: AdminAlerts;
  let fixture: ComponentFixture<AdminAlerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAlerts],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAlerts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
