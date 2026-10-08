import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { TransferReviewService } from 'src/app/services/transfer-review.service';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loadingMessage = signal('');
  slowLoading = signal(false);
  private slowLoadingTimer?: ReturnType<typeof setTimeout>;
  fb                = inject( FormBuilder );
  validatorsService = inject( ValidatorsService );
  authService       = inject( AuthService );
  router            = inject( Router );
  typeInputPassword = signal('password');
  loading           = signal(false);
  year              = signal(new Date().getFullYear()); 
  sucursales  = signal<Sucursal[]>([]);
  showWorkContext = signal(false);
  sucursalService   = inject(SucursalesService);
  transferReviewService = inject(TransferReviewService);

  loginForm: FormGroup = this.fb.group({
    email: [localStorage.getItem('email') || '', [ Validators.required, Validators.pattern(this.validatorsService.emailPattern())]],
    password: ['', [ Validators.required]],
    remember: [localStorage.getItem('saveEmail') || false]
  });
  contextForm: FormGroup = this.fb.group({
    id_sucursal: [null, [Validators.required]],
    id_storage: [null, [Validators.required]]
  });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    clearTimeout(this.slowLoadingTimer);
  }

  private startLoading(message: string): void {
    clearTimeout(this.slowLoadingTimer);
    this.loading.set(true);
    this.loadingMessage.set(message);
    this.slowLoading.set(false);
    this.slowLoadingTimer = setTimeout(() => this.slowLoading.set(true), 6000);
  }

  private finishLoading(): void {
    clearTimeout(this.slowLoadingTimer);
    this.loading.set(false);
    this.loadingMessage.set('');
    this.slowLoading.set(false);
  }
  
  login(): void {
    if (this.loading()) return;
    this.loginForm.markAllAsTouched();
    if( this.loginForm.invalid ) return;
    this.loading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: (resp) =>{
        if(this.loginForm.get('remember')?.value) {
          localStorage.setItem('email', this.loginForm.get('email')?.value);
          localStorage.setItem('saveEmail', this.loginForm.get('remember')?.value);
        } else {
          localStorage.removeItem('email');
          localStorage.removeItem('saveEmail');
        }
        this.getAllSucursales();
      },
      error:(err) =>{
        this.loading.set(false);
        let error;
        if(err?.error?.errors){
          error = err?.error?.errors[0]?.msg;
        }
        Swal.fire('Oops...!!', error || 'Ocurrió un imprevisto | Revisa tu conexión a internet', error ? 'info' : 'warning');
      },
    })
  }

  updateTypeInputPassword() {
    if(this.typeInputPassword() === 'password'){
      this.typeInputPassword.set('text');
    } else {
      this.typeInputPassword.set('password');
    }
  }

  getAllSucursales() {
      this.startLoading('Cargando sucursales y almacenes…');
      this.sucursalService.getAllAndSearch(1,100,true).pipe(timeout({ first: 20000 })).subscribe({
        next: (resp) => {
          this.sucursales.set(resp.sucursales.data);
          if(this.authService.getUser.role != 'ADMINISTRADOR'){
            const sucursalesTemp = this.sucursales();
            this.sucursales.set(sucursalesTemp.filter((sucursal: Sucursal) =>
              this.authService.getUser?.assign_sucursales!.some((resp) => sucursal.id === resp.id_sucursal)
            ));
          }
          const sucursales = this.sucursales();
          const idSucursalOld = Number(localStorage.getItem('id_sucursal'));
          const idStorageOld = Number(localStorage.getItem('id_storage'));
          const initialSucursal = sucursales.find(s => s.id === idSucursalOld) || sucursales[0];
          const initialStorages = this.getStorages(initialSucursal?.id);
          const idStorage = initialStorages.some(storage => storage.id === idStorageOld)
            ? idStorageOld
            : initialStorages[0]?.id ?? null;
          this.contextForm.patchValue({ id_sucursal: initialSucursal?.id ?? null, id_storage: idStorage });
          this.showWorkContext.set(true);
          this.finishLoading();
        },
        error: () => {
          this.finishLoading();
          Swal.fire('No se pudo cargar el contexto', 'El usuario fue autenticado, pero no se pudieron cargar las sucursales. Intente nuevamente.', 'warning');
        },
      });
    }

  getStorages(idSucursal?: number) {
    return [...(this.sucursales().find(sucursal => sucursal.id === idSucursal)?.storage || [])]
      .filter(storage => storage.status)
      .sort((first, second) => first.name.localeCompare(second.name));
  }

  onSucursalChange() {
    const storages = this.getStorages(Number(this.contextForm.get('id_sucursal')?.value));
    this.contextForm.patchValue({ id_storage: storages[0]?.id ?? null });
  }

  async confirmWorkContext() {
    if (this.loading()) return;
    this.contextForm.markAllAsTouched();
    if (this.contextForm.invalid) return;
    const { id_sucursal, id_storage } = this.contextForm.value;
    if (!this.validatorsService.setWorkContext(this.sucursales(), id_sucursal, id_storage)) return;
    this.startLoading('Preparando tu espacio de trabajo…');
    this.showWorkContext.set(false);
    try {
      this.validatorsService.reload_sucursal_storages$.next(true);
      this.transferReviewService.beginSession();
      const entered = await this.router.navigateByUrl('/');
      if (!entered) {
        this.finishLoading();
        this.showWorkContext.set(true);
        await Swal.fire('No se pudo completar el ingreso', 'Vuelve a intentar con la sucursal y el almacén seleccionados.', 'warning');
        return;
      }
      // Las alertas operativas se consultan después de completar el ingreso.
      this.transferReviewService.checkCurrentContext(true).subscribe({ error: () => {} });
    } catch {
      this.finishLoading();
      this.showWorkContext.set(true);
      await Swal.fire('No se pudo cargar el sistema', 'Revisa tu conexión y vuelve a intentar.', 'warning');
    } finally {
      this.finishLoading();
    }
  }

  cancelWorkContext() {
    this.showWorkContext.set(false);
    this.authService.logout();
  }
}
