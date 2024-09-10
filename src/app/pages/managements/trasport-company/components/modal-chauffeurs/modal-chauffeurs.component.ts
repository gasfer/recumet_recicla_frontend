import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { TransportCompanyService } from '../../../services/trasport-company.service';
import { Subscription } from 'rxjs';
import { Chauffeur, TransportCompany } from '../../../interfaces/trasport_company.interfaces';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-chauffeurs',
  templateUrl: './modal-chauffeurs.component.html',
  styles: [
  ]
})
export class ModalChauffeursComponent implements OnInit, OnDestroy {
  transportCompanyService = inject(TransportCompanyService);
  isChauffeursSub$!: Subscription;
  transportCompany?: TransportCompany;
  chauffeurs = signal<{data:Chauffeur[],status:boolean}>({data: [],status:true});
  cols = signal<ColsTable[]>([
    { field: 'full_names', header: 'CHOFER' , style:'min-width:150px;', tooltip: true},
    { field: `number_document`, header: 'CI / LICENCIA' , style:'min-width:100px;',tooltip: true  },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:80px;max-width:80px', isButton:true,
    }
  ]);

  ngOnInit(): void {
    this.isChauffeursSub$ = this.transportCompanyService.chauffeursSubs.subscribe(resp => {
      this.transportCompany =  {...resp};
      this.transportCompany.chauffeurs.forEach(chauffeur => {
        chauffeur.options = [
          {
            label:'Eliminar',icon:'fa-solid fa-trash-can', 
            tooltip: 'Eliminar',
            class:'p-button-rounded p-button-danger p-button-sm ms-1',
            eventClick: () => {
              this.deleteChauffeurs(chauffeur);
            }
          },
        ]
      });
      this.chauffeurs.set({data: this.transportCompany.chauffeurs, status:true});
    });
  }

  ngOnDestroy(): void {
    this.isChauffeursSub$.unsubscribe();
  }

  deleteChauffeurs(chauffeur: Chauffeur) {
    Swal.fire({
      title: `¿Esta seguro de dar de baja definitivamente?`,
      text: `Esta apunto de Eliminar a ${chauffeur.full_names}`,
      icon: 'warning',
      confirmButtonText: `Si, Dar de baja!`,
      showLoaderOnConfirm: true,
      showCancelButton: true,
      backdrop:true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      customClass: { container: 'sweetalert2'},
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          this.transportCompanyService.deleteChauffeur(chauffeur.id).subscribe({
            complete: () => resolve(true),
            error: (err) => {
              Swal.showValidationMessage(`Ops...! Lamentablemente no se puedo realizar la solicitud`);
              resolve(false);
            }
          });
        });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if(!result.isConfirmed) return;
      if(result.value) {
        this.chauffeurs().data = this.chauffeurs().data.filter(resp => resp.id != chauffeur.id);
        this.transportCompanyService.save$.next(true);
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Se ha dado de baja al chofer`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }
}
