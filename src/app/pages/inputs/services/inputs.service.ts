import { EventEmitter, Injectable, inject, signal } from '@angular/core';
import { FormSearchInputs, GetAllInputs, GetOneInput, Input, InputConfig, NewInputForm } from '../interfaces/input.interface';
import { Product } from '../../inventories/interfaces/products.interface';
import { Provider } from '../interfaces/provider.interface';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, timeout } from 'rxjs';
import Swal from 'sweetalert2';
import { PurchaseTraceabilityApiService } from 'src/app/core/services/purchase-traceability-api.service';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class InputsService {
  private traceabilityApi = inject(PurchaseTraceabilityApiService);
  private mutationOptions() { return { headers: new HttpHeaders({ 'Idempotency-Key': globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}` }) }; }
  detailShopping = signal<Product[]>([]);
  providerSelect = signal<Provider | undefined>(undefined);
  dataInputForEdit = signal<Input | undefined>(undefined);
  showModalConfigInput: boolean = false;
  showModalSaveInput: boolean = false;
  showModalDetailsInput: boolean = false;
  isEdit: boolean = false;
  editSubs$: EventEmitter<Input> = new EventEmitter<Input>();
  detailsSubs$: EventEmitter<Input> = new EventEmitter<Input>();
  types_registry = signal([{ name: 'SIN FICHA', code: 'SIN FICHA' }, { name: 'FICHA', code: 'FICHA' }, { name: 'BOLETA', code: 'BOLETA' }]);
  private http = inject(HttpClient);
  private voucherPrintInProgress = false;
  referral_sources = signal([
    { name: 'Redes Sociales (Facebook, TikTok, Instagram)', code: 'REDES SOCIALES' },
    { name: 'Página Web RECUMET', code: 'PAGINA WEB RECUMET' },
    { name: 'Búsqueda en Google', code: 'GOOGLE' },
    { name: 'Referido por amigo/Amiga', code: 'REFERIDO POR AMIGO' },
    { name: 'Feria o Rueda de Negocios', code: 'FERIA' },
    { name: 'Seguimiento Comercial (Llamadas periódicas)', code: 'SEGUIMIENTO COMERCIAL' }
  ]);

  public _inputConfig: InputConfig = {
    searchForCode: localStorage.getItem('searchForCode') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearch') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProducts') === 'true' ? true : false,
    printAfter: localStorage.getItem('printAfter') === 'false' ? false : true,
    viewMoneyButtons: localStorage?.getItem('viewMoneyButtons') === 'false' ? false : true,
    printRoll: localStorage.getItem('printRoll') === 'true' ? true : false,
    printHalfPage: localStorage.getItem('printHalfPage') === 'true' ? true : false,
  }

  constructor() {
    this.migrateLegacyPrintFormatPreference();
  }

  private migrateLegacyPrintFormatPreference(): void {
    const preferenceVersion = 'input-print-format-v2';
    if (localStorage.getItem(preferenceVersion) === 'true') return;

    localStorage.setItem('printHalfPage', 'false');
    localStorage.setItem(preferenceVersion, 'true');
    this._inputConfig.printHalfPage = false;
  }

  getInputById(id_input: string): Observable<GetOneInput> {
    let url = `${base_url}/input/find/${id_input}`;
    return this.http.get<GetOneInput>(url);
  }

  getAllAndSearchInputs(page: number, limit: number, params: FormSearchInputs, type: string = '', query?: string, field_sort: string = 'id', order: string = 'DESC',): Observable<GetAllInputs> {
    let url = '';
    if (type === '') {
      url = `${base_url}/input?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}`;
    } else {
      url = `${base_url}/input?page=${page}&limit=${limit}&type=${type}&query=${query}&field_sort=${field_sort}&order=${order}`;
    }
    return this.http.get<GetAllInputs>(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      })
    });
  }

  postNewInput(data: NewInputForm): Observable<{ ok: string, msg: string, id_input: number }> {
    const url = `${base_url}/input`;
    return this.http.post<{ ok: string, msg: string, id_input: number }>(url, data, this.mutationOptions());
  }

  putUpdateInput(id_input: number, data: NewInputForm): Observable<{ ok: string, msg: string, id_input: number }> {
    const url = `${base_url}/input/${id_input}`;
    return this.http.put<{ ok: string, msg: string, id_input: number }>(url, data, this.mutationOptions());
  }

  previewVoidInput(id_input: number): Observable<any> {
    return this.http.get(`${base_url}/input/anular/${id_input}/preview`);
  }

  getOperationalDate(): Observable<{ ok: boolean; date: string }> {
    return this.http.get<{ ok: boolean; date: string }>(`${base_url}/input/operational-date`);
  }

  deleteInput(id_input: number, reason: string) {
    const url = `${base_url}/input/anular/${id_input}`;
    return this.http.delete(url, { ...this.mutationOptions(), body: { reason } });
  }

  getPurchaseTraceability(id_input: number, page = 1, limit = 50): Observable<any> {
    return this.traceabilityApi.getPurchase(id_input, page, limit);
  }

  resetInput() {
    this.detailShopping.update((details) => details = []);
    this.providerSelect.set(undefined);
  }

  updateDetailShopping(product: Product, updateQuantity: boolean = true, newQuantity: boolean = false) {
    const productExist = this.detailShopping().length > 0 ? this.detailShopping().find((prod) => prod.id === product.id) : false;
    if (productExist) {
      this.detailShopping.update((details) => {
        return details.map((prod) => {
          if (prod.id !== product.id) return prod;
          if (updateQuantity) {
            prod.quantity = newQuantity ? product.quantity : prod.quantity + (prod.set_quantity ?? 1);
          }
          prod.import = prod.quantity * prod.costo;
          return prod;
        });
      });
    } else {
      //primera agregación al carrito
      product.quantity = product.set_quantity ?? 1;
      product.import = product.quantity * product.costo;
      this.detailShopping.update((details) => [
        ...details,
        product,
      ]);
    }
  }
  //* Reportes */
  getReportPdf(params: FormSearchInputs, field_sort: string = 'id', order: string = 'DESC',) {
    const url = `${base_url}/input/pdf?field_sort=${field_sort}&order=${order}`;
    return this.http.get<any>(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      }),
      responseType: 'blob' as 'json'
    });
  }

  getReportExcel(params: FormSearchInputs, field_sort: string = 'id', order: string = 'DESC',) {
    const url = `${base_url}/input/excel?field_sort=${field_sort}&order=${order}`;
    return this.http.get(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      }),
      responseType: 'blob',
    });
  }

  getPurchaseReportExcel(params: FormSearchInputs, field_sort: string = 'id', order: string = 'DESC', type: string = '', query: string = '') {
    const search = type ? `&type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}` : '';
    return this.http.get(`${base_url}/input/purchase-report/excel?field_sort=${field_sort}&order=${order}${search}`, {
      params: new HttpParams({ fromObject: { ...params } }),
      responseType: 'blob',
    });
  }

  getPurchaseReport(page: number, limit: number, params: FormSearchInputs, type: string = '', query: string = '', field_sort: string = 'date_voucher', order: string = 'DESC'): Observable<GetAllInputs> {
    const search = type ? `&type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}` : '';
    return this.http.get<GetAllInputs>(`${base_url}/input/purchase-report?page=${page}&limit=${limit}&field_sort=${field_sort}&order=${order}${search}`, {
      params: new HttpParams({ fromObject: { ...params } }),
    });
  }

getPurchaseReportPdf(params: FormSearchInputs, field_sort: string = 'date_voucher', order: string = 'DESC', type: string = '', query: string = '') {
    const search = type ? `&type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}` : '';
    return this.http.get(`${base_url}/input/purchase-report/pdf?field_sort=${field_sort}&order=${order}${search}`, {
      params: new HttpParams({ fromObject: { ...params } }),
      responseType: 'blob',
    });
  }

  getPurchaseReportDetailsPdf(params: FormSearchInputs, field_sort: string = 'date_voucher', order: string = 'DESC', type: string = '', query: string = '') {
    const search = type ? `&type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}` : '';
    return this.http.get(`${base_url}/input/purchase-report/pdf/details?field_sort=${field_sort}&order=${order}${search}`, {
      params: new HttpParams({ fromObject: { ...params } }),
      responseType: 'blob',
    });
  }

  getPurchaseReportDetailsCPPPdf(params: FormSearchInputs, field_sort: string = 'date_voucher', order: string = 'DESC', type: string = '', query: string = '') {
    const search = type ? `&type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}` : '';
    return this.http.get(`${base_url}/input/purchase-report/pdf/details/cpp?field_sort=${field_sort}&order=${order}${search}`, {
      params: new HttpParams({ fromObject: { ...params } }),
      responseType: 'blob',
    });
  }

  getPurchaseReportDetailsExcel(params: FormSearchInputs, field_sort: string = 'date_voucher', order: string = 'DESC', type: string = '', query: string = '') {
    const search = type ? `&type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}` : '';
    return this.http.get(`${base_url}/input/purchase-report/excel/details?field_sort=${field_sort}&order=${order}${search}`, {
      params: new HttpParams({ fromObject: { ...params } }),
      responseType: 'blob',
    });
  }

  getPurchaseProductSummaryExcel(params: FormSearchInputs, field_sort: string = 'date_voucher', order: string = 'DESC', type: string = '', query: string = '') {
    const search = type ? `&type=${encodeURIComponent(type)}&query=${encodeURIComponent(query)}` : '';
    return this.http.get(`${base_url}/input/purchase-report/excel/summary-by-product?field_sort=${field_sort}&order=${order}${search}`, {
      params: new HttpParams({ fromObject: { ...params } }),
      responseType: 'blob',
    });
  }

  getConsolidatedInventoryExcel(params: FormSearchInputs) {
    return this.http.get(`${base_url}/kardex/total-stock-recumet/excel-consolidated`, {
      params: new HttpParams({ fromObject: { ...params, showZeroSaldo: 'false' } }),
      responseType: 'blob',
    });
  }
  //* Reportes Detalles */
  getReportDetailsPdf(params: FormSearchInputs) {
    const url = `${base_url}/input/pdf/details`;
    return this.http.get<any>(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      }),
      responseType: 'blob' as 'json'
    });
  }

  getReportDetailsCPPPdf(params: FormSearchInputs) {
    const url = `${base_url}/input/pdf/details/cpp`;
    return this.http.get<any>(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      }),
      responseType: 'blob' as 'json'
    });
  }
  getReportDetailsExcel(params: FormSearchInputs) {
    const url = `${base_url}/input/excel/details`;
    return this.http.get(url, {
      params: new HttpParams({
        fromObject: {
          ...params
        }
      }),
      responseType: 'blob',
    });
  }

  //* IMPRIMIR BOLETA
  getPrintVoucherInput(id_input: Number) {
    let format = 'normal';
    if (this._inputConfig.printRoll) {
      format = 'rollo';
    } else if (this._inputConfig.printHalfPage) {
      format = 'media';
    }
    const url = `${base_url}/input/pdf/voucher/${id_input}?format=${format}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  printPdfReport(id_input: number) {
    if (this.voucherPrintInProgress) {
      return;
    }

    this.voucherPrintInProgress = true;
    Swal.fire({
      title: 'Generando Boleta!',
      html: `Estamos generando la boleta`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.getPrintVoucherInput(id_input).pipe(
      timeout({ first: 20000 })
    ).subscribe({
      next: (data) => {
        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);

        const iframe = document.createElement('iframe');
        iframe.classList.add('app-print-frame');
        iframe.src = fileURL;
        let cleanedUp = false;
        let cleanupTimeout: ReturnType<typeof setTimeout> | undefined;
        const cleanupPrintFrame = () => {
          if (cleanedUp) return;
          cleanedUp = true;
          if (cleanupTimeout) clearTimeout(cleanupTimeout);
          iframe.remove();
          URL.revokeObjectURL(fileURL);
          this.voucherPrintInProgress = false;
        };

        iframe.onload = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const printWindow = iframe.contentWindow;
              if (!printWindow) {
                Swal.close();
                cleanupPrintFrame();
                void Swal.fire('No se pudo abrir la boleta', 'Intente imprimir nuevamente.', 'error');
                return;
              }

              cleanupTimeout = setTimeout(cleanupPrintFrame, 60000);
              try {
                Swal.close();
                printWindow.focus();
                printWindow.print();
              } catch (error) {
                console.error('Error al abrir el diálogo de impresión:', error);
                cleanupPrintFrame();
                void Swal.fire('No se pudo abrir la impresión', 'Intente nuevamente.', 'error');
              }
            });
          });
        };
        iframe.onerror = () => {
          Swal.close();
          cleanupPrintFrame();
          void Swal.fire('No se pudo cargar la boleta', 'Intente imprimir nuevamente.', 'error');
        };

        document.body.appendChild(iframe);
      },
      error: (err) => {
        this.voucherPrintInProgress = false;
        Swal.close();
        console.error('Error al generar la boleta:', err);
        const message = err?.name === 'TimeoutError'
          ? 'El servidor tardó demasiado en responder. Intente nuevamente; no es necesario reiniciar la página.'
          : 'Verifique su conexión e intente nuevamente.';
        void Swal.fire('No se pudo generar la boleta', message, 'error');
      }
    });
  }

  uploadVoucher(idInput: number, file: File): Observable<any> {
    const url = `${base_url}/input/upload/voucher?idInput=${idInput}`;
    const formData = new FormData();
    formData.append('voucher', file);
    return this.http.put<any>(url, formData);
  }
}
