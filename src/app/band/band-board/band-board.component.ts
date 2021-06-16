import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { UserInfoService } from '../../user-info.service'
import { BandService } from '../band.service'
import {BandSearchOpt} from '../bandSearchOpt'

import { Band } from '../band'

import * as GLOBALCONFIG from '../../global-config'
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-band-board',
  templateUrl: './band-board.component.html',
  styleUrls: ['./band-board.component.css']
})
export class BandBoardComponent implements OnInit {
  bands$: Band[] = [];
  adsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'bands/images/';

  bandSearchOpt = new FormGroup({
    name: new FormControl(undefined),
    description: new FormControl(undefined),
    band_type: new FormControl(undefined),
    owner: new FormControl(undefined),
    seeking: new FormControl(false)
  });

  constructor(
    private bandService: BandService,
    private router: Router,
    private route: ActivatedRoute,
    public userInfoService: UserInfoService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      let id = JSON.parse(params.get('id') as any) as number;
      if (id != null){
        this.searchSingleBand(id);
      } else {
        this.search();
      }
    });
  }

  private updateBandList(band_id?: number) {
    this.bandService.getBand(band_id).subscribe(modifiedBand => {
      let objIndex = this.bands$.findIndex((bandItem => bandItem.id == band_id));
      this.bands$[objIndex] = modifiedBand;
    });
  }

  searchSingleBand(idObj: number) {
    this.bandService.getBand(idObj).subscribe(band => {
      if (band != undefined) {
        this.bands$ = [band]
      } else {
        this.bands$ = []
      }
    });
  }

  search(): void {
    // eliminate url params id from notification calls
    this.router.navigate(["/app/band"]);
    console.log(this.bandSearchOpt.value)
    this.bandService.searchBands(this.bandSearchOpt.value as BandSearchOpt).subscribe(result => {
      console.log(result.results);
      this.bands$ = result.results;
    })
  }

  delete(band_id?: number): void {
    this.bandService.deleteBand(band_id).subscribe(_ => {
      this.search();
    });
  }

  addPreference(band_id?: number): void {
    this.bandService.addPreference(band_id).subscribe(_ => {
      this.updateBandList(band_id);
    });
  }

  deletePreference(band_id?: number): void {
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