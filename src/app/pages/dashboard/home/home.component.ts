import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { Histories } from '../interfaces/history.interface';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { DashboardService } from '../services/dashboard.service';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  authService       = inject(AuthService);
  dashboardService  = inject(DashboardService);
  validatorsService = inject(ValidatorsService);
  cardsRequest = signal([
    {
      class: 'card r-card', icon: 'fa-solid fa-tags', 
      view: this.validatorsService.withPermission('PRODUCTOS','view'),
      title: 'PRODUCTOS',  linkRedirect: '/inventories/products',
    },
    {
      class: 'card bookp-card', icon: 'fa-solid fa-truck',
      view: this.validatorsService.withPermission('COMPRAS','create'),
      title: 'COMPRAS', linkRedirect: '/inputs/input-small',
    }, { 
      class: 'card revenue-card', icon: 'fa-solid fa-boxes-stacked',
      view: this.validatorsService.withPermission('CLASIFICADOS','create'),
      title: 'CLASIFICADOS', linkRedirect: '/classifieds/classified', 
    },
    {
      class: 'card o-card', icon: 'fa-solid fa-users',
      view: this.validatorsService.withPermission('CLIENTES','view'),
      title: 'CLIENTES', linkRedirect: '/outputs/clients',
    }, 
    {
      class: 'card b-card', icon: 'fa-solid fa-cart-plus',
      view: this.validatorsService.withPermission('VENTAS','create'),
      title: 'VENTAS', linkRedirect: '/outputs/output', 
    },
    {
      class: 'card p-card', icon: 'fa-solid fa-signs-post',
      view: this.validatorsService.withPermission('TRASLADOS','create'),
      title: 'TRASLADOS', linkRedirect: '/transfers/transfer',
    },
    {
      class: 'card o-card', icon: 'fa-solid fa-cash-register',
      view: this.validatorsService.withPermission('CAJA','view'),
      title: 'CAJA', linkRedirect: '/caja/adm-caja',
    },
    {
      class: 'card p-card', icon: 'fas fa-clipboard-list',
      view: this.validatorsService.withPermission('KARDEX','view'),
      title: 'KARDEX', linkRedirect: '/inventories/kardex',
    }, 
    
  ]);
  cardsRequestPermission = computed(()=>this.cardsRequest().filter(resp => resp.view == true))
  cols         = signal<ColsTable[]>([
    { field: 'createdAt', header: 'FECHA' , style:'min-width:120px;max-width:120px;', tooltip: true, isDate: true},
    { field: `description`, header: 'DETALLE' , style:'min-width:150px;max-width:400px;', tooltip: true, isText:true  },
    { field: `type`, header: 'TIPO' , style:'min-width:150px;max-width:300px;', tooltip: true  },
    { field: `user.full_names`, header: 'USUARIO' , style:'min-width:150px;max-width:300px;', tooltip: true  },
  ]);
  histories    = signal<Histories|undefined>(undefined);
  loading      = signal(false);

  ngOnInit(): void {
    const id_user = this.authService.getUser.role == 'ADMINISTRADOR' ? '' : this.authService.getUser.id!.toString();
    this.loading.set(true);
    this.dashboardService.getAll(1,5000,this.validatorsService.id_sucursal(),id_user).subscribe({
      next: (resp) => {
        this.loading.set(false);
        this.histories.set(resp.histories);
      }, 
      error: () => this.loading.set(false)
    });
  }
}
