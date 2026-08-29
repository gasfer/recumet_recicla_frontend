import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MenuItem } from './menu.model';
import { EventService } from 'src/app/core/services/event.service';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import MetisMenu from 'metismenujs';
import { ValidatorsService } from '../../services/validators.service';
import Swal from 'sweetalert2';
import { MENU } from './menu';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styles: [
    `
      /* Sidebar principal */
      :host ::ng-deep #side-menu {
        background-color: #32374b; /* Gris oscuro moderno */
        color: #f9fafb;
        font-family: 'Inter', sans-serif;
      }

      /* Ítems del menú */
      :host ::ng-deep .side-nav-link-ref {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        font-size: 0.95rem;
        color: #f9fafb;
        border-radius: 8px;
        transition: all 0.3s ease;
        position: relative;
      }

      /* Hover animado */
      :host ::ng-deep .side-nav-link-ref:hover {
        background: linear-gradient(10deg, #00b04e 0%, #00b04e 100%);
        color: #fff;
        transform: translateX(5px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      /* Ítems activos */
      :host ::ng-deep .side-nav-link-ref.active {
        background: linear-gradient(10deg, #00b04e 0%, #00b04e 100%);
        color: #fff;
        font-weight: 600;
      }

      /* Submenús */
      :host ::ng-deep .mm-show {
        display: block !important;
        animation: slideDown 0.3s ease forwards;
      }

      :host ::ng-deep .sub-menu .side-nav-link-ref {
        padding-left: 40px;
        font-size: 0.9rem;
        color: #e5e7eb;
      }

      /* Íconos */
      :host ::ng-deep .side-nav-link-ref i {
        margin-right: 12px;
        font-size: 1.2rem;
        transition:
          transform 0.3s ease,
          color 0.3s ease;
      }

      :host ::ng-deep .side-nav-link-ref:hover i {
        transform: rotate(15deg);
        color: #fff;
      }

      /* Animación del submenú */
      @keyframes slideDown {
        0% {
          opacity: 0;
          transform: translateY(-10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Indicador de nivel */
      :host ::ng-deep .side-nav-link-ref::before {
        content: '';
        position: absolute;
        left: 0;
        width: 4px;
        height: 100%;
        background-color: transparent;
        border-radius: 2px;
        transition: background-color 0.3s ease;
      }

      :host ::ng-deep .side-nav-link-ref.active::before {
        background: linear-gradient(10deg, #00b04e 0%, #00b04e 100%);
      }
    `,
  ],
})
export class SidebarComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('componentRef') scrollRef: any;
  @Input() isCondensed = false;
  menu: any;
  data: any;
  private readonly menuDefinition = MENU;
  menuItems: MenuItem[] = [];

  @ViewChild('sideMenu') sideMenu?: ElementRef;

  constructor(
    private eventService: EventService,
    private router: Router,
    public translate: TranslateService,
    public validatorsService: ValidatorsService,
  ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this._activateMenuDropdown();
        this._scrollElement();
      }
    });
  }

  ngOnInit() {
    this.initialize();
    this._scrollElement();
  }

  ngAfterViewInit() {
    this.menu = new MetisMenu(this.sideMenu!.nativeElement);
    this._activateMenuDropdown();
  }

  toggleMenu(event: any) {
    event.currentTarget.nextElementSibling.classList.toggle('mm-show');
  }

  ngOnChanges() {
    if ((!this.isCondensed && this.sideMenu) || this.isCondensed) {
      setTimeout(() => {
        this.menu = new MetisMenu(this.sideMenu!.nativeElement);
      });
    } else if (this.menu) {
      this.menu.dispose();
    }
  }
  _scrollElement() {
    setTimeout(() => {
      if (document.getElementsByClassName('mm-active').length > 0) {
        let currentPosition: any =
          document.getElementsByClassName('mm-active')[0];
        currentPosition = currentPosition['offsetTop'];
        if (currentPosition > 500)
          if (this.scrollRef.SimpleBar !== null)
            this.scrollRef.SimpleBar.getScrollElement().scrollTop =
              currentPosition + 300;
      }
    }, 300);
  }

  /**
   * remove active and mm-active class
   */
  _removeAllClass(className: any) {
    const els = document.getElementsByClassName(className);
    while (els[0]) {
      els[0].classList.remove(className);
    }
  }

  /**
   * Activate the parent dropdown
   */
  _activateMenuDropdown() {
    this._removeAllClass('mm-active');
    this._removeAllClass('active');
    this._removeAllClass('mm-show');
    const links = document.getElementsByClassName('side-nav-link-ref');
    let menuItemEl = null;
    // tslint:disable-next-line: prefer-for-of
    const paths = [];
    for (let i = 0; i < links.length; i++) {
      let link: any = links[i];
      paths.push(link['pathname']);
    }
    var itemIndex = paths.indexOf(window.location.pathname);
    if (itemIndex === -1) {
      const strIndex = window.location.pathname.lastIndexOf('/');
      const item = window.location.pathname.substr(0, strIndex).toString();
      menuItemEl = links[paths.indexOf(item)];
    } else {
      menuItemEl = links[itemIndex];
    }
    if (menuItemEl) {
      menuItemEl.classList.add('active');
      const parentEl: any = menuItemEl.parentElement;
      if (parentEl) {
        parentEl.classList.add('mm-active');
        const parent2El = parentEl.parentElement.closest('ul');
        if (parent2El && parent2El.id !== 'side-menu') {
          parent2El.classList.add('mm-show');
          const parent3El = parent2El.parentElement;
          if (parent3El && parent3El.id !== 'side-menu') {
            parent3El.classList.add('mm-active');
            const childAnchor = parent3El.querySelector('.has-arrow');
            const childDropdown = parent3El.querySelector('.has-dropdown');
            if (childAnchor) {
              childAnchor.classList.add('mm-active');
            }
            if (childDropdown) {
              childDropdown.classList.add('mm-active');
            }
            const parent4El = parent3El.parentElement;
            if (parent4El && parent4El.id !== 'side-menu') {
              parent4El.classList.add('mm-show');
              const parent5El = parent4El.parentElement;
              if (parent5El && parent5El.id !== 'side-menu') {
                parent5El.classList.add('mm-active');
                const childanchor = parent5El.querySelector('.is-parent');
                if (childanchor && parent5El.id !== 'side-menu') {
                  childanchor.classList.add('mm-active');
                }
              }
            }
          }
        }
      }
    }
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
      return;
    }
    this.menuItems = this.cloneMenuDefinition();
    if (isAdmin) return;

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
  }

  private cloneMenuDefinition(): MenuItem[] {
    return this.menuDefinition.map((item) => ({
      ...item,
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
  }

  checkBooleanArray(array: boolean[]): boolean {
    // Verificar si al menos hay un verdadero (true) en el arreglo
    const atLeastOneTrue = array.some((value) => value === true);
    return atLeastOneTrue;
  }
  /**
   * Returns true or false if given menu item has child or not
   * @param item menuItem
   */
  hasItems(item: MenuItem) {
    return item.subItems !== undefined ? item.subItems.length > 0 : false;
  }

}
