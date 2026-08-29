import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { TransferReviewService } from 'src/app/services/transfer-review.service';
import { TopbarComponent } from './topbar.component';

describe('TopbarComponent responsive context', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopbarComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: DOCUMENT, useValue: document },
        { provide: Router, useValue: {} },
        { provide: TranslateService, useValue: {} },
        { provide: LanguageService, useValue: {} },
        { provide: AuthService, useValue: { getUser: { role: 'ADMINISTRADOR' } } },
        { provide: SucursalesService, useValue: {} },
        { provide: ValidatorsService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: TransferReviewService, useValue: {} },
      ],
    })
      .overrideComponent(TopbarComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  it('preserves the active work context when viewport orientation changes', () => {
    component.form.setValue({ id_sucursal: 7, id_storage: 13 });

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));

    expect(component.form.getRawValue()).toEqual({ id_sucursal: 7, id_storage: 13 });
  });
});
