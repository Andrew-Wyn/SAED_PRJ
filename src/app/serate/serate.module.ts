import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SerateBoardComponent } from './serate-board/serate-board.component';
import { SerateEditComponent } from './serate-edit/serate-edit.component';
import { SeratePublishComponent } from './serate-publish/serate-publish.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from '../app-routing.module';



@NgModule({
  declarations: [
    SerateBoardComponent,
    SerateEditComponent,
    SeratePublishComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ]
})
export class SerateModule { }
