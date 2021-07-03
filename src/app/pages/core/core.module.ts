import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPage } from './header/header.page';
import { FooterPage } from './footer/footer.page';
import {RouterModule} from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    HeaderPage,
    FooterPage,
  ],
  exports:[
    HeaderPage, 
    FooterPage,
    CommonModule,
  ],
  
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CoreModule { }
