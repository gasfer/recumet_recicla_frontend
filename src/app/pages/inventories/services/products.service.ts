import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FormAssignSucursalesProduct, GetAllProducts, GetProductSucursals, NewPrice, PostReturnProduct, Product } from '../interfaces/products.interface';
import { ValidatorsService } from 'src/app/services/validators.service';
import { GetAllPaginateProviderProduct } from '../interfaces/provider-products.interface';
import { GetAllProductsAndCosts, ProductCost } from '../interfaces/products-prices.interfaces';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private http = inject(HttpClient);
  private validatorsService = inject(ValidatorsService);
  isEdit: boolean = false
  showModal : boolean = false
  showModalPrices     : boolean = false;
  showModalNewPrice   : boolean = false;
  showModalSucursales : boolean = false;
  showModalProvider   : boolean = false;
  save$: Subject<boolean> = new Subject();
  editSubs: EventEmitter<Product> = new EventEmitter<Product>();
  pricesSubs: EventEmitter<Product> = new EventEmitter<Product>();
  assignSucursalSubs: EventEmitter<Product> = new EventEmitter<Product>();
  viewProviderSubs  : EventEmitter<Product> = new EventEmitter<Product>();

  getAllAndSearch(page: number, limit: number,status:boolean, type: string = '', query?: string,stock:boolean = false, id_sucursal:string = '', id_storage:string = '',field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllProducts>{
    if(!id_sucursal){
      id_sucursal = this.validatorsService.id_sucursal().toString();
    }
    let url = '';
    if(type === ''){
      url = `${base_url}/product?page=${page}&limit=${limit}&status=${status}&stock=${stock}&id_sucursal=${id_sucursal}&id_storage=${id_storage}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/product?page=${page}&limit=${limit}&type=${type}&query=${query}&status=${status}&stock=${stock}&id_sucursal=${id_sucursal}&id_storage=${id_storage}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllProducts>(url);
  }

  getAllAndSearchProviderProduct(page: number, limit: number,id_product:number, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllPaginateProviderProduct>{
    const id_sucursal = this.validatorsService.id_sucursal().toString();
    let url = '';
    if(type === ''){
      url = `${base_url}/provider/product?page=${page}&limit=${limit}&id_product=${id_product}&id_sucursal=${id_sucursal}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/provider/product?page=${page}&limit=${limit}&type=${type}&query=${query}&id_product=${id_product}&id_sucursal=${id_sucursal}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllPaginateProviderProduct>(url);
  }

  getAllAndSearchProductCosts(page: number, limit: number,id_category:string, type: string = '', query?: string,field_sort:string = 'id',order:string = 'DESC'): Observable<GetAllProductsAndCosts>{
    const id_sucursal = this.validatorsService.id_sucursal().toString();
    if(id_category == null) id_category = '';
    let url = '';
    if(type === ''){
      url = `${base_url}/product/costs?page=${page}&limit=${limit}&id_category=${id_category}&id_sucursal=${id_sucursal}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/product/costs?page=${page}&limit=${limit}&type=${type}&query=${query}&id_category=${id_category}&id_sucursal=${id_sucursal}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllProductsAndCosts>(url);
  }

  getOneProductSucursal(id_product: number): Observable<GetProductSucursals>{
    let url = `${base_url}/product/sucursals?id_product=${id_product}`;
    return this.http.get<GetProductSucursals>(url);
  }

  postNewAssignate(id_product:number, sucursalesAssign:FormAssignSucursalesProduct[]) {
    const url = `${base_url}/product/sucursals`;
    return this.http.post(url, {id_product,sucursalesAssign});
  }

  postNewProductCost( productCost:ProductCost) {
    const url = `${base_url}/product/cost`;
    const id_sucursal = this.validatorsService.id_sucursal().toString();
    return this.http.post(url, {id_sucursal,...productCost});
  }

  postNew(form:Product): Observable<PostReturnProduct> {
    const {id, ...body}= form;
    const url = `${base_url}/product`;
    return this.http.post<PostReturnProduct>(url, body);
  }

  putUpdate(form:Product) {
    const {id, ...body}= form;
    const url = `${base_url}/product/${form.id}`;
    return this.http.put(url, body);
  }

  putInactiveOrActive(id:number,status:boolean) {
    const url = `${base_url}/product/destroyAndActive/${id}`;
    return this.http.put(url, {status});
  }

  postNewPrice(body:NewPrice) {
    const url = `${base_url}/product/price`;
    return this.http.post(url, body);
  }

  deletePrice(id:number) {
    const url = `${base_url}/product/price/${id}`;
    return this.http.delete(url);
  }

  uploadImage(idProduct: number,image: File){
    const url = `${base_url}/product/upload/img?idProduct=${idProduct}`;
    const formData = new FormData();
    formData.append('img', image);
    return this.http.put(url,formData);
  }

  calcularPrecio(costo:number,margen:number) {
    if (costo !== null && margen !== null) {
      const precio = costo + (costo * (margen / 100));
      return precio;
    }
    return 0;
  }

  calcularMargen(costo:number,precio:number): number {
    if (costo !== null && precio !== null && costo !== 0) {
      const margen = ((precio - costo) / costo) * 100;
      return margen;
    }
    return 0;
  }

  //export prices

  getReportProductCostExcel(id_category:string,field_sort:string = 'id',order:string = 'DESC') {
    const id_sucursal = this.validatorsService.id_sucursal().toString();
    if(id_category == null) id_category = '';
    const url = `${base_url}/product/excel/costs?field_sort=${field_sort}&order=${order}&id_category=${id_category}&id_sucursal=${id_sucursal}`;
    return this.http.get(url,{
              responseType: 'blob',
            });
  }

  getReportProductCostPdf(id_category:string,field_sort:string = 'id',order:string = 'DESC') {
    const id_sucursal = this.validatorsService.id_sucursal().toString();
    if(id_category == null) id_category = '';
    const url = `${base_url}/product/pdf/costs?field_sort=${field_sort}&order=${order}&id_category=${id_category}&id_sucursal=${id_sucursal}`;
    return this.http.get(url,{
              responseType: 'blob',
            });
  }

}
