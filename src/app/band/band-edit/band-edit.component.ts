import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { BandService } from '../band.service';

import * as GLOBALCONFIG from '../../global-config';

@Component({
  selector: 'app-band-edit',
  templateUrl: './band-edit.component.html',
  styleUrls: ['./band-edit.component.css']
})
export class BandEditComponent implements OnInit {

  bandsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'bands/images/';
  idBandModify?: number;
  imageBlob?: string | ArrayBuffer | null;

  valid = false;
  photo?: string | ArrayBuffer | null;

  bandModifyForm = new FormGroup({
    name: new FormControl(undefined),
    description: new FormControl(undefined),
    band_type: new FormControl(undefined),
    seeking: new FormControl(false)
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bandService: BandService,
    private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.idBandModify = JSON.parse(params.get('idBandModify') as any);
      if (this.idBandModify == undefined) {
        this.goBack();
      } else {
        this.bandService.getBand(this.idBandModify).subscribe(
          band => {
            this.bandModifyForm.patchValue({
              name: band.name,
              description: band.description,
              band_type: band.band_type,
              seeking: band.seeking
            });
            this.valid = true;
          }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(["/app/band"]);
  }

  save(): void {
    if (this.imageBlob != undefined) {
      this.bandService.updateBandImage(this.idBandModify, this.imageBlob).subscribe(_ => {
        this.bandService.updateBand(this.idBandModify, this.bandModifyForm.value).subscribe(
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
        this.bandService.updateBand(this.idBandModify, this.bandModifyForm.value).subscribe(
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