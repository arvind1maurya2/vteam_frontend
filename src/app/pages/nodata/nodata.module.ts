import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NodataPageRoutingModule } from './nodata-routing.module';

import { NodataPage } from './nodata.page';
import { CoreModule } from '../core/core.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CoreModule,
    NodataPageRoutingModule
  ],
  declarations: [NodataPage]
})
export class NodataPageModule {}
