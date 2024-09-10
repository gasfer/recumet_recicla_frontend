import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComponentsService {
  clearInputSearch$: Subject<boolean> = new Subject();
  setShowImg: boolean = false;
  setShowModalBsSus: boolean = false;
  srcImg = signal('NONE');
  nameImg = signal('NONE');
  textImg = signal('');
  typeImg= signal('');
  withModal= signal('');

  openModalImage(nameImg: string,textImg:string,srcImg: string, type: string, withModal:string = '35vw') {
    this.setShowImg = true;
    this.srcImg.set(srcImg);
    this.nameImg.set(nameImg);
    this.typeImg.set(type);
    this.textImg.set(textImg);
    this.withModal.set(withModal);
  }
}
