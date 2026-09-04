import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductsService } from './products.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';

describe('ProductsService operational catalog', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  const routes: Array<[ProductAccessContext, string]> = [
    [ProductAccessContext.Purchases, 'purchases'],
    [ProductAccessContext.Sales, 'sales'],
    [ProductAccessContext.Transfers, 'transfers'],
    [ProductAccessContext.Classifieds, 'classifieds'],
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProductsService,
        { provide: ValidatorsService, useValue: { id_sucursal: () => 1 } },
      ],
    });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  for (const [context, segment] of routes) {
    it(`uses the fixed ${segment} route and preserves every frontend filter`, () => {
      service.getAllAndSearch(
        2, 25, true, 'pos', 'cobre', true, '3', '4', 'name', 'ASC', true,
        'RAW_MATERIAL', context,
      ).subscribe();

      const request = http.expectOne(req =>
        req.url.includes(`/product/operational/${segment}`)
        && req.urlWithParams.includes('page=2')
        && req.urlWithParams.includes('limit=25')
        && req.urlWithParams.includes('type=pos')
        && req.urlWithParams.includes('query=cobre')
        && req.urlWithParams.includes('stock=true')
        && req.urlWithParams.includes('id_sucursal=3')
        && req.urlWithParams.includes('id_storage=4')
        && req.urlWithParams.includes('field_sort=name')
        && req.urlWithParams.includes('order=ASC')
        && req.urlWithParams.includes('withStock=true')
        && req.urlWithParams.includes('category_type=RAW_MATERIAL')
        && !req.urlWithParams.includes('product_context'));
      expect(request.request.method).toBe('GET');
      request.flush({ ok: true, products: { data: [] } });
    });
  }

  it('keeps administrative consumers on the protected general route', () => {
    service.getAllAndSearch(1, 50, true).subscribe();

    const request = http.expectOne(req =>
      req.url.includes('/product')
      && !req.url.includes('/operational/'));
    expect(request.request.urlWithParams).not.toContain('product_context');
    request.flush({ ok: true, products: { data: [] } });
  });

  it('uses the operational select route without a client context parameter', () => {
    service.getSelectProducts(
      'cobre', 10, 'RAW_MATERIAL', '1,2', ProductAccessContext.Purchases,
    ).subscribe();

    const request = http.expectOne(req =>
      req.url.includes('/product/operational/purchases/select')
      && req.urlWithParams.includes('query=cobre')
      && req.urlWithParams.includes('category_type=RAW_MATERIAL')
      && req.urlWithParams.includes('category_ids=1,2')
      && !req.urlWithParams.includes('product_context'));
    expect(request.request.method).toBe('GET');
    request.flush({ ok: true, products: [] });
  });

  it('uses a dedicated route for technical difference products', () => {
    service.getDifferenceProducts('merma', 20).subscribe();

    const request = http.expectOne(req =>
      req.url.includes('/product/differences/select')
      && req.urlWithParams.includes('query=merma')
      && req.urlWithParams.includes('limit=20'));
    expect(request.request.method).toBe('GET');
    request.flush({ ok: true, products: [] });
  });

  it('uses the inventory catalog instead of the administrative product route', () => {
    service.getInventorySelectProducts('cobre', 20, 'FINISHED_PRODUCT', '1,2').subscribe();

    const request = http.expectOne(req =>
      req.url.includes('/product/inventory/select')
      && req.urlWithParams.includes('query=cobre')
      && req.urlWithParams.includes('limit=20')
      && req.urlWithParams.includes('category_type=FINISHED_PRODUCT')
      && req.urlWithParams.includes('category_ids=1,2'));
    expect(request.request.method).toBe('GET');
    request.flush({ ok: true, products: [] });
  });
});
