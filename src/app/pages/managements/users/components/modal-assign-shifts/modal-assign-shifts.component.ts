import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { Subscription } from 'rxjs';
import { FormAssignShifts, User } from '../../../interfaces/user.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ErrorLogsService } from 'src/app/core/services/error-logs.service';

@Component({
  selector: 'app-modal-assign-shifts',
  templateUrl: './modal-assign-shifts.component.html',
  styles: [`
    label {
      cursor: pointer;
    }
  `]
})
export class ModalAssignShiftsComponent implements OnInit, OnDestroy {
  userService = inject( UsersService );
  fb          = inject( FormBuilder );
  errorLogsService = inject( ErrorLogsService );
  loading     = signal(false);
  user        = signal<User|undefined>(undefined);
  isEditSub$!: Subscription;
  formGroup: FormGroup = this.fb.group({
    selectedDomingo: [,[Validators.required]],
    selectedLunes:  [,[Validators.required]],
    selectedMartes:  [,[Validators.required]],
    selectedMiercoles:  [,[Validators.required]],
    selectedJueves:  [,[Validators.required]],
    selectedViernes:  [,[Validators.required]],
    selectedSabado: [,[Validators.required]],
  });

  ngOnInit(): void {
    this.isEditSub$ = this.userService.assignHorariosSubs.subscribe(resp => {
      this.formGroup.reset();
      this.user.set(resp);
      this.user()?.assign_shift.forEach(assign_shift => {
        if(assign_shift.day === 'DOMINGO'){
          if(assign_shift.hour_start === assign_shift.hour_end){
            this.formGroup.get('selectedDomingo')?.setValue('SIN_ACCESO');
          } else {
            this.formGroup.get('selectedDomingo')?.setValue(assign_shift.hour_start+'-'+assign_shift.hour_end);
          }
        }
        if(assign_shift.day === 'LUNES'){
          if(assign_shift.hour_start === assign_shift.hour_end){
            this.formGroup.get('selectedLunes')?.setValue('SIN_ACCESO');
          } else {
            this.formGroup.get('selectedLunes')?.setValue(assign_shift.hour_start+'-'+assign_shift.hour_end);
          }
        }
        if(assign_shift.day === 'MARTES'){
          if(assign_shift.hour_start === assign_shift.hour_end){
            this.formGroup.get('selectedMartes')?.setValue('SIN_ACCESO');
          } else {
            this.formGroup.get('selectedMartes')?.setValue(assign_shift.hour_start+'-'+assign_shift.hour_end);
          }
        }
        if(assign_shift.day === 'MIERCOLES'){
          if(assign_shift.hour_start === assign_shift.hour_end){
            this.formGroup.get('selectedMiercoles')?.setValue('SIN_ACCESO');
          } else {
            this.formGroup.get('selectedMiercoles')?.setValue(assign_shift.hour_start+'-'+assign_shift.hour_end);
          }
        }
        if(assign_shift.day === 'JUEVES'){
          if(assign_shift.hour_start === assign_shift.hour_end){
            this.formGroup.get('selectedJueves')?.setValue('SIN_ACCESO');
          } else {
            this.formGroup.get('selectedJueves')?.setValue(assign_shift.hour_start+'-'+assign_shift.hour_end);
          }
        }
        if(assign_shift.day === 'VIERNES'){
          if(assign_shift.hour_start === assign_shift.hour_end){
            this.formGroup.get('selectedViernes')?.setValue('SIN_ACCESO');
          } else {
            this.formGroup.get('selectedViernes')?.setValue(assign_shift.hour_start+'-'+assign_shift.hour_end);
          }
        }
        if(assign_shift.day === 'SABADO'){
          if(assign_shift.hour_start === assign_shift.hour_end){
            this.formGroup.get('selectedSabado')?.setValue('SIN_ACCESO');
          } else {
            this.formGroup.get('selectedSabado')?.setValue(assign_shift.hour_start+'-'+assign_shift.hour_end);
          }
        }
      });
    });
  }

  ngOnDestroy(): void {
     this.isEditSub$.unsubscribe();
  }

  formGet(value:string){
    return this.formGroup.get(value)?.value;
  }

  saveNewAssignShifts() {
    this.formGroup.markAllAsTouched();
    if(!this.formGroup.valid) {
      this.errorLogsService.notifications('Selecciona los horarios de todos los Dias','info','form')
      return;
    };
    this.loading.set(true);
    const shiftsAssign: FormAssignShifts[] =  [
      {
        id_user: this.user()?.id!,
        number_day:0,
        day: 'DOMINGO',
        hour_start: this.formGet('selectedDomingo') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedDomingo').split('-')[0],
        hour_end: this.formGet('selectedDomingo') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedDomingo').split('-')[1],
        status: this.formGet('selectedDomingo') == 'SIN_ACCESO' ? false : true,
      },
      {
        id_user: this.user()?.id!,
        number_day:1,
        day: 'LUNES',
        hour_start: this.formGet('selectedLunes') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedLunes').split('-')[0],
        hour_end: this.formGet('selectedLunes') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedLunes').split('-')[1],
        status: this.formGet('selectedLunes') == 'SIN_ACCESO' ? false : true,
      },
      {
        id_user: this.user()?.id!,
        number_day:2,
        day: 'MARTES',
        hour_start: this.formGet('selectedMartes') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedMartes').split('-')[0],
        hour_end: this.formGet('selectedMartes') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedMartes').split('-')[1],
        status: this.formGet('selectedMartes') == 'SIN_ACCESO' ? false : true,
      },
      {
        id_user: this.user()?.id!,
        number_day:3,
        day: 'MIERCOLES',
        hour_start: this.formGet('selectedMiercoles') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedMiercoles').split('-')[0],
        hour_end: this.formGet('selectedMiercoles') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedMiercoles').split('-')[1],
        status: this.formGet('selectedMiercoles') == 'SIN_ACCESO' ? false : true,
      },
      {
        id_user: this.user()?.id!,
        number_day:4,
        day: 'JUEVES',
        hour_start: this.formGet('selectedJueves') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedJueves').split('-')[0],
        hour_end: this.formGet('selectedJueves') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedJueves').split('-')[1],
        status: this.formGet('selectedJueves') == 'SIN_ACCESO' ? false : true,
      },
      {
        id_user: this.user()?.id!,
        number_day:5,
        day: 'VIERNES',
        hour_start: this.formGet('selectedViernes') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedViernes').split('-')[0],
        hour_end: this.formGet('selectedViernes') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedViernes').split('-')[1],
        status: this.formGet('selectedViernes') == 'SIN_ACCESO' ? false : true,
      },
      {
        id_user: this.user()?.id!,
        number_day:6,
        day: 'SABADO',
        hour_start: this.formGet('selectedSabado') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedSabado').split('-')[0],
        hour_end: this.formGet('selectedSabado') == 'SIN_ACCESO' ? '00:00' : this.formGet('selectedSabado').split('-')[1],
        status: this.formGet('selectedSabado') == 'SIN_ACCESO' ? false : true,
      }
    ];
    this.userService.postAssignShifts(shiftsAssign).subscribe({
      next: (resp) => {
        this.userService.showModalAssignShifts = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Asignación de turnos realizada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
        });
        this.userService.save$.next(true);
        this.loading.set(false);
      },
      error: (err) => this.loading.set(false)
    })
  }
}
