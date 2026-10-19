import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MenuItem } from './menu.model';
import { EventService } from 'src/app/core/services/event.service';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ValidatorsService } from '../../services/validators.service';
import Swal from 'sweetalert2';
import { MENU } from './menu';
import { Subscription } from 'rxjs';

export interface MenuGroup {
  directItem?: MenuItem;
  id: number;
  title: string;
  badgeCount: number;
  isOpen: boolean;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private readonly navigationSubscription: Subscription;
  private scrollTimer?: ReturnType<typeof setTimeout>;
  @ViewChild('componentRef') scrollRef?: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @Input() isCondensed = false;
  @Input() isMobileViewport = false;
  @Output() toggleRequested = new EventEmitter<void>();


  menu: any;
  data: any;
  private readonly menuDefinition = MENU;
  menuItems: MenuItem[] = [];
  menuGroups: MenuGroup[] = [];
  filteredGroups: MenuGroup[] = [];
  searchTerm = '';

  @ViewChild('sideMenu') sideMenu?: ElementRef;

  constructor(
    private eventService: EventService,
    private router: Router,
    public translate: TranslateService,
    public validatorsService: ValidatorsService,
  ) {
    this.navigationSubscription = router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateActiveStateFromUrl();
        this._scrollElement();
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  }

  ngOnInit() {
    this.initialize();
    this._scrollElement();
  }

  ngAfterViewInit() {
    this.updateActiveStateFromUrl();
  }

  ngOnChanges() {
    this._scrollElement();
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input?.value || '';
    this.applyFilter();
  }

