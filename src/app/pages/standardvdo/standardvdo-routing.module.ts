import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StandardvdoPage } from './standardvdo.page';

const routes: Routes = [
  {
    path: '',
    component: StandardvdoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StandardvdoPageRoutingModule {}
