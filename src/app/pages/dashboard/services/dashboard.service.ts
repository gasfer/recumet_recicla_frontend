import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GetAllHistories } from '../interfaces/history.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  constructor() { }

  getAll(page: number, limit: number,id_sucursal:number,id_user:string): Observable<GetAllHistories>{
    const url = `${base_url}/history?page=${page}&limit=${limit}&id_sucursal=${id_sucursal}&id_user=${id_user}`;
    return this.http.get<GetAllHistories>(url);
  }

}
