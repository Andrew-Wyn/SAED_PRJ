import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { FormGroup, FormControl } from '@angular/forms';
import { SerateService } from '../serate.service';

import { BandServ } from '../bandServ'
import { Router } from '@angular/router';


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
    start_time: new FormControl(undefined),
    end_time: new FormControl(undefined)
  });

  constructor(
    private serateService: SerateService,
    private router: Router,
    private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  goBack() {
    this.router.navigate(["/app/serate"]);
  }

  save() {
    // create Ad object to load into api
    let newBandServ = {
      name: this.bandServNewForm.value['name'],
      description: this.bandServNewForm.value['description'],
      date: this.bandServNewForm.value['date'],
      band_type: this.bandServNewForm.value['band_type'],
      start_time: this.bandServNewForm.value['start_time'],
      end_time: this.bandServNewForm.value['end_time']
    } as BandServ


    this.serateService.addBandServ(newBandServ).subscribe(
      response => {
        if (this.imageBlob != undefined) {
          this.serateService.updateBandServImage(response.band_serv_id, this.imageBlob).subscribe(_ => {
            this.goBack();
          },
          (error) => {
            console.log(error);
            alert("Errore " + error.statusText);
            this.goBack();
          });    
        } else {
          this.goBack();
        }
      },
      (error) => {
        console.log(error);
        alert("Errore " + error.statusText);
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