import { Component, computed, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { TransfersService } from '../../services/transfers.service';
import { Subscription } from 'rxjs';
import { Transfer } from '../../interfaces/transfers.interface';
import { ValidatorsService } from 'src/app/services/validators.service';
import { DecimalFormatService } from 'src/app/services/decimal-format.service';

@Component({
  selector: 'app-modal-view-details-transfer',
  templateUrl: './modal-view-details.component.html',
  styleUrls: ['./modal-view-details.component.scss'],
})
export class ModalViewDetailsComponent implements OnInit, OnDestroy{
  transfersService  = inject(TransfersService);
  validatorsService = inject(ValidatorsService);
  decimalFormat     = inject(DecimalFormatService);
  viewDetailsSub$!: Subscription;
  transfer          = signal<Transfer|undefined>(undefined);
  totalQuantityItems= computed(() => this.transfer()?.detailsTransfers.reduce( (sum, product) => Number(sum) + Number(product.quantity),0));
  totalQuantityReceivedItems = computed(() => this.transfer()?.detailsTransfers.reduce( (sum, product) => Number(sum) + Number(product.quantity_received !== null && product.quantity_received !== undefined ? product.quantity_received : product.quantity),0));

  ngOnInit(): void {
    this.viewDetailsSub$ = this.transfersService.detailsSubs$.subscribe(transfer => {
      this.transfer.set(transfer);
    });
  }

  ngOnDestroy(): void {
    this.viewDetailsSub$.unsubscribe();
  }
}
