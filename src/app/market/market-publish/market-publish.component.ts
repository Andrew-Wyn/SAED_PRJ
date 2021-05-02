import { Component, OnInit } from '@angular/core';

import { FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { MarketService } from '../market.service';

import { Ad } from '../ad'
import { UserInfoService } from 'src/app/user-info.service';


@Component({
  selector: 'app-market-publish',
  templateUrl: './market-publish.component.html',
  styleUrls: ['./market-publish.component.css']
})
export class MarketPublishComponent implements OnInit {

  adNewForm = new FormGroup({
    title: new FormControl(undefined),
    price: new FormControl(undefined),
    photo: new FormControl(undefined),
    type: new FormControl(undefined),
  });


  constructor(private marketService: MarketService, private location: Location, private userInfoService: UserInfoService) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

  save() {
    // create Ad object to load into api
    let newAd = {
      id: undefined,
      title: this.adNewForm.value['title'],
      price: this.adNewForm.value['price'],
      photo: this.adNewForm.value['photo'],
      owner: this.userInfoService.userInfo?.userName,
      ownerId: this.userInfoService.userInfo?.id,
      type: this.adNewForm.value['type'],  
    } as Ad
    this.marketService.addAd(newAd).subscribe();
  }

}
