import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GetAllScales, Scale } from '../interfaces/scale.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ScalesService {

  private http = inject(HttpClient);
  isEdit: boolean = false
  showModal : boolean = false
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Scale> = new EventEmitter<Scale>();

  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllScales>{
    let url = '';
    if(type === ''){
      url = `${base_url}/scale?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/scale?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllScales>(url);
  }

  postNew(form:Scale) {
    const {id, ...body}= form;
    const url = `${base_url}/scale`;
    return this.http.post(url, body);
  }

  putUpdate(form:Scale) {
    const {id, ...body}= form;
    const url = `${base_url}/scale/${form.id}`;
    return this.http.put(url, body);
  }

  putInactiveOrActive(id:number,status:boolean) {
    const url = `${base_url}/scale/destroyAndActive/${id}`;
    return this.http.put(url, {status});
  }
}
