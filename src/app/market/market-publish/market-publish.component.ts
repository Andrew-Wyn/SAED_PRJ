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
  imageBlob?: string | ArrayBuffer | null;

  adNewForm = new FormGroup({
    title: new FormControl(undefined),
    description: new FormControl(undefined),
    price: new FormControl(undefined),
    ad_type: new FormControl(undefined),
  });

  constructor(private marketService: MarketService, private location: Location, private userInfoService: UserInfoService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.go("/app/market");
  }

  save() {
    // create Ad object to load into api
    let newAd = {
      title: this.adNewForm.value['title'],
      description: this.adNewForm.value['description'],
      price: this.adNewForm.value['price'],
      ad_type: this.adNewForm.value['ad_type'],  
    } as Ad

    this.marketService.addAd(newAd).subscribe(
      response => {
        if (this.imageBlob != undefined) {
          this.marketService.updateAdImage(response.ad_id, this.imageBlob).subscribe(_ => {
            this.goBack();
          });    
        } else {
          this.goBack();
        }
      },
      (error) => {
        console.log(error);
        this.goBack();
      });
  }

  onFileChange(event: any) {
    let reader = new FileReader();
   
    if(event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsArrayBuffer(file);
    
      reader.onload = () => {
        this.imageBlob = reader.result;
        (document.getElementById('picture-icon') as HTMLImageElement).src = URL.createObjectURL(file);
        // need to run CD since file load runs outside of zone
        this.cd.markForCheck();
      };
    }  
  }
}
