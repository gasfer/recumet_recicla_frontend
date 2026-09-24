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
        background: #172033;
        color: #e9eff9;
        font-family: 'Inter', sans-serif;
        padding: 10px 8px 24px;
      }

      :host ::ng-deep .vertical-menu,
      :host ::ng-deep .vertical-menu > ngx-simplebar,
      :host ::ng-deep .vertical-menu .simplebar-content-wrapper,
      :host ::ng-deep .vertical-menu .simplebar-content {
        background: #172033;
        border-top: 0 !important;
        box-shadow: none;
      }

      :host ::ng-deep .side-nav-link-ref,
      :host ::ng-deep .side-nav-group {
        display: flex;
        align-items: center;
        gap: 11px;
        margin: 2px 4px;
        padding: 10px 12px;
        font-size: .875rem;
        color: #c6d2e3;
        border: 1px solid transparent;
        border-radius: 10px;
        transition: background-color .18s ease, color .18s ease, border-color .18s ease;
        position: relative;
      }

      :host ::ng-deep .side-nav-link-ref:hover,
      :host ::ng-deep .side-nav-group:hover {
        background: #22304a;
        border-color: #31425f;
        color: #fff;
      }

      :host ::ng-deep .side-nav-link-ref.active {
        background: linear-gradient(90deg, #007f46, #00a44f);
        border-color: #32bf77;
        color: #fff;
        font-weight: 700;
        box-shadow: 0 6px 16px rgba(0, 164, 79, .22);
      }

      /* Submenús */
      :host ::ng-deep .mm-show {
        display: block !important;
        animation: slideDown 0.3s ease forwards;
      }

      :host ::ng-deep .sub-menu .side-nav-link-ref {
        margin-left: 18px;
        padding-left: 16px;
        font-size: .82rem;
        color: #aebdd1;
      }

      :host ::ng-deep .sub-menu .side-nav-link-ref::after {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #60728f;
        position: absolute;
        left: 2px;
      }

      /* Íconos */
      :host ::ng-deep .side-nav-link-ref i,
      :host ::ng-deep .side-nav-group i {
        margin-right: 0;
        font-size: 1rem;
        color: #81a0c5;
        transition: color .18s ease;
      }

      :host ::ng-deep .side-nav-link-ref:hover i,
      :host ::ng-deep .side-nav-group:hover i,
      :host ::ng-deep .side-nav-link-ref.active i { color: #fff; }

      :host ::ng-deep .side-nav-link-ref:focus-visible,
      :host ::ng-deep .side-nav-group:focus-visible {
        outline: 3px solid rgba(92, 214, 143, .65);
        outline-offset: 2px;
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
        display: none;
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
