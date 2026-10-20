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
  isEditSub$!: Subscription;
  transportCompany?: TransportCompany;
  transportCompanies = signal<TransportCompany[]>([]);
  cargoTruckForm: FormGroup = this.fb.group({
    id: [null],
    placa: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(10),this.validatorsService.isSpacesInDynamicTxt]],
    id_trasport_company: [null, [Validators.required]],
    status: [{value:true, disabled: true}]
  });
  ngOnInit(): void {
    this.transportCompanyService.getAllAndSearch(1, 1000, true).subscribe({
      next: (response) => this.transportCompanies.set(response.trasport_company.data),
      error: () => this.transportCompanies.set([]),
    });
    this.isCargoTruckSub$ = this.transportCompanyService.cargoTrucksSubs.subscribe(resp => {
      this.transportCompany =  {...resp};
      this.cargoTruckForm.patchValue({
        id_trasport_company: resp.id,
      });
    });
    this.isEditSub$ = this.transportCompanyService.cargoTruckEditSubs.subscribe((truck) => {
      this.transportCompanyService.isEditCargoTruck = true;
      this.transportCompany = undefined;
      this.cargoTruckForm.reset(truck);
    });
  }
  ngOnDestroy(): void {
    this.isCargoTruckSub$.unsubscribe();
    this.isEditSub$.unsubscribe();
  }
  saveCargoTruck() {
    this.cargoTruckForm.markAllAsTouched();
    if(!this.cargoTruckForm.valid) return;
    this.loading.set(true);
    const payload = this.cargoTruckForm.getRawValue();
    const { id, ...newPayload } = payload;
    const request = this.transportCompanyService.isEditCargoTruck
      ? this.transportCompanyService.putUpdateCargoTruck(payload)
      : this.transportCompanyService.postNewCargoTruck({...newPayload, status: true});
    request.subscribe({
      complete: () => {
        this.transportCompanyService.save$.next(true);
        this.loading.set(false);
        this.transportCompanyService.showModalNewCargoTruck = false;
        this.transportCompanyService.isEditCargoTruck = false;
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
    this.transportCompanyService.isEditCargoTruck = false;
    this.transportCompany = undefined;
  }
}
