import { Component, OnInit, inject } from '@angular/core';
import { ComponentsService } from '../../services/components.service';

@Component({
  selector: 'app-view-image',
  templateUrl: './view-image.component.html',
  styles: [
  ]
})
export class ViewImageComponent implements OnInit {

  componentsService = inject(ComponentsService);

  ngOnInit(): void {
  }

}
