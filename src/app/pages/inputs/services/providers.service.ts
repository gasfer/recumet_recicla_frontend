import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { GetAllProviders, GetAllTypesProvider, Provider } from '../interfaces/provider.interface';
import { environment } from 'src/environments/environment';
import { GetAllSectorProviders, Sector } from '../interfaces/sector.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {
  private http = inject(HttpClient);
  isEdit: boolean = false;
  showModal : boolean = false;
  showModalNewSector : boolean = false;
  showModalSectors : boolean = false;
  save$: Subject<boolean> = new Subject();
  reloadCategoriesSectors$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Provider> = new EventEmitter<Provider>();

  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC', id_type_provider:string = ''): Observable<GetAllProviders>{
    let url = '';
    if(type === ''){
      url = `${base_url}/provider?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}&id_type_provider=${id_type_provider}`;
    } else {
      url = `${base_url}/provider?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}&id_type_provider=${id_type_provider}`;
    }
    return this.http.get<GetAllProviders>(url);
  }

  postNew(form:Provider) {
    const {id, ...body}= form;
    const url = `${base_url}/provider`;
    return this.http.post(url, body);
  }

  putUpdate(form:Provider) {
    const {id, ...body}= form;
    const url = `${base_url}/provider/${form.id}`;
    return this.http.put(url, body);
  }

  putInactiveOrActive(id:number,status:boolean) {
    const url = `${base_url}/provider/destroyAndActive/${id}`;
    return this.http.put(url, {status});
  }

  getAllSectorProvider(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllSectorProviders>{
    let url = '';
    if(type === ''){
      url = `${base_url}/provider/sectors?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/provider/sectors?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllSectorProviders>(url);
  }

  postSector(sector:Sector) {
    const {id, ...body}= sector;
    const url = `${base_url}/provider/sector`;
    return this.http.post(url, body);
  }

  deleteSector(id:number) {
    const url = `${base_url}/provider/sector/destroy/${id}`;
    return this.http.delete(url);
  }

  getAllTypesProvider(): Observable<GetAllTypesProvider>{
    let url = `${base_url}/provider/types`;
    return this.http.get<GetAllTypesProvider>(url);
  }
}
