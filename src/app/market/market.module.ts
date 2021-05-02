import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketBoardComponent } from './market-board/market-board.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarketEditComponent } from './market-edit/market-edit.component';
import { AppRoutingModule } from '../app-routing.module';
import { MaketPublishComponent } from './maket-publish/maket-publish.component';


@NgModule({
  declarations: [
    MarketBoardComponent,
    MarketEditComponent,
    MaketPublishComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ]
})
export class MarketModule { }
