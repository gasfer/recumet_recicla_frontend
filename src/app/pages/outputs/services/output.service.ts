import { EventEmitter, Injectable, inject, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Product } from '../../inventories/interfaces/products.interface';
import { Client, FormSearchOutputs, GetAllOutputs, GetOneOutput, NewOutputForm, Output, OutputConfig } from '../interfaces/output.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class OutputService {
  detailSale        = signal<Product[]>([]);
  clientSelect      = signal<Client|undefined>(undefined);
  dataOutputForEdit = signal<Output|undefined>(undefined);
  showModalConfigInput: boolean = false;
  showModalSaveInput: boolean = false;
  showModalDetailsInput: boolean = false;
  isEdit: boolean = false;
  types_registry = signal([{name: 'SIN FICHA', code: 'SIN FICHA'},{name: 'FICHA', code: 'FICHA'},{name: 'BOLETA', code: 'BOLETA'}]);

  types_output   = signal([{name: 'MENOR'},{name: 'MAYOR. NACIONAL'},{name: 'MAYOR. EXTERIOR'}]);

  editSubs$: EventEmitter<Output> = new EventEmitter<Output>();
  detailsSubs$: EventEmitter<Output> = new EventEmitter<Output>();

  private http   = inject(HttpClient);
  public _outputConfig : OutputConfig = {
    searchForCode: localStorage.getItem('searchForCodeO') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearchO') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProductsO') === 'true' ? true : false,
    printAfter: localStorage.getItem('printAfterO') === 'false' ? false : true,
    viewMoneyButtons: localStorage?.getItem('viewMoneyButtonsO') === 'false' ? false : true,
  }

  constructor() { }

  getOutputById(id_output:string): Observable<GetOneOutput>{
    let  url = `${base_url}/output/find/${id_output}`;
    return this.http.get<GetOneOutput>(url);
  }

  getAllAndSearchOutputs(page: number, limit: number,params:FormSearchOutputs, type: string = '', query?: string, field_sort:string = 'id',order:string = 'DESC',): Observable<GetAllOutputs>{
    let url = '';
    if(type === ''){
      url = `${base_url}/output?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/output?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllOutputs>(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      })
    });
  }

  postNewOutput(data:NewOutputForm): Observable<{ok:string,msg:string,id_output:number}> {
    const url = `${base_url}/output`;
    return this.http.post<{ok:string,msg:string,id_output:number}>(url, data);
  }

  putUpdateOutput(id_output:number,data:NewOutputForm): Observable<{ok:string,msg:string,id_output:number}> {
    const url = `${base_url}/output/${id_output}`;
    return this.http.put<{ok:string,msg:string,id_output:number}>(url, data);
  }

  deleteOutput(id_output: number) {
    const url = `${base_url}/output/anular/${id_output}`;
    return this.http.delete(url);
  }

  resetOutput() {
    this.detailSale.update((details)=>  details = []);
    this.clientSelect.set(undefined);
  }

updateDetailSale(product: Product, updateQuantity: boolean = true, newQuantity: boolean = false) {
  const productExist = this.detailSale().find((prod) => prod.id === product.id);

  if (productExist) {
    this.detailSale.update((details) =>
      details.map((prod) => {
        if (prod.id !== product.id) return prod;

        if (updateQuantity) {
          prod.quantity = newQuantity
            ? product.quantity
            : prod.quantity + 1;

          // ✅ Solo limitar stock si NO estamos en edición
          const stock = prod.total_stock;
          if (!this.isEdit && stock != null && stock > 0 && prod.quantity > stock) {
            prod.quantity = stock;
          }
        }

        prod.import = prod.quantity * prod.price_select!;
        return { ...prod }; // ✅ nueva referencia para recalcular totalSummary
      })
    );
  } else {
    product.quantity = 1;
    product.price_select = Number(product.prices[0]?.price) ?? 0;
    product.import = product.quantity * product.price_select;
    this.detailSale.update((details) => [...details, product]);
  }
}



  //* Reportes */
  getReportPdf(params:FormSearchOutputs, field_sort:string = 'id',order:string = 'DESC',) {
    const url = `${base_url}/output/pdf?field_sort=${field_sort}&order=${order}`;
    return this.http.get<any>(url,{
              params: new HttpParams({
                fromObject: {
                  ...params
                }
              }),
              responseType: 'blob' as 'json'
            });
  }

  getReportExcel(params:FormSearchOutputs, field_sort:string = 'id',order:string = 'DESC',) {
    const url = `${base_url}/output/excel?field_sort=${field_sort}&order=${order}`;
    return this.http.get(url,{
              params: new HttpParams({
                fromObject: {
                  ...params
                }
              }),
              responseType: 'blob',
            });
  }
  //* Reportes Detalles */
  getReportDetailsPdf(params:FormSearchOutputs) {
    const url = `${base_url}/output/pdf/details`;
    return this.http.get<any>(url,{
              params: new HttpParams({
                fromObject: {
                  ...params
                }
              }),
              responseType: 'blob' as 'json'
            });
  }

  getReportDetailsExcel(params:FormSearchOutputs) {
    const url = `${base_url}/output/excel/details`;
    return this.http.get(url,{
              params: new HttpParams({
                fromObject: {
                  ...params
                }
              }),
              responseType: 'blob',
            });
  }

  //* IMPRIMIR BOLETA
  getPrintVoucherOutput(id_output:Number) {
    const url = `${base_url}/output/pdf/voucher/${id_output}`;
    return this.http.get(url,{
              responseType: 'blob',
            });
  }

  printPdfReport(id_output:number) {
    Swal.fire({
      title: 'Generando Boleta!',
      html: `Estamos generando la boleta`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.getPrintVoucherOutput(id_output).subscribe({
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
