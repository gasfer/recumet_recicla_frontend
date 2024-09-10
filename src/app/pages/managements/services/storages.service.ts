import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GetAllStorages, Storage } from '../interfaces/storages.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class StoragesService {
  private http = inject(HttpClient);
  isEdit: boolean = false;
  showModal : boolean = false;
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Storage> = new EventEmitter<Storage>();

  getAllAndSearch(page: number, limit: number,status:boolean,id_sucursal:number, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllStorages>{
    let url = '';
    if(type === ''){
      url = `${base_url}/storage?page=${page}&limit=${limit}&status=${status}&id_sucursal=${id_sucursal}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/storage?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&id_sucursal=${id_sucursal}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllStorages>(url);
  }

  postNew(form:Storage) {
    const {id, ...body}= form;
    const url = `${base_url}/storage`;
    return this.http.post(url, body);
  }

  putUpdate(form:Storage) {
    const url = `${base_url}/storage/${form.id}`;
    return this.http.put(url, form);
  }

  putInactiveOrActive(id:number,status:boolean) {
    const url = `${base_url}/storage/destroyAndActive/${id}`;
    return this.http.put(url, {status});
  }
}
