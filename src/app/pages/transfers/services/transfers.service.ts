import { EventEmitter, inject, Injectable, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { FormSearchTransfers, GetAllTransfers, NewTransformForm, Transfer, TransferConfig, UpdateTransferToReceived } from '../interfaces/transfers.interface';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Product } from '../../inventories/interfaces/products.interface';
import { Sucursal } from '../../managements/interfaces/sucursales.interface';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class TransfersService {
  private http   = inject(HttpClient);
  detailsSubs$: EventEmitter<Transfer> = new EventEmitter<Transfer>();
  showModalDetailsTransfer: boolean = false;
  showModalConfigTransfer: boolean = false;
  showModalSaveTransfer: boolean = false;
  showModalConfirmationReception: boolean = false;

  detailTransfer = signal<Product[]>([]);
  sucursalSelect = signal<Sucursal|undefined>(undefined);
  public _transferConfig : TransferConfig = {
    searchForCode: localStorage.getItem('searchForCodeTr') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearchTr') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProductsTr') === 'true' ? true : false,
    printAfter: localStorage.getItem('printAfterTr') === 'false' ? false : true,
    viewMoneyButtons: localStorage?.getItem('viewMoneyButtonsTr') === 'false' ? false : true,
  }

  constructor() { }

  getAllAndSearchTransfers(page: number, limit: number,params:FormSearchTransfers, type: string = '', query?: string, field_sort:string = 'id',order:string = 'DESC',): Observable<GetAllTransfers>{
    let url = '';
    if(type === ''){
      url = `${base_url}/transfers?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/transfers?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllTransfers>(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      })
    });
  }

  postNewTransfer(data:NewTransformForm): Observable<{ok:string,msg:string,id_transfer:number}> {
    const url = `${base_url}/transfers`;
    return this.http.post<{ok:string,msg:string,id_transfer:number}>(url, data);
  }

  putTransferToReceived(data:UpdateTransferToReceived): Observable<{ok:string,msg:string,id_transfer:number}> {
    const url = `${base_url}/transfers/received`;
    return this.http.put<{ok:string,msg:string,id_transfer:number}>(url, data);
  }

  deleteTransfer(id_transfer: number) {
    const url = `${base_url}/transfers/destroy/${id_transfer}`;
    return this.http.delete(url);
  }

  //* Reportes */
  getReportPdf(params:FormSearchTransfers, field_sort:string = 'id',order:string = 'DESC') {
    const url = `${base_url}/transfers/pdf?field_sort=${field_sort}&order=${order}`;
    return this.http.get<any>(url,{
              params: new HttpParams({
                fromObject: {
                  ...params
                }
              }),
              responseType: 'blob' as 'json'
            });
  }

  getReportExcel(params:FormSearchTransfers, field_sort:string = 'id',order:string = 'DESC',) {
    const url = `${base_url}/transfers/excel?field_sort=${field_sort}&order=${order}`;
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
  getPrintVoucherTransfer(id_transfer:Number) {
    const url = `${base_url}/transfers/pdf/voucher/${id_transfer}`;
    return this.http.get(url,{
              responseType: 'blob',
            });
  } 

  printPdfReport(id_transfer:number) {
    Swal.fire({
      title: 'Generando Boleta!',
      html: `Estamos generando la boleta`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.getPrintVoucherTransfer(id_transfer).subscribe({
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

  resetTransfer() {
    this.detailTransfer.update((details)=>  details = []); 
    this.sucursalSelect.set(undefined); 
  }

  updateDetailSale(product: Product, updateQuantity: boolean = true, newQuantity: boolean = false) {
    const productExist = this.detailTransfer().length > 0 ? this.detailTransfer().find((prod) => prod.id === product.id) : false;
    if(productExist){
      this.detailTransfer.update((details)=>{
        return details.map((prod) => {
          if(prod.id != product.id) return prod;
          if(updateQuantity){
            prod.quantity = newQuantity ? product.quantity : prod.quantity + 1;
            if(prod.quantity > product.total_stock!) {
              prod.quantity = product.total_stock!;
            }
          } 
          prod.import = prod.quantity * prod.costo!;
          return prod;
        })
      });
    } else {
      //primera agregación al carrito
      product.quantity = product.total_stock! > 1  ? 1 : product.total_stock!;
      product.import = product.costo!;
      this.detailTransfer.update((detail) =>  [...detail, product] );
    }
  }
}
