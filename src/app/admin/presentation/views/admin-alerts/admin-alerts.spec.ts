import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AdminAlertsComponent } from './admin-alerts';

describe('AdminAlertsComponent', () => {
  let component: AdminAlertsComponent;
  let fixture: ComponentFixture<AdminAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAlertsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateService()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAlertsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
