import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GetAllTransportCompany, NewCargoTruck, NewChauffeur, TransportCompany } from '../interfaces/trasport_company.interfaces';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class TransportCompanyService {

  private http = inject(HttpClient);
  isEdit                 : boolean = false;
  showModal              : boolean = false;
  showModalChauffeurs    : boolean = false;
  showModalCargoTrucks   : boolean = false;
  showModalNewChauffeur  : boolean = false;
  showModalNewCargoTruck : boolean = false;
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<TransportCompany> = new EventEmitter<TransportCompany>();
  chauffeursSubs: EventEmitter<TransportCompany> = new EventEmitter<TransportCompany>();
  cargoTrucksSubs: EventEmitter<TransportCompany> = new EventEmitter<TransportCompany>();

  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllTransportCompany>{
    let url = '';
    if(type === ''){
      url = `${base_url}/trasport_company?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/trasport_company?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllTransportCompany>(url);
  }

  postNew(form:TransportCompany) {
    const {id, ...body}= form;
    const url = `${base_url}/trasport_company`;
    return this.http.post(url, body);
  }

  putUpdate(form:TransportCompany) {
    const {id, ...body}= form;
    const url = `${base_url}/trasport_company/${form.id}`;
    return this.http.put(url, body);
  }

  putInactiveOrActive(id:number,status:boolean) {
    const url = `${base_url}/trasport_company/destroyAndActive/${id}`;
    return this.http.put(url, {status});
  }

  deleteCargoTruck(id:number) {
    const url = `${base_url}/trasport_company/cargo_truck/${id}`;
    return this.http.delete(url);
  }

  deleteChauffeur(id:number) {
    const url = `${base_url}/trasport_company/chauffeur/${id}`;
    return this.http.delete(url);
  }

  postNewCargoTruck(body:NewCargoTruck) {
    const url = `${base_url}/trasport_company/cargo_truck`;
    return this.http.post(url, body);
  }
  postNewChauffeur(body:NewChauffeur) {
    const url = `${base_url}/trasport_company/chauffeur`;
    return this.http.post(url, body);
  }
}
