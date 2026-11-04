import { Component, Input  } from '@angular/core';


@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styles: [`
    .breadcrumb-link {
      color: var(--bs-secondary-color, var(--bs-secondary));
      text-decoration: none;
      border-radius: 3px;
    }

    .breadcrumb-link:hover {
      color: var(--bs-primary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .breadcrumb-link:focus-visible {
      outline: 2px solid var(--bs-primary);
      outline-offset: 2px;
    }
  `]
})
export class BreadcrumbComponent {
  @Input() breadcrumbs:any = [];

}
