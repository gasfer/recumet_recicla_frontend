import { EventEmitter, Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { FormAssignShifts, FormAssignSucursales, GetAllUsers, User } from '../interfaces/user.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Permission } from '../interfaces/permissions.interfaces';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  isEdit: boolean = false;
  showModal : boolean = false;
  showModalAssignPermissions : boolean = false;
  showModalAssignShifts : boolean = false;
  showModalSucursales : boolean = false;
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<User> = new EventEmitter<User>();
  assignSucursalSubs: EventEmitter<User> = new EventEmitter<User>();
  assignPermisosSubs: EventEmitter<User> = new EventEmitter<User>();
  assignHorariosSubs: EventEmitter<User> = new EventEmitter<User>();
  
  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllUsers>{
    let url = '';
    if(type === ''){
      url = `${base_url}/user?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/user?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllUsers>(url);
  }

  postNew(form:User) {
    const {id, ...body}= form;
    const url = `${base_url}/user`;
    return this.http.post(url, body);
  }

  putUpdate(form:User) {
    const url = `${base_url}/user/${form.id}`;
    return this.http.put(url, form);
  }

  putInactiveOrActive(idUser:number,status:boolean) {
    const url = `${base_url}/user/destroyAndActive/${idUser}`;
    return this.http.put(url, {status});
  }

  postAssignSucursales(sucursales:FormAssignSucursales[]) {
    const url = `${base_url}/user/assign/sucursales`;
    return this.http.put(url, {sucursales});
  }

  postAssignShifts(shifts:FormAssignShifts[]) {
    const url = `${base_url}/user/assign/shift`;
    return this.http.put(url, {shifts});
  }

  postAssignPermissions(permissions:Permission[]) {
    const url = `${base_url}/user/assign/permissions`;
    return this.http.put(url, {permissions});
  }
  
}
