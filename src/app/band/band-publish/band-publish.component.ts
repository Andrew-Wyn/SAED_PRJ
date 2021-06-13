import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { BandService } from '../band.service';

import { Band } from '../band'
import { UserInfoService } from 'src/app/user-info.service';

@Component({
  selector: 'app-band-publish',
  templateUrl: './band-publish.component.html',
  styleUrls: ['./band-publish.component.css']
})
export class BandPublishComponent implements OnInit {

  photo?: string | ArrayBuffer | null;
  imageBlob?: string | ArrayBuffer | null;

  bandNewForm = new FormGroup({
    name: new FormControl(undefined),
    description: new FormControl(undefined),
    band_type: new FormControl(undefined),
    seeking: new FormControl(undefined),
  });

  constructor(private bandService: BandService, private location: Location, private userInfoService: UserInfoService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  goBack() {
    this.location.go("/app/band");
  }

  save() {
    // create Ad object to load into api
    let newBand = {
      name: this.bandNewForm.value['name'],
      description: this.bandNewForm.value['description'],
      band_type: this.bandNewForm.value['band_type'],
      seeking: this.bandNewForm.value['seeking']
    } as Band

    this.bandService.addBand(newBand).subscribe(
      response => {

        if (this.imageBlob != undefined) {
          this.bandService.updateBandImage(response.band_id, this.imageBlob).subscribe(_ => {
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
