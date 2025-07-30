import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: [
  ]
})
export class LoginComponent implements OnInit {
  fb                = inject( FormBuilder );
  validatorsService = inject( ValidatorsService );
  authService       = inject( AuthService );
  router            = inject( Router );
  typeInputPassword = signal('password');
  loading           = signal(false);
  year              = signal(new Date().getFullYear()); 
  sucursales  = signal<Sucursal[]>([]);
  sucursalService   = inject(SucursalesService);

  loginForm: FormGroup = this.fb.group({
    email: [localStorage.getItem('email') || '', [ Validators.required, Validators.pattern(this.validatorsService.emailPattern())]],
    password: ['', [ Validators.required]],
    remember: [localStorage.getItem('saveEmail') || false]
  });

  ngOnInit(): void {
  }
  
  login(): void {
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
        this.loading.set(false);
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
      this.sucursalService.getAllAndSearch(1,100,true).subscribe({
        next: (resp) => {
          this.sucursales.set(resp.sucursales.data);
          if(this.authService.getUser.role != 'ADMINISTRADOR'){
            const sucursalesTemp = this.sucursales();
            this.sucursales.set(sucursalesTemp.filter((sucursal: Sucursal) =>
              this.authService.getUser?.assign_sucursales!.some((resp) => sucursal.id === resp.id_sucursal)
            ));
          }
          //show set sucursal
          const sucursales = this.sucursales();
          const id_sucursal_old = localStorage.getItem('id_sucursal');
          // Generar opciones con `selected` en la opción guardada
          const htmlOptions = sucursales
            .map(s => {
              const selected = s.id?.toString() === id_sucursal_old ? 'selected' : '';
              return `<option value="${s.id}" ${selected}>${s.name}</option>`;
            })
            .join('');
          Swal.fire({
            title: 'BIENVENIDO, Selecciona una sucursal',
            icon: 'success',
            html: `
              <select id="sucursalSelect" class="swal2-input">
                ${htmlOptions}
              </select>
            `,
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            preConfirm: () => {
              const selectEl = document.getElementById('sucursalSelect') as HTMLSelectElement;
              const selected = selectEl?.value;
              return selected;
            }
          }).then(result => {
            const selectedId = result.value;
            const selectedSucursal = sucursales.find(s => s.id == selectedId);
            localStorage.setItem('id_sucursal', selectedSucursal?.id!.toString() || '0');
            this.validatorsService.reload_sucursal_storages$.next(true);
            this.router.navigateByUrl('/');
          });
        },
      });
    }
}
