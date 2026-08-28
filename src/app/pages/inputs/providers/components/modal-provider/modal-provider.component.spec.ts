import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';
import { ModalProviderComponent } from './modal-provider.component';

describe('ModalProviderComponent category catalog', () => {
  it('loads provider categories from the purchases operational context', () => {
    const getAllAndSearch = jasmine.createSpy('getAllAndSearch').and.returnValue(of({
      categories: { data: [] }
    }));
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    component.categories = signal([]);
    component.categoriesService = { getAllAndSearch } as any;
    (component as any).productContext = ProductAccessContext.Purchases;

    component.getAllCategories();

    expect(getAllAndSearch).toHaveBeenCalledWith(
      1,
      1000,
      true,
      '',
      '',
      '',
      'id',
      'DESC',
      ProductAccessContext.Purchases,
    );
  });
});
