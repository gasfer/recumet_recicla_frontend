import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ClassifiedService } from '../../../services/classified.service';
import { Subscription } from 'rxjs';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Classified } from '../../../interfaces/classified.interface';

@Component({
  selector: 'app-modal-view-details',
  templateUrl: './modal-view-details.component.html',
  styles: [
  ]
})
export class ModalViewDetailsComponent implements OnInit, OnDestroy {
  classifiedService = inject(ClassifiedService);
  validatorsService = inject(ValidatorsService);
  viewDetailsSub$!: Subscription;
  classified        = signal<Classified|undefined>(undefined);
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  totalQuantityItems= computed(() => this.classified()?.detailsClassified.reduce( (sum, product) => Number(sum) + Number(product.quantity),0));
  
  ngOnInit(): void {
    this.viewDetailsSub$ = this.classifiedService.detailsSubs$.subscribe(classified => {
      this.classified.set(classified);
    });
  }

  ngOnDestroy(): void {
    this.viewDetailsSub$.unsubscribe();
  }
}
