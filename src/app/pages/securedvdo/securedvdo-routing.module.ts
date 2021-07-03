import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SecuredvdoPage } from './securedvdo.page';

const routes: Routes = [
  {
    path: '',
    component: SecuredvdoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SecuredvdoPageRoutingModule {}
