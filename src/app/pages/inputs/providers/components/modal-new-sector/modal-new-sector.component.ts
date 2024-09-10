import { Component, inject, signal } from '@angular/core';
import { ProvidersService } from '../../../services/providers.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ErrorLogsService } from 'src/app/core/services/error-logs.service';

@Component({
  selector: 'app-modal-new-sector',
  templateUrl: './modal-new-sector.component.html',
  styles: [
  ]
})
export class ModalNewSectorComponent {
  providersService  = inject( ProvidersService );
  errorLogsService  = inject( ErrorLogsService );
  validatorsService = inject( ValidatorsService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  sectorForm: FormGroup = this.fb.group({
    name: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(174),this.validatorsService.isSpacesInDynamicTxt]],
    status: [true]
  });

  newSector() {
    this.sectorForm.markAllAsTouched();
    if(!this.sectorForm.valid) return;
    this.loading.set(true);
    this.providersService.postSector(this.sectorForm.value).subscribe({
      complete: () => {
        this.providersService.reloadCategoriesSectors$.next(true);
        this.loading.set(false);
        this.providersService.showModalNewSector = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Sector nuevo agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: (error) => {
        Swal.fire({ 
          title: 'Advertencia!', 
          text: error?.error?.errors[0]?.msg ? error?.error?.errors[0]?.msg : 'Los datos no son validos, Intenta nuevamente',
          icon: 'warning', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.loading.set(false); 
      }
    });
  }

  resetModal() { 
    this.sectorForm.reset({
      name: '',
      status: true,
    });
  }


}
