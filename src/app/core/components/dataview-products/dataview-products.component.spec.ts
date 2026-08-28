import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
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
});
