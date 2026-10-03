import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { ValidatorsService } from 'src/app/services/validators.service';
import { CategoriesService } from 'src/app/pages/inventories/services/categories.service';
import { ProductsService } from 'src/app/pages/inventories/services/products.service';
import { DataviewProductsComponent } from './dataview-products.component';

describe('DataviewProductsComponent prominent product code', () => {
  let fixture: ComponentFixture<DataviewProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataviewProductsComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            getAllAndSearch: jasmine.createSpy().and.returnValue(of({
              products: { data: [], total: 0, from: 0, to: 0 },
            })),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            getAllAndSearch: jasmine.createSpy().and.returnValue(of({
              categories: { data: [] },
            })),
          },
        },
        {
          provide: ValidatorsService,
          useValue: { decimalLength: () => 2 },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DataviewProductsComponent, {
        set: {
          template: `
            <div
              class="top-badges"
              [class.top-badges--prominent]="prominentProductCode">
            </div>
          `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DataviewProductsComponent);
  });

  it('keeps the prominent presentation disabled by default', () => {
    fixture.detectChanges();

    const badgeContainer = fixture.nativeElement.querySelector('.top-badges');
    expect(fixture.componentInstance.prominentProductCode).toBeFalse();
    expect(badgeContainer.classList).not.toContain('top-badges--prominent');
  });

  it('applies the prominent class when the input is enabled', () => {
    fixture.componentRef.setInput('prominentProductCode', true);
    fixture.detectChanges();

    const badgeContainer = fixture.nativeElement.querySelector('.top-badges');
    expect(badgeContainer.classList).toContain('top-badges--prominent');
  });

  it('requests the selected page without a filter', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.paginate({ page: 2, rows: 50 });
    const request = TestBed.inject(ProductsService).getAllAndSearch as jasmine.Spy;
    expect(request.calls.mostRecent().args.slice(0, 5)).toEqual([3, 50, true, '', '']);
    expect(component.first).toBe(100);
  });

  it('keeps the active filter when paging', () => {
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.searchByProduct('plomo blando');
    component.paginate({ page: 1, rows: 50 });
    const request = TestBed.inject(ProductsService).getAllAndSearch as jasmine.Spy;
    expect(request.calls.mostRecent().args.slice(0, 5)).toEqual([2, 50, true, 'pos', 'plomo blando']);
  });

  for (const input of ['id_sucursal', 'id_storage']) {
    it(`reloads the first page with the current filter when ${input} changes`, () => {
      fixture.componentRef.setInput('id_sucursal', '1');
      fixture.componentRef.setInput('id_storage', '10');
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.searchByProduct('plomo blando');
      component.paginate({ page: 2, rows: 50 });
      fixture.componentRef.setInput(input, input === 'id_sucursal' ? '2' : '20');
      fixture.detectChanges();
      const request = TestBed.inject(ProductsService).getAllAndSearch as jasmine.Spy;
      expect(request.calls.mostRecent().args.slice(0, 8)).toEqual([
        1, 50, true, 'pos', 'plomo blando', false,
        input === 'id_sucursal' ? '2' : '1',
        input === 'id_storage' ? '20' : '10',
      ]);
      expect(component.first).toBe(0);
    });
  }

  it('discards pending results from the previous branch', () => {
    fixture.componentRef.setInput('id_sucursal', '1');
    fixture.detectChanges();
    const oldResponse = new Subject<any>();
    const newResponse = new Subject<any>();
    const request = TestBed.inject(ProductsService).getAllAndSearch as jasmine.Spy;
    request.and.returnValues(oldResponse, newResponse);
    fixture.componentInstance.searchByProduct('plomo');
    fixture.componentRef.setInput('id_sucursal', '2');
    fixture.detectChanges();
    newResponse.next({ products: { data: [], total: 2, from: 1, to: 2 } });
    oldResponse.next({ products: { data: [], total: 99, from: 1, to: 50 } });
    expect(fixture.componentInstance.total).toBe(2);
  });
});
