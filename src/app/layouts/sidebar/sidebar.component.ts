import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
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
  styles: [
    `
      :host {
        display: block;
      }

      /* Contenedor principal del Sidebar */
      :host ::ng-deep .vertical-menu {
        display: flex !important;
        flex-direction: column !important;
        height: 100dvh !important;
        background: #070e1b !important;
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.28);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      }

      :host ::ng-deep .vertical-menu > ngx-simplebar,
      :host ::ng-deep .vertical-menu .simplebar-content-wrapper,
      :host ::ng-deep .vertical-menu .simplebar-content {
        background: #070e1b !important;
      }

      /* Cabecera Brand Compacta */
      .sidebar-brand-wrapper {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 14px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background: #050a14;
      }

      .brand-badge-box {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #0d192f;
        border: 1px solid rgba(16, 185, 129, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .brand-badge-img {
        width: 26px;
        height: 26px;
        object-fit: contain;
      }

      .brand-text-col {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .brand-title-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .brand-name {
        color: #ffffff;
        font-size: 0.95rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        line-height: 1.1;
      }

      /* Buscador de Módulos */
      .sidebar-search-container {
        flex-shrink: 0;
        padding: 10px 12px 6px;
      }

      .search-box-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        background: #0e172a;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 6px 10px;
        transition: border-color 0.2s, background-color 0.2s;
      }

      .search-box-wrapper:focus-within {
        border-color: #10b981;
        background: #132039;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
      }

      .search-icon {
        color: #64748b;
        font-size: 0.8rem;
        margin-right: 8px;
      }

      .search-input-field {
        background: transparent;
        border: none;
        outline: none;
        color: #e2e8f0;
        font-size: 0.78rem;
        width: 100%;
      }

      .search-input-field::placeholder {
        color: #64748b;
      }

      .search-shortcut-kbd {
        background: #1e293b;
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 0.62rem;
        font-family: inherit;
        padding: 2px 5px;
        border-radius: 4px;
        white-space: nowrap;
      }

      /* Scroll central con SimpleBar */
      .sidebar-scroll {
        flex: 1 1 auto;
        min-height: 0;
        height: auto !important;
        overflow: hidden;
      }

      :host ::ng-deep .sidebar-scroll .simplebar-wrapper,
      :host ::ng-deep .sidebar-scroll .simplebar-mask,
      :host ::ng-deep .sidebar-scroll .simplebar-content-wrapper {
        height: 100% !important;
        max-height: 100% !important;
      }

      /* Contenedor de Grupos */
      .sidebar-groups-wrapper {
        padding: 10px 10px 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* Tarjeta de Grupo / Cabecera Accordion */
      .group-accordion-card {
        border-radius: 10px;
        background: #0e172b;
        border: 1px solid rgba(255, 255, 255, 0.05);
        overflow: hidden;
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .group-accordion-card.is-open {
        border-color: rgba(16, 185, 129, 0.35);
        background: #0b1426;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .group-header-button {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 12px;
        background: transparent;
        border: none;
        cursor: pointer;
        outline: none;
        color: #94a3b8;
        transition: background-color 0.18s, color 0.18s;
      }

      .group-header-button:hover {
        background: rgba(255, 255, 255, 0.03);
        color: #ffffff;
      }

      .group-accordion-card.is-open .group-header-button {
        color: #ffffff;
        background: rgba(16, 185, 129, 0.06);
      }

      .group-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .group-indicator-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
      }

      .group-title-text {
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .group-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .group-count-badge {
        background: #070e1b;
        color: #64748b;
        border: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 0.68rem;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 999px;
      }

      .group-chevron-icon {
        font-size: 0.68rem;
        color: #64748b;
        transition: transform 0.22s ease, color 0.18s ease;
      }

      .group-chevron-icon.is-rotated {
        transform: rotate(90deg);
        color: #10b981;
      }

      /* Contenido desplegable del grupo */
      .group-items-collapse {
        padding: 6px 6px 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
      }

      .nav-items-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      /* Item Nivel 1 */
      .nav-link-item-1 {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 0.79rem;
        color: #cbd5e1;
        text-decoration: none;
        border: 1px solid transparent;
        transition: all 0.18s ease;
        cursor: pointer;
      }

      .nav-link-item-1:hover {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.22);
        color: #ffffff;
      }

      /* Icono Nivel 1: cambia a verde principal en hover */
      .nav-item-icon {
        font-size: 0.88rem;
        color: #8197b4;
        width: 16px;
        text-align: center;
        transition: color 0.18s ease, transform 0.18s ease;
      }

      .nav-link-item-1:hover .nav-item-icon {
        color: #10b981 !important;
        transform: scale(1.1);
      }

      /* Item Nivel 1 Activo */
      .nav-link-item-1.active {
        background: linear-gradient(90deg, #059669 0%, #10b981 100%) !important;
        border-color: #34d399 !important;
        color: #ffffff !important;
        font-weight: 700;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.32);
      }

      .nav-link-item-1.active .nav-item-icon {
        color: #ffffff !important;
      }

      .nav-item-label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sub-toggle-chevron {
        font-size: 0.65rem;
        color: #64748b;
        transition: transform 0.2s ease;
      }

      .sub-toggle-chevron.is-open {
        transform: rotate(180deg);
        color: #10b981;
      }

      /* Submenú Nivel 2 (Menu 2) */
      .nav-sub-wrapper {
        display: flex;
        flex-direction: column;
      }

      .nav-sub-list-2 {
        list-style: none;
        margin: 4px 0 6px 14px;
        padding: 4px 0 4px 10px;
        border-left: 2px solid rgba(16, 185, 129, 0.22);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-link-item-2 {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 0.74rem;
        color: #94a3b8;
        text-decoration: none;
        transition: all 0.16s ease;
      }

      .sub-bullet-symbol {
        color: #64748b;
        font-size: 0.85rem;
        line-height: 1;
        transition: color 0.16s ease, transform 0.16s ease;
      }

      .nav-link-item-2:hover {
        background: rgba(255, 255, 255, 0.04);
        color: #ffffff;
      }

      .nav-link-item-2:hover .sub-bullet-symbol {
        color: #10b981;
        transform: translateX(2px);
      }

      .nav-link-item-2.active {
        color: #10b981 !important;
        font-weight: 700;
        background: rgba(16, 185, 129, 0.12);
      }

      .nav-link-item-2.active .sub-bullet-symbol {
        color: #10b981 !important;
      }

      /* Footer del Sidebar */
      .sidebar-footer-status {
        flex-shrink: 0;
        margin-top: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        background: #050a14;
        color: #94a3b8;
        font-size: 0.72rem;
      }

      .footer-sync-row {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .sync-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 6px #10b981;
      }

      .version-tag-pill {
        background: #0e172a;
        color: #64748b;
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 4px;
      }
    `,
  ],
})
export class SidebarComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('componentRef') scrollRef: any;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @Input() isCondensed = false;

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
    router.events.forEach((event) => {
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
    this.buildMenuGroups();
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
            isExpanded: item.subItems && item.subItems.length > 0 ? true : item.isExpanded,
          });
        } else if (matchingSubItems.length > 0) {
          matchingItems.push({
            ...item,
            subItems: matchingSubItems,
            isExpanded: true,
          });
        }
      }

      if (matchingItems.length > 0) {
        filtered.push({
          ...group,
          isOpen: true,
          items: matchingItems,
        });
      }
    }

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

  toggleGroup(group: MenuGroup): void {
    group.isOpen = !group.isOpen;
  }

  toggleSubItem(item: MenuItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    (item as any).isExpanded = !(item as any).isExpanded;
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
      group.isOpen = hasActiveChild;
    });

    this.menuGroups = groups.filter((g) => g.items.length > 0);
    this.applyFilter();
  }

  updateActiveStateFromUrl(): void {
    const currentPath = window.location.pathname;
    this.menuGroups.forEach((group) => {
      const hasActiveChild = group.items.some((item) => {
        if (item.link && currentPath.includes(item.link)) return true;
        return (item.subItems ?? []).some((sub) => sub.link && currentPath.includes(sub.link));
      });
      if (hasActiveChild) {
        group.isOpen = true;
      }
    });
    this.applyFilter();
  }

  _scrollElement() {
    setTimeout(() => {
      const activeEl = document.querySelector(
        '.vertical-menu .nav-link-item-1.active, .vertical-menu .nav-link-item-2.active',
      ) as HTMLElement;
      if (activeEl && this.scrollRef?.SimpleBar) {
        const currentPosition = activeEl.offsetTop;
        if (currentPosition > 400) {
          this.scrollRef.SimpleBar.getScrollElement().scrollTop = Math.max(
            0,
            currentPosition - 80,
          );
        }
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
