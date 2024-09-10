import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Category, GetAllCategories } from '../interfaces/categories.interface';
import { environment } from 'src/environments/environment';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private http = inject(HttpClient);
  isEdit: boolean = false;
  showModal : boolean = false;
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Category> = new EventEmitter<Category>();

  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllCategories>{
    let url = '';
    if(type === ''){
      url = `${base_url}/category?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/category?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllCategories>(url);
  }

  postNew(form:Category) {
    const {id, ...body}= form;
    const url = `${base_url}/category`;
    return this.http.post(url, body);
  }

  putUpdate(form:Category) {
    const url = `${base_url}/category/${form.id}`;
    return this.http.put(url, form);
  }

  putInactiveOrActive(id:number,status:boolean) {
    const url = `${base_url}/category/destroyAndActive/${id}`;
    return this.http.put(url, {status});
  }
}
