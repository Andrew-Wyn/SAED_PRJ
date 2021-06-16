import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { MarketService } from '../market.service';

import * as GLOBALCONFIG from '../../global-config';

@Component({
  selector: 'app-market-edit',
  templateUrl: './market-edit.component.html',
  styleUrls: ['./market-edit.component.css']
})
export class MarketEditComponent implements OnInit {
  
  adsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'ads/images/';
  idAdModify?: number;
  imageBlob?: string | ArrayBuffer | null;

  valid = false;
  photo?: string | ArrayBuffer | null;

  adModifyForm = new FormGroup({
    title: new FormControl(undefined),
    price: new FormControl(undefined),
    owner: new FormControl(undefined),
    ad_type: new FormControl(undefined),
    description: new FormControl(undefined),
    rent: new FormControl(false)
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private marketService: MarketService,
    private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.idAdModify = JSON.parse(params.get('idAdModifiy') as any);
      console.log(this.idAdModify);
      if (this.idAdModify == undefined) {
        this.goBack();
      } else {
        this.marketService.getAd(this.idAdModify).subscribe(
          ad => {
            this.adModifyForm.patchValue({
              title: ad.title,
              price: ad.price,
              owner: ad.owner,
              ad_type: ad.ad_type,
              description: ad.description,
              rent: ad.rent
            });
            this.valid = true;
          }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(["/app/market"]);
  }

  save(): void {
    if (this.imageBlob != undefined) {
      this.marketService.updateAdImage(this.idAdModify, this.imageBlob).subscribe(_ => {

        this.marketService.updateAd(this.idAdModify, this.adModifyForm.value).subscribe(
          _ => {
            this.goBack();
          },
          (error) => {
            console.log(error);
            alert("Errore " + error.statusText);
            this.goBack();
          });
      });
    } else {
        this.marketService.updateAd(this.idAdModify, this.adModifyForm.value).subscribe(
          _ => {
            this.goBack();
          },
          (error) => {
            console.log(error);
            alert("Errore " + error.statusText);
            this.goBack();
          });
    }
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
