import { HttpClient, HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject, of, catchError } from 'rxjs';
import { GetAllProviders, GetAllTypesProvider, Provider } from '../interfaces/provider.interface';
import { environment } from 'src/environments/environment';
import { GetAllSectorProviders, Sector } from '../interfaces/sector.interface';
import {
  ProviderBankAccountProfile,
  ProviderCommercialCompaniesResponse,
  ProviderCommercialProfileResponse,
  ProviderCompanyProfile,
  ProviderContactProfile,
  ProviderMaterialProfile,
  ProviderPendingSummary,
  ProviderSiteProfile,
  ProviderSiteResponse,
} from '../interfaces/provider-commercial-profile.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {
  private http = inject(HttpClient);
  isEdit: boolean = false;
  showModal : boolean = false;
  showPreRegisterModal : boolean = false;
  showModalNewSector : boolean = false;
  showModalSectors : boolean = false;
  save$: Subject<boolean> = new Subject();
  reloadCategoriesSectors$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Provider> = new EventEmitter<Provider>();
/*
  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC', id_type_provider:string = ''): Observable<GetAllProviders>{
    let url = '';
    if(type === ''){
      url = `${base_url}/provider?page=${page}&limit=${limit}&status=${status}&field_sort=${field_sort}&order=${order}&id_type_provider=${id_type_provider}`;
    } else {
      url = `${base_url}/provider?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&field_sort=${field_sort}&order=${order}&id_type_provider=${id_type_provider}`;
    }
    return this.http.get<GetAllProviders>(url);
  }*/

