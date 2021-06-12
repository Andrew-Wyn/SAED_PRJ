import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable, of } from 'rxjs';

import { UserInfoService } from '../../user-info.service'
import { SerateService } from '../serate.service'

import { BandServ } from '../bandServ'
import { BandServSearchOpt } from '../bandServSearchOpt'

import * as GLOBALCONFIG from '../../global-config'
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-serate-board',
  templateUrl: './serate-board.component.html',
  styleUrls: ['./serate-board.component.css']
})
export class SerateBoardComponent implements OnInit {

  bandServs$: BandServ[] = [];

  bandServsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'bandservs/images/';

  bandServSearchOpt = new FormGroup({
    name: new FormControl(undefined),
    type: new FormControl(undefined),
    description: new FormControl(undefined),
    min_date: new FormControl(undefined),
    max_date: new FormControl(undefined),
  });

  constructor(
    private serateService: SerateService,
    private location: Location,
    private route: ActivatedRoute,
    public userInfoService: UserInfoService) { }
    
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      let id = JSON.parse(params.get('id') as any) as number;
      if (id != null){
        this.searchSingleBandServ(id);
      } else {
        this.search();
      }
    });
  }

  private updateBandServs(band_serv_id?: number) {
    this.serateService.getBandServ(band_serv_id).subscribe(modifiedBandServ => {
      let objIndex = this.bandServs$.findIndex((bandServItem => bandServItem.band_serv_id == band_serv_id));
      this.bandServs$[objIndex] = modifiedBandServ;
      console.log(this.bandServs$);
    });

  }

  searchSingleBandServ(idObj: number) {
    this.serateService.getBandServ(idObj).subscribe(bendServ => {
      this.bandServs$ = [bendServ]
    });
  }

  // Push a search term into the observable stream.
  search(): void {
    this.location.go("/app/bandServ")
    this.serateService.searchBandServs(this.bandServSearchOpt.value as BandServSearchOpt).subscribe(result => {
      this.bandServs$ = result.results;
      console.log("ritornati", this.bandServs$)
    })
  }

  delete(id?: number): void {
    this.serateService.deleteBandServ(id).subscribe();
  }
  
  addPreference(band_serv_id?: number): void {
    // chiamare end point per la preferenza 'ads/interested/<id>' e modificare valore contact info
    // richiamando nuovamente ads/<id>
    this.serateService.addPreference(band_serv_id).subscribe(_ => {
      this.updateBandServs(band_serv_id);
    });
  }

  deletePreference(band_serv_id?: number): void {
    // chiamare end point per la preferenza con delete
    this.serateService.deletePreference(band_serv_id).subscribe(_ => {
      this.updateBandServs(band_serv_id);
    });
  }

}
