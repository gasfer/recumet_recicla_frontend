import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { LAYOUT_WIDTH, SIDEBAR_TYPE, TOPBAR, LAYOUT_MODE } from '../layouts.model';
import { Subscription } from 'rxjs';
import { SidebarPreferencesService } from 'src/app/core/services/sidebar-preferences.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { EventService } from 'src/app/core/services/event.service';

@Component({
  selector: 'app-rightsidebar',
  templateUrl: './rightsidebar.component.html',
  styles: [
  ]
})
export class RightsidebarComponent implements OnInit, OnDestroy {
  private preferences = inject(SidebarPreferencesService);
  private validators = inject(ValidatorsService);
  private readonly sidebarSubscription = new Subscription();
  isVisible?: string;
  attribute?: string;

  width?: string;
  sidebartype?: string;
  mode?: string;
  topbar?: string;

  constructor(private eventService: EventService) { }

  ngOnInit() {
    this.width = LAYOUT_WIDTH;
    const preference = this.preferences.load(this.validators.user()?.id);
    this.sidebartype = preference.collapsed ? 'icon' : preference.expandedType;
    this.sidebarSubscription.add(this.eventService.subscribe('changeSidebartype', value => this.sidebartype = value));
    this.sidebarSubscription.add(this.eventService.subscribe('sidebarModeChanged', value => this.sidebartype = value));
    this.topbar = TOPBAR;
    const savedMode = localStorage.getItem('recumet-theme');
    this.mode = savedMode === 'dark' || savedMode === 'light' ? savedMode : LAYOUT_MODE;
    this.sidebarSubscription.add(this.eventService.subscribe('changeMode', value => this.mode = value));

    /**
     * horizontal-vertical layput set
     */
    this.attribute = document.body.getAttribute('data-layout') ?? '';
    const vertical = document.getElementById('is-layout');
    if (vertical != null) {
      vertical.setAttribute('checked', 'true');
    }
    if (this.attribute == 'horizontal') {
      vertical?.removeAttribute('checked');
    }
  }

  /**
   * Hide the sidebar
   */
  ngOnDestroy(): void { this.sidebarSubscription?.unsubscribe(); }

  public hide() {
    document.body.classList.remove('right-bar-enabled');
  }

  /**
   * Change Topbar
   */
  changeTopbar(topbar: string) {
    this.topbar = topbar;
    this.eventService.broadcast('changeTopbar', topbar);
  }

  /**
   * Change the layout onclick
   * @param layout Change the layout
   */
  changeLayout(layout:any) {
    if (layout.target.checked == true){
      this.eventService.broadcast('changeLayout', 'vertical');
    } else {
      this.eventService.broadcast('changeLayout', 'horizontal');
    }
  }

  changeWidth(width: string) {
    this.width = width;
    this.eventService.broadcast('changeWidth', width);
  }

  changeSidebartype(sidebar: string) {
    this.sidebartype = sidebar;
    this.eventService.broadcast('changeSidebartype', sidebar);
  }

  changeMode(themeMode: string) {
    this.mode = themeMode;
    this.eventService.broadcast('changeMode', themeMode);
  }
}
