import { Component, Input  } from '@angular/core';


@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styles: [
  ]
})
export class BreadcrumbComponent {
  @Input() breadcrumbs:any = [];
}
