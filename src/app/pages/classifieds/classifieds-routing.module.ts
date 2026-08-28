import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClassifiedComponent } from './classified/classified.component';
import { QueryClassifiedsComponent } from './query-classifieds/query-classifieds.component';
import { NAVIGATION_DESTINATIONS as NAV, childPath, routeData } from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (title: string) => [{ title: 'Entradas' }, { title: 'Clasificados' }, { title, active: true }];

export const CLASSIFIED_ROUTES: Routes = [
  { path: childPath(NAV.createClassified, '/classifieds'), component: ClassifiedComponent,
    data: routeData(NAV.createClassified, breadcrumb(NAV.createClassified.title)) },
  { path: childPath(NAV.queryClassifieds, '/classifieds'), component: QueryClassifiedsComponent,
    data: routeData(NAV.queryClassifieds, breadcrumb(NAV.queryClassifieds.title)) },
  { path: '**', redirectTo: 'classified'},
];

@NgModule({
  imports: [RouterModule.forChild(CLASSIFIED_ROUTES)],
  exports: [RouterModule]
})
export class ClassifiedsRoutingModule { }
