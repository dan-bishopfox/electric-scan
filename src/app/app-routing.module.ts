import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EyeBallerComponent } from './components/eyeballer/eyeballer.component';

const routes: Routes = [
  { path: '', component: EyeBallerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
