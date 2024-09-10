import { AfterViewInit, Component, Input, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EventService } from 'src/app/core/services/event.service';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-vertical',
  templateUrl: './vertical.component.html',
  styles: [
  ]
})
export class VerticalComponent implements OnInit, AfterViewInit {
  isCondensed = false;
  @Input() breadcrumbs:any = [];
  // sidebartype: string;
  validatorsService = inject(ValidatorsService);
  constructor(private router: Router, private eventService: EventService) {
    this.router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        document.body.classList.remove('sidebar-enable');
      }
    });
  }

  ngOnInit() {
    document.body.setAttribute('data-layout', 'vertical');
  }

  isMobile() {
    const ua = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  }

  ngAfterViewInit() {
  }

  /**
   * on settings button clicked from topbar
   */
  onSettingsButtonClicked() {
    document.body.classList.toggle('right-bar-enabled');
  }

  /**
   * On mobile toggle button clicked
   */
  onToggleMobileMenu() {
    this.isCondensed = !this.isCondensed;
    document.body.classList.toggle('sidebar-enable');
    document.body.classList.toggle('vertical-collpsed');

    if (window.screen.width <= 768) {
      document.body.classList.remove('vertical-collpsed');
    }
  }
}
