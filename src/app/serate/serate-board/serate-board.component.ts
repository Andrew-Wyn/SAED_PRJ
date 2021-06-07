import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable, of } from 'rxjs';

import { UserInfoService } from '../../user-info.service'
import { SerateService } from '../serate.service'

import { BandServ } from '../bandServ'
import { BandServSearchOpt } from '../bandServSearchOpt'

import * as GLOBALCONFIG from '../../global-config'

@Component({
  selector: 'app-serate-board',
  templateUrl: './serate-board.component.html',
  styleUrls: ['./serate-board.component.css']
})
export class SerateBoardComponent implements OnInit {

  bandServs$: BandServ[] = [];

  bandServsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'bandservs/photos/';

  bandServSearchOpt = new FormGroup({
    name: new FormControl(undefined),
    band_type: new FormControl(undefined),
    description: new FormControl(undefined),
    date: new FormControl(undefined),
    start: new FormControl(undefined),
    end: new FormControl(undefined)
  });

  constructor(private serateService: SerateService, public userInfoService: UserInfoService) { }
  ngOnInit(): void {
    this.search();
  }

  private updateBandServs(band_serv_id?: number) {
    this.serateService.getBandServ(band_serv_id).subscribe(modifiedBandServ => {
      let objIndex = this.bandServs$.findIndex((bandServItem => bandServItem.band_serv_id == band_serv_id));
      this.bandServs$[objIndex] = modifiedBandServ;
      console.log(this.bandServs$);
    });

  }

  // Push a search term into the observable stream.
  search(): void {
    this.serateService.searchBandServs(this.bandServSearchOpt.value as BandServSearchOpt).subscribe(result => {
      console.log(result.results);
      this.bandServs$ = result.results;
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
