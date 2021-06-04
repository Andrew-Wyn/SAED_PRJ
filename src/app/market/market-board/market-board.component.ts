import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable, of } from 'rxjs';

import { UserInfoService } from '../../user-info.service'
import { MarketService } from '../market.service'

import { Ad } from '../ad'
import { AdSearchOpt } from '../adSearchOpt'

import * as GLOBALCONFIG from '../../global-config'

@Component({
  selector: 'app-market-board',
  templateUrl: './market-board.component.html',
  styleUrls: ['./market-board.component.css']
})
export class MarketBoardComponent implements OnInit {

  ads$: Ad[] = [];

  adsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'ads/photos/';

  adSearchOpt = new FormGroup({
    title: new FormControl(undefined),
    minPrice: new FormControl(undefined),
    maxPrice: new FormControl(undefined),
    owner: new FormControl(undefined),
    ad_type: new FormControl(undefined),
    description: new FormControl(undefined)
  });

  constructor(private marketService: MarketService, public userInfoService: UserInfoService) { }
  ngOnInit(): void {
    this.search();
  }

  // Push a search term into the observable stream.
  search(): void {
    this.marketService.searchAds(this.adSearchOpt.value as AdSearchOpt).subscribe(result => {
      console.log(result.results);
      this.ads$ = result.results;
    })
  }

  delete(id?: number): void {
    this.marketService.deleteAd(id).subscribe();
  }
  
  addPreference(id?: number): void {
    // chiamare end point per la preferenza 'ads/interested/<id>' e modificare valore contact info
    // richiamando nuovamente ads/<id>
    this.marketService.addPreference(id).subscribe(_ => {
      this.marketService.getAd(id).subscribe(modifiedAd => {
        let objIndex = this.ads$.findIndex((adItem => adItem.id == id));
        this.ads$[objIndex] = modifiedAd;
        console.log(this.ads$);
      });
    });
  }

  deletePreference(id?: number): void {
    // chiamare end point per la preferenza con delete
    this.marketService.deletePreference(id).subscribe(_ => {
      this.marketService.getAd(id).subscribe(modifiedAd => {
        let objIndex = this.ads$.findIndex((adItem => adItem.id == id));
        this.ads$[objIndex] = modifiedAd;
      });
    });
  }

}
