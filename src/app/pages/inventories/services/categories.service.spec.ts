import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';
import { CategoriesService } from './categories.service';

describe('CategoriesService operational catalog', () => {
  let service: CategoriesService;
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
      providers: [CategoriesService],
    });
    service = TestBed.inject(CategoriesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  for (const [context, segment] of routes) {
    it(`uses the fixed ${segment} route for category filters`, () => {
      service.getAllAndSearch(
        3, 40, true, 'name', 'metales', 'RAW_MATERIAL', 'name', 'ASC', context,
      ).subscribe();

      const request = http.expectOne(req =>
        req.url.includes(`/category/operational/${segment}`)
        && req.urlWithParams.includes('page=3')
        && req.urlWithParams.includes('limit=40')
        && req.urlWithParams.includes('type=name')
        && req.urlWithParams.includes('query=metales')
        && req.urlWithParams.includes('category_type=RAW_MATERIAL')
        && req.urlWithParams.includes('field_sort=name')
        && req.urlWithParams.includes('order=ASC')
        && !req.urlWithParams.includes('product_context'));
      expect(request.request.method).toBe('GET');
      request.flush({ ok: true, categories: { data: [] } });
    });
  }

  it('keeps administrative categories on the protected general route', () => {
    service.getAllAndSearch(1, 50, true).subscribe();

    const request = http.expectOne(req =>
      req.url.includes('/category')
      && !req.url.includes('/operational/'));
    expect(request.request.urlWithParams).not.toContain('product_context');
    request.flush({ ok: true, categories: { data: [] } });
  });

  it('uses the operational select route without product_context', () => {
    service.getCategorySelect('RAW_MATERIAL', ProductAccessContext.Purchases).subscribe();

    const request = http.expectOne(req =>
      req.url.includes('/category/operational/purchases/select')
      && req.urlWithParams.includes('category_type=RAW_MATERIAL')
      && !req.urlWithParams.includes('product_context'));
    expect(request.request.method).toBe('GET');
    request.flush({ ok: true, categories: [] });
  });

  it('uses the inventory catalog instead of the administrative category route', () => {
    service.getInventoryCategorySelect('FINISHED_PRODUCT').subscribe();

    const request = http.expectOne(req =>
      req.url.includes('/category/inventory/select')
      && req.urlWithParams.includes('category_type=FINISHED_PRODUCT'));
    expect(request.request.method).toBe('GET');
    request.flush({ ok: true, categories: [] });
  });
});
