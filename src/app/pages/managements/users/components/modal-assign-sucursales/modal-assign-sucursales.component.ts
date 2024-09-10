import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Subscription } from 'rxjs';
import { FormAssignSucursales, User } from '../../../interfaces/user.interface';
import { Sucursal } from '../../../interfaces/sucursales.interface';
import { SucursalesService } from '../../../services/sucursales.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-assign-sucursales',
  templateUrl: './modal-assign-sucursales.component.html',
  styles: [
  ]
})
export class ModalAssignSucursalesComponent implements OnInit , OnDestroy{

  userService = inject(UsersService);
  sucursalService = inject(SucursalesService);
  isEditSub$!: Subscription;
  user = signal<User|undefined>(undefined)
  sucursales = signal<Sucursal[]>([])
  loading = signal(false);

  ngOnInit(): void {
    this.isEditSub$ = this.userService.assignSucursalSubs.subscribe(resp => {
      this.user.set(resp)
    });
  }
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }

  getAllSucursales() {
    this.sucursalService.getAllAndSearch(1,1000,true).subscribe({
      next: (resp) => this.sucursales.set(resp.sucursales.data), 
      complete: () => {
        this.sucursales().forEach(resp=> resp.select = false);
        this.user()?.assign_sucursales.forEach((resp)=>{
          const targetIndex =  this.sucursales().findIndex(item => item.id === resp.id_sucursal);
          if (targetIndex !== -1) {
            this.sucursales()[targetIndex].select = true;  // Nuevo valor que deseas asignar
          } 
        });
      },
    });
  }

  

  assignSucursal(sucursal: Sucursal) {
    const targetIndex =  this.sucursales().findIndex(item => item.id === sucursal.id);
    if (targetIndex !== -1) {
      this.sucursales()[targetIndex].select = !this.sucursales()[targetIndex].select;  
    } 
  }

  saveAssignSucursales() {
    this.loading.set(true);
    let sucursalesAssign: FormAssignSucursales[] = [];
    this.sucursales().forEach(sucursal => {
        sucursalesAssign.push({
          id_user: this.user()?.id!,
          id_sucursal: sucursal.id!,
          status: sucursal.select!
        });
    });
    this.userService.postAssignSucursales(sucursalesAssign).subscribe({
      next: (resp) => {
        this.userService.showModalSucursales = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Asignación de sucursales realizada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
        });
        this.userService.save$.next(true);
        this.loading.set(false);
      },
      error: (err) => this.loading.set(false)
    })
  }

}
