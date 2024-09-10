import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { GetAllSucursales, Sucursal } from '../interfaces/sucursales.interface';
const base_url = environment.base_url;
@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  private http = inject(HttpClient);
  isEdit: boolean = false
  showModal : boolean = false
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Sucursal> = new EventEmitter<Sucursal>();

  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllSucursales>{
    let url = '';
    if(type === ''){
      url = `${base_url}/sucursal?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/sucursal?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllSucursales>(url);
  }

  postNew(form:Sucursal) {
    const {id, ...body}= form;
    const url = `${base_url}/sucursal`;
    return this.http.post(url, body);
  }

  putUpdate(form:Sucursal) {
    const url = `${base_url}/sucursal/${form.id}`;
    return this.http.put(url, form);
  }

  putInactiveOrActive(id:number,status:boolean) {
    const url = `${base_url}/sucursal/destroyAndActive/${id}`;
    return this.http.put(url, {status});
  }
}
