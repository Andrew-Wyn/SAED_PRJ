import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';

import { Ad } from '../ad'
import { MarketService } from '../market.service';

@Component({
  selector: 'app-market-edit',
  templateUrl: './market-edit.component.html',
  styleUrls: ['./market-edit.component.css']
})
export class MarketEditComponent implements OnInit {

  adModify?: Ad;

  valid = false;
  photo?: string | ArrayBuffer | null;

  adModifyForm = new FormGroup({
    title: new FormControl(undefined),
    price: new FormControl(undefined),
    photo: new FormControl(undefined),
    owner: new FormControl(undefined),
    type: new FormControl(undefined),
  });

  constructor(private route: ActivatedRoute, private location: Location, private marketService: MarketService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.adModify = JSON.parse(params.get('adModifiy') as any);

      if (this.adModify == undefined) {
        this.location.back();
      } else {
        // to delete
        this.adModifyForm.patchValue({
          title: this.adModify?.title,
          price: this.adModify?.price,
          photo: this.adModify?.photo,
          owner: this.adModify?.owner,
          type: this.adModify?.type
        });
        this.valid = true;
        /*this.marketService.getAd(this.adModify?.id).subscribe(
          ad => {
            if (ad != this.adModify) {
              this.location.back();
            } else {
              console.log(this.adModify?.id);
              this.adModifyForm.patchValue({
                title: this.adModify?.title,
                price: this.adModify?.price,
                photo: this.adModify?.photo,
                owner: this.adModify?.owner,
                type: this.adModify?.type
              });
              this.valid = true;
            }
          }
        );*/
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  save(): void {
    this.marketService.updateAd(this.adModifyForm.value).subscribe(() => {
      this.goBack();
    });
  }

  onFileChange(event: any) {
    let reader = new FileReader();
   
    if(event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
    
      reader.onload = () => {
        this.adModifyForm.value.photo = reader.result;
        
        // need to run CD since file load runs outside of zone
        this.cd.markForCheck();
      };
    }
  }


}
