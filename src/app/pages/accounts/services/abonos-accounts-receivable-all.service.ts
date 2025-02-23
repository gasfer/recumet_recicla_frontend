import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import { FormPayMultiple } from '../interfaces/accounts-payable-provider.interface';
import { FormSearchAbonosReceivables, GetAllAbonosReceivableAccountAll } from '../interfaces/abonos-accounts-receivable-all.interface';
import { FormSearchAccountsReceivable } from '../interfaces/accounts-receivable.interface';
import Swal from 'sweetalert2';
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

  postNewAbonoMultipleAccountReceivable(data: FormPayMultiple): Observable<{id_abono_accounts_receivable:number}> {
    const url = `${base_url}/accounts_receivable/payMultiClient`;
    return this.http.post<{id_abono_accounts_receivable:number}>(url, data);
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


  getPrintAbonoMultipleAccountReceivable(id_abono_account_receivable_multiple: Number) {
    const url = `${base_url}/accounts_receivable/pdf/voucher-abono-multiple/${id_abono_account_receivable_multiple}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  printAbonoMultipleAccountPayablePdf(id_abono_account_receivable_multiple: number) {
    Swal.fire({
      title: 'Generando!',
      html: `Espere un momento`,
      customClass: { container: 'sweetalert2' },
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.getPrintAbonoMultipleAccountReceivable(id_abono_account_receivable_multiple).subscribe({
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

  deleteAbonoAccountReceivableMultiple(id_abono_account_receivable_multiple: number) {
    const url = `${base_url}/accounts_receivable/destroy-abono-multiple/${id_abono_account_receivable_multiple}`;
    return this.http.delete(url);
  }

}
