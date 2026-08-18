import { DOCUMENT } from '@angular/common';
import { Component, EventEmitter, Inject, OnInit, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { AuthService } from 'src/app/auth/auth.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { FormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styles: [`
    .work-context { align-items: end; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: .65rem; gap: .55rem; margin: .6rem 0 .6rem .75rem; padding: .35rem .55rem; }
    .work-context__field { display: grid; gap: .2rem; }
    .work-context__field label { color: #64748b; font-size: .66rem; font-weight: 700; line-height: 1; text-transform: uppercase; }
    @media (max-width: 575px) { .work-context { margin-left: .25rem; padding: .25rem; } .work-context__field label { display: none; } }
  `]
})
export class TopbarComponent implements OnInit{
  element:any;
  cookieValue:any;
  flagvalue:any;
  countryName:any;
  valueset:any;
  constructor(@Inject(DOCUMENT) private document: any, private router: Router,
              public languageService: LanguageService,
              public translate: TranslateService,
              public authService: AuthService,
              private breakpointObserver: BreakpointObserver) {
  }

  listLang = [
    { text: 'Español', flag: 'assets/images/flags/spain.jpg', lang: 'es' },
    { text: 'English', flag: 'assets/images/flags/us.jpg', lang: 'en' },
  ];

  openMobileMenu: boolean =  false;

  @Output() settingsButtonClicked = new EventEmitter();
  @Output() mobileMenuButtonClicked = new EventEmitter();
  cities: any[] | undefined;
  selectedCity: any | undefined;
  isPageViewMovil: boolean = false;
  styleSucursales   = signal({});
  fb                = inject( FormBuilder  );
  sucursalService   = inject(SucursalesService);
  validatorsService = inject(ValidatorsService);
  notificationsService = inject(NotificationsService);
  form:UntypedFormGroup = this.fb.group({
    id_sucursal: ['',[Validators.required]],
    id_storage: ['',[Validators.required]],
  });
  sucursales  = signal<Sucursal[]>([]);
  isReloadSub$!: Subscription;

  ngOnInit() {
    this.openMobileMenu = false;
    this.element = document.documentElement;
    this.cookieValue = localStorage.getItem('lang'); 
    const val = this.listLang.filter(x => x.lang === this.cookieValue);
    this.countryName = val.map(element => element.text);
    if (val.length === 0) {
      if (this.flagvalue === undefined) { this.valueset = 'assets/images/flags/us.jpg'; }
    } else {
      this.flagvalue = val.map(element => element.flag);
    }
    this.mediaQuery();
    this.getAllSucursales();
    this.loadNotifications();
    this.isReloadSub$ = this.validatorsService.reload_sucursal_storages$.subscribe(resp => {
      this.getAllSucursales();
    });
  }

  loadNotifications() {
    this.notificationsService.requestNotificationPermission();
    this.notificationsService.getUnreadNotifications().subscribe();
  }

  markAllNotificationsAsRead() {
    this.notificationsService.markAsRead([]).subscribe();
  }

  //** Asignar sucursales al selector, segun solo las sucursales asignadas al usuario logueado */
  getAllSucursales() {
    this.sucursalService.getAllAndSearch(1,100,true).subscribe({
      next: (resp) => {
        this.sucursales.set(resp.sucursales.data);
        if(this.authService.getUser.role != 'ADMINISTRADOR'){
          const sucursalesTemp = this.sucursales();
          this.sucursales.set(sucursalesTemp.filter((sucursal: Sucursal) =>
            this.authService.getUser?.assign_sucursales!.some((resp) => sucursal.id === resp.id_sucursal)
          ));
        }
      },
      complete: () => {
        if(this.sucursales().length == 0){
          Swal.fire({ 
            title: 'Ops! No tienes sucursal asignado', 
            text: `Indica al administrador que se te asigne`,
            icon: 'warning', 
            showClass: { popup: 'animated animate fadeInDown' },
            customClass: { container: 'swal-alert'},
          }).then(() => this.authService.logout());
        }
        const idSucursal = Number(localStorage.getItem('id_sucursal')) || this.sucursales()[0]?.id;
        const idStorage = Number(localStorage.getItem('id_storage')) || null;
        if (!idSucursal || !this.setWorkContext(idSucursal, idStorage)) {
          Swal.fire('Ops!', 'La sucursal seleccionada no tiene almacenes activos.', 'warning');
          return;
        }
        this.form.patchValue({ id_sucursal: this.validatorsService.id_sucursal(), id_storage: this.validatorsService.id_storage() });
      }
    });
  }

  setWorkContext(idSucursal: number, preferredStorageId?: number | null): boolean {
    return this.validatorsService.setWorkContext(this.sucursales(), idSucursal, preferredStorageId);
  }

  setStoragesBySucursal(reload:boolean = true) {
    this.form.markAllAsTouched();
    if(!this.form.valid) return;
    if(reload) {
      this.validatorsService.reload.set(true);
      setTimeout(() => {
        this.validatorsService.reload.set(false);
      }, 100);
    }
    const idSucursal = Number(this.form.get('id_sucursal')?.value);
    if (!this.setWorkContext(idSucursal, null)) {
      this.form.get('id_storage')?.setValue(null);
      Swal.fire('Ops!', 'La sucursal seleccionada no tiene almacenes activos.', 'warning');
      return;
    }
    this.form.get('id_storage')?.setValue(this.validatorsService.id_storage());
  }

  setStorage() {
    const idSucursal = Number(this.form.get('id_sucursal')?.value);
    const idStorage = Number(this.form.get('id_storage')?.value);
    if (!this.setWorkContext(idSucursal, idStorage)) return;
    this.validatorsService.reload.set(true);
    setTimeout(() => this.validatorsService.reload.set(false), 100);
  }

  mediaQuery() {
    this.breakpointObserver.observe([
          Breakpoints.XSmall,
          Breakpoints.Small,
        ]).subscribe((state: BreakpointState) => {
          this.isPageViewMovil = state.matches;
          if(this.isPageViewMovil){
            this.styleSucursales.set({'maxWidth':'130px','minWidth':'130px',});
          } else {
            this.styleSucursales.set({'maxWidth':'auto','minWidth':'190px',});
          }
        });
  }

  setLanguage(text: string, lang: string, flag: string) {
    this.countryName = text;
    this.flagvalue = flag;
    this.cookieValue = lang;
    this.languageService.setLanguage(lang);
  }

  /**
   * Toggles the right sidebar
   */
  toggleRightSidebar() {
    this.settingsButtonClicked.emit();
  }

  /**
   * Toggle the menu bar when having mobile screen
   */
  toggleMobileMenu(event: any) {
    event.preventDefault();
    this.mobileMenuButtonClicked.emit();
  }

  /**
   * Logout the user
   */
  logout() {
    this.authService.logout();
  }

  /**
   * Fullscreen method
   */
  fullscreen() {
    document.body.classList.toggle('fullscreen-enable');
    if (
      !document.fullscreenElement && !this.element.mozFullScreenElement &&
      !this.element.webkitFullscreenElement) {
      if (this.element.requestFullscreen) {
        this.element.requestFullscreen();
      } else if (this.element.mozRequestFullScreen) {
        /* Firefox */
        this.element.mozRequestFullScreen();
      } else if (this.element.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        this.element.webkitRequestFullscreen();
      } else if (this.element.msRequestFullscreen) {
        /* IE/Edge */
        this.element.msRequestFullscreen();
      }
    } else {
      if (this.document.exitFullscreen) {
        this.document.exitFullscreen();
      } else if (this.document.mozCancelFullScreen) {
        /* Firefox */
        this.document.mozCancelFullScreen();
      } else if (this.document.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        this.document.webkitExitFullscreen();
      } else if (this.document.msExitFullscreen) {
        /* IE/Edge */
        this.document.msExitFullscreen();
      }
    }
  }
}
