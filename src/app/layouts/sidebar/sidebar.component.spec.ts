import { SidebarComponent } from './sidebar.component';
import { MENU } from './menu';
import Swal from 'sweetalert2';

describe('SidebarComponent title filtering', () => {
  it('ignores matching menu entries without subitems', () => {
    const component = Object.create(SidebarComponent.prototype) as SidebarComponent;
    component.menuItems = [
      { name: 'ENTRADAS', view: true },
      { name: 'ENTRADAS', subItems: [{ name: 'COMPRAS', view: true }], view: true },
      { name: 'ENTRADAS_TITULO', isTitle: true, view: false },
    ];

    expect(() => component.filterTitle('ENTRADAS')).not.toThrow();
    expect(component.menuItems[2].view).toBeTrue();
  });

  it('hides the title when no matching entry has visible subitems', () => {
    const component = Object.create(SidebarComponent.prototype) as SidebarComponent;
    component.menuItems = [
      { name: 'SALIDAS', view: true },
      { name: 'SALIDAS_TITULO', isTitle: true, view: true },
    ];

    component.filterTitle('SALIDAS');

    expect(component.menuItems[1].view).toBeFalse();
  });
});

describe('SidebarComponent permission filtering', () => {
  const createComponent = (role: string, allowed: (name: string, action: string) => boolean) => {
    const component = Object.create(SidebarComponent.prototype) as SidebarComponent;
    (component as any).menuDefinition = MENU;
    component.menuItems = [];
    component.validatorsService = {
      user: () => ({ role }),
      validateUserWithPermissions: () => true,
      withPermission: allowed,
    } as any;
    return component;
  };

  it('keeps the complete menu for an administrator', () => {
    const component = createComponent('ADMINISTRADOR', () => true);

    component.initialize();

    expect(component.menuItems.length).toBe(MENU.length);
    expect(component.menuItems.flatMap((item) => item.subItems ?? []).length)
      .toBe(MENU.flatMap((item) => item.subItems ?? []).length);
  });

  it('keeps only authorized leaves and their section title for a limited user', () => {
    const component = createComponent(
      'OPERADOR',
      (name, action) => name === 'COMPRAS' && action === 'create',
    );

    component.initialize();

    const links = component.menuItems.flatMap((item) => item.subItems ?? []).map((item) => item.link);
    const titles = component.menuItems.filter((item) => item.isTitle).map((item) => item.name);
    expect(links).toEqual(['/inputs/input-small']);
    expect(titles).toContain('ENTRADAS_TITULO');
    expect(titles).not.toContain('BALANZA_TITULO');
  });

  it('clones submenu arrays instead of mutating the shared manifest', () => {
    const originalProviderCount = MENU.find((item) => item.id === 21)?.subItems?.length;
    const component = createComponent('OPERADOR', () => false);

    component.initialize();

    expect(MENU.find((item) => item.id === 21)?.subItems?.length).toBe(originalProviderCount);
  });

  it('keeps the session available when the user has no assigned permissions', () => {
    const component = createComponent('OPERADOR', () => false);
    component.validatorsService.validateUserWithPermissions = () => false;
    const alert = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as never));

    component.initialize();

    expect(component.menuItems).toEqual([]);
    expect(alert).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Sin permisos asignados',
      text: 'No tiene permisos habilitados. Comuníquese con soporte para solicitar la habilitación.',
    }));
  });
});
