import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketBoardComponent } from './market-board/market-board.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    MarketBoardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class MarketModule { }
