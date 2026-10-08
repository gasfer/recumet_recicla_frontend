import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';
import { User, AssignPermission } from 'src/app/auth/auth.interface';
import { permissionModuleLabel } from 'src/app/core/constants/permission-presentation.constants';
import Swal from 'sweetalert2';
import { userRolePresentation } from 'src/app/core/constants/user-role.constants';

export interface ReadonlyPermissionGroup {
  name: string;
  icon: string;
  permissions: AssignPermission[];
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  readonly rolePresentation = userRolePresentation;
  activeTab = signal<'general' | 'security' | 'assignments'>('assignments');
  loading = signal(false);
  savingProfile = signal(false);
  savingPassword = signal(false);

  user = signal<User | undefined>(undefined);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  defaultAvatar = 'assets/img/not-user.jpg';

  constructor(
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      cellphone: ['', [Validators.pattern('^[0-9]{7,10}$')]],
      photo: ['']
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPass = form.get('new_password')?.value;
    const confirmPass = form.get('confirm_password')?.value;
    if (newPass && confirmPass && newPass !== confirmPass) {
      form.get('confirm_password')?.setErrors({ mismatch: true });
    } else if (form.get('confirm_password')?.hasError('mismatch')) {
      form.get('confirm_password')?.setErrors(null);
    }
    return null;
  }

