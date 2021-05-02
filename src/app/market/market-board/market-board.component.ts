import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable, of } from 'rxjs';

import { UserInfoService } from '../../user-info.service'
import { MarketService } from '../market.service'

import { Ad } from '../ad'
import { AdSearchOpt } from '../adSearchOpt'

@Component({
  selector: 'app-market-board',
  templateUrl: './market-board.component.html',
  styleUrls: ['./market-board.component.css']
})
export class MarketBoardComponent implements OnInit {
  ads$: Observable<Ad[]> = of([]);

  adSearchOpt = new FormGroup({
    title: new FormControl(undefined),
    minPrice: new FormControl(undefined),
    maxPrice: new FormControl(undefined),
    owner: new FormControl(undefined),
    type: new FormControl(undefined),
  });

  constructor(private marketService: MarketService, public userInfoService: UserInfoService) { }
  ngOnInit(): void {
    console.log(this.userInfoService.userInfo?.id);
    this.search();
  }

  // Push a search term into the observable stream.
  search(): void {
    this.ads$ = this.marketService.searchAds(this.adSearchOpt.value as AdSearchOpt);
  }
  
  delete(id: number): void {
    this.marketService.deleteAd(id).subscribe();
  }

}
