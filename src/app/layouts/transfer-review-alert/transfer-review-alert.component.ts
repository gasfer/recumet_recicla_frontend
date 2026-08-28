import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReviewStatus, TransferReview, TransferReviewService } from 'src/app/services/transfer-review.service';

@Component({
  selector: 'app-transfer-review-alert',
  templateUrl: './transfer-review-alert.component.html',
  styleUrls: ['./transfer-review-alert.component.scss'],
})
export class TransferReviewAlertComponent {
  readonly reviewService = inject(TransferReviewService);
  private readonly router = inject(Router);

  statusLabel(status: ReviewStatus): string {
    return ({ EN_REVISION: 'En revisión', PARCIAL: 'Parcial', COMPLETADO: 'Completado' })[status];
  }

  statusSeverity(status: ReviewStatus): 'danger' | 'warning' | 'success' {
    return ({ EN_REVISION: 'danger', PARCIAL: 'warning', COMPLETADO: 'success' } as const)[status];
  }

  reviewStatusLabel(review: TransferReview): string {
    return review.reconciliation_status === 'COMPLETADO' && !review.resolved_at
      ? 'Pendiente de cierre'
      : this.statusLabel(review.reconciliation_status);
  }

  reviewStatusSeverity(review: TransferReview): 'danger' | 'warning' | 'success' {
    return review.reconciliation_status === 'COMPLETADO' && !review.resolved_at
      ? 'warning'
      : this.statusSeverity(review.reconciliation_status);
  }

  differenceLabel(type: string): string {
    return type === 'EXCEDENTE_PARA_REVISION' ? 'Excedente' : 'Faltante';
  }

  goToInconclusiveReceptions(): void {
    this.reviewService.closeAlerts();
    this.router.navigate(['/transfers/query-receptions'], {
      queryParams: { view: 'inconclusive' },
    });
  }

  continueWorking(): void {
    this.reviewService.closeAlerts();
  }
}
