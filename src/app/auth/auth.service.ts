import { Injectable, signal,  } from '@angular/core';
import { Auth, FormAuth, User } from './auth.interface';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap, timeout } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ValidatorsService } from '../services/validators.service';
import { DecimalFormatService } from '../services/decimal-format.service';
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
    private validatorsService:ValidatorsService,
    private decimalFormat: DecimalFormatService
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
          this.decimalFormat.setDecimals(this.decimal());
          this.validatorsService.user.set(this._user());
        })
      );
  }

  refresh() : Observable<boolean> {
    return this.http.post<Auth>(`${base_url}/auth/refresh`,{},this.headerToken)
    .pipe(
      timeout({ first: 8000 }),
      map( (resp: Auth) => {
        this._user.set(resp.user);
        this.validatorsService.user.set(this._user());
        this.decimal.set(resp.company.decimals);
        this.validatorsService.decimalLength.set(this.decimal())
        this.decimalFormat.setDecimals(this.decimal());
        localStorage.setItem('token',resp.token);
        return true;
      }),
      catchError( error => {
        return of(false);
      })
    );
  }

  getProfile(): Observable<{ ok: boolean, user: User }> {
    return this.http.get<{ ok: boolean, user: User }>(`${base_url}/user/profile/me`, this.headerToken)
      .pipe(
        tap(resp => {
          if (resp?.ok && resp.user) {
            this._user.set(resp.user);
            this.validatorsService.user.set(this._user());
          }
        })
      );
  }

  updateProfile(data: { cellphone?: number | string, photo?: string }): Observable<{ ok: boolean, msg: string, user: User }> {
    return this.http.put<{ ok: boolean, msg: string, user: User }>(`${base_url}/user/profile/me`, data, this.headerToken)
      .pipe(
        tap(resp => {
          if (resp?.ok && resp.user) {
            this._user.set(resp.user);
            this.validatorsService.user.set(this._user());
          }
        })
      );
  }

  changePassword(data: { current_password: string, new_password: string, confirm_password?: string }): Observable<{ ok: boolean, msg: string }> {
    return this.http.put<{ ok: boolean, msg: string }>(`${base_url}/user/profile/change-password`, data, this.headerToken);
  }

  logout() {
    localStorage.removeItem('token');
    this.validatorsService.clearWorkContext();
    this.router.navigateByUrl('/auth');
  }
}
