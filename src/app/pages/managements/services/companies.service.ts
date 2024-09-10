import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Company, GetAllCompanies } from '../interfaces/companies.interfaces';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  private http = inject(HttpClient);
  showModal : boolean = false
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Company> = new EventEmitter<Company>();

  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllCompanies>{
    let url = '';
    if(type === ''){
      url = `${base_url}/company?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/company?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllCompanies>(url);
  }
  putUpdate(form:Company) {
    const url = `${base_url}/company/${form.id}`;
    return this.http.put(url, form);
  }
}
