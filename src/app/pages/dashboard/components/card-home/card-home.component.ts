import { Component, Input } from '@angular/core';
import { CardHome } from '../../interfaces/card-home.interface';

@Component({
  selector: 'app-card-home',
  templateUrl: './card-home.component.html',
  styleUrls: ['./card-home.component.scss']
})
export class CardHomeComponent {
  @Input() data: CardHome = {};

  ngOnInit(): void {
  }
}
