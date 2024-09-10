import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from './menu.model';
import { EventService } from 'src/app/core/services/event.service';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import MetisMenu from 'metismenujs';
import { ValidatorsService } from '../../services/validators.service';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/auth/auth.service';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styles: [
  ]
})
export class SidebarComponent implements OnInit, AfterViewInit, OnChanges{
  @ViewChild('componentRef') scrollRef : any;
  @Input() isCondensed = false;
  menu: any;
  data: any;
  MENU : MenuItem[] = [
      {
          id: 1,
          label: 'MENUITEMS.DASHBOARDS.TEXT',
          isTitle: true
      },
      {
          id: 2,
          label: 'MENUITEMS.DASHBOARDS.TEXT',
          icon: 'fa-solid fa-chart-simple',
          link: '/dashboard/home',
      },
      {
          id: 6,
          isLayout: true
      },
      {
          id: 7,
          name: 'ENTRADAS_TITULO',
          label: 'MENUITEMS.ENTRADAS.TEXT',
          isTitle: true
      },
      {
          id: 8,
          name: 'ENTRADAS',
          label: 'MENUITEMS.COMPRAS.TEXT',
          icon: 'fa-solid fa-truck',
          subItems: [
              {
                  id: 9,
                  name: 'PROVEEDORES',
                  action: 'view',
                  label: 'MENUITEMS.ENTRADAS.LIST.PROVEEDORES',
                  link: '/inputs/providers',
              },
              {
                  id: 10,
                  name: 'COMPRAS',
                  action: 'create',
                  label: 'MENUITEMS.ENTRADAS.LIST.REALIZARCOMPRAS',
                  link: '/inputs/input-small',
              },
              {
                  id: 11,
                  name: 'COMPRAS',
                  action: 'view',
                  label: 'MENUITEMS.ENTRADAS.LIST.CONSULTARCOMPRAS',
                  link: '/inputs/query-inputs',
              }
          ]
      },
      {
          id: 9,
          name: 'ENTRADAS',
          label: 'MENUITEMS.CLASIFICADOS.TEXT',
          icon: 'fa-solid fa-boxes-packing',
          subItems: [
              {
                  id: 10,
                  name: 'CLASIFICADOS',
                  action: 'create',
                  label: 'MENUITEMS.CLASIFICADOS.LIST.REALIZARCLASIFICADOS',
                  link: '/classifieds/classified',
              },
              {
                  id: 11,
                  name: 'CLASIFICADOS',
                  action: 'view',
                  label: 'MENUITEMS.CLASIFICADOS.LIST.CONSULTARCLASIFICADOS',
                  link: '/classifieds/query-classifieds',
              }
          ]
      },
      {
          id: 13,
          name: 'SALIDAS_TITULO',
          label: 'MENUITEMS.SALIDAS.TEXT',
          isTitle: true
      },
      {
          id: 14,
          name: 'SALIDAS',
          label: 'MENUITEMS.VENTAS.TEXT',
          icon: 'fa-solid fa-cart-plus',
          subItems: [
              {
                  id: 15,
                  name: 'CLIENTES',
                  action: 'view',
                  label: 'MENUITEMS.SALIDAS.LIST.CLIENTES',
                  icon: 'bx-calendar',
                  link: '/outputs/clients',
              },
              {
                  id: 16,
                  name: 'VENTAS',
                  action: 'create',
                  label: 'MENUITEMS.SALIDAS.LIST.REALIZARVENTAS',
                  icon: 'bx-calendar',
                  link: '/outputs/output',
              },
              {
                  id: 17,
                  name: 'VENTAS',
                  action: 'view',
                  label: 'MENUITEMS.SALIDAS.LIST.CONSULTARVENTAS',
                  icon: 'bx-chat',
                  link: '/outputs/query-outputs',
              }
          ]
      },
      {
          id: 15,
          name: 'SALIDAS',
          label: 'MENUITEMS.TRASLADOS.TEXT',
          icon: 'fa-solid fa-truck-ramp-box',
          subItems: [
              {
                  id: 15,
                  name: 'TRASLADOS',
                  action: 'create',
                  label: 'MENUITEMS.TRASLADOS.LIST.REALIZARTRASLADOS',
                  icon: 'bx-calendar',
                  link: '/transfers/transfer',
              },
              {
                  id: 16,
                  name: 'TRASLADOS',
                  action: 'view',
                  label: 'MENUITEMS.TRASLADOS.LIST.CONSULTARTRASLADOS',
                  icon: 'bx-calendar',
                  link: '/transfers/query-transfers',
              },
              {
                  id: 17,
                  name: 'RECEPCIONES',
                  action: 'view',
                  label: 'MENUITEMS.TRASLADOS.LIST.CONSULTARRECEPCIONES',
                  icon: 'bx-chat',
                  link: '/transfers/query-receptions',
              }
          ]
      },
      {
          id: 19,
          name: 'CAJA_TITULO',
          label: 'MENUITEMS.ADMCAJA.TEXT',
          isTitle: true
      },
      {
          id: 20,
          name: 'CAJA',
          label: 'MENUITEMS.CAJA.TEXT',
          icon: 'fa-solid fa-vault',
          subItems: [
              {
                  id: 21,
                  name: 'CAJA',
                  action: 'create',
                  label: 'MENUITEMS.CAJA.LIST.ADMCAJA',
                  icon: 'bx-calendar',
                  link: '/caja/adm-caja',
              },
              {
                  id: 22,
                  name: 'CAJA',
                  action: 'view',
                  label: 'MENUITEMS.CAJA.LIST.COSULTARCAJA',
                  icon: 'bx-calendar',
                  link: '/caja/query-caja',
              }
          ]
      },
      {
          id: 23,
          name: 'CAJA',
          label: 'MENUITEMS.CUENTAS.TEXT',
          icon: 'fa-solid fa-comments-dollar',
          subItems: [
              {
                  id: 24,
                  name: 'CUENTAS POR PAGAR',
                  action: 'view',
                  label: 'MENUITEMS.CUENTAS.LIST.CUENTASPORPAGAR',
                  icon: 'bx-chat',
                  link: '/accounts/accounts-payable',
              },
              {
                  id: 25,
                  name: 'CUENTAS POR COBRAR',
                  action: 'view',
                  label: 'MENUITEMS.CUENTAS.LIST.CUENTASPORCOBRAR',
                  icon: 'bx-chat',
                  link: '/accounts/accounts-receivable',
              }
          ]
      },
      {
          id: 26,
          name: 'KARDEX',
          action: 'view',
          label: 'MENUITEMS.INVENTARIO.TEXT',
          isTitle: true
      },
      {
        id: 27,
        name: 'KARDEX',
        label: 'MENUITEMS.KARDEX.TEXT',
        icon: 'fa-solid fa-boxes-stacked',
        subItems: [
            {
              id: 28,
              name: 'KARDEX FÍSICO',
              action: 'view',
              label: 'MENUITEMS.KARDEXFISICO.TEXT',
              link: '/inventories/kardex-fisico',
            },
            {
              id: 30,
              name: 'KARDEX HISTÓRICO',
              action: 'view',
              label: 'MENUITEMS.KARDEXHISTORICO.TEXT',
              link: '/inventories/kardex',
            },
        ]
      },
     
      {
          id: 26,
          name: 'ADMINISTRACION_TITULO',
          label: 'MENUITEMS.ADMINISTRACION.TEXT',
          isTitle: true
      },
      {
          id: 27,
          name: 'ADMINISTRACION',
          label: 'MENUITEMS.ALMACEN.TEXT',
          icon: 'fa-solid fa-warehouse',
          subItems: [
              {
                  id: 30,
                  name: 'UND MEDIDA',
                  action: 'view',
                  label: 'MENUITEMS.ALMACEN.LIST.UNIDADMEDIDA',
                  link: '/inventories/units',
                  parentId: 92
              },
              {
                  id: 31,
                  name: 'BALANZAS',
                  action: 'view',
                  label: 'MENUITEMS.ALMACEN.LIST.BALANZAS',
                  link: '/inventories/scales',
                  parentId: 92
              },
              {
                  id: 29,
                  name: 'CATEGORIAS',
                  action: 'view',
                  label: 'MENUITEMS.ALMACEN.LIST.CATEGORIAS',
                  link: '/inventories/categories',
                  parentId: 92
              },
              {
                  id: 28,
                  name: 'PRODUCTOS',
                  action: 'view',
                  label: 'MENUITEMS.ALMACEN.LIST.PRODUCTOS',
                  link: '/inventories/products',
                  parentId: 92
              },
          ]
      },
      {
          id: 32,
          name: 'ADMINISTRACION',
          label: 'MENUITEMS.GESTION.TEXT',
          icon: 'fa-solid fa-gears',
          subItems: [
              {
                  id: 33,
                  name: 'USUARIOS',
                  action: 'view',
                  label: 'MENUITEMS.GESTION.LIST.USUARIOS',
                  link: '/managements/users',
                  parentId: 92
              },
              {
                  id: 34,
                  name: 'EMPRESA',
                  action: 'view',
                  label: 'MENUITEMS.GESTION.LIST.EMPRESA',
                  link: '/managements/company',
                  parentId: 92
              },
              {
                  id: 35,
                  name: 'SUCURSALES',
                  action: 'view',
                  label: 'MENUITEMS.GESTION.LIST.SUCURSALES',
                  link: '/managements/sucursales',
                  parentId: 92
              },
              {
                  id: 36,
                  name: 'ALMACENES',
                  action: 'view',
                  label: 'MENUITEMS.GESTION.LIST.ALMACENES',
                  link: '/managements/storages',
                  parentId: 92
              },
              {
                  id: 37,
                  name: 'COMP. TRASPORTE',
                  action: 'view',
                  label: 'MENUITEMS.GESTION.LIST.TRASPORTES',
                  link: '/managements/trasport_company',
                  parentId: 92
              },
          ]
      },
  ];
  menuItems : MenuItem[] = [];

