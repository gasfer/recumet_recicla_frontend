import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NAVIGATION_DESTINATIONS as NAV } from 'src/app/core/constants/application-navigation.constants';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="erp-header-panel mb-3">
      <div class="erp-panel-title"><i class="fa-solid fa-chart-column text-emerald-600"></i><span>REPORTES</span></div>
    </div>
    <section class="erp-section">
      <div class="erp-section-title">Reportes disponibles</div>
      <div class="erp-form-grid">
        <a *ngFor="let report of visibleReports" [routerLink]="report.path" class="erp-btn erp-btn-secondary">
          <i class="fa-solid fa-file-lines"></i>{{ report.title }}
        </a>
      </div>
      <p *ngIf="!visibleReports.length" class="text-muted mb-0">No tiene reportes habilitados.</p>
    </section>
  `,
})
export class ReportsComponent {
  private validators = inject(ValidatorsService);
  get visibleReports() {
    return [NAV.purchaseReport].filter(report =>
      this.validators.user()?.role === 'ADMINISTRADOR' ||
      this.validators.withPermission(report.permission!.name, report.permission!.action));
  }
}
