import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NodataPage } from './nodata.page';

const routes: Routes = [
  {
    path: '',
    component: NodataPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NodataPageRoutingModule {}