  @ViewChild('sideMenu') sideMenu?: ElementRef;
  authService = inject(AuthService);

  constructor(private eventService: EventService, private router: Router, public translate: TranslateService, public validatorsService:ValidatorsService) {
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

  toggleMenu(event:any) {
    event.currentTarget.nextElementSibling.classList.toggle('mm-show');
  }

  ngOnChanges() {
    if (!this.isCondensed && this.sideMenu || this.isCondensed) {
      setTimeout(() => {
        this.menu = new MetisMenu(this.sideMenu!.nativeElement);
      });
    } else if (this.menu) {
      this.menu.dispose();
    }
  }
  _scrollElement() {
    setTimeout(() => {
      if (document.getElementsByClassName("mm-active").length > 0) {
        let currentPosition:any = document.getElementsByClassName("mm-active")[0];
        currentPosition = currentPosition['offsetTop'];
        if (currentPosition > 500)
        if(this.scrollRef.SimpleBar !== null)
          this.scrollRef.SimpleBar.getScrollElement().scrollTop =
            currentPosition + 300;
      }
    }, 300);
  }

  /**
   * remove active and mm-active class
   */
  _removeAllClass(className:any) {
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
      let link :any= links[i];
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
      const parentEl:any = menuItemEl.parentElement;
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
            if (childAnchor) { childAnchor.classList.add('mm-active'); }
            if (childDropdown) { childDropdown.classList.add('mm-active'); }
            const parent4El = parent3El.parentElement;
            if (parent4El && parent4El.id !== 'side-menu') {
              parent4El.classList.add('mm-show');
              const parent5El = parent4El.parentElement;
              if (parent5El && parent5El.id !== 'side-menu') {
                parent5El.classList.add('mm-active');
                const childanchor = parent5El.querySelector('.is-parent');
                if (childanchor && parent5El.id !== 'side-menu') { childanchor.classList.add('mm-active'); }
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
    if(!this.validatorsService.validateUserWithPermissions() && !isAdmin) {
      Swal.fire({ 
        title: 'Ops! No tienes permisos asignados', 
        text: `Indica al administrador que se te asigne`,
        icon: 'warning', 
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      }).then(() => this.authService.logout());
      return;
    };
    this.menuItems = [...this.MENU];
    if(isAdmin) return;


    //**Select si tiene permisos por modulo view | true | false */
    this.menuItems.forEach((item) => {
      if(item.name && item.action){
        item.view =  this.validatorsService.withPermission(item.name, item.action)
      } else {
        item.view = true;
      }
      item?.subItems?.forEach((subItem:any) => {
        if(subItem.name && subItem.action){
          subItem.view =  this.validatorsService.withPermission(subItem.name, subItem.action)
        } else {
          subItem.view = true;
        }  
      });
    });

    //**los que no tienen permiso estan falso entonces lo filtramos */
    this.menuItems?.forEach(item => {
      if(item?.subItems){
        item!.subItems = item?.subItems.filter((item:any) =>  item.view);
      }
    });

    //**filtramos los titulos que no tengan hijos o submenus */
    ['ENTRADAS','SALIDAS','CAJA','INVENTARIO','ADMINISTRACION'].forEach(item => {
      this.filterTitle(item);
    })
    this.menuItems = this.menuItems.filter(item =>  item.view);
  }

  filterTitle(name:string){ 
    const salidas = this.menuItems.filter(resp => resp.name === name);
    const is_min_true = salidas.map(resp => resp.subItems.length > 0 ).some(resp => resp === true);
    this.menuItems.forEach(resp=> {
      if(resp.isTitle && resp.name === `${name}_TITULO`){
        resp.view = is_min_true;
      }
    });
  }

  checkBooleanArray(array: boolean[]): boolean {
    // Verificar si al menos hay un verdadero (true) en el arreglo
    const atLeastOneTrue = array.some(value => value === true);
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
