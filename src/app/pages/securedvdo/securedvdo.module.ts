import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SecuredvdoPageRoutingModule } from './securedvdo-routing.module';

import { SecuredvdoPage } from './securedvdo.page';
import { CoreModule } from '../core/core.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CoreModule,
    SecuredvdoPageRoutingModule
  ],
  declarations: [SecuredvdoPage]
})
export class SecuredvdoPageModule {}