getAllAndSearch(
  page: number,
  limit: number,
  status: boolean,
  type: string = '',
  query: string = '',
  field_sort: string = 'id',
  order: string = 'DESC',
  id_type_provider: string = '',
  estado_registro: string = ''
): Observable<GetAllProviders> {

  let params = new HttpParams()
    .set('page', page)
    .set('limit', limit)
    .set('status', status)
    .set('field_sort', field_sort)
    .set('order', order);

  if (id_type_provider) {
    params = params.set('id_type_provider', id_type_provider);
  }

  if (estado_registro) {
    params = params.set('estado_registro', estado_registro);
  }

  if (type) {
    params = params.set('type', type);
  }

  if (query) {
    params = params.set('query', query);
  }

  return this.http.get<GetAllProviders>(`${base_url}/provider`, { params });
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

  getProvidersAutocomplete(query: string = ''): Observable<{ ok: boolean, providers: Provider[] }> {
    let params = new HttpParams().set('query', query);
    return this.http.get<{ ok: boolean, providers: Provider[] }>(`${base_url}/provider/autocomplete`, { params });
  }

  preRegister(form: { full_names: string | null; number_document?: string | null; cellphone?: string | null }) {
    return this.http.post<{ ok: boolean, provider: Provider }>(`${base_url}/provider/pre-register`, form);
  }

  checkDuplicate(number_document?: string, cellphone?: string | number) {
    let params = new HttpParams();
    if (number_document) params = params.set('number_document', number_document);
    if (cellphone) params = params.set('cellphone', cellphone);
    return this.http.get<{ ok: boolean, exists: boolean, provider?: Provider }>(`${base_url}/provider/check-duplicate`, { params });
  }

  getCommercialDetails(id: number) {
    return this.http.get<{ ok: boolean, provider: Provider }>(`${base_url}/provider/${id}/commercial-details`);
  }

  resolveGoogleMapsLink(url: string) {
    return this.http.get<{ ok: boolean; finalUrl: string; latitude: number; longitude: number }>(`${base_url}/provider/resolve-map-link`, { params: new HttpParams().set('url', url) });
  }

  getFrequencyAnalysis(providerId: number, productId?: number, branchId?: number) {
    let params = new HttpParams();
    if (productId) params = params.set('id_product', productId.toString());
    if (branchId) params = params.set('id_sucursal', branchId.toString());
    return this.http.get<{
      ok: boolean;
      analysis: {
        has_sufficient_history: boolean;
        total_deliveries: number;
        average_days: number | null;
        frequency: string | null;
        frequency_mode: 'automatic' | 'manual';
        last_delivery_date: string | null;
        next_estimated_date: string | null;
        message?: string;
        details?: any;
      };
    }>(`${base_url}/provider/${providerId}/frequency-analysis`, { params }).pipe(
      catchError(() => {
        return of({
          ok: true,
          analysis: {
            has_sufficient_history: false,
            total_deliveries: 0,
            average_days: null,
            frequency: null,
            frequency_mode: 'manual' as const,
            last_delivery_date: null,
            next_estimated_date: null,
            message: 'No hay suficiente historial para calcular automáticamente.'
          }
        });
      })
    );
  }


  getCommercialCompanies(query = '') {
    const params = query ? new HttpParams().set('query', query) : undefined;
    return this.http.get<ProviderCommercialCompaniesResponse>(`${base_url}/commercial_providers`, { params });
  }
  getCommercialCompany(id: number) { return this.http.get<ProviderCommercialProfileResponse>(`${base_url}/commercial_providers/${id}`); }
  createCommercialCompany(body: ProviderCompanyProfile | { company: ProviderCompanyProfile; headquarters: ProviderSiteProfile }) {
    return this.http.post<ProviderCommercialProfileResponse>(`${base_url}/commercial_providers`, body);
  }
  updateCommercialCompany(id: number, body: ProviderCompanyProfile) {
    return this.http.put<ProviderCommercialProfileResponse>(`${base_url}/commercial_providers/${id}`, body);
  }
  uploadCommercialCompanyDocument(id: number, type: 'CERTIFICATE' | 'TRACEABILITY_REPORT', file: File) {
    const body = new FormData();
    body.append('document', file, file.name);
    return this.http.post<{ ok: boolean; document: { id: number; document_type: string; original_name: string } }>(
      `${base_url}/commercial_providers/${id}/documents/${type}`, body,
    );
  }
  setCommercialCompanyProviders(id: number, provider_ids: number[]) {
    return this.http.put<ProviderCommercialProfileResponse>(`${base_url}/commercial_providers/${id}/providers`, { provider_ids });
  }
  createCommercialSite(companyId: number, site: ProviderSiteProfile) {
    return this.http.post<ProviderCommercialProfileResponse>(`${base_url}/commercial_providers/${companyId}/sites`, site);
  }
  updateCommercialSite(companyId: number, providerId: number, site: ProviderSiteProfile) {
    return this.http.put<ProviderSiteResponse>(`${base_url}/commercial_providers/${companyId}/sites/${providerId}`, site);
  }
  transferCommercialHeadquarters(companyId: number, providerId: number) {
    return this.http.put<ProviderCommercialProfileResponse>(`${base_url}/commercial_providers/${companyId}/sites/${providerId}/headquarters`, {});
  }
  getCommercialSitePending(companyId: number, providerId: number) {
    return this.http.get<{ ok: boolean; pending: ProviderPendingSummary }>(`${base_url}/commercial_providers/${companyId}/sites/${providerId}/pending`);
  }
  deactivateCommercialSite(companyId: number, providerId: number) {
    return this.http.put<ProviderCommercialProfileResponse>(`${base_url}/commercial_providers/${companyId}/sites/${providerId}/deactivate`, { confirm: true });
  }
  replaceCommercialContacts(companyId: number, providerId: number, contacts: ProviderContactProfile[]) {
    return this.http.put<{ ok: boolean; contacts: ProviderContactProfile[] }>(`${base_url}/commercial_providers/${companyId}/sites/${providerId}/contacts`, { contacts });
  }
  replaceCommercialMaterials(companyId: number, providerId: number, materials: ProviderMaterialProfile[]) {
    return this.http.put<{ ok: boolean; materials: ProviderMaterialProfile[] }>(`${base_url}/commercial_providers/${companyId}/sites/${providerId}/materials`, { materials });
  }
  replaceCommercialBankAccounts(companyId: number, providerId: number, bankAccounts: ProviderBankAccountProfile[]) {
    return this.http.put<{ ok: boolean; bankAccounts: ProviderBankAccountProfile[] }>(`${base_url}/commercial_providers/${companyId}/sites/${providerId}/bank-accounts`, { bankAccounts });
  }


  getReportExcel(status:boolean, type: string = '', query?: string, field_sort:string = 'id',order:string = 'DESC',id_type_provider:string = '') {
      const url = `${base_url}/provider/excel?field_sort=${field_sort}&order=${order}&type=${type}&query=${query}&status=${status}&id_type_provider=${id_type_provider}`;
      return this.http.get(url,{
                responseType: 'blob',
              });
    }
}
