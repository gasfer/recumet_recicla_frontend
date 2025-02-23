import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import { FormPayMultiple } from '../interfaces/accounts-payable-provider.interface';
import { FormSearchAbonosReceivables, GetAllAbonosReceivableAccountAll } from '../interfaces/abonos-accounts-receivable-all.interface';
import { FormSearchAccountsReceivable } from '../interfaces/accounts-receivable.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class AbonosAccountReceivableAllService {
  private http = inject(HttpClient);
  showModalNewAbono: boolean = false;
  reloadAccountsPayable$: Subject<number> = new Subject();

  getAllAndSearchAbonosReceivablesAll(page: number, limit: number, params: FormSearchAbonosReceivables, type: string = '', query?: string, field_sort: string = 'id', order: string = 'DESC'): Observable<GetAllAbonosReceivableAccountAll> {
    let url = '';
    if (type === '') {
      url = `${base_url}/accounts_receivable/abonos/all?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/accounts_receivable/abonos/all?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllAbonosReceivableAccountAll>(url, {
      params: new HttpParams({
        fromObject: { ...params }
      })
    });
  }

  postNewAbonoMultipleAccountReceivable(data: FormPayMultiple) {
    const url = `${base_url}/accounts_receivable/payMultiClient`;
    return this.http.post(url, data);
  }

  getReportAccountsPayableAbonosPdf(params: FormSearchAccountsReceivable, type: string = '', query?: string, field_sort: string = 'id', order: string = 'DESC') {
    let url = '';
    if (type === '') {
      url = `${base_url}/accounts_receivable/pdf/abonos?field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/accounts_receivable/pdf/abonos?field_sort=${field_sort}&order=${order}&type=${type}&query=${query}`;
    }
    return this.http.get<any>(url, {
      params: new HttpParams({
        fromObject: { ...params }
      }),
      responseType: 'blob' as 'json'
    });
  }

  getReportAccountsPayableExcel(params: FormSearchAccountsReceivable, type: string = '', query?: string, field_sort: string = 'id', order: string = 'DESC') {
    let url = '';
    if (type === '') {
      url = `${base_url}/accounts_receivable/excel/abonos?field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/accounts_receivable/excel/abonos?field_sort=${field_sort}&order=${order}&type=${type}&query=${query}`;
    }
    return this.http.get(url, {
      params: new HttpParams({
        fromObject: { ...params }
      }),
      responseType: 'blob',
    });
  }

}
