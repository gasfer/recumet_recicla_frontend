import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpContextToken,
  HttpHeaders
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ErrorLogsService } from '../services/error-logs.service';
export const NotUseJWT = new HttpContextToken(() => false);
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor( private errorLogsService:ErrorLogsService) {}

  get token(): string {
    return localStorage.getItem('token') || '';
  }
  get headerToken() {
    return new HttpHeaders({
      'Authorization' : this.token
    });
  } 

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const reqClone = req.clone({ headers:  this.headerToken }); 
    if (req.context.get(NotUseJWT)) {
      return next.handle(req)
    }
    return next.handle( reqClone ).pipe(
      catchError((err) => {
        this.errorLogsService.logDeErrores(err);
        return throwError(() => err);
      }),
    )
  }
}
