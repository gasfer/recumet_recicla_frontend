import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-empty',
  templateUrl: './card-empty.component.html',
  styles: [
  ]
})
export class CardEmptyComponent {
  @Input() title: string = 'Información';
  @Input() subTitle: string = 'No se encontró ningún registro';
}
