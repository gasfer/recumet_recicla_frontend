import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  LAYOUT_VERTICAL, LAYOUT_HORIZONTAL, LAYOUT_WIDTH, TOPBAR, LAYOUT_MODE, SIDEBAR_TYPE
} from './layouts.model';
import { EventService } from '../core/services/event.service';
import { ActivationEnd, Router } from '@angular/router';
import { Subscription, filter, map } from 'rxjs';
import { ValidatorsService } from '../services/validators.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styles: [
  ]
})
export class LayoutComponent implements OnInit, OnDestroy{
  layoutType  = signal(LAYOUT_VERTICAL);
  layoutwidth = signal(LAYOUT_WIDTH);
  topbar      = signal(TOPBAR);
  mode        = signal(LAYOUT_MODE);
  sidebartype = signal(SIDEBAR_TYPE);

  eventService = inject(EventService);
  validatorsService = inject(ValidatorsService);
  public tituloSubs$! : Subscription;
  public breadcrumbs:any = [];

  constructor(private router: Router) {
    this.tituloSubs$ = this.getArgumentosRuta()
                        .subscribe((data: any) => {
                          this.breadcrumbs = data.data;
                          let titulo = this.breadcrumbs[this.breadcrumbs.length - 1].title;
                          document.title = `Recumet | ${titulo}`;
                        });  

  }
  ngOnDestroy(): void {
   this.tituloSubs$.unsubscribe();
  }

  ngOnInit(): void {
    this.LayoutWidth(this.layoutwidth());
    this.changeSidebar(this.sidebartype());
    this.changeMode(this.mode());

    this.eventService.subscribe('changeLayout', (layout) => {
      this.layoutType.set(layout);
    });
    this.eventService.subscribe('changeWidth', (width) => {
      this.layoutwidth.set(width);
      this.LayoutWidth(this.layoutwidth());
    });
    this.eventService.subscribe('changeSidebartype', (layout) => {
      this.sidebartype.set(layout);
      this.changeSidebar(this.sidebartype());
    });
    this.eventService.subscribe('changeMode', (mode) => {
      this.mode.set(mode);
      this.changeMode(this.mode());
    });
  }

  getArgumentosRuta() {
    return this.router.events
      .pipe(
        filter( (event: any) => event instanceof ActivationEnd),
        filter( (event: ActivationEnd) => event.snapshot.firstChild === null),
        map((event: ActivationEnd) => event.snapshot.data)
      );
  }

  changeMode(value:string) {    
    switch (value) {
      case "light":
        document.body.setAttribute('data-bs-theme', 'light');
        break;
      case "dark":
        document.body.setAttribute('data-bs-theme', 'dark');
        break;
      default:
        document.body.setAttribute('data-bs-theme', 'light');
        break;
    }
  }

  changeSidebar(value:string) {
    switch (value) {
      case "light":
        document.body.setAttribute('data-sidebar', 'light');
        document.body.setAttribute('data-topbar', 'dark');
        document.body.removeAttribute('data-sidebar-size');
        document.body.removeAttribute('data-layout-size');
        document.body.removeAttribute('data-keep-enlarged');
        document.body.classList.remove('vertical-collpsed');
        document.body.removeAttribute('data-layout-scrollable');
        break;
      case "compact":
        document.body.setAttribute('data-sidebar-size', 'small');
        document.body.setAttribute('data-sidebar', 'dark');
        document.body.removeAttribute('data-topbar');
        document.body.removeAttribute('data-layout-size');
        document.body.removeAttribute('data-keep-enlarged');
        document.body.classList.remove('sidebar-enable');
        document.body.classList.remove('vertical-collpsed');
        document.body.removeAttribute('data-layout-scrollable');
        break;
      case "dark":
        document.body.setAttribute('data-sidebar', 'dark');
        document.body.removeAttribute('data-topbar');
        document.body.removeAttribute('data-layout-size');
        document.body.removeAttribute('data-keep-enlarged');
        document.body.removeAttribute('data-sidebar-size');
        document.body.classList.remove('sidebar-enable');
        //document.body.setAttribute('data-topbar', 'dark');
        document.body.classList.remove('vertical-collpsed');
        document.body.removeAttribute('data-layout-scrollable');
        break;
      case "icon":
        document.body.classList.add('vertical-collpsed');
        document.body.setAttribute('data-sidebar', 'dark');
        document.body.removeAttribute('data-layout-size');
        document.body.setAttribute('data-keep-enlarged',"true");
        document.body.removeAttribute('data-topbar');
        document.body.removeAttribute('data-layout-scrollable');
        break;
      case "colored":
        document.body.setAttribute('data-sidebar', 'dark');
        document.body.removeAttribute('data-topbar');
        document.body.removeAttribute('data-layout-size');
        document.body.removeAttribute('data-keep-enlarged');
        document.body.removeAttribute('data-sidebar-size');
        document.body.classList.remove('sidebar-enable');
        document.body.setAttribute('data-topbar', 'dark');
        document.body.classList.remove('vertical-collpsed');
        document.body.removeAttribute('data-layout-scrollable');
        break;
      default:
        document.body.setAttribute('data-sidebar', 'dark');
        break;
    }
  }

  LayoutWidth(width: string) {
    switch (width) {
      case "fluid":
        document.body.setAttribute("data-layout-size", "fluid");
        document.body.classList.remove("vertical-collpsed");
        document.body.removeAttribute("data-layout-scrollable");
        break;
      case "boxed":
        document.body.setAttribute("data-layout-size", "boxed");
        document.body.classList.add("vertical-collpsed");
        document.body.removeAttribute("data-layout-scrollable");
        break;
      case "scrollable":
        document.body.removeAttribute("data-layout-size");
        document.body.setAttribute("data-layout-scrollable", "true");
        document.body.setAttribute("data-layout-size", "fluid");
        document.body.classList.remove("right-bar-enabled", "vertical-collpsed");
        break;
      default:
        document.body.setAttribute("data-layout-size", "fluid");
        break;
    }
  }

  /**
   * Check if the vertical layout is requested
   */
  isVerticalLayoutRequested() {
    return this.layoutType() === LAYOUT_VERTICAL;
  }
  
  /**
   * Check if the horizontal layout is requested
  */
 isHorizontalLayoutRequested() {
    return this.layoutType() === LAYOUT_HORIZONTAL;
  }
}
