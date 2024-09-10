import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { InputsService } from '../../../services/inputs.service';
import { Subscription } from 'rxjs';
import { Input } from '../../../interfaces/input.interface';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-modal-view-details',
  templateUrl: './modal-view-details.component.html',
  styles: []
})
export class ModalViewDetailsComponent implements OnInit, OnDestroy {
  inputService      = inject(InputsService);
  validatorsService = inject(ValidatorsService);
  viewDetailsSub$!: Subscription;
  input             = signal<Input|undefined>(undefined);
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  
  ngOnInit(): void {
    this.viewDetailsSub$ = this.inputService.detailsSubs$.subscribe(input => {
      this.input.set(input);
    });
  }

  ngOnDestroy(): void {
    this.viewDetailsSub$.unsubscribe();
  }
}
