import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { FormSearchKardex, GetAllKardexes } from '../interfaces/kardex.interface';
import { Observable } from 'rxjs';

const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class KardexService {
  private http = inject(HttpClient);

  // Método para kardex general
  getAllAndSearchKardex(
    page: number,
    limit: number,
    params: FormSearchKardex,
    type: string = '',
    query?: string,
    field_sort: string = 'id',
    order: string = 'DESC'
  ): Observable<GetAllKardexes> {
    let url = '';
    if (type === '') {
      url = `${base_url}/kardex?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/kardex?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }

    // 🆕 Construir params correctamente incluyendo category_ids
    let httpParams = new HttpParams({
      fromObject: {
        filterBy: params.filterBy,
        date1: params.date1,
        date2: params.date2 || '',
        id_product: params.id_product || '',
        id_provider: params.id_provider || '',
        id_storage: params.id_storage || '',
        id_sucursal: params.id_sucursal || '',
        type_kardex: params.type_kardex || '',
        include_zero: params.include_zero?.toString() || 'false',
      }
    });

    // 🆕 Añadir category_ids correctamente (append devuelve un nuevo HttpParams)
    if (params.category_ids && params.category_ids.length > 0) {
      params.category_ids.forEach(id => {
        httpParams = httpParams.append('category_ids[]', id.toString());
      });
    }

    return this.http.get<GetAllKardexes>(url, { params: httpParams });
  }

  // Método para kardex físico (ACTIVO - NO COMENTADO)
  getAllAndSearchKardexFisico(
    page: number,
    limit: number,
    params: FormSearchKardex,
    type: string = '',
    query: string = '',
    fieldSort: string = 'product.category.name',
    order: string = 'desc'
  ): Observable<any> {
    let url = '';
    if (type === '') {
      url = `${base_url}/kardex/fisico?page=${page}&limit=${limit}&field_sort=${fieldSort}&order=${order}`;
    } else {
      url = `${base_url}/kardex/fisico?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${fieldSort}&order=${order}`;
    }

    // 🔧 Construir objeto params base
    const paramsObject: any = {
      filterBy: params.filterBy,
      date1: params.date1,
      date2: params.date2 || '',
      id_product: params.id_product || '',
      id_provider: params.id_provider || '',
      id_storage: params.id_storage || '',
      id_sucursal: params.id_sucursal || '',
      type_kardex: params.type_kardex || '',
      include_zero: params.include_zero?.toString() || 'false',
    };

    // 🆕 Añadir category_ids como string separado por comas
    if (params.category_ids && params.category_ids.length > 0) {
      paramsObject.category_ids = params.category_ids.join(',');
      console.log('📤 Enviando category_ids:', paramsObject.category_ids);
    }

    // Crear HttpParams desde el objeto
    const httpParams = new HttpParams({ fromObject: paramsObject });

    console.log('🔍 URL completa:', url);
    console.log('📋 Params enviados:', httpParams.toString());

    return this.http.get(url, { params: httpParams });
  }

  //* Reportes Detalles */

  getReportPdf(params: FormSearchKardex, field_sort: string = 'id', order: string = 'DESC') {
    const url = `${base_url}/kardex/pdf?field_sort=${field_sort}&order=${order}`;

    let httpParams = new HttpParams({
      fromObject: {
        filterBy: params.filterBy,
        date1: params.date1,
        date2: params.date2 || '',
        id_product: params.id_product || '',
        id_provider: params.id_provider || '',
        id_storage: params.id_storage || '',
        id_sucursal: params.id_sucursal || '',
        type_kardex: params.type_kardex || '',
        include_zero: params.include_zero?.toString() || 'false',
      }
    });

    if (params.category_ids && params.category_ids.length > 0) {
      params.category_ids.forEach(id => {
        httpParams = httpParams.append('category_ids[]', id.toString());
      });
    }

    return this.http.get<any>(url, {
      params: httpParams,
      responseType: 'blob' as 'json'
    });
  }

  getReportPdfExistencia(params: FormSearchKardex, field_sort: string = 'id', order: string = 'DESC') {
    const url = `${base_url}/kardex/pdf/existencia?field_sort=${field_sort}&order=${order}`;

    let httpParams = new HttpParams({
      fromObject: {
        filterBy: params.filterBy,
        date1: params.date1,
        date2: params.date2 || '',
        id_product: params.id_product || '',
        id_provider: params.id_provider || '',
        id_storage: params.id_storage || '',
        id_sucursal: params.id_sucursal || '',
        type_kardex: params.type_kardex || '',
        include_zero: params.include_zero?.toString() || 'false',
      }
    });

    if (params.category_ids && params.category_ids.length > 0) {
      params.category_ids.forEach(id => {
        httpParams = httpParams.append('category_ids[]', id.toString());
      });
    }

    return this.http.get<any>(url, {
      params: httpParams,
      responseType: 'blob' as 'json'
    });
  }
getReportPdfFisico(
    params: FormSearchKardex,
    fieldSort: string = 'product.category.name',
    order: string = 'desc'
  ): Observable<any> {
    const url = `${base_url}/kardex/pdf/fisico`;

    // 🔧 Construir objeto params base
    const paramsObject: any = {
      filterBy: params.filterBy,
      date1: params.date1,
      date2: params.date2 || '',
      id_product: params.id_product || '',
      id_provider: params.id_provider || '',
      id_storage: params.id_storage || '',
      id_sucursal: params.id_sucursal || '',
      type_kardex: params.type_kardex || '',
      field_sort: fieldSort,
      order: order,
    };

    // 🆕 Añadir category_ids como string separado por comas
    if (params.category_ids && params.category_ids.length > 0) {
      paramsObject.category_ids = params.category_ids.join(',');
      console.log('📤 PDF - Enviando category_ids:', paramsObject.category_ids);
    }

    const httpParams = new HttpParams({ fromObject: paramsObject });

    console.log('📄 URL PDF:', url);
    console.log('📋 Params PDF:', httpParams.toString());

    return this.http.get(url, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  getReportExcel(params: FormSearchKardex, field_sort: string = 'id', order: string = 'DESC') {
    const url = `${base_url}/kardex/excel?field_sort=${field_sort}&order=${order}`;

    let httpParams = new HttpParams({
      fromObject: {
        filterBy: params.filterBy,
        date1: params.date1,
        date2: params.date2 || '',
        id_product: params.id_product || '',
        id_provider: params.id_provider || '',
        id_storage: params.id_storage || '',
        id_sucursal: params.id_sucursal || '',
        type_kardex: params.type_kardex || '',
        include_zero: params.include_zero?.toString() || 'false',
      }
    });

    if (params.category_ids && params.category_ids.length > 0) {
      params.category_ids.forEach(id => {
        httpParams = httpParams.append('category_ids[]', id.toString());
      });
    }

    return this.http.get(url, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  getReportExcelExistencia(params: FormSearchKardex, field_sort: string = 'id', order: string = 'DESC') {
    const url = `${base_url}/kardex/excel/existencia?field_sort=${field_sort}&order=${order}`;

    let httpParams = new HttpParams({
      fromObject: {
        filterBy: params.filterBy,
        date1: params.date1,
        date2: params.date2 || '',
        id_product: params.id_product || '',
        id_provider: params.id_provider || '',
        id_storage: params.id_storage || '',
        id_sucursal: params.id_sucursal || '',
        type_kardex: params.type_kardex || '',
        include_zero: params.include_zero?.toString() || 'false',
      }
    });

    if (params.category_ids && params.category_ids.length > 0) {
      params.category_ids.forEach(id => {
        httpParams = httpParams.append('category_ids[]', id.toString());
      });
    }

    return this.http.get(url, {
      params: httpParams,
      responseType: 'blob',
    });
  }

 getReportExcelFisico(
    params: FormSearchKardex,
    fieldSort: string = 'product.category.name',
    order: string = 'desc'
  ): Observable<any> {
    const url = `${base_url}/kardex/excel/fisico`;

    // 🔧 Construir objeto params base
    const paramsObject: any = {
      filterBy: params.filterBy,
      date1: params.date1,
      date2: params.date2 || '',
      id_product: params.id_product || '',
      id_provider: params.id_provider || '',
      id_storage: params.id_storage || '',
      id_sucursal: params.id_sucursal || '',
      type_kardex: params.type_kardex || '',
      field_sort: fieldSort,
      order: order,
    };

    // 🆕 Añadir category_ids como string separado por comas
    if (params.category_ids && params.category_ids.length > 0) {
      paramsObject.category_ids = params.category_ids.join(',');
      console.log('📤 Excel - Enviando category_ids:', paramsObject.category_ids);
    }

    const httpParams = new HttpParams({ fromObject: paramsObject });

    console.log('📊 URL Excel:', url);
    console.log('📋 Params Excel:', httpParams.toString());

    return this.http.get(url, {
      params: httpParams,
      responseType: 'blob'
    });
  }

}
