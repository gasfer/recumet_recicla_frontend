import { Injectable,inject, EventEmitter } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { AccountReceivable, FormSearchAccountsReceivable, GetAllAccountsReceivable, NewAbonoAccountReceivable, ResponseNewAbono } from '../interfaces/accounts-receivable.interface';
const base_url = environment.base_url;
@Injectable({
  providedIn: 'root'
})
export class AccountsReceivableService {

  private http   = inject(HttpClient);
  detailsSubs$: EventEmitter<AccountReceivable> = new EventEmitter<AccountReceivable>();
  showModalDetailsAccountReceivable: boolean = false;
  showModalNewAbono: boolean = false;
  reloadAccountsReceivable$: Subject<number> = new Subject();

  getAllAndSearchAccountsReceivable(page: number, limit: number,params:FormSearchAccountsReceivable, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllAccountsReceivable>{
    let url = '';
    if(type === ''){
      url = `${base_url}/accounts_receivable?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/accounts_receivable?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllAccountsReceivable>(url, {
      params: new HttpParams({
        fromObject: { ...params }
      })
    });
  }

  postNewAbonoAccountReceivable(data:NewAbonoAccountReceivable): Observable<ResponseNewAbono> {
    const url = `${base_url}/accounts_receivable/new-abono`;
    return this.http.post<ResponseNewAbono>(url, data);
  }

  deleteAbonoAccountReceivable(id_abono_account_receivable: number) {
    const url = `${base_url}/accounts_receivable/destroy-abono/${id_abono_account_receivable}`;
    return this.http.delete(url);
  }
  //* Reportes */
  getReportAccountsReceivablePdf(params:FormSearchAccountsReceivable,field_sort:string = 'id',order:string = 'DESC') {
    const url = `${base_url}/accounts_receivable/pdf?field_sort=${field_sort}&order=${order}`;
    return this.http.get<any>(url,{
              params: new HttpParams({
                fromObject: {...params}
              }),
              responseType: 'blob' as 'json'
            });
  }

  getReportAccountsReceivableExcel(params:FormSearchAccountsReceivable,field_sort:string = 'id',order:string = 'DESC') {
    const url = `${base_url}/accounts_receivable/excel?field_sort=${field_sort}&order=${order}`;
    return this.http.get(url,{
              params: new HttpParams({
                fromObject: { ...params}
              }),
              responseType: 'blob',
            });
  }

  //* IMPRIMIR BOLETAS
  getPrintAccountReceivable(id_account_receivable:Number) {
    const url = `${base_url}/accounts_receivable/pdf/voucher-account-receivable/${id_account_receivable}`;
    return this.http.get(url,{
              responseType: 'blob',
            });
  } 

  printAccountReceivablePdf(id_account_receivable:number) {
    Swal.fire({
      title: 'Generando estado de cuenta!',
      html: `Espere un momento`,
      customClass: { container: 'sweetalert2'},
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.getPrintAccountReceivable(id_account_receivable).subscribe({
            next: (data) => {
              const file = new Blob([data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
              window.open(fileURL);
              Swal.close();
            },
            error: (err) => Swal.close()
          });
        });
      },
    });
  }

  getPrintVoucherAbonoAccountReceivable(id_abono_account_receivable:Number) {
    const url = `${base_url}/accounts_receivable/pdf/voucher-abono/${id_abono_account_receivable}`;
    return this.http.get(url,{
              responseType: 'blob',
            });
  } 

  printVoucherAbonoAccountReceivablePdf(id_abono_account_receivable:number) {
    Swal.fire({
      title: 'Generando estado de cuenta!',
      html: `Espere un momento`,
      customClass: { container: 'sweetalert2'},
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.getPrintVoucherAbonoAccountReceivable(id_abono_account_receivable).subscribe({
            next: (data) => {
              const file = new Blob([data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
              window.open(fileURL);
              Swal.close();
            },
            error: (err) => Swal.close()
          });
        });
      },
    });
  }
}
