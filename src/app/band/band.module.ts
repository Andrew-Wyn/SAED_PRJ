import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BandBoardComponent } from './band-board/band-board.component';
import { BandEditComponent } from './band-edit/band-edit.component';
import { BandPublishComponent } from './band-publish/band-publish.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from '../app-routing.module';

@NgModule({
  declarations: [
    BandBoardComponent,
    BandEditComponent,
    BandPublishComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ]
})
export class BandModule { }
