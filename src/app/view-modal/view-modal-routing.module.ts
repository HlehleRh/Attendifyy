import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewModalPage } from './view-modal.page';

const routes: Routes = [
  {
    path: '',
    component: ViewModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViewModalPageRoutingModule {}
