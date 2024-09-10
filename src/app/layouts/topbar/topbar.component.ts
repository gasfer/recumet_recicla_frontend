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

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styles: []
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
  form:UntypedFormGroup = this.fb.group({
    id_sucursal: ['',[Validators.required]],
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
    this.isReloadSub$ = this.validatorsService.reload_sucursal_storages$.subscribe(resp => {
      this.getAllSucursales();
    });
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
        const id_sucursal = localStorage.getItem('id_sucursal');
        if(id_sucursal){
          this.form.get('id_sucursal')?.setValue(Number(id_sucursal));
        } else {
          this.form.get('id_sucursal')?.setValue(this.sucursales()[this.sucursales().length - 1].id);
          localStorage.setItem('id_sucursal',this.form.get('id_sucursal')?.value);
        }
        this.setStoragesBySucursal(false);
      }
    });
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
    const id_sucursal =  this.form.get('id_sucursal')?.value;
    if(id_sucursal){
      this.validatorsService.id_sucursal.set(id_sucursal);
      localStorage.setItem('id_sucursal', id_sucursal);
      const sucursal_select = this.sucursales().find(sucursal => sucursal.id == Number(id_sucursal));
      this.validatorsService.storages.set(sucursal_select!.storage);
    } else {
      this.validatorsService.storages.set([]);
    }
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
            this.styleSucursales.set({'maxWidth':'auto','minWidth':'200px',});
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
