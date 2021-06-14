import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { SerateService } from '../serate.service';

import * as GLOBALCONFIG from '../../global-config';

@Component({
  selector: 'app-serate-edit',
  templateUrl: './serate-edit.component.html',
  styleUrls: ['./serate-edit.component.css']
})
export class SerateEditComponent implements OnInit {

  bandServsImageUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + 'band_servs/images/';
  idBandServModify?: number;
  imageBlob?: string | ArrayBuffer | null;

  valid = false;
  photo?: string | ArrayBuffer | null;

  bandServModifyForm = new FormGroup({
    name: new FormControl(undefined),
    band_type: new FormControl(undefined),
    description: new FormControl(undefined),
    date: new FormControl(undefined),
    start_time: new FormControl(undefined),
    end_time: new FormControl(undefined)
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serateService: SerateService,
    private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.idBandServModify = JSON.parse(params.get('idBandServModify') as any);
      console.log(this.idBandServModify);
      if (this.idBandServModify == undefined) {
        this.goBack();
      } else {
        this.serateService.getBandServ(this.idBandServModify).subscribe(
          bandServ => {
            this.bandServModifyForm.patchValue({
              name: bandServ.name,
              band_type: bandServ.band_type,
              date: bandServ.date, // TODO: convert date to string
              start_time: bandServ.start_time,
              end_time: bandServ.end_time,
              description: bandServ.description
            });
            this.valid = true;
          }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(["/app/serate"]);
  }

  save(): void {
    if (this.imageBlob != undefined) {
      this.serateService.updateBandServImage(this.idBandServModify, this.imageBlob).subscribe(_ => {

        this.serateService.updateBandServ(this.idBandServModify, this.bandServModifyForm.value).subscribe(
          _ => {
            this.goBack();
          },
          (error) => {
            console.log(error);
            this.goBack();
          });
      });
    } else {
        this.serateService.updateBandServ(this.idBandServModify, this.bandServModifyForm.value).subscribe(
          _ => {
            this.goBack();
          },
          (error) => {
            console.log(error);
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
