import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StandardvdoPageRoutingModule } from './standardvdo-routing.module';

import { StandardvdoPage } from './standardvdo.page';
import { CoreModule } from '../core/core.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CoreModule,
    StandardvdoPageRoutingModule
  ],
  declarations: [StandardvdoPage]
})
export class StandardvdoPageModule {}
