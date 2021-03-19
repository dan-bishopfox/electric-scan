import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxDropzoneModule } from 'ngx-dropzone';

import { BaseMaterialModule } from './base-materials';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EyeBallerComponent } from './components/eyeballer/eyeballer.component';

@NgModule({
  declarations: [
    AppComponent,
    EyeBallerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxDropzoneModule,
    BrowserAnimationsModule,
    BaseMaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
