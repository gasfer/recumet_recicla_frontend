import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';
const base_url = environment.base_url;
@Pipe({
  name: 'image'
})
export class ImagePipe implements PipeTransform {

  transform(img: string = '', type:string): unknown {
    if(img === 'NONE'){
      return '../../../assets/img/none-img.jpg';
    } else if(img){
      return `${base_url}/file/${type}/${img}`;
    } else {
      return '../../../assets/img/none-img.jpg';
    }
  }

}
