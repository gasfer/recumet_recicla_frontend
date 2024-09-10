import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { TransportCompanyService } from '../../../services/trasport-company.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TransportCompany } from '../../../interfaces/trasport_company.interfaces';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-new-chauffeur',
  templateUrl: './modal-new-chauffeur.component.html',
  styles: [
  ]
})
export class ModalNewChauffeurComponent implements OnInit, OnDestroy {
  loading = signal(false);
  validatorsService       = inject( ValidatorsService );
  transportCompanyService = inject( TransportCompanyService );
  fb                      = inject( FormBuilder );
  isChauffeursSub$!: Subscription;
  transportCompany?: TransportCompany;
  chauffeurForm: FormGroup = this.fb.group({
    full_names: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(174),this.validatorsService.isSpacesInDynamicTxt]],
    number_document: [ '', [Validators.minLength(2),Validators.maxLength(20)]],
    id_trasport_company: [null, [Validators.required]],
    status: [{value:true, disabled: true}]
  });
  ngOnInit(): void {
    this.isChauffeursSub$ = this.transportCompanyService.chauffeursSubs.subscribe(resp => {
      this.transportCompany =  {...resp};
      this.chauffeurForm.patchValue({
        id_trasport_company: resp.id,
      });
    });
  }
  ngOnDestroy(): void {
    this.isChauffeursSub$.unsubscribe();
  }
  newCargoTruck() {
    this.chauffeurForm.markAllAsTouched();
    if(!this.chauffeurForm.valid) return;
    this.loading.set(true);
    this.transportCompanyService.postNewChauffeur({...this.chauffeurForm.value, status: true}).subscribe({
      complete: () => {
        this.transportCompanyService.save$.next(true);
        this.loading.set(false);
        this.transportCompanyService.showModalNewChauffeur = false;
        this.transportCompanyService.showModalChauffeurs = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Chofer agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() {
    this.transportCompanyService.showModalNewChauffeur = false;
    this.chauffeurForm.reset({
      full_names: '',
      number_document: '',
      id_trasport_company: null,
      status: true,
    });
  }
}
