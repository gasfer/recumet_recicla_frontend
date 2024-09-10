import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  public languages: string[] = ['en', 'es', 'de', 'it', 'ru'];

  constructor(public translate: TranslateService) {
    let browserLang;
    this.translate.addLangs(this.languages);
    if (localStorage.getItem('lang')) {
      browserLang = localStorage.getItem('lang');
    } else {
      this.setLanguage('es');
      browserLang = translate.getBrowserLang();
    }
    translate.use(browserLang?.match(/en|es|de|it|ru/) ? browserLang : 'en');
  }

  public setLanguage(lang:string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

}
