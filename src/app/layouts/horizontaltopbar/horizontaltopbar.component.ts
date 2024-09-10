import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EventService } from 'src/app/core/services/event.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { MENU } from './menu';
import { MenuItem } from './menu.model';
@Component({
  selector: 'app-horizontaltopbar',
  templateUrl: './horizontaltopbar.component.html',
  styles: [
  ]
})
export class HorizontaltopbarComponent implements OnInit {
  element     = signal<any|undefined>(undefined);
  cookieValue = signal('');
  flagvalue:any;
  countryName:any;
  valueset    = signal('');

  menuItems = signal<MenuItem[]>([]);
  listLang = signal([
    { text: 'Español', flag: 'assets/images/flags/spain.jpg', lang: 'es' },
    { text: 'English', flag: 'assets/images/flags/us.jpg', lang: 'en' },
  ]);

  constructor(@Inject(DOCUMENT) private document: any, private router: Router, private eventService: EventService,
    public languageService: LanguageService) {
      router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.activateMenu();
        }
      });
  }
 
  ngOnInit(): void {
    this.element.set(document.documentElement);
    this.menuItems.set(MENU);

    this.cookieValue.set(localStorage.getItem('lang')??'');
    const val = this.listLang().filter(x => x.lang === this.cookieValue());
    this.countryName = val.map(element => element.text);
    if (val.length === 0) {
      if (this.flagvalue === undefined) { this.valueset.set('assets/images/flags/us.jpg') }
    } else {
      this.flagvalue = val.map(element => element.flag);
    }
  }

  _removeAllClass(className:string) {
    const els = document.getElementsByClassName(className);
    while (els[0]) {
      els[0].classList.remove(className);
    }
  }

  private activateMenu() {

    const resetParent = (el: any) => {
      const parent = el.parentElement;
      if (parent) {
        parent.classList.remove('active');
        const parent2 = parent.parentElement;
        this._removeAllClass('mm-active');
        this._removeAllClass('mm-show');
        if (parent2) {
          parent2.classList.remove('active');
          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove('active');
            const parent4 = parent3.parentElement;
            if (parent4) {
              parent4.classList.remove('active');
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove('active');
                const menuelement = document.getElementById("topnav-menu-content")
                if (menuelement !== null) {
                  if (menuelement.classList.contains('show'))
                    document.getElementById("topnav-menu-content")?.classList.remove("show");
                }
              }
            }
          }
        }
      }
    };

    // activate menu item based on location
    const links:any = document.getElementsByClassName('side-nav-link-ref');
    let matchingMenuItem = null;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < links.length; i++) {
      // reset menu
      resetParent(links[i]);
    }
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < links.length; i++) {
      // tslint:disable-next-line: no-string-literal
      if (location.pathname === links[i]['pathname']) {
        matchingMenuItem = links[i];
        break;
      }
    }

    if (matchingMenuItem) {
      const parent = matchingMenuItem.parentElement;
      /**
       * TODO: This is hard coded way of expading/activating parent menu dropdown and working till level 3.
       * We should come up with non hard coded approach
       */
      if (parent) {
        parent.classList.add('active');
        const parent2 = parent.parentElement;
        if (parent2) {
          parent2.classList.add('active');
          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.add('active');
            const parent4 = parent3.parentElement;
            if (parent4) {
              parent4.classList.add('active');
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.add('active');
                const parent6 = parent5.parentElement;
                if (parent6) {
                  parent6.classList.add('active');
                }
              }
            }
          }
        }
      }
    }
  }


  toggleMenubar() {
    const element = document.getElementById('topnav-menu-content');
    element?.classList.toggle('show');
  }

  setLanguage(text: string, lang: string, flag: string) {
    this.countryName = text;
    this.flagvalue = flag;
    this.cookieValue.set(lang);
    this.languageService.setLanguage(lang);
  }

  fullscreen() {
    document.body.classList.toggle('fullscreen-enable');
    if (
      !document.fullscreenElement && !this.element()?.mozFullScreenElement &&
      !this.element().webkitFullscreenElement) {
      if (this.element().requestFullscreen) {
        this.element().requestFullscreen();
      } else if (this.element().mozRequestFullScreen) {
        /* Firefox */
        this.element().mozRequestFullScreen();
      } else if (this.element().webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        this.element().webkitRequestFullscreen();
      } else if (this.element().msRequestFullscreen) {
        /* IE/Edge */
        this.element().msRequestFullscreen();
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

  hasItems(item: MenuItem) {
    return item.subItems !== undefined ? item.subItems.length > 0 : false;
  }

  onMenuClick(event:any) {
    const nextEl = event.target.nextElementSibling;
    if (nextEl) {
      const parentEl = event.target.parentNode;
      if (parentEl) {
        parentEl.classList.remove("show");
      }
      nextEl.classList.toggle("show");
    }
    return false;
  }
  
  logout() {
    this.router.navigate(['/auth/']);
  }

  onSettingsButtonClicked() {
    document.body.classList.toggle('right-bar-enabled');
  }
}
