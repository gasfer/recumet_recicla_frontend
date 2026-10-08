import { SidebarComponent } from './sidebar.component';
import { MENU } from './menu';
import Swal from 'sweetalert2';

describe('SidebarComponent exclusive accordion', () => {
  const createComponent = () => {
    const component = Object.create(SidebarComponent.prototype) as SidebarComponent;
    component.searchTerm = '';
    component.menuGroups = [
      { id: 1, title: 'Entradas', badgeCount: 1, isOpen: true, items: [
        { id: 11, label: 'Compras', isExpanded: true, subItems: [{ link: '/inputs/input-small' }] },
        { id: 12, label: 'Recepciones', subItems: [{ link: '/inputs/receptions' }] },
      ] },
      { id: 2, title: 'Administración', badgeCount: 1, isOpen: false, items: [
        { id: 21, label: 'Configuración', subItems: [{ link: '/settings' }] },
      ] },
    ];
    component.filteredGroups = component.menuGroups;
    return component;
  };

  it('closes the previous group and allows closing the selected group', () => {
    const component = createComponent();
    component.toggleGroup(component.menuGroups[1]);
    expect(component.menuGroups.map(group => group.isOpen)).toEqual([false, true]);
    component.toggleGroup(component.menuGroups[1]);
    expect(component.menuGroups.every(group => !group.isOpen)).toBeTrue();
  });

  it('closes sibling submenus when another submenu is expanded', () => {
    const component = createComponent();
    component.toggleSubItem(component.menuGroups[0].items[1], new Event('click'));
    expect(component.menuGroups[0].items.map(item => item.isExpanded)).toEqual([false, true]);
  });

  it('keeps only one search result group open and synchronizes toggles when search clears', () => {
    const component = createComponent();
    component.searchTerm = 'c';
    component.applyFilter();
    expect(component.filteredGroups.filter(group => group.isOpen).length).toBe(1);
    component.toggleGroup(component.filteredGroups[1]);
    component.searchTerm = '';
    component.applyFilter();
    expect(component.filteredGroups.map(group => group.isOpen)).toEqual([false, true]);
  });

  it('closes manually opened groups when the active route is restored', () => {
    const component = createComponent();
    spyOn(component, 'hasActiveSubChild').and.returnValue(false);
    component.menuGroups[0].items[0].link = window.location.pathname;
    component.menuGroups[1].isOpen = true;
    component.updateActiveStateFromUrl();
    expect(component.menuGroups.map(group => group.isOpen)).toEqual([true, false]);
  });
});

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

  it('shows sale registration to an operator with the create sale permission', () => {
    const component = createComponent('OPERADOR', (name, action) => name === 'VENTAS' && action === 'create');
    component.initialize();
    const sales = component.menuItems.find(item => item.label === 'Ventas');
    expect(sales?.subItems?.map(item => item.link)).toEqual(['/outputs/output']);
  });

  it('keeps clients only inside sales and dashboard and reports as direct links', () => {
    const component = createComponent('ADMINISTRADOR', () => true);
    component.initialize();
    const sales = component.menuItems.find(item => item.label === 'Ventas');
    const clientLinks = component.menuItems.flatMap(item => [item, ...(item.subItems ?? [])])
      .filter(item => item.link === '/outputs/clients');
    expect(clientLinks.length).toBe(1);
    expect(sales?.subItems).toContain(clientLinks[0]);
    for (const label of ['Dashboard', 'Reportes']) {
      const group = component.menuGroups.find(item => item.title === label);
      expect(group?.directItem?.link).toBeTruthy();
      expect(group?.directItem?.subItems).toBeUndefined();
    }
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
