import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert-notify',
  templateUrl: './alert-notify.component.html',
})
export class AlertNotifyComponent {
  @Input() title: string = 'Estimado usuario:';
  @Input() subTitle: string = 'los campos marcados en';
  @Input() required: boolean = true;
  @Input() subTitle2: string = 'son obligatorios';
  @Input() classColor: string = 'alert-info';
}
