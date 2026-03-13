import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Subscription } from 'rxjs';
import { User } from '../../../interfaces/user.interface';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Permission } from '../../../interfaces/permissions.interfaces';
import Swal from 'sweetalert2';

interface PermissionGroup {
  name: string;
  icon: string;
  expanded: boolean;
  permissions: Permission[];
}

@Component({
  selector: 'app-modal-assign-permissions',
  templateUrl: './modal-assign-permissions.component.html',
  styles: []
})
export class ModalAssignPermissionsComponent implements OnInit, OnDestroy {
  loading = signal(false);
  userService = inject(UsersService);
  fb = inject(FormBuilder);
  isEditSub$!: Subscription;
  user = signal<User | undefined>(undefined);
  permissionsForm!: FormGroup;
permissionGroups = signal<PermissionGroup[]>([
  // 📥 ENTRADAS
  {
    name: 'ENTRADAS',
    icon: 'fa-arrow-down-to-line',
    expanded: true,
    permissions: [
      { id_user: null, module: "PROVEEDORES", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "RECOJO", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CERTIFICAR", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CUENTAS PROVEEDOR", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "COMPRAS PROVEEDOR", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "COMPRAS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR COMPRAS", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "CLASIFICADOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR CLASIFICADOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
    ]
  },

  // ⚖️ BALANZA
  {
    name: 'GESTIÓN BALANZA',
    icon: 'fa-scale-balanced',
    expanded: true,
    permissions: [
      { id_user: null, module: "REGISTRAR PESAJE CAMIONERA", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR PESAJES CAMIONERA", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "REGISTRAR PESAJE MANUAL", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR PESAJES MANUALES", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "REGISTRAR SERVICIO", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR SERVICIOS", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "REGISTRAR TRANSPORTISTA", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR TRANSPORTISTAS", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "REGISTRAR CAMION", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR CAMIONES", view: false, create: false, update: false, delete: false, reports: false, status: true },
    ]
  },

  // 📤 SALIDAS
  {
    name: 'SALIDAS',
    icon: 'fa-arrow-up-from-line',
    expanded: true,
    permissions: [
      { id_user: null, module: "CLIENTES", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "VENTAS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR VENTAS", view: false, create: false, update: false, delete: false, reports: false, status: true },
    ]
  },

  // 🔄 TRASLADOS
  {
    name: 'TRASLADOS',
    icon: 'fa-truck-ramp-box',
    expanded: true,
    permissions: [
      { id_user: null, module: "TRASLADOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR TRASLADOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "RECEPCIONES", view: false, create: false, update: false, delete: false, reports: false, status: true },
    ]
  },

  // 💰 CAJA Y FINANZAS
  {
    name: 'FINANZAS',
    icon: 'fa-cash-register',
    expanded: true,
    permissions: [
      { id_user: null, module: "CAJA", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CONSULTAR CAJA", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "GASTOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "PERSONAL GASTOS", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "CUENTAS POR PAGAR", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CUENTAS POR COBRAR", view: false, create: false, update: false, delete: false, reports: false, status: true },
    ]
  },

  // 📦 INVENTARIO
  {
    name: 'INVENTARIO',
    icon: 'fa-boxes-stacked',
    expanded: true,
    permissions: [
      { id_user: null, module: "KARDEX-FIS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "KARDEX PT", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "KARDEX AR", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "KARDEX TODOS", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "INSUMOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "AF MAQUINARIA", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "AF VEHICULOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "AF MUEBLES", view: false, create: false, update: false, delete: false, reports: false, status: true },
    ]
  },

  // ⚙️ ADMINISTRACION
  {
    name: 'ADMINISTRACION',
    icon: 'fa-gear',
    expanded: true,
    permissions: [
      { id_user: null, module: "UND MEDIDA", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "BALANZAS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "CATEGORIAS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "PRODUCTOS", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "USUARIOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "EMPRESA", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "SUCURSALES", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "ALMACENES", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "COMP. TRASPORTE", view: false, create: false, update: false, delete: false, reports: false, status: true },
    ]
  }
]);
ngOnInit(): void {
  this.resetFormGroup();
  this.isEditSub$ = this.userService.assignPermisosSubs.subscribe(resp => {
    this.resetFormGroup();
    this.formArray.clear(); // Mejor usar clear() en lugar de setValue([])
    this.user.set(resp); // Aquí ya se está asignando el usuario completo

    // Actualizar permisos en los grupos
    this.user()?.assign_permission.forEach(userPermission => {
      this.permissionGroups().forEach(group => {
        const targetIndex = group.permissions.findIndex(p => p.module === userPermission.module);
        if (targetIndex !== -1) {
          group.permissions[targetIndex].view = userPermission.view;
          group.permissions[targetIndex].create = userPermission.create;
          group.permissions[targetIndex].update = userPermission.update;
          group.permissions[targetIndex].delete = userPermission.delete;
          group.permissions[targetIndex].reports = userPermission.reports;
        }
      });
    });

    // Agregar todos los permisos al FormArray
    this.permissionGroups().forEach(group => {
      group.permissions.forEach(permission => {
        this.addPermission(permission);
      });
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

    // Resetear todos los permisos
    this.permissionGroups.update(groups =>
      groups.map(group => ({
        ...group,
        permissions: group.permissions.map(permission => ({
          ...permission,
          view: false,
          create: false,
          update: false,
          delete: false,
          reports: false
        }))
      }))
    );
  }

  get formArray() {
    return this.permissionsForm.get('permissions') as FormArray;
  }

  toggleGroup(groupIndex: number) {
    this.permissionGroups.update(groups => {
      const updated = [...groups];
      updated[groupIndex].expanded = !updated[groupIndex].expanded;
      return updated;
    });
  }

  sendNewPermissions() {
    this.loading.set(true);
    let permissions: Permission[] = this.formArray.value;
    permissions.forEach(permission => {
      permission.id_user = this.user()!.id;
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
    });
  }

  addPermission(permission: Permission) {
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

  // Helper para obtener el índice global de un permiso
  getPermissionIndex(groupIndex: number, permissionIndex: number): number {
    let globalIndex = 0;
    for (let i = 0; i < groupIndex; i++) {
      globalIndex += this.permissionGroups()[i].permissions.length;
    }
    return globalIndex + permissionIndex;
  }

  onHideModal() {
  setTimeout(() => {
    this.resetFormGroup();
  });
}

}
