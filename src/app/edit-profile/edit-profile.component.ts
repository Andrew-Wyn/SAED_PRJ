import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { UserInfoService } from '../user-info.service';
import { Location } from '@angular/common';

import { UserInfo } from '../userInfo'
import { timeout } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  @Input() userInfo?: UserInfo;

  constructor(public userInfoService: UserInfoService, private location: Location, private cd: ChangeDetectorRef, private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.getUserInfo();
  }

  getUserInfo() {
    // pensare di copiare l'oggetto user info dal servizio senza richiamare il backend
    this.userInfoService.retriveUserInfo().subscribe(userInfo => {
        this.userInfo=userInfo
    });
  }

  onFileChange(event: any) {
    let reader = new FileReader();
   
    if(event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
    
      reader.onload = () => {
        if (this.userInfo != undefined){
          console.log(reader.result);
          //this.userInfo.picture_url = reader.result;
          // inviare richiesta di put dell'immagine, poi richiamare set user e retreive user
        }
        // need to run CD since file load runs outside of zone
        this.cd.markForCheck();
      };
    }
  }
  

  goBack(): void {
    this.location.back();
  }

  save(): void {
    this.userInfoService.changeUserinfo(this.userInfo).subscribe(() => {
      // eseguo anche se fallisce, idempotente ;)
      this.userInfoService.setUserInfo();
      this.goBack();
    });
  }  

  delete() {
    this.userInfoService.deleteUser(this.userInfo?.email).subscribe(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    });
  }

}
