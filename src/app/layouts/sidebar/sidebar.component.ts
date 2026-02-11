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
import { AuthService } from 'src/app/auth/auth.service';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styles: [
    `

    /* Sidebar principal */
    :host ::ng-deep #side-menu {
      background-color: #32374B; /* Gris oscuro moderno */
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
      background: linear-gradient(10deg, #00B04E 0%, #00B04E 100%);
      color: #fff;
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    /* Ítems activos */
    :host ::ng-deep .side-nav-link-ref.active {
      background: linear-gradient(10deg, #00B04E 0%, #00B04E 100%);
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
      transition: transform 0.3s ease, color 0.3s ease;
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
      background: linear-gradient(10deg, #00B04E 0%, #00B04E 100%);
    }
    `
  ]
})

export class SidebarComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('componentRef') scrollRef: any;
  @Input() isCondensed = false;
  menu: any;
  data: any;
MENU: MenuItem[] = [
  // 🚀 DASHBOARD
  {
    id: 1,
    label: 'MENUITEMS.DASHBOARDS.TEXT',
    isTitle: true,
  },
  {
    id: 2,
    label: 'MENUITEMS.DASHBOARDS.TEXT',
    icon: 'fa-solid fa-chart-simple',
    link: '/dashboard/home',
  },
/*
  // ⚖️ BALANZA
  {
    id: 50,
    name: 'BALANZA_TITULO',
    label: 'MENUITEMS.BALANZA.TEXT',
    isTitle: true,
  },
  {
    id: 51,
    name: 'BALANZA',
    label: 'MENUITEMS.BALANZA.TEXT',
    icon: 'fa-solid fa-balance-scale',
    subItems: [
      // BALANZA CAMIONERA
      {
        id: 52,
        name: 'BALANZA CAMIONERA',
        label: 'MENUITEMS.BALANZA.CAMIONERA.TEXT',
        icon: 'fa-solid fa-truck-fast',
        subItems: [
          {
            id: 53,
            name: 'REGISTRAR PESАJE CAMIONERA',
            action: 'create',
            label: 'MENUITEMS.BALANZA.CAMIONERA.REGISTRAR',
            link: '/scale/truck-scale/register',
            icon: 'fa-solid fa-plus-circle',
          },
          {
            id: 54,
            name: 'CONSULTAR PESАJES CAMIONERA',
            action: 'view',
            label: 'MENUITEMS.BALANZA.CAMIONERA.CONSULTAR',
            link: '/scale/truck-scale/query',
            icon: 'fa-solid fa-search',
          },
        ],
      },
      // BALANZA MANUAL
      {
        id: 55,
        name: 'BALANZA MANUAL',
        label: 'MENUITEMS.BALANZA.MANUAL.TEXT',
        icon: 'fa-solid fa-weight-scale',
        subItems: [
          {
            id: 56,
            name: 'REGISTRAR PESАJE MANUAL',
            action: 'create',
            label: 'MENUITEMS.BALANZA.MANUAL.REGISTRAR',
            link: '/scale/manual-scale/register',
            icon: 'fa-solid fa-clipboard-list',
          },
          {
            id: 57,
            name: 'CONSULTAR PESАJES MANUALES',
            action: 'view',
            label: 'MENUITEMS.BALANZA.MANUAL.CONSULTAR',
            link: '/scale/manual-scale/query',
            icon: 'fa-solid fa-chart-line',
          },
        ],
      },
      // SERVICIO DE BALANZA
      {
        id: 58,
        name: 'SERVICIO DE BALANZA',
        label: 'MENUITEMS.BALANZA.SERVICIO.TEXT',
        icon: 'fa-solid fa-calculator',
        subItems: [
          {
            id: 59,
            name: 'REGISTRAR SERVICIO',
            action: 'create',
            label: 'MENUITEMS.BALANZA.SERVICIO.REGISTRAR',
            link: '/scale/service/register',
            icon: 'fa-solid fa-circle-plus',
          },
          {
            id: 60,
            name: 'CONSULTAR SERVICIOS DE PESАJE',
            action: 'view',
            label: 'MENUITEMS.BALANZA.SERVICIO.CONSULTAR',
            link: '/scale/service/query',
            icon: 'fa-solid fa-list-check',
          },
        ],
      },
      // TRANSPORTISTAS
      {
        id: 61,
        name: 'TRANSPORTISTAS',
        label: 'MENUITEMS.BALANZA.TRANSPORTISTAS.TEXT',
        icon: 'fa-solid fa-user-tie',
        subItems: [
          {
            id: 62,
            name: 'REGISTRAR TRANSPORTISTA',
            action: 'create',
            label: 'MENUITEMS.BALANZA.TRANSPORTISTAS.REGISTRAR',
            link: '/scale/drivers/register',
            icon: 'fa-solid fa-user-plus',
          },
          {
            id: 63,
            name: 'CONSULTAR TRANSPORTISTAS',
            action: 'view',
            label: 'MENUITEMS.BALANZA.TRANSPORTISTAS.CONSULTAR',
            link: '/scale/drivers/query',
            icon: 'fa-solid fa-users-viewfinder',
          },
        ],
      },
      // CAMIONES
      {
        id: 64,
        name: 'CAMIONES',
        label: 'MENUITEMS.BALANZA.CAMIONES.TEXT',
        icon: 'fa-solid fa-truck-pickup',
        subItems: [
          {
            id: 65,
            name: 'REGISTRAR CAMIÓN',
            action: 'create',
            label: 'MENUITEMS.BALANZA.CAMIONES.REGISTRAR',
            link: '/scale/trucks/register',
            icon: 'fa-solid fa-plus-square',
          },
          {
            id: 66,
            name: 'CONSULTAR CAMIONES',
            action: 'view',
            label: 'MENUITEMS.BALANZA.CAMIONES.CONSULTAR',
            link: '/scale/trucks/query',
            icon: 'fa-solid fa-list-ul',
          },
        ],
      },
    ],
  },
*/
  // 🟢 ENTRADAS
  {
    id: 100,
    name: 'ENTRADAS_TITULO',
    label: 'MENUITEMS.ENTRADAS.TEXT',
    isTitle: true,
  },
  {
    id: 101,
    name: 'ENTRADAS',
    label: 'MENUITEMS.COMPRAS.TEXT',
    icon: 'fa-solid fa-truck',
    subItems: [
          {
        id: 151,
        name: 'PROVEEDORES',
        action: 'view',
        label: 'MENUITEMS.ENTRADAS.LIST.PROVEEDORES',
        link: '/inputs/providers',
      },
      {
        id: 102,
        name: 'COMPRAS',
        action: 'create',
        label: 'MENUITEMS.ENTRADAS.LIST.REALIZARCOMPRAS',
        link: '/inputs/input-small',
      },
      {
        id: 103,
        name: 'COMPRAS',
        action: 'view',
        label: 'MENUITEMS.ENTRADAS.LIST.CONSULTARCOMPRAS',
        link: '/inputs/query-inputs',
      },
    ],
  },
  {
    id: 150,
    name: 'PROVEEDORES',
    label: 'MENUITEMS.PROVEEDORES.TEXT',
    icon: 'fa-solid fa-users',
    subItems: [
      {
        id: 151,
        name: 'PROVEEDORE',
        action: 'view',
        label: 'MENUITEMS.ENTRADAS.LIST.PROVEEDORES',
        link: '/inputs/providers',
      },
      {
        id: 152,
        name: 'RECOJO',
        action: 'create',
        label: 'MENUITEMS.PROVEEDORES.LIST.AGENDAR',
        link: '/providers/schedule-pickup',
      },
      {
        id: 153,
        name: 'CERTIFICAR',
        action: 'validate',
        label: 'MENUITEMS.PROVEEDORES.LIST.CERTIFICAR',
        link: '/providers/certify',
      },
      {
        id: 154,
        name: 'CUENTAS',
        action: 'view',
        label: 'MENUITEMS.PROVEEDORES.LIST.CUENTAS',
        link: '/providers/accounts',
      },
      {
        id: 155,
        name: 'COMPRAS proveedor',
        action: 'view',
        label: 'MENUITEMS.PROVEEDORES.LIST.COMPRAS',
        link: '/providers/purchases',
      },
    ],
  },
  {
    id: 200,
    name: 'ENTRADAS',
    label: 'MENUITEMS.CLASIFICADOS.TEXT',
    icon: 'fa-solid fa-boxes-packing',
    subItems: [
      {
        id: 201,
        name: 'CLASIFICADOS',
        action: 'create',
        label: 'MENUITEMS.CLASIFICADOS.LIST.REALIZARCLASIFICADOS',
        link: '/classifieds/classified',
      },
      {
        id: 202,
        name: 'CLASIFICADOS',
        action: 'view',
        label: 'MENUITEMS.CLASIFICADOS.LIST.CONSULTARCLASIFICADOS',
        link: '/classifieds/query-classifieds',
      },
    ],
  },

  // 🟡 SALIDAS
  {
    id: 250,
    name: 'SALIDAS_TITULO',
    label: 'MENUITEMS.SALIDAS.TEXT',
    isTitle: true,
  },
  {
    id: 251,
    name: 'SALIDAS',
    label: 'MENUITEMS.VENTAS.TEXT',
    icon: 'fa-solid fa-cart-plus',
    subItems: [
      {
        id: 252,
        name: 'CLIENTES',
        action: 'view',
        label: 'MENUITEMS.SALIDAS.LIST.CLIENTES',
        icon: 'bx-calendar',
        link: '/outputs/clients',
      },
      {
        id: 253,
        name: 'VENTAS',
        action: 'create',
        label: 'MENUITEMS.SALIDAS.LIST.REALIZARVENTAS',
        icon: 'bx-calendar',
        link: '/outputs/output',
      },
      {
        id: 254,
        name: 'VENTAS',
        action: 'view',
        label: 'MENUITEMS.SALIDAS.LIST.CONSULTARVENTAS',
        icon: 'bx-chat',
        link: '/outputs/query-outputs',
      },
    ],
  },
  {
    id: 255,
    name: 'SALIDAS',
    label: 'MENUITEMS.TRASLADOS.TEXT',
    icon: 'fa-solid fa-truck-ramp-box',
    subItems: [
      {
        id: 256,
        name: 'TRASLADOS',
        action: 'create',
        label: 'MENUITEMS.TRASLADOS.LIST.REALIZARTRASLADOS',
        icon: 'bx-calendar',
        link: '/transfers/transfer',
      },
      {
        id: 257,
        name: 'TRASLADOS',
        action: 'view',
        label: 'MENUITEMS.TRASLADOS.LIST.CONSULTARTRASLADOS',
        icon: 'bx-calendar',
        link: '/transfers/query-transfers',
      },
      {
        id: 258,
        name: 'RECEPCIONES',
        action: 'view',
        label: 'MENUITEMS.TRASLADOS.LIST.CONSULTARRECEPCIONES',
        icon: 'bx-chat',
        link: '/transfers/query-receptions',
      },
    ],
  },

  // 🟠 CAJA
  {
    id: 300,
    name: 'CAJA_TITULO',
    label: 'MENUITEMS.ADMCAJA.TEXT',
    isTitle: true,
  },
  {
    id: 301,
    name: 'CAJA',
    label: 'MENUITEMS.CAJA.TEXT',
    icon: 'fa-solid fa-vault',
    subItems: [
      {
        id: 302,
        name: 'CAJA',
        action: 'create',
        label: 'MENUITEMS.CAJA.LIST.ADMCAJA',
        icon: 'bx-calendar',
        link: '/caja/adm-caja',
      },
      {
        id: 303,
        name: 'CAJA',
        action: 'view',
        label: 'MENUITEMS.CAJA.LIST.COSULTARCAJA',
        icon: 'bx-calendar',
        link: '/caja/query-caja',
      },
    ],
  },
  {
    id: 304,
    name: 'CUENTAS',
    label: 'MENUITEMS.CUENTAS.TEXT',
    icon: 'fa-solid fa-comments-dollar',
    subItems: [
      {
        id: 305,
        name: 'CUENTAS POR PAGAR',
        action: 'view',
        label: 'MENUITEMS.CUENTAS.LIST.CUENTASPORPAGAR',
        icon: 'bx-chat',
        link: '/accounts/accounts-payable',
      },
      {
        id: 306,
        name: 'CUENTAS POR COBRAR',
        action: 'view',
        label: 'MENUITEMS.CUENTAS.LIST.CUENTASPORCOBRAR',
        icon: 'bx-chat',
        link: '/accounts/accounts-receivable',
      },
    ],
  },

// 📦 INVENTARIO
{
  id: 350,
  name: 'INVENTARIO',
  action: 'view',
  label: 'MENUITEMS.INVENTARIO.TEXT',
  isTitle: true,
},
{
  id: 351,
  name: 'ACTIVOFIJO',
  label: 'Inv. activo Fijo',
  icon: 'fa-solid fa-boxes-stacked',
  subItems: [
    {
      id: 352,
      name: 'INSUMOS',
      action: 'view',
      label: 'Insumos y Consumibles',
      link: '/inventories/insumos',
    },
    {
      id: 353,
      name: 'AF-MAQ',
      action: 'view',
      label: 'AF Maquinaria',
      link: '/inventories/activos-fijos-maquinaria',
    },
    {
      id: 354,
      name: 'AF-VEH',
      action: 'view',
      label: 'AF Vehículos',
      link: '/inventories/activos-fijos-vehiculos',
    },
    {
      id: 355,
      name: 'AF-MOB',
      action: 'view',
      label: 'AF Muebles y Oficina',
      link: '/inventories/activos-fijos-muebles-oficina',
    },
  ],
},

// 📊 KARDEX
{
  id: 356,
  name: 'KARDEX',
  label: 'MENUITEMS.INVENTARIO.TEXT',
  icon: 'fa-solid fa-warehouse',
  subItems: [
     {
      id: 357,
      name: 'KARDEX-FIS',
      action: 'view',
      label: '(MP)Materia Prima',
      link: '/inventories/kardex-fisico',
    },
    {
      id: 359,
      name: 'KARDEX-PT',
      action: 'view',
      label: '(PT)Productos Terminados',
      link: '/inventories/kardex-fisico',
    },

  ],
},

  // todo aplicar aqui esta estructura pero se debe crear los componentes para cada vista
  // {
  //   path: 'kardex-fisico/mp',
  //   component: KardexFisicoComponent,
  //   data: {
  //     categoryIds: [1, 2, 5, 13, 8, 6, 7],
  //     title: '(MP) Materia Prima'
  //   }
  // },
  // {
  //   path: 'kardex-fisico/pt',
  //   component: KardexFisicoComponent,
  //   data: {
  //     categoryIds: [4],
  //     title: '(PT) Productos Terminados'
  //   }
  // },
  // {
  //   path: 'kardex-fisico/all',
  //   component: KardexFisicoComponent,
  //   data: {
  //     categoryIds: [],
  //     title: 'Todos los Productos'
  //   }
  // },
  // {
  //   path: 'kardex-fisico/ar',
  //   component: KardexFisicoComponent,
  //   data: {
  //     categoryIds: [14],
  //     title: '(AR) Artículos de Reventa'
  //   }
  // },



  // 🟣 ADMINISTRACIÓN
  {
    id: 400,
    name: 'ADMINISTRACION_TITULO',
    label: 'MENUITEMS.ADMINISTRACION.TEXT',
    isTitle: true,
  },
  {
    id: 401,
    name: 'ADMINISTRACION',
    label: 'MENUITEMS.ALMACEN.TEXT',
    icon: 'fa-solid fa-warehouse',
    subItems: [
      {
        id: 402,
        name: 'UND MEDIDA',
        action: 'view',
        label: 'MENUITEMS.ALMACEN.LIST.UNIDADMEDIDA',
        link: '/inventories/units',
      },
      {
        id: 403,
        name: 'BALANZAS',
        action: 'view',
        label: 'MENUITEMS.ALMACEN.LIST.BALANZAS',
        link: '/inventories/scales',
      },
      {
        id: 404,
        name: 'CATEGORIAS',
        action: 'view',
        label: 'MENUITEMS.ALMACEN.LIST.CATEGORIAS',
        link: '/inventories/categories',
      },
      {
        id: 405,
        name: 'PRODUCTOS',
        action: 'view',
        label: 'MENUITEMS.ALMACEN.LIST.PRODUCTOS',
        link: '/inventories/products',
      },
    ],
  },
  {
    id: 450,
    name: 'ADMINISTRACION',
    label: 'MENUITEMS.GESTION.TEXT',
    icon: 'fa-solid fa-gears',
    subItems: [
      {
        id: 451,
        name: 'USUARIOS',
        action: 'view',
        label: 'MENUITEMS.GESTION.LIST.USUARIOS',
        link: '/managements/users',
      },
      {
        id: 452,
        name: 'EMPRESA',
        action: 'view',
        label: 'MENUITEMS.GESTION.LIST.EMPRESA',
        link: '/managements/company',
      },
      {
        id: 453,
        name: 'SUCURSALES',
        action: 'view',
        label: 'MENUITEMS.GESTION.LIST.SUCURSALES',
        link: '/managements/sucursales',
      },
      {
        id: 454,
        name: 'ALMACENES',
        action: 'view',
        label: 'MENUITEMS.GESTION.LIST.ALMACENES',
        link: '/managements/storages',
      },
      {
        id: 455,
        name: 'COMP. TRASPORTE',
        action: 'view',
        label: 'MENUITEMS.GESTION.LIST.TRASPORTES',
        link: '/managements/trasport_company',
      },
    ],
  },
];

  menuItems: MenuItem[] = [];

  @ViewChild('sideMenu') sideMenu?: ElementRef;
  authService = inject(AuthService);

  constructor(
    private eventService: EventService,
    private router: Router,
    public translate: TranslateService,
    public validatorsService: ValidatorsService
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
        title: 'Ops! No tienes permisos asignados',
        text: `Indica al administrador que se te asigne`,
        icon: 'warning',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert' },
      }).then(() => this.authService.logout());
      return;
    }
    this.menuItems = [...this.MENU];
    if (isAdmin) return;

    //**Select si tiene permisos por modulo view | true | false */
    this.menuItems.forEach((item) => {
      if (item.name && item.action) {
        item.view = this.validatorsService.withPermission(
          item.name,
          item.action
        );
      } else {
        item.view = true;
      }
      item?.subItems?.forEach((subItem: any) => {
        if (subItem.name && subItem.action) {
          subItem.view = this.validatorsService.withPermission(
            subItem.name,
            subItem.action
          );
        } else {
          subItem.view = true;
        }
      });
    });

    //**los que no tienen permiso estan falso entonces lo filtramos */
    this.menuItems?.forEach((item) => {
      if (item?.subItems) {
        item!.subItems = item?.subItems.filter((item: any) => item.view);
      }
    });

    //**filtramos los titulos que no tengan hijos o submenus */
    ['ENTRADAS', 'SALIDAS', 'CAJA', 'INVENTARIO', 'ADMINISTRACION'].forEach(
      (item) => {
        this.filterTitle(item);
      }
    );
    this.menuItems = this.menuItems.filter((item) => item.view);
  }

  filterTitle(name: string) {
    const salidas = this.menuItems.filter((resp) => resp.name === name);
    const is_min_true = salidas
      .map((resp) => resp.subItems.length > 0)
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
