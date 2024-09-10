import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Subscription } from 'rxjs';
import { User } from '../../../interfaces/user.interface';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Permission } from '../../../interfaces/permissions.interfaces';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-assign-permissions',
  templateUrl: './modal-assign-permissions.component.html',
  styles: []
})
export class ModalAssignPermissionsComponent  implements OnInit, OnDestroy {
  loading     = signal(false);
  userService = inject(UsersService);
  fb          = inject(FormBuilder);
  isEditSub$!: Subscription;
  user = signal<User|undefined>(undefined);
  permissionsForm!: FormGroup;
  permissions = signal<Permission[]>([
    {
      id_user: null,
      module: "PROVEEDORES",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "COMPRAS",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "CLASIFICADOS",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "CLIENTES",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "VENTAS",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "TRASLADOS",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "RECEPCIONES",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "CAJA",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "CUENTAS POR PAGAR",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "CUENTAS POR COBRAR",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "KARDEX",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "UND MEDIDA",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "BALANZAS",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "CATEGORIAS",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "PRODUCTOS",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "USUARIOS",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "EMPRESA",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "SUCURSALES",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "ALMACENES",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
    {
      id_user: null,
      module: "COMP. TRASPORTE",
      view: false,
      create: false,
      update: false,
      delete: false,
      reports: false,
      status: true
    },
  ]);

  ngOnInit(): void {
    this.resetFormGroup();
    this.isEditSub$ = this.userService.assignPermisosSubs.subscribe(resp => {
      this.resetFormGroup();
      this.formArray.setValue([]);
      this.user.set(resp);
      this.user()?.assign_permission.forEach(permission => {
          const targetIndex =  this.permissions().findIndex(item => item.module === permission.module);
          if (targetIndex !== -1) {
            this.permissions()[targetIndex].view = permission.view;  // Nuevo valor que deseas asignar
            this.permissions()[targetIndex].create = permission.create;  // Nuevo valor que deseas asignar
            this.permissions()[targetIndex].update = permission.update;  // Nuevo valor que deseas asignar
            this.permissions()[targetIndex].delete = permission.delete;  // Nuevo valor que deseas asignar
            this.permissions()[targetIndex].reports = permission.reports;  // Nuevo valor que deseas asignar
            //this.permissions()[targetIndex].status = permission.status; 
          } 
      });
      this.permissions().forEach(permission => {
        this.addPermission(permission);
      });
    });
  }

  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }

  resetFormGroup() {
    this.permissionsForm = this.fb.group({
      permissions: this.fb.array([])
    });
    this.permissions.update((resp) => 
      resp.map(permission => ({
        ...permission,
        view: false,
        create: false,
        update: false,
        delete: false,
        reports: false
      }))
    );
  }

  get formArray () {
    return this.permissionsForm.get('permissions') as FormArray;
  }

  sendNewPermissions() {
    this.loading.set(true);
    let permissions: Permission[] = this.formArray.value;
    permissions.forEach(permission => {
      permission.id_user =  this.user()!.id;
    });
    this.userService.postAssignPermissions(permissions).subscribe({
      next: (resp) => {
        this.userService.showModalAssignPermissions = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Asignación de permisos realizada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
        });
        this.userService.save$.next(true);
        this.loading.set(false);
      },
      error: (err) => this.loading.set(false)
    })
  }

  addPermission(permission:Permission) {
    const permissionGroup = this.fb.group({
      id_user: [permission.id_user],
      module: [permission.module],
      view: [permission.view],
      create: [permission.create],
      update: [permission.update],
      delete: [permission.delete],
      reports: [permission.reports],
      status: [permission.status]
    });
      this.formArray.push(permissionGroup);
  }
}
