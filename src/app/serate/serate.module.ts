import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SerateBoardComponent } from './serate-board/serate-board.component';
import { SerateEditComponent } from './serate-edit/serate-edit.component';
import { SeratePublishComponent } from './serate-publish/serate-publish.component';



@NgModule({
  declarations: [
    SerateBoardComponent,
    SerateEditComponent,
    SeratePublishComponent
  ],
  imports: [
    CommonModule
  ]
})
export class SerateModule { }
