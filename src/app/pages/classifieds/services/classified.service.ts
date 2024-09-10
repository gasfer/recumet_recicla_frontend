import { EventEmitter, Injectable, inject, signal } from '@angular/core';
import { Product } from '../../inventories/interfaces/products.interface';
import { OutputConfig } from '../../outputs/interfaces/output.interface';
import { Classified, FormSearchClassified, GetAllClassifieds, NewClassifiedForm } from '../interfaces/classified.interface';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import Swal from 'sweetalert2';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ClassifiedService {
  detailSale        = signal<Product[]>([]);
  productSelect     = signal<Product|undefined>(undefined);
  types_registry    = signal([{name: 'FICHA', code: 'FICHA'},{name: 'BOLETA', code: 'BOLETA'}]);
  showModalConfigClassified : boolean = false;
  showModalSaveClassified   : boolean = false;
  showModalDetailsClassified: boolean = false;
  public _classifiedConfig : OutputConfig = {
    searchForCode: localStorage.getItem('searchForCodeC') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearchC') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProductsC') === 'true' ? true : false,
    printAfter: localStorage.getItem('printAfterC') === 'false' ? false : true,
    viewMoneyButtons: localStorage?.getItem('viewMoneyButtonsC') === 'false' ? false : true,
  }
  private http   = inject(HttpClient);
  detailsSubs$: EventEmitter<Classified> = new EventEmitter<Classified>();


  getAllAndSearchClassifieds(page: number, limit: number,params:FormSearchClassified, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllClassifieds>{
    let url = '';
    if(type === ''){
      url = `${base_url}/classified?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/classified?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllClassifieds>(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      })
    });
  }

  postNewClassified(data:NewClassifiedForm): Observable<{ok:string,msg:string,id_classified:number}> {
    const url = `${base_url}/classified`;
    return this.http.post<{ok:string,msg:string,id_classified:number}>(url, data);
  }

  deleteClassified(id_classified: number) {
    const url = `${base_url}/classified/destroy/${id_classified}`;
    return this.http.delete(url);
  }

  updateDetailSale(product: Product, updateQuantity: boolean = true, newQuantity: boolean = false) {
    const productExist = this.detailSale().length > 0 ? this.detailSale().find((prod) => prod.id === product.id) : false;
    if(productExist){
      this.detailSale.update((details) => {
        return details.map((prod) => {
          if (prod.id !== product.id) return prod;
          if (updateQuantity) {
            prod.quantity = newQuantity ? product.quantity : prod.quantity + 1;
          }
          prod.import = prod.quantity * prod.price_select!;
          return prod;
        });
      });
    } else {
      //primera agregación al carrito
      product.quantity = product.total_stock == 0 ? 1 :product.total_stock! > 1  ? 1 : product.total_stock!;;
      product.import = product.price_select!;
      this.detailSale.update((details) => [...details, product]);
    }
  }

  resetClassified() {
    this.detailSale.update((details)=>  details = []); 
    this.productSelect.set(undefined); 
  }

  //* Reportes */
  getReportPdf(params:FormSearchClassified,field_sort:string = 'id',order:string = 'DESC') {
    const url = `${base_url}/classified/pdf?field_sort=${field_sort}&order=${order}`;
    return this.http.get<any>(url,{
              params: new HttpParams({
                fromObject: {
                  ...params
                }
              }),
              responseType: 'blob' as 'json'
            });
  }

  getReportExcel(params:FormSearchClassified,field_sort:string = 'id',order:string = 'DESC') {
    const url = `${base_url}/classified/excel?field_sort=${field_sort}&order=${order}`;
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
  getReportDetailsPdf(params:FormSearchClassified) {
    const url = `${base_url}/classified/pdf/details`;
    return this.http.get<any>(url,{
              params: new HttpParams({
                fromObject: {
                  ...params
                }
              }),
              responseType: 'blob' as 'json'
            });
  }

  getReportDetailsExcel(params:FormSearchClassified) {
    const url = `${base_url}/classified/excel/details`;
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
  getPrintVoucherClassified(id_classified:Number) {
    const url = `${base_url}/classified/pdf/voucher/${id_classified}`;
    return this.http.get(url,{
              responseType: 'blob',
            });
  } 

  printPdfReport(id_classified:number) {
    Swal.fire({
      title: 'Generando Boleta!',
      html: `Estamos generando la boleta`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.getPrintVoucherClassified(id_classified).subscribe({
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
