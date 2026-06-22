import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BalanzaCamioneraComponent } from './balanza-camionera/balanza-camionera.component';
import { BalanzaManualComponent }    from './balanza-manual/balanza-manual.component';
import { ServicioBalanzaComponent }  from './servicio-balanza/servicio-balanza.component';

const routes: Routes = [
  { path: 'balanza-camionera', component: BalanzaCamioneraComponent },
  { path: 'balanza-manual',    component: BalanzaManualComponent    },
  { path: 'servicio-balanza',  component: ServicioBalanzaComponent  },
  { path: '',  redirectTo: 'balanza-camionera', pathMatch: 'full'   },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BalanzaRoutingModule {}