  private normalizeText(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  applyFilter(): void {
    const term = this.normalizeText(this.searchTerm);
    if (!term) {
      this.filteredGroups = this.menuGroups;
      return;
    }

    const filtered: MenuGroup[] = [];

    for (const group of this.menuGroups) {
      const groupTitleMatch = this.normalizeText(group.title).includes(term);
      const matchingItems: MenuItem[] = [];

      for (const item of group.items) {
        const itemLabelMatch = this.normalizeText(item.label ?? '').includes(term);
        const matchingSubItems = (item.subItems ?? []).filter((sub) =>
          this.normalizeText(sub.label ?? '').includes(term)
        );

        if (groupTitleMatch || itemLabelMatch) {
          matchingItems.push({
            ...item,
            isExpanded: false,
          });
        } else if (matchingSubItems.length > 0) {
          matchingItems.push({
            ...item,
            subItems: matchingSubItems,
            isExpanded: false,
          });
        }
      }

      if (matchingItems.length > 0) {
        filtered.push({
          ...group,
          isOpen: group.isOpen,
          items: matchingItems,
        });
      }
    }

    const openGroup = filtered.find((group) => group.isOpen && !group.directItem)
      || filtered.find((group) => !group.directItem);
    filtered.forEach((group) => {
      group.isOpen = group === openGroup;
      const expandedItem = group.items.find((item) => item.isExpanded)
        || group.items.find((item) => this.hasItems(item));
      group.items.forEach((item) => {
        item.isExpanded = group.isOpen && item === expandedItem;
      });
    });
    this.filteredGroups = filtered;
  }

  trackByGroupId(_index: number, group: MenuGroup): any {
    return group.id || group.title;
  }

  trackByItem(_index: number, item: MenuItem): any {
    return item.id || item.link || item.label;
  }

  trackBySubItem(_index: number, subItem: MenuItem): any {
    return subItem.id || subItem.link || subItem.label;
  }

  toggleGroup(group: MenuGroup, event?: Event): void {
    if (this.isCondensed) {
      this.toggleRequested.emit();
      group.isOpen = false;
    }
    const shouldOpen = !group.isOpen;
    for (const candidate of new Set([...this.menuGroups, ...this.filteredGroups])) {
      candidate.isOpen = shouldOpen && candidate.id === group.id;
    }
  }

  toggleSubItem(item: MenuItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const shouldExpand = !this.isSubItemExpanded(item);
    for (const group of new Set([...this.menuGroups, ...this.filteredGroups])) {
      for (const candidate of group.items) {
        candidate.isExpanded = shouldExpand && candidate.id === item.id;
      }
    }
  }

  isSubItemExpanded(item: MenuItem): boolean {
    if ((item as any).isExpanded !== undefined) {
      return (item as any).isExpanded;
    }
    return this.hasActiveSubChild(item);
  }

  hasActiveSubChild(item: MenuItem): boolean {
    if (!item.subItems || item.subItems.length === 0) return false;
    const currentPath = window.location.pathname;
    return item.subItems.some((sub) => sub.link && currentPath.includes(sub.link));
  }

  hasActiveRoute(group: MenuGroup): boolean {
    const currentPath = window.location.pathname;
    return group.items.some((item) =>
      (!!item.link && currentPath.includes(item.link)) ||
      (item.subItems ?? []).some((subItem) => !!subItem.link && currentPath.includes(subItem.link))
    );
  }

  getCompactLabel(group: MenuGroup): string {
    const labels: Record<string, string> = { Dashboard: 'Inicio', 'Administración de caja': 'Caja', Administración: 'Admin.' };
    return labels[group.title] ?? group.title;
  }

  getGroupNotificationCount(group: MenuGroup): number {
    return group.items.flatMap(item => [item, ...(item.subItems ?? [])])
      .reduce((count, item) => {
        const value = Number(item.badge?.text);
        return count + (Number.isFinite(value) && value > 0 ? value : 0);
      }, 0);
  }

  getGroupIcon(group: MenuGroup): string {
    const currentPath = window.location.pathname;
    const activeItem = group.items.find((item) =>
      (!!item.link && currentPath.includes(item.link)) ||
      (item.subItems ?? []).some((subItem) => !!subItem.link && currentPath.includes(subItem.link))
    );
    const item = activeItem ?? group.items[0];
    return item ? this.getItemIcon(item) : 'fa-solid fa-folder';
  }

  getItemIcon(item: MenuItem): string {
    if (item.icon && item.icon !== 'fa-solid fa-angle-right') {
      return item.icon;
    }
    const label = (item.label ?? '').toLowerCase();
    if (label.includes('dashboard')) return 'fa-solid fa-chart-simple';
    if (label.includes('proveedor')) return 'fa-solid fa-users';
    if (label.includes('cliente')) return 'fa-solid fa-user-group';
    if (label.includes('compra')) return 'fa-solid fa-truck';
    if (label.includes('clasific')) return 'fa-solid fa-boxes-packing';
    if (label.includes('recepci')) return 'fa-solid fa-box-open';
    if (label.includes('concilia')) return 'fa-solid fa-scale-balanced';
    if (label.includes('balanza camionera')) return 'fa-solid fa-truck-fast';
    if (label.includes('balanza manual')) return 'fa-solid fa-weight-scale';
    if (label.includes('servicio de balanza') || label.includes('balanza')) return 'fa-solid fa-scale-balanced';
    if (label.includes('transportista')) return 'fa-solid fa-user-tie';
    if (label.includes('camion')) return 'fa-solid fa-truck-pickup';
    if (label.includes('venta')) return 'fa-solid fa-cart-shopping';
    if (label.includes('traslado')) return 'fa-solid fa-truck-ramp-box';
    if (label.includes('despacho')) return 'fa-solid fa-dolly';
    if (label.includes('caja')) return 'fa-solid fa-vault';
    if (label.includes('activo')) return 'fa-solid fa-money-bill-transfer';
    if (label.includes('cuenta')) return 'fa-solid fa-comments-dollar';
    if (label.includes('kardex')) return 'fa-solid fa-warehouse';
    if (label.includes('inventario')) return 'fa-solid fa-boxes-stacked';
    if (label.includes('almacén') || label.includes('almacen')) return 'fa-solid fa-warehouse';
    if (label.includes('config') || label.includes('usuario') || label.includes('empresa') || label.includes('sucursal')) return 'fa-solid fa-gears';
    if (label.includes('reporte')) return 'fa-solid fa-chart-column';
    return 'fa-solid fa-circle-dot';
  }

  buildMenuGroups(): void {
    const groups: MenuGroup[] = [];
    let currentGroup: MenuGroup | null = null;

    for (const item of this.menuItems) {
      if (item.isLayout && item.link) {
        groups.push({ id: item.id!, title: item.label ?? '', badgeCount: 1,
          isOpen: false, items: [item], directItem: item });
        currentGroup = null;
        continue;
      }
      if (item.isTitle) {
        currentGroup = {
          id: item.id ?? groups.length + 1,
          title: item.label ?? '',
          badgeCount: 0,
          isOpen: false,
          items: [],
        };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.items.push(item);
      } else {
        currentGroup = {
          id: 0,
          title: 'Principal',
          badgeCount: 0,
          isOpen: false,
          items: [item],
        };
        groups.push(currentGroup);
      }
    }

    const currentPath = window.location.pathname;
    let openedGroup = false;
    groups.forEach((group) => {
      let count = 0;
      let hasActiveChild = false;

      group.items.forEach((item) => {
        if (item.subItems && item.subItems.length > 0) {
          count += item.subItems.length;
          if (item.subItems.some((sub) => sub.link && currentPath.includes(sub.link))) {
            hasActiveChild = true;
          }
        } else {
          count += 1;
          if (item.link && currentPath.includes(item.link)) {
            hasActiveChild = true;
          }
        }
      });

      group.badgeCount = count;
      // Inicialmente solo se abre si el usuario se encuentra dentro de una de sus rutas
      group.isOpen = !group.directItem && hasActiveChild && !openedGroup;
      openedGroup ||= group.isOpen;
    });

    this.menuGroups = groups.filter((g) => g.items.length > 0);
    this.applyFilter();
  }

  updateActiveStateFromUrl(): void {
    const currentPath = window.location.pathname;
    let openedGroup = false;
    this.menuGroups.forEach((group) => {
      const hasActiveChild = group.items.some((item) => {
        if (item.link && currentPath.includes(item.link)) return true;
        return (item.subItems ?? []).some((sub) => sub.link && currentPath.includes(sub.link));
      });
      group.isOpen = !group.directItem && hasActiveChild && !openedGroup;
      openedGroup ||= group.isOpen;
      let expandedItem = false;
      group.items.forEach((item) => {
        item.isExpanded = group.isOpen && this.hasActiveSubChild(item) && !expandedItem;
        expandedItem ||= item.isExpanded;
      });
    });
    this.applyFilter();
  }

  _scrollElement() {
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const activeEl = document.querySelector(
        '.vertical-menu .nav-link-item-1.active, .vertical-menu .nav-link-item-2.active',
      ) as HTMLElement;
      const scrollElement = this.scrollRef?.nativeElement as HTMLElement | undefined;
      if (!activeEl || !scrollElement) return;
      const activeBounds = activeEl.getBoundingClientRect();
      const scrollBounds = scrollElement.getBoundingClientRect();
      if (activeBounds.bottom > scrollBounds.bottom) {
        scrollElement.scrollTop += activeBounds.bottom - scrollBounds.bottom + 16;
      } else if (activeBounds.top < scrollBounds.top) {
        scrollElement.scrollTop -= scrollBounds.top - activeBounds.top + 16;
      }
    }, 300);
  }

  /**
   * Initialize
   */
  initialize(): void {
    const isAdmin = this.validatorsService.user()?.role == 'ADMINISTRADOR';
    if (!this.validatorsService.validateUserWithPermissions() && !isAdmin) {
      Swal.fire({
        title: 'Sin permisos asignados',
        text: 'No tiene permisos habilitados. Comuníquese con soporte para solicitar la habilitación.',
        icon: 'warning',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert' },
      });
      this.menuItems = [];
      this.menuGroups = [];
      return;
    }
    this.menuItems = this.cloneMenuDefinition();
    if (isAdmin) {
      this.buildMenuGroups();
      return;
    }

    //**Select si tiene permisos por modulo view | true | false */
    this.menuItems.forEach((item) => {
      if (item.name && item.action) {
        item.view = this.validatorsService.withPermission(
          item.name,
          item.action,
        );
      } else {
        item.view = true;
      }
      item.subItems?.forEach((subItem) => {
        if (subItem.name && subItem.action) {
          subItem.view = this.validatorsService.withPermission(
            subItem.name,
            subItem.action,
          );
        } else {
          subItem.view = true;
        }
      });
    });

    //**los que no tienen permiso estan falso entonces lo filtramos */
    this.menuItems.forEach((item) => {
      if (item.subItems) {
        item.subItems = item.subItems.filter((subItem) => subItem.view);
        item.view = item.subItems.length > 0;
      }
    });

    this.menuItems = this.menuItems.filter((item) => item.isTitle || item.view);
    this.updateTitleVisibility();
    this.menuItems = this.menuItems.filter((item) => item.view !== false);
    this.buildMenuGroups();
  }

  private cloneMenuDefinition(): MenuItem[] {
    return this.menuDefinition.map((item) => ({
      ...item,
      name: item.isTitle && !item.name
        ? `${(item.label ?? '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}_TITULO`
        : item.name,
      subItems: item.subItems?.map((subItem) => ({ ...subItem })),
    }));
  }

  private updateTitleVisibility(): void {
    this.menuItems.forEach((item, index) => {
      if (!item.isTitle) return;
      const nextTitleIndex = this.menuItems.findIndex(
        (candidate, candidateIndex) => candidateIndex > index && candidate.isTitle,
      );
      const sectionEnd = nextTitleIndex === -1 ? this.menuItems.length : nextTitleIndex;
      item.view = this.menuItems
        .slice(index + 1, sectionEnd)
        .some((candidate) => candidate.view !== false);
    });
  }

  filterTitle(name: string) {
    const salidas = this.menuItems.filter((resp) => resp.name === name);
    const is_min_true = salidas
      .map((resp) => (resp.subItems?.length ?? 0) > 0)
      .some((resp) => resp === true);
    this.menuItems.forEach((resp) => {
      if (resp.isTitle && resp.name === `${name}_TITULO`) {
        resp.view = is_min_true;
      }
    });
    this.buildMenuGroups();
  }

  checkBooleanArray(array: boolean[]): boolean {
    const atLeastOneTrue = array.some((value) => value === true);
    return atLeastOneTrue;
  }

  hasItems(item: MenuItem) {
    return item.subItems !== undefined ? item.subItems.length > 0 : false;
  }
}
