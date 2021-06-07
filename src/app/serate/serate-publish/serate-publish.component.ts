import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { SerateService } from '../serate.service';

import { BandServ } from '../bandServ'
import { UserInfoService } from 'src/app/user-info.service';


@Component({
  selector: 'app-serate-publish',
  templateUrl: './serate-publish.component.html',
  styleUrls: ['./serate-publish.component.css']
})
export class SeratePublishComponent implements OnInit {

  photo?: string | ArrayBuffer | null;
  imageBlob?: string | ArrayBuffer | null;

  bandServNewForm = new FormGroup({
    name: new FormControl(undefined),
    description: new FormControl(undefined),
    date: new FormControl(undefined),
    band_type: new FormControl(undefined),
    start: new FormControl(undefined),
    end: new FormControl(undefined)
  });

  constructor(private serateService: SerateService, private location: Location, private userInfoService: UserInfoService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.back();
  }

  save() {
    // create Ad object to load into api
    let newAd = {
      name: this.bandServNewForm.value['name'],
      description: this.bandServNewForm.value['description'],
      date: this.bandServNewForm.value['date'], // TODO: convertire data in stringa
      band_type: this.bandServNewForm.value['band_type'],
      start: this.bandServNewForm.value['start'],
      end: this.bandServNewForm.value['end']
    } as BandServ

    this.serateService.addBandServ(newAd).subscribe(
      response => {
        if (this.imageBlob != undefined) {
          this.serateService.updateBandServImage(response.band_serv_id, this.imageBlob).subscribe(_ => {
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