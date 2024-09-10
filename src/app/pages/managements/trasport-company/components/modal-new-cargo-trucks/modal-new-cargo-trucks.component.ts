import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { TransportCompanyService } from '../../../services/trasport-company.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { TransportCompany } from '../../../interfaces/trasport_company.interfaces';

@Component({
  selector: 'app-modal-new-cargo-trucks',
  templateUrl: './modal-new-cargo-trucks.component.html',
  styles: [
  ]
})
export class ModalNewCargoTrucksComponent implements OnInit, OnDestroy {
  loading = signal(false);
  validatorsService       = inject( ValidatorsService );
  transportCompanyService = inject( TransportCompanyService );
  fb                      = inject( FormBuilder );
  isCargoTruckSub$!: Subscription;
  transportCompany?: TransportCompany;
  cargoTruckForm: FormGroup = this.fb.group({
    placa: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(10),this.validatorsService.isSpacesInDynamicTxt]],
    id_trasport_company: [null, [Validators.required]],
    status: [{value:true, disabled: true}]
  });
  ngOnInit(): void {
    this.isCargoTruckSub$ = this.transportCompanyService.cargoTrucksSubs.subscribe(resp => {
      this.transportCompany =  {...resp};
      this.cargoTruckForm.patchValue({
        id_trasport_company: resp.id,
      });
    });
  }
  ngOnDestroy(): void {
    this.isCargoTruckSub$.unsubscribe();
  }
  newCargoTruck() {
    this.cargoTruckForm.markAllAsTouched();
    if(!this.cargoTruckForm.valid) return;
    this.loading.set(true);
    this.transportCompanyService.postNewCargoTruck({...this.cargoTruckForm.value, status: true}).subscribe({
      complete: () => {
        this.transportCompanyService.save$.next(true);
        this.loading.set(false);
        this.transportCompanyService.showModalNewCargoTruck = false;
        this.transportCompanyService.showModalCargoTrucks = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Vehículo agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() {
    this.transportCompanyService.showModalNewCargoTruck = false;
    this.cargoTruckForm.reset({
      placa: '',
      id_trasport_company: null,
      status: true,
    });
  }
}
