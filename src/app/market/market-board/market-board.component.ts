import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable, of } from 'rxjs';
import {Location} from '@angular/common'; 

import { UserInfoService } from '../../user-info.service'
import { MarketService } from '../market.service'

import { Ad } from '../ad'
import { AdSearchOpt } from '../adSearchOpt'

import * as GLOBALCONFIG from '../../global-config'
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-market-board',
  templateUrl: './market-board.component.html',
  styleUrls: ['./market-board.component.css']
})
export class MarketBoardComponent implements OnInit {

  ads$: Ad[] = [];

  adsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'ads/images/';

  adSearchOpt = new FormGroup({
    title: new FormControl(undefined),
    min_price: new FormControl(undefined),
    max_price: new FormControl(undefined),
    owner: new FormControl(undefined),
    ad_type: new FormControl(undefined),
    description: new FormControl(undefined),
    rent: new FormControl(false)
  });

  constructor(
    private marketService: MarketService,
    public userInfoService: UserInfoService,
    private route: ActivatedRoute,
    private router: Router
    ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      let id = JSON.parse(params.get('id') as any) as number;
      if (id != null){
        this.searchSingleAd(id);
      } else {
        this.search();
      }
    });
  }

  searchSingleAd(idObj: number) {
    this.marketService.getAd(idObj).subscribe(ad => {
      if (ad != undefined) {
        this.ads$ = [ad]
      } else {
        this.ads$ = []
      }
    });
  }

  search(): void {
    // eliminate url params id from notification calls
    this.router.navigate(["/app/market"]);
    this.marketService.searchAds(this.adSearchOpt.value as AdSearchOpt).subscribe(result => {
      console.log(result.results);
      this.ads$ = result.results;
    })
  }

  delete(id?: number): void {
    this.marketService.deleteAd(id).subscribe(_ => {
      this.search();
    });
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
