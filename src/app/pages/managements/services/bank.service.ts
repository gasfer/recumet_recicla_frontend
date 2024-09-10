import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Bank, GetAllBanks } from '../interfaces/bank.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private http = inject(HttpClient);
  isEdit: boolean = false;
  showModal : boolean = false;
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Bank> = new EventEmitter<Bank>();

  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllBanks>{
    let url = '';
    if(type === ''){
      url = `${base_url}/bank?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/bank?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllBanks>(url);
  }

  postNew(form:Bank) {
    const {id, ...body}= form;
    const url = `${base_url}/bank`;
    return this.http.post(url, body);
  }

  putUpdate(form:Bank) {
    const url = `${base_url}/bank/${form.id}`;
    return this.http.put(url, form);
  }

  putInactiveOrActive(id:number,status:boolean) {
    const url = `${base_url}/bank/destroyAndActive/${id}`;
    return this.http.put(url, {status});
  }
}
