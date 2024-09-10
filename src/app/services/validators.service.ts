import { Injectable, inject, signal } from '@angular/core';
import { AbstractControl, ValidationErrors, UntypedFormGroup } from '@angular/forms';
import { NgxImageCompressService } from 'ngx-image-compress';
import { Storage } from '../pages/managements/interfaces/sucursales.interface';
import { Subject } from 'rxjs';
import { AuthService } from './../auth/auth.service';
import { User } from '../auth/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class ValidatorsService {
  emailPattern    = signal('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$');
  numberCiPattern = signal('^(?:(?=[eE][-])([1-9][0-9]{3,7})|([eE][-])?[1-9][0-9]{3,7}|[1-9][0-9]{3,7}[-][1-9][0-9A-Za-z]?)$');
  loadingPage     = signal(false);
  isPageViewMovil = signal(false);
  expRegValidInput: RegExp = /^[^<>*!$~@%^&`¡;+¥¿?=]/;

  decimalLength = signal(2);

  localCompressedURl: any;
  //localCompressedURl1: any;
  compressLoading: boolean = false;
  //compressLoading1: boolean = false;
  user = signal<User|undefined>(undefined);
  id_sucursal = signal(0);
  storages    = signal<Storage[]>([]);
  reload      = signal(false);
  reload_sucursal_storages$: Subject<boolean> = new Subject();
  constructor(private imageCompress: NgxImageCompressService) {

  }

  validateUserWithPermissions(): boolean {
    const isWithTrue = this.user()!.assign_permission.some((permiso) => {
      const valores = Object.values(permiso);
      return valores.some((valor) => valor === true);
    });
    if(this.user()!.assign_permission.length > 0 && isWithTrue){
      return true;
    } else {
      return false;
    }
  }

  withPermission(module_search:string,action:'view'|'create'|'update'|'delete'|'reports') {
    if(!module_search) return false;
    if(this.user()?.role === 'ADMINISTRADOR') return true;
    const permission = this.user()?.assign_permission.find(assign_permission => assign_permission.module === module_search);
    if(!permission) return false;
    return permission![action] ?? false;
  }

  inputValidMessage(campo: string,form:UntypedFormGroup ,isNumber: boolean = false): string{
    const error = form.get(campo)?.errors;
    return this.messageError(error, isNumber);
  }

  inputValid(campo: string,form:UntypedFormGroup) : boolean {
     return form.get(campo)?.invalid && form.get(campo)?.touched ? true : false;
  }

  messageError(error: any, isNumber: boolean): string {
    if(error?.hasOwnProperty('required')){
      return 'El campo es requerido';
    }
    if(error?.hasOwnProperty('minlength')){
      return `El mínimo de caracteres es ${error?.['minlength']?.requiredLength}`;
    }
    if(error?.hasOwnProperty('maxlength')){
      return `El máximo de caracteres es ${error?.['maxlength']?.requiredLength}`;
    }
    if(error?.hasOwnProperty('pattern') ){
      return `El campo no es valido`;
    }
    if(error?.hasOwnProperty('min') && isNumber){
      return `El cantidad minima es ${error?.['min']?.min}`;
    }
    if(error?.hasOwnProperty('max') && isNumber){
      return `La cantidad maxima es de ${error?.['max']?.max}`;
    }
    if(Object.keys(error).length > 0){
      return `El campo no es valido`;
    }
    return '';
  }

  isSpacesInDynamicTxt(control: AbstractControl): ValidationErrors | null {
    const txt = control.value;
    return !txt || txt.trim().length === 0 ? { isSpacesInTxt: true } : null;
  }

  isSpacesInPassword(control: AbstractControl): ValidationErrors | null {
    const txt = control.value;
    return !txt || txt.trim().length < 8 ? { isSpacesInPassword: true } : null;
  } 

  compressFile(imageBase64: string, img:File): Promise<File> {
    const sizeImage = img.size;
    const filename = img['name'];
    if (sizeImage <= 3145728) {
      return new Promise((resolve, reject) => { 
        this.localCompressedURl = imageBase64;
        this.compressLoading = false;
        resolve(img);
      });
    }
    let quality = sizeImage > 10485760 ? 30 : 50;
    return new Promise((resolve, reject) => {
      this.imageCompress.compressFile(imageBase64, -1, quality, quality).then(
        result => {
          this.localCompressedURl = result;
          const imageBlob = this.dataURItoBlob(result.split(',')[1]);
          const imageFile = new File([imageBlob], filename, { type: 'image/jpeg' });
          this.compressLoading = false;
          resolve(imageFile);
        }).catch(err => {
          this.compressLoading = false;
          reject(err);
        });
    })
  }

  dataURItoBlob(dataURI: string) {
    const byteString = window.atob(dataURI);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer); for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    } const blob = new Blob([int8Array], { type: 'image/jpeg' });
    return blob;
  }
}
