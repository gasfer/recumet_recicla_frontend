import { Component, OnInit, inject } from '@angular/core';
import { ActivationEnd, Router } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  title = 'Recumet';
  config = inject(PrimeNGConfig);
  ngOnInit(): void {
    this.config.setTranslation({
      dayNamesMin: ["Do","Lu","Ma","Mi","Ju","Vi","Sá"],
      monthNames: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre ","Diciembre"],
      monthNamesShort: ["En.","Febr.","Mzo.","Abr.","My.","Jun.","Jul.","Agt.","Sept.","Oct.","Nov.","Dic."],
      weak: 'Débil',
      medium: 'Medio',
      strong: 'Fuerte',
      passwordPrompt: 'Utiliza una combinación de letras M/m, números'
      //translations
    }); 
  }
  
}
