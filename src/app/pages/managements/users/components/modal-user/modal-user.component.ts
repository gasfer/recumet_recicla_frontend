import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { UsersService } from '../../../services/users.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal-user',
  templateUrl: './modal-user.component.html'
})
export class ModalUserComponent implements OnInit, OnDestroy {
  validatorsService = inject( ValidatorsService );
  userService       = inject( UsersService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  roles = signal([
    { name: 'ADMINISTRADOR/A', code: 'ADMINISTRADOR'},
    { name: 'OPERADOR/A', code: 'OPERADOR'},
  ]);
  sex = signal([
    { name: 'MASCULINO', code: 'MASCULINO'},
    { name: 'FEMENINO', code: 'FEMENINO'},
  ]);
  userForm: FormGroup = this.fb.group({
    id: [''],
    full_names: [ '', [ Validators.required,this.validatorsService.isSpacesInDynamicTxt]],
    number_document: ['', [ Validators.required,this.validatorsService.isSpacesInDynamicTxt]],
    cellphone: [null, [ Validators.required,Validators.min(60000000), Validators.max(79999999)]],
    sex: ['', [ Validators.required]],
    photo: ['NONE', [ Validators.required]],
    position: ['', [ Validators.required,this.validatorsService.isSpacesInDynamicTxt]],
    email: ['', [ Validators.required,Validators.pattern(this.validatorsService.emailPattern())]],
    password: ['', [ Validators.required, Validators.minLength(8),this.validatorsService.isSpacesInPassword]],
    role: ['', [ Validators.required,this.validatorsService.isSpacesInDynamicTxt]],
    status: [true]
  });
  isEditSub$!: Subscription;

  ngOnInit(): void {
    this.isEditSub$ = this.userService.editSubs.subscribe(resp => {
      this.userForm.reset({
        id: resp.id,
        full_names: resp.full_names,
        number_document: resp.number_document,
        cellphone: resp.cellphone,
        sex: resp.sex,
        photo: resp.photo,
        position: resp.position,
        email: resp.email,
        password: '',
        role: resp.role,
        status: resp.status,
      });
    });
  }
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  newUser() {
    this.userForm.markAllAsTouched();
    if(!this.userForm.valid) return;
    this.loading.set(true);
    this.userService.postNew(this.userForm.value).subscribe({
      complete: () => {
        this.userService.save$.next(true);
        this.loading.set(false);
        this.userService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Usuario nuevo agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  editUser() {
    this.userForm.markAllAsTouched();
    if(!this.userForm.valid) return;
    this.loading.set(true);
    this.userService.putUpdate(this.userForm.value).subscribe({
      complete: () => {
        this.userService.save$.next(true);
        this.loading.set(false);
        this.userService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Usuario modificado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.userForm.reset({
      full_names: '',
      number_document: '',
      cellphone: null,
      sex: '',
      photo: 'NONE',
      position: '',
      email: '',
      password: '',
      role: '',
      status: true,
    });
  }
}
