import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { TransportCompanyService } from '../../../services/trasport-company.service';
import { Subscription } from 'rxjs';
import { CargoTruck, TransportCompany } from '../../../interfaces/trasport_company.interfaces';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-modal-cargo-trucks',
  templateUrl: './modal-cargo-trucks.component.html',
  styleUrls: ['./modal-cargo-trucks.component.scss']
})
export class ModalCargoTrucksComponent implements OnInit, OnDestroy {
  transportCompanyService = inject(TransportCompanyService);
  validatorsService = inject(ValidatorsService);
  isCargoTruckSub$!: Subscription;
  saveSub$!: Subscription;
  transportCompany?: TransportCompany;
  cargoTrucks = signal<{data:CargoTruck[],status:boolean}>({data: [],status:true});
  cols = signal<ColsTable[]>([
    { field: 'placa', header: 'PLACA' , style:'min-width:150px;', tooltip: true},
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:80px;max-width:80px', isButton:true,
    }
  ]);

  ngOnInit(): void {
    this.isCargoTruckSub$ = this.transportCompanyService.cargoTrucksSubs.subscribe(resp => {
      this.transportCompany =  {...resp};
      this.transportCompany.cargo_trucks.forEach(cargo_truck => {
        cargo_truck.options = [
          {
            label:'Editar', icon:'fa-solid fa-pen-to-square', tooltip:'Editar camión',
            disabled: !this.validatorsService.withPermission('COMP. TRASPORTE','update'),
            class:'p-button-rounded p-button-warning p-button-sm',
            eventClick: () => this.editCargoTruck(cargo_truck),
          },
          {
            label:'Eliminar',icon:'fa-solid fa-trash-can', 
            tooltip: 'Eliminar',
            disabled: !this.validatorsService.withPermission('COMP. TRASPORTE','delete'),
            class:'p-button-rounded p-button-danger p-button-sm ms-1',
            eventClick: () => {
              this.deleteChauffeurs(cargo_truck);
            }
          },
        ]
      });
      this.cargoTrucks.set({data: this.transportCompany.cargo_trucks, status:true});
    });
    this.saveSub$ = this.transportCompanyService.save$.subscribe(() => this.refreshCompanyList());
  }

  ngOnDestroy(): void {
    this.isCargoTruckSub$.unsubscribe();
    this.saveSub$.unsubscribe();
  }

  editCargoTruck(truck: CargoTruck): void {
    this.transportCompanyService.isEditCargoTruck = true;
    this.transportCompanyService.cargoTruckEditSubs.emit(truck);
    this.transportCompanyService.showModalNewCargoTruck = true;
  }

  private refreshCompanyList(): void {
    if (!this.transportCompany) return;
    this.transportCompanyService.getAllAndSearch(1, 1000, true).subscribe({
      next: (response) => {
        const refreshed = response.trasport_company.data.find((company) => company.id === this.transportCompany?.id);
        if (!refreshed) return;
        this.transportCompany = refreshed;
        this.cargoTrucks.set({ data: refreshed.cargo_trucks, status: true });
        refreshed.cargo_trucks.forEach((truck) => {
          truck.options = [
            { label:'Editar', icon:'fa-solid fa-pen-to-square', tooltip:'Editar camión', disabled: !this.validatorsService.withPermission('COMP. TRASPORTE','update'), class:'p-button-rounded p-button-warning p-button-sm', eventClick: () => this.editCargoTruck(truck) },
            { label:'Eliminar', icon:'fa-solid fa-trash-can', tooltip:'Eliminar', disabled: !this.validatorsService.withPermission('COMP. TRASPORTE','delete'), class:'p-button-rounded p-button-danger p-button-sm ms-1', eventClick: () => this.deleteChauffeurs(truck) },
          ];
        });
      },
    });
  }

  deleteChauffeurs(cargoTruck: CargoTruck) {
    Swal.fire({
      title: `¿Esta seguro de dar de baja definitivamente?`,
      text: `Esta apunto de Eliminar a vehículo con placa: ${cargoTruck.placa}`,
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
          this.transportCompanyService.deleteCargoTruck(cargoTruck.id).subscribe({
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
        this.cargoTrucks().data = this.cargoTrucks().data.filter(resp => resp.id != cargoTruck.id);
        this.transportCompanyService.save$.next(true);
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Se ha dado de baja al camion`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }
}
