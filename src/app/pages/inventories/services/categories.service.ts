import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Category, GetAllCategories } from '../interfaces/categories.interface';
import { environment } from 'src/environments/environment';
import { PRODUCT_ACCESS_ROUTE_SEGMENTS, ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private http = inject(HttpClient);
  isEdit: boolean = false;
  showModal: boolean = false;
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Category> = new EventEmitter<Category>();

  getAllAndSearch(page: number, limit: number, status: boolean, type: string = '', query?: string, category_type: string = '', field_sort: string = 'id', order: string = 'DESC', productContext: ProductAccessContext | '' = ''): Observable<GetAllCategories> {
    let url = '';
    const endpoint = productContext
      ? `category/operational/${PRODUCT_ACCESS_ROUTE_SEGMENTS[productContext]}`
      : 'category';
    if (type === '') {
      url = `${base_url}/${endpoint}?page=${page}&limit=${limit}&status=${status}&category_type=${category_type}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/${endpoint}?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&category_type=${category_type}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllCategories>(url);
  }

  postNew(form: Category) {
    const { id, ...body } = form;
    const url = `${base_url}/category`;
    return this.http.post(url, body);
  }

  putUpdate(form: Category) {
    const url = `${base_url}/category/${form.id}`;
    return this.http.put(url, form);
  }

  putInactiveOrActive(id: number, status: boolean) {
    const url = `${base_url}/category/destroyAndActive/${id}`;
    return this.http.put(url, { status });
  }

  getCategorySelect(category_type: string = '', productContext: ProductAccessContext | '' = ''): Observable<any> {
    const endpoint = productContext
      ? `category/operational/${PRODUCT_ACCESS_ROUTE_SEGMENTS[productContext]}/select`
      : 'category/select';
    const url = `${base_url}/${endpoint}?category_type=${category_type}`;
    return this.http.get<any>(url);
  }

  getInventoryCategorySelect(category_type: string = ''): Observable<any> {
    return this.http.get<any>(`${base_url}/category/inventory/select?category_type=${category_type}`);
  }
}
