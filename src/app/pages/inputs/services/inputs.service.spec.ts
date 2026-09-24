import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormSearchInputs } from '../interfaces/input.interface';
import { InputsService } from './inputs.service';
import { PurchaseTraceabilityApiService } from 'src/app/core/services/purchase-traceability-api.service';

describe('InputsService reporte de compras', () => {
  let service: InputsService;
  let http: HttpTestingController;

  const params: FormSearchInputs = {
    status: 'ACTIVE', type_pay: 'CONTADO', type_registry: '', id_provider: '', referral_sources: '',
    id_type_provider: '', old_customer: '', with_pickup: '', filterBy: 'MONTH', id_sucursal: '1',
    id_storage: '2', category_ids: '3', id_products: '4', report_filters: 'Sucursales: Casa',
    date1: '09', date2: '2026',
  };

  const path = (req: { url: string }) => req.url.split('?')[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InputsService, PurchaseTraceabilityApiService],
    });
    service = TestBed.inject(InputsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista el reporte solo por la ruta aislada purchase-report', () => {
    service.getPurchaseReport(1, 50, params, 'cod', 'mp-1', 'date_voucher', 'DESC').subscribe();
    const request = http.expectOne(req => path(req).endsWith('/input/purchase-report') && req.method === 'GET');
    expect(request.request.urlWithParams).toContain('page=1');
    expect(request.request.urlWithParams).toContain('type=cod');
    expect(request.request.urlWithParams).toContain('query=mp-1');
    request.flush({ ok: true, inputs: { data: [], total: 0 } });
  });

  it('expone Excel y PDF principales en rutas propias del reporte', () => {
    service.getPurchaseReportExcel(params).subscribe();
    http.expectOne(req => path(req).endsWith('/input/purchase-report/excel') && req.method === 'GET').flush(new Blob());

    service.getPurchaseReportPdf(params).subscribe();
    http.expectOne(req => path(req).endsWith('/input/purchase-report/pdf') && req.method === 'GET').flush(new Blob());
  });

  it('expone el resumen por producto PDF en su ruta detallada aislada', () => {
    service.getPurchaseReportDetailsPdf(params, 'date_voucher', 'DESC', 'cod', 'mp-1').subscribe();
    const request = http.expectOne(req => path(req).endsWith('/input/purchase-report/pdf/details') && req.method === 'GET');
    expect(request.request.urlWithParams).toContain('type=cod');
    expect(request.request.urlWithParams).toContain('query=mp-1');
    request.flush(new Blob());
  });

  it('expone el detalle costo promedio PDF en su ruta detallada aislada', () => {
    service.getPurchaseReportDetailsCPPPdf(params).subscribe();
    http.expectOne(req => path(req).endsWith('/input/purchase-report/pdf/details/cpp') && req.method === 'GET').flush(new Blob());
  });

  it('expone el resumen por producto Excel en su ruta detallada aislada', () => {
    service.getPurchaseReportDetailsExcel(params).subscribe();
    http.expectOne(req => path(req).endsWith('/input/purchase-report/excel/details') && req.method === 'GET').flush(new Blob());
  });

  it('expone el resumen por producto Excel en su ruta dedicada', () => {
    service.getPurchaseProductSummaryExcel(params).subscribe();
    http.expectOne(req => path(req).endsWith('/input/purchase-report/excel/summary-by-product') && req.method === 'GET').flush(new Blob());
  });

  it('expone el inventario consolidado en su ruta propia', () => {
    service.getConsolidatedInventoryExcel(params).subscribe();
    http.expectOne(req => path(req).endsWith('/kardex/total-stock-recumet/excel-consolidated') && req.method === 'GET').flush(new Blob());
  });
});
