import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Subscription } from 'rxjs';
import { User } from '../../../interfaces/user.interface';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Permission } from '../../../interfaces/permissions.interfaces';
import Swal from 'sweetalert2';
import {
  PRODUCT_ACCESS_MODULE_COLUMN_LABEL,
  PRODUCT_ACCESS_CONTEXT_OPTIONS,
  PRODUCT_ACCESS_SECTION_DESCRIPTION,
  PRODUCT_ACCESS_SECTION_TITLE,
  PRODUCT_CATEGORY_TYPE_OPTIONS,
} from 'src/app/core/constants/product-category-access.constants';
import {
  permissionModuleLabel,
  TRANSFER_REVIEW_ACTION_HELP,
} from 'src/app/core/constants/permission-presentation.constants';

interface PermissionGroup {
  name: string;
  icon: string;
  expanded: boolean;
  permissions: Permission[];
}

export const updateAllowedCategoryTypes = (
  currentTypes: string[] | null | undefined,
  categoryType: string,
  checked: boolean,
): string[] => {
  const types = new Set(Array.isArray(currentTypes) ? currentTypes : []);
  checked ? types.add(categoryType) : types.delete(categoryType);
  return [...types];
};

@Component({
  selector: 'app-modal-assign-permissions',
  templateUrl: './modal-assign-permissions.component.html',
  styles: []
})
export class ModalAssignPermissionsComponent implements OnInit, OnDestroy {
  readonly productAccessRows = [...PRODUCT_ACCESS_CONTEXT_OPTIONS];
  readonly productCategoryTypes = [...PRODUCT_CATEGORY_TYPE_OPTIONS];
  readonly productAccessSectionTitle = PRODUCT_ACCESS_SECTION_TITLE;
  readonly productAccessSectionDescription = PRODUCT_ACCESS_SECTION_DESCRIPTION;
  readonly productAccessModuleColumnLabel = PRODUCT_ACCESS_MODULE_COLUMN_LABEL;
  readonly transferReviewActionHelp = TRANSFER_REVIEW_ACTION_HELP;
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
      { id_user: null, module: "TRANSFER_REVIEW", view: false, create: false, update: false, delete: false, reports: false, status: true },
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
      { id_user: null, module: "KARDEX-PT", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "KARDEX-AR", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "KARDEX-ALL", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "KARDEX-ALL-FILTRO", view: false, create: false, update: false, delete: false, reports: false, status: true },

      { id_user: null, module: "INSUMOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "AF MAQUINARIA", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "AF VEHICULOS", view: false, create: false, update: false, delete: false, reports: false, status: true },
      { id_user: null, module: "AF MUEBLES", view: false, create: false, update: false, delete: false, reports: false, status: true },
    ]
  },

  // ⚙️ ADMINISTRACION
  {
    name: 'ADMINISTRACIÓN',
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
          group.permissions[targetIndex].allowed_category_types = userPermission.allowed_category_types ?? [];
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
          reports: false,
          allowed_category_types: []
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
    const permissions: Permission[] = this.formArray.getRawValue().map(permission => ({
      ...permission,
      allowed_category_types: Array.isArray(permission.allowed_category_types)
        ? [...new Set(permission.allowed_category_types)]
        : []
    }));
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
      error: (err) => {
        this.loading.set(false);
        Swal.fire({
          title: 'No se guardaron los permisos',
          text: err?.error?.errors?.[0]?.msg ?? 'Verifica la configuración e inténtalo nuevamente.',
          icon: 'error',
          showClass: { popup: 'animated animate fadeInDown' },
        });
      }
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
      allowed_category_types: [permission.allowed_category_types ?? []],
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

  permissionLabel(module: string): string {
    return permissionModuleLabel(module);
  }

  getPermissionIndexByModule(module: string): number {
    let globalIndex = 0;
    for (const group of this.permissionGroups()) {
      const permissionIndex = group.permissions.findIndex(permission => permission.module === module);
      if (permissionIndex !== -1) return globalIndex + permissionIndex;
      globalIndex += group.permissions.length;
    }
    return -1;
  }

  isCategoryTypeAllowed(module: string, categoryType: string): boolean {
    const permissionIndex = this.getPermissionIndexByModule(module);
    if (permissionIndex < 0) return false;
    const types = this.formArray.at(permissionIndex)?.get('allowed_category_types')?.value;
    return Array.isArray(types) && types.includes(categoryType);
  }

  setCategoryTypeAllowed(module: string, categoryType: string, checked: boolean): void {
    const permissionIndex = this.getPermissionIndexByModule(module);
    if (permissionIndex < 0) return;
    const control = this.formArray.at(permissionIndex)?.get('allowed_category_types');
    if (!control) return;
    control.setValue(updateAllowedCategoryTypes(control.value, categoryType, checked));
    control.markAsDirty();
    control.markAsTouched();
  }

  onHideModal() {
  setTimeout(() => {
    this.resetFormGroup();
  });
}

}
