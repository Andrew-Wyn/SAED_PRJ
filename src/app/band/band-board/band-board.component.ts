import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { UserInfoService } from '../../user-info.service'
import { BandService } from '../band.service'
import {BandSearchOpt} from '../bandSearchOpt'

import { Band } from '../band'

import * as GLOBALCONFIG from '../../global-config'

@Component({
  selector: 'app-band-board',
  templateUrl: './band-board.component.html',
  styleUrls: ['./band-board.component.css']
})
export class BandBoardComponent implements OnInit {
  bands$: Band[] = [];
  adsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'bands/photos/';

  bandSearchOpt = new FormGroup({
    name: new FormControl(undefined),
    description: new FormControl(undefined),
    band_type: new FormControl(undefined),
    owner: new FormControl(undefined),
    searching: new FormControl(undefined)
  });

  constructor(private bandService: BandService, public userInfoService: UserInfoService) { }

  ngOnInit(): void {
    this.search();
  }

  private updateBandList(band_id?: number) {
    this.bandService.getBand(band_id).subscribe(modifiedBand => {
      let objIndex = this.bands$.findIndex((bandItem => bandItem.band_id == band_id));
      this.bands$[objIndex] = modifiedBand;
    });
  }

  search(): void {
    this.bandService.searchBands(this.bandSearchOpt.value as BandSearchOpt).subscribe(result => {
      console.log(result.results);
      this.bands$ = result.results;
    })
  }

  delete(band_id?: number): void {
    this.bandService.deleteBand(band_id).subscribe();
  }

  addPreference(band_id?: number): void {
    // chiamare end point per la preferenza 'ads/interested/<id>' e modificare valore contact info
    // richiamando nuovamente ads/<id>
    this.bandService.addPreference(band_id).subscribe(_ => {
      this.bandService.getBand(band_id).subscribe(modifiedBand => {
        let objIndex = this.bands$.findIndex((bandItem => bandItem.band_id == band_id));
        this.bands$[objIndex] = modifiedBand;
        console.log(this.bands$);
      });
    });
  }

  deletePreference(band_id?: number): void {
    // chiamare end point per la preferenza con delete
    this.bandService.deletePreference(band_id).subscribe(_ => {
      this.updateBandList(band_id);
    });
  }

  deleteMember(band_id?: number, user_id?: number): void {
    this.bandService.deleteMember(band_id, user_id).subscribe(_ => {
      this.updateBandList(band_id);
    });
  }

  acceptRequest(band_id?: number, user_id?: number): void {
    this.bandService.acceptRequest(band_id, user_id).subscribe(_ => {
      this.updateBandList(band_id);
    });
  }

  declineRequest(band_id?: number, user_id?: number): void {
    this.bandService.declineRequest(band_id, user_id).subscribe(_ => {
      this.updateBandList(band_id);
    });
  }

}