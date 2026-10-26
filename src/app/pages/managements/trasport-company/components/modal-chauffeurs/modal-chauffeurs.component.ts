import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { TransportCompanyService } from '../../../services/trasport-company.service';
import { Subscription } from 'rxjs';
import { Chauffeur, TransportCompany } from '../../../interfaces/trasport_company.interfaces';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-modal-chauffeurs',
  templateUrl: './modal-chauffeurs.component.html',
  styleUrls: ['./modal-chauffeurs.component.scss']
})
export class ModalChauffeursComponent implements OnInit, OnDestroy {
  transportCompanyService = inject(TransportCompanyService);
  validatorsService = inject(ValidatorsService);
  isChauffeursSub$!: Subscription;
  saveSub$!: Subscription;
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
            label:'Editar', icon:'fa-solid fa-pen-to-square', tooltip:'Editar conductor',
            disabled: !this.validatorsService.withPermission('COMP. TRASPORTE','update'),
            class:'p-button-rounded p-button-warning p-button-sm',
            eventClick: () => this.editChauffeur(chauffeur),
          },
          {
            label:'Eliminar',icon:'fa-solid fa-trash-can', 
            tooltip: 'Eliminar',
            disabled: !this.validatorsService.withPermission('COMP. TRASPORTE','delete'),
            class:'p-button-rounded p-button-danger p-button-sm ms-1',
            eventClick: () => {
              this.deleteChauffeurs(chauffeur);
            }
          },
        ]
      });
      this.chauffeurs.set({data: this.transportCompany.chauffeurs, status:true});
    });
    this.saveSub$ = this.transportCompanyService.save$.subscribe(() => this.refreshCompanyList());
  }

  ngOnDestroy(): void {
    this.isChauffeursSub$.unsubscribe();
    this.saveSub$.unsubscribe();
  }

  editChauffeur(chauffeur: Chauffeur): void {
    this.transportCompanyService.isEditChauffeur = true;
    this.transportCompanyService.chauffeurEditSubs.emit(chauffeur);
    this.transportCompanyService.showModalNewChauffeur = true;
  }

  private refreshCompanyList(): void {
    if (!this.transportCompany) return;
    this.transportCompanyService.getAllAndSearch(1, 1000, true).subscribe({
      next: (response) => {
        const refreshed = response.trasport_company.data.find((company) => company.id === this.transportCompany?.id);
        if (!refreshed) return;
        this.transportCompany = refreshed;
        this.chauffeurs.set({ data: refreshed.chauffeurs, status: true });
        refreshed.chauffeurs.forEach((chauffeur) => {
          chauffeur.options = [
            { label:'Editar', icon:'fa-solid fa-pen-to-square', tooltip:'Editar conductor', disabled: !this.validatorsService.withPermission('COMP. TRASPORTE','update'), class:'p-button-rounded p-button-warning p-button-sm', eventClick: () => this.editChauffeur(chauffeur) },
            { label:'Eliminar', icon:'fa-solid fa-trash-can', tooltip:'Eliminar', disabled: !this.validatorsService.withPermission('COMP. TRASPORTE','delete'), class:'p-button-rounded p-button-danger p-button-sm ms-1', eventClick: () => this.deleteChauffeurs(chauffeur) },
          ];
        });
      },
    });
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
      confirmButtonColor: 'var(--color-action-primary)',
      cancelButtonColor: 'var(--color-action-secondary)',
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
