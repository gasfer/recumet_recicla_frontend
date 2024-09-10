import { Component, computed, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { TransfersService } from '../../services/transfers.service';
import { Subscription } from 'rxjs';
import { Transfer } from '../../interfaces/transfers.interface';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-modal-view-details',
  templateUrl: './modal-view-details.component.html',
})
export class ModalViewDetailsComponent implements OnInit, OnDestroy{
  transfersService  = inject(TransfersService);
  validatorsService = inject(ValidatorsService);
  viewDetailsSub$!: Subscription;
  transfer          = signal<Transfer|undefined>(undefined);
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  totalQuantityItems= computed(() => this.transfer()?.detailsTransfers.reduce( (sum, product) => Number(sum) + Number(product.cost),0));

  ngOnInit(): void {
    this.viewDetailsSub$ = this.transfersService.detailsSubs$.subscribe(transfer => {
      this.transfer.set(transfer);
    });
  }

  ngOnDestroy(): void {
    this.viewDetailsSub$.unsubscribe();
  }
}
