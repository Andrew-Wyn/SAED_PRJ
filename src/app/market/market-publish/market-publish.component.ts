import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

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

  photo?: string | ArrayBuffer | null;

  adNewForm = new FormGroup({
    title: new FormControl(undefined),
    price: new FormControl(undefined),
    photo: new FormControl(undefined),
    type: new FormControl(undefined),
  });

  constructor(private marketService: MarketService, private location: Location, private userInfoService: UserInfoService, private cd: ChangeDetectorRef) { }

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
      photo: this.photo,
      owner: this.userInfoService.userInfo?.name,
      ownerId: this.userInfoService.userInfo?.id,
      type: this.adNewForm.value['type'],  
    } as Ad
    console.log(newAd);
    this.marketService.addAd(newAd).subscribe();
  }

  onFileChange(event: any) {
    let reader = new FileReader();
   
    if(event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
    
      reader.onload = () => {
        this.photo = reader.result;
        
        // need to run CD since file load runs outside of zone
        this.cd.markForCheck();
      };
    }
  }
  

}
