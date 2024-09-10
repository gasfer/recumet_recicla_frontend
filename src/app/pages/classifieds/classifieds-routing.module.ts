import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClassifiedComponent } from './classified/classified.component';
import { QueryClassifiedsComponent } from './query-classifieds/query-classifieds.component';

const routes: Routes = [
  { path: 'classified', component: ClassifiedComponent, 
    data: { data: [ { title: 'Entradas' },{ title: 'Clasificados' },{ title: 'Realizar Clasificados' , active: true }], name:'CLASIFICADOS', action:'create'}},
  { path: 'query-classifieds', component: QueryClassifiedsComponent, 
    data: { data: [ { title: 'Entradas' },{ title: 'Clasificados' },{ title: 'Consultar Clasificados' , active: true }], name:'CLASIFICADOS', action:'view'}},
  { path: '**', redirectTo: 'classified'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClassifiedsRoutingModule { }
