import { signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { LoginComponent } from './login.component';

describe('Login work context transition', () => {
  const createComponent = () => {
    const component = Object.create(LoginComponent.prototype) as LoginComponent;
    component.loading = signal(false);
    component.loadingMessage = signal('');
    component.slowLoading = signal(false);
    component.showWorkContext = signal(true);
    component.sucursales = signal([]);
    component.contextForm = new FormGroup({ id_sucursal: new FormControl(1), id_storage: new FormControl(2) });
    component.validatorsService = { setWorkContext: () => true, reload_sucursal_storages$: { next: () => {} } } as any;
    component.transferReviewService = { beginSession: () => {}, checkCurrentContext: jasmine.createSpy().and.returnValue(of([])) } as any;
    return component;
  };

  it('keeps loading until navigation completes and ignores duplicate confirmations', async () => {
    const component = createComponent();
    let resolveNavigation!: (value: boolean) => void;
    const navigate = jasmine.createSpy().and.returnValue(new Promise<boolean>(resolve => resolveNavigation = resolve));
    component.router = { navigateByUrl: navigate } as any;
    const entering = component.confirmWorkContext();
    expect(component.loading()).toBeTrue();
    expect(component.loadingMessage()).toContain('Preparando');
    expect(component.transferReviewService.checkCurrentContext).not.toHaveBeenCalled();
    await component.confirmWorkContext();
    expect(navigate).toHaveBeenCalledTimes(1);
    resolveNavigation(true);
    await entering;
    expect(component.loading()).toBeFalse();
    expect(component.loadingMessage()).toBe('');
    expect(component.transferReviewService.checkCurrentContext).toHaveBeenCalled();
  });

  it('removes the overlay and restores the selector when navigation fails', async () => {
    const component = createComponent();
    component.router = { navigateByUrl: () => Promise.reject(new Error('Navigation failed')) } as any;
    spyOn(Swal, 'fire').and.callFake(() => {
      expect(component.loadingMessage()).toBe('');
      return Promise.resolve({ isConfirmed: true } as any);
    });
    await component.confirmWorkContext();
    expect(component.showWorkContext()).toBeTrue();
    expect(component.loading()).toBeFalse();
  });
});
