import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViewModalPageRoutingModule } from './view-modal-routing.module';

import { ViewModalPage } from './view-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ViewModalPageRoutingModule
  ],
  declarations: [ViewModalPage]
})
export class ViewModalPageModule {}