  loadProfile(): void {
    this.loading.set(true);
    this.authService.getProfile().subscribe({
      next: (resp) => {
        this.loading.set(false);
        if (resp?.ok && resp.user) {
          this.user.set(resp.user);
          this.profileForm.patchValue({
            cellphone: resp.user.cellphone || '',
            photo: resp.user.photo || ''
          });
        }
      },
      error: () => {
        this.loading.set(false);
        const currentUser = this.authService.getUser;
        if (currentUser?.id) {
          this.user.set(currentUser as User);
          this.profileForm.patchValue({
            cellphone: currentUser.cellphone || '',
            photo: currentUser.photo || ''
          });
        }
      }
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.defaultAvatar;
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    const { cellphone, photo } = this.profileForm.value;

    this.authService.updateProfile({
      cellphone: cellphone ? Number(cellphone) : undefined,
      photo: photo ? photo.trim() : ''
    }).subscribe({
      next: (resp) => {
        this.savingProfile.set(false);
        if (resp?.ok) {
          this.user.set(resp.user);
          Swal.fire({
            title: '¡Perfil Actualizado!',
            text: resp.msg || 'Los datos de contacto y foto han sido guardados.',
            icon: 'success',
            confirmButtonColor: '#34c38f'
          });
        }
      },
      error: (err) => {
        this.savingProfile.set(false);
        const errorMsg = err?.error?.errors?.[0]?.msg || 'No se pudo actualizar el perfil.';
        Swal.fire({
          title: 'Error',
          text: errorMsg,
          icon: 'error',
          confirmButtonColor: '#f46a6a'
        });
      }
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    const { current_password, new_password, confirm_password } = this.passwordForm.value;

    this.authService.changePassword({
      current_password,
      new_password,
      confirm_password
    }).subscribe({
      next: (resp) => {
        this.savingPassword.set(false);
        if (resp?.ok) {
          this.passwordForm.reset();
          Swal.fire({
            title: '¡Contraseña Actualizada!',
            text: resp.msg || 'Tu contraseña ha sido modificada con éxito.',
            icon: 'success',
            confirmButtonColor: '#34c38f'
          });
        }
      },
      error: (err) => {
        this.savingPassword.set(false);
        const errorMsg = err?.error?.errors?.[0]?.msg || 'La contraseña actual no es correcta.';
        Swal.fire({
          title: 'Error de Validación',
          text: errorMsg,
          icon: 'error',
          confirmButtonColor: '#f46a6a'
        });
      }
    });
  }

  permissionLabel(module: string): string {
    return permissionModuleLabel(module);
  }

  getActivePermissionGroups(user?: User): ReadonlyPermissionGroup[] {
    if (!user) return [];
    const permissions = user.assign_permission || [];
    const activePerms = permissions.filter(p => p.view || p.create || p.update || p.delete || p.reports);
    if (activePerms.length === 0) return [];

    const groupDefinitions = [
      {
        name: 'COMERCIAL',
        icon: 'fa-briefcase',
        modules: ['PROVEEDORES', 'RECOJO', 'CERTIFICAR', 'CUENTAS PROVEEDOR', 'COMPRAS PROVEEDOR', 'REPORTE COMERCIAL']
      },
      {
        name: 'ENTRADAS',
        icon: 'fa-arrow-down-to-line',
        modules: ['COMPRAS', 'CONSULTAR COMPRAS', 'REPORTE COMPRAS', 'CLASIFICADOS', 'CONSULTAR CLASIFICADOS']
      },
      {
        name: 'BALANZA',
        icon: 'fa-scale-balanced',
        modules: ['REGISTRAR PESAJE CAMIONERA', 'CONSULTAR PESAJES CAMIONERA', 'REGISTRAR PESAJE MANUAL', 'CONSULTAR PESAJES MANUALES', 'REGISTRAR SERVICIO', 'CONSULTAR SERVICIOS', 'REGISTRAR TRANSPORTISTA', 'CONSULTAR TRANSPORTISTAS', 'REGISTRAR CAMION', 'CONSULTAR CAMIONES']
      },
      {
        name: 'SALIDAS',
        icon: 'fa-arrow-up-from-line',
        modules: ['CLIENTES', 'VENTAS', 'CONSULTAR VENTAS', 'REPORTE VENTAS', 'DESPACHOS', 'TRASLADOS', 'CONSULTAR TRASLADOS', 'RECEPCIONES', 'TRANSFER_REVIEW']
      },
      {
        name: 'ADMINISTRACIÓN DE CAJA',
        icon: 'fa-cash-register',
        modules: ['CAJA', 'CONSULTAR CAJA', 'GASTOS', 'PERSONAL GASTOS', 'CUENTAS POR PAGAR', 'CUENTAS POR COBRAR', 'REPORTE FINANZAS']
      },
      {
        name: 'INVENTARIO',
        icon: 'fa-boxes-stacked',
        modules: ['KARDEX-FIS', 'KARDEX-PT', 'KARDEX-AR', 'KARDEX-ALL', 'KARDEX-ALL-FILTRO', 'STOCK_RECONCILIATION', 'REPORTE KARDEX', 'INSUMOS', 'AF MAQUINARIA', 'AF VEHICULOS', 'AF MUEBLES']
      },
      {
        name: 'ADMINISTRACIÓN',
        icon: 'fa-gear',
        modules: ['UND MEDIDA', 'BALANZAS', 'CATEGORIAS', 'PRODUCTOS', 'USUARIOS', 'EMPRESA', 'SUCURSALES', 'ALMACENES', 'COMP. TRASPORTE']
      },
      {
        name: 'REPORTES',
        icon: 'fa-chart-column',
        modules: ['REPORTE GERENCIA', 'REPORTE CONTABILIDAD']
      }
    ];

    const result: ReadonlyPermissionGroup[] = [];
    const assignedModuleSet = new Set<string>();

    for (const group of groupDefinitions) {
      const matched = activePerms.filter(p => group.modules.includes(p.module));
      if (matched.length > 0) {
        matched.forEach(p => assignedModuleSet.add(p.module));
        result.push({
          name: group.name,
          icon: group.icon,
          permissions: matched
        });
      }
    }

    const remaining = activePerms.filter(p => !assignedModuleSet.has(p.module));
    if (remaining.length > 0) {
      result.push({
        name: 'OTROS MÓDULOS',
        icon: 'fa-shield-halved',
        permissions: remaining
      });
    }

    return result;
  }
}
