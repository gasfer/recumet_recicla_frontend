import { Component, inject, signal } from '@angular/core';
import { OutputService } from '../../../services/output.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Subscription } from 'rxjs';
import { Output } from '../../../interfaces/output.interface';

@Component({
  selector: 'app-modal-view-details',
  templateUrl: './modal-view-details.component.html',
  styles: [
  ]
})
export class ModalViewDetailsComponent {
  outputService     = inject(OutputService);
  validatorsService = inject(ValidatorsService);
  viewDetailsSub$!: Subscription;
  output             = signal<Output|undefined>(undefined);
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  
  ngOnInit(): void {
    this.viewDetailsSub$ = this.outputService.detailsSubs$.subscribe(output => {
      this.output.set(output);
    });
  }

  ngOnDestroy(): void {
    this.viewDetailsSub$.unsubscribe();
  }
}
