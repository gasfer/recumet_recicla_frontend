import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import { FormPayMultiple } from '../interfaces/accounts-payable-provider.interface';
import { FormSearchAbonosPayables, GetAllAbonosPayableAccountAll } from '../interfaces/abonos-accounts-payable-all.interface';
import { FormSearchAccountsPayables } from '../interfaces/accounts-payable.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class AbonosAccountPayableAllService {
  private http = inject(HttpClient);
  showModalNewAbono: boolean = false;
  reloadAccountsPayable$: Subject<number> = new Subject();

  getAllAndSearchAbonosPayableAll(page: number, limit: number, params: FormSearchAbonosPayables, type: string = '', query?: string, field_sort: string = 'id', order: string = 'DESC'): Observable<GetAllAbonosPayableAccountAll> {
    let url = '';
    if (type === '') {
      url = `${base_url}/accounts_payable/abonos/all?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/accounts_payable/abonos/all?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllAbonosPayableAccountAll>(url, {
      params: new HttpParams({
        fromObject: { ...params }
      })
    });
  }

  postNewAbonoMultipleAccountPayable(data: FormPayMultiple) {
    const url = `${base_url}/accounts_payable/payMultiProvider`;
    return this.http.post(url, data);
  }


  getReportAccountsPayableAbonosPdf(params: FormSearchAccountsPayables, type: string = '', query?: string, field_sort: string = 'id', order: string = 'DESC') {
    let url = '';
    if (type === '') {
      url = `${base_url}/accounts_payable/pdf/abonos?field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/accounts_payable/pdf/abonos?field_sort=${field_sort}&order=${order}&type=${type}&query=${query}`;
    }
    return this.http.get<any>(url, {
      params: new HttpParams({
        fromObject: { ...params }
      }),
      responseType: 'blob' as 'json'
    });
  }

  getReportAccountsPayableExcel(params: FormSearchAccountsPayables, type: string = '', query?: string,field_sort: string = 'id', order: string = 'DESC') {
    let url = '';
    if (type === '') {
      url = `${base_url}/accounts_payable/excel/abonos?field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/accounts_payable/excel/abonos?field_sort=${field_sort}&order=${order}&type=${type}&query=${query}`;
    }
    return this.http.get(url, {
      params: new HttpParams({
        fromObject: { ...params }
      }),
      responseType: 'blob',
    });
  }

}
