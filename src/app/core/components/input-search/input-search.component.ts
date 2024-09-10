import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { ComponentsService } from '../../services/components.service';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-input-search',
  templateUrl: './input-search.component.html',
  styles: []
})
export class InputSearchComponent implements OnInit, OnDestroy {
  @Input({required: true}) placeholder:string ='';
  @Input() icon :string = '';
  @Input() btnNew :boolean = false;
  @Input() iconBtnNew :string = '';
  @Output() onEnters  : EventEmitter<string> = new EventEmitter();
  @Output() onDebounce: EventEmitter<string> = new EventEmitter();
  @Output() onBtnNew: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('txtTermino') txtTermino!: ElementRef;
  termino = new UntypedFormControl();
  debounce: Subject<string> = new Subject();
  validatorsService = inject(ValidatorsService);
  componentsService = inject(ComponentsService);
  clearInputSearchSubs!: Subscription;
 
  ngOnInit() { 
    this.debounce.pipe(debounceTime(500)).subscribe(valor => { 
      this.onDebounce.emit(valor?.trim());
    });
    this.clearInputSearchSubs = this.componentsService.clearInputSearch$
        .subscribe((isReloadEmit) => this.clearInput(isReloadEmit));    
  }

  ngOnDestroy(): void {
    this.clearInputSearchSubs.unsubscribe();
  }

  searchTyping(){
    this.debounce.next(this.termino!.value);  
  }

  searchForEnter(){
    this.onEnters.emit(this.termino!.value?.trim());
  }

  clickBtnNew() {
    this.onBtnNew.emit(true);
  }

  clearInput(isReloadEmit:boolean = false) {
    this.termino.setValue('');
    this.txtTermino.nativeElement.focus();
    if(isReloadEmit){
      this.onEnters.emit('');
    }
  }
}
