import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import { FormPayMultiple } from '../interfaces/accounts-payable-provider.interface';
import { FormSearchAbonosPayables, GetAllAbonosPayableAccountAll } from '../interfaces/abonos-accounts-payable-all.interface';
import { FormSearchAccountsPayables } from '../interfaces/accounts-payable.interface';
import Swal from 'sweetalert2';
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

  getReportAccountsPayableExcel(params: FormSearchAccountsPayables, type: string = '', query?: string, field_sort: string = 'id', order: string = 'DESC') {
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


  getPrintAbonoMultipleAccountPayable(id_abono_account_payable_multiple: Number) {
    const url = `${base_url}/accounts_payable/pdf/voucher-abono-multiple/${id_abono_account_payable_multiple}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  printAbonoMultipleAccountPayablePdf(id_abono_account_payable_multiple: number) {
    Swal.fire({
      title: 'Generando!',
      html: `Espere un momento`,
      customClass: { container: 'sweetalert2' },
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.getPrintAbonoMultipleAccountPayable(id_abono_account_payable_multiple).subscribe({
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
