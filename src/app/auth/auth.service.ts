import { Injectable, signal,  } from '@angular/core';
import { Auth, FormAuth, User } from './auth.interface';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ValidatorsService } from '../services/validators.service';
const base_url = environment.base_url;	

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  _user = signal<User|undefined>(undefined);
  decimal = signal(2);
  constructor( 
    private http:    HttpClient,
    private router:  Router,
    private validatorsService:ValidatorsService
  ) { }
  
  get token(): string {
    return localStorage.getItem('token') || '';
  }
  get headerToken() {
    return { headers: { 'Authorization' : this.token } };
  }
  get getUser() {
    return { ...this._user() };
  }

  login(formData: FormAuth) : Observable<Auth> {
    return this.http.post<Auth>(`${base_url}/auth`, formData).
      pipe(
        tap( (resp: Auth)  => {
          this._user.set(resp.user);
          this.decimal.set(resp.company.decimals);
          localStorage.setItem('token', resp.token);
          this.validatorsService.decimalLength.set(this.decimal());
          this.validatorsService.user.set(this._user());
        })
      );
  }

  refresh() : Observable<boolean> {
    return this.http.post<Auth>(`${base_url}/auth/refresh`,{},this.headerToken)
    .pipe(
      map( (resp: Auth) => {
        this._user.set(resp.user);
        this.validatorsService.user.set(this._user());
        this.decimal.set(resp.company.decimals);
        this.validatorsService.decimalLength.set(this.decimal())
        localStorage.setItem('token',resp.token);
        return true;
      }),
      catchError( error => {
        return of(false);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('id_sucursal');
    this.validatorsService.id_sucursal.set(0);
    this.validatorsService.storages.set([]);
    this.router.navigateByUrl('/auth');
  }
}
