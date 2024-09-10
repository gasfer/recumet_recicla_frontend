import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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

  loginForm: FormGroup = this.fb.group({
    email: [localStorage.getItem('email') || '', [ Validators.required, Validators.pattern(this.validatorsService.emailPattern())]],
    password: ['', [ Validators.required]],
    remember: [localStorage.getItem('saveEmail') || false]
  });

  ngOnInit(): void {
    localStorage.removeItem('id_sucursal');
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
        Swal.fire('BIENVENIDO',resp.user.full_names,'success');
        this.router.navigateByUrl('/');
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
}
