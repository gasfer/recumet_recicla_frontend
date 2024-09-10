import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { FormNewDetail, GetAllTotalesMovements } from '../interfaces/adm-caja.interface';
import { GetAllConsultaCaja } from '../interfaces/query-caja.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private http = inject(HttpClient);
  showModalOpenCaja: boolean = false;
  showModalMovementCaja: boolean = false;
  type_event: 'OPEN_CAJA' | 'CLOSE_CAJA' | 'UPDATE_CAJA' = 'OPEN_CAJA';
  type_movement: 'INGRESO' | 'GASTO' = 'INGRESO';

  getTotalesAndMovements(id_sucursal:number): Observable<GetAllTotalesMovements>{
    const url = `${base_url}/caja_small/totales?id_sucursal=${id_sucursal}`;
    return this.http.get<GetAllTotalesMovements>(url);
  }
  postOpenCaja(id_sucursal:number, monto:number){
    const url = `${base_url}/caja_small/open`;
    return this.http.post(url,{id_sucursal,monto_apertura:monto});
  }
  putCierreCaja(id_sucursal:number, monto:number){
    const url = `${base_url}/caja_small/close`;
    return this.http.put(url,{id_sucursal,monto_cierre:monto});
  }
  putUpdateMontoCaja(id_sucursal:number, monto:number){
    const url = `${base_url}/caja_small/update_apertura`;
    return this.http.put(url,{id_sucursal,monto_apertura:monto});
  }
  postNewDetailCaja(form:FormNewDetail){
    const url = `${base_url}/caja_small/new-detail`;
    return this.http.post(url,form);
  }
  getAllAndSearchConsultasCaja(page: number, limit: number,params:any, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllConsultaCaja>{
    let url = '';
    if(type === ''){
      url = `${base_url}/caja_small?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/caja_small?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllConsultaCaja>(url, {
      params: new HttpParams({
        fromObject: { ...params}
      })
    });
  }


  //* IMPRIMIR BOLETA
  getPrintVoucherCaja(id_caja_small:Number) {
    const url = `${base_url}/caja_small/print_caja/${id_caja_small}`;
    return this.http.get(url,{
              responseType: 'blob',
            });
  } 

  printPdfArqueoCaja(id_caja_small:number) {
    Swal.fire({
      title: 'Generando Boleta!',
      html: `Espere un momento`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.getPrintVoucherCaja(id_caja_small).subscribe({
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
