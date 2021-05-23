import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { UserInfoService } from '../user-info.service';
import { Location } from '@angular/common';

import { UserInfo } from '../userInfo'
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import * as GLOBALCONFIG from '../global-config'

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  @Input() userInfo?: UserInfo;

  imageBlob?: string | ArrayBuffer | null;

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
      reader.readAsArrayBuffer(file);
    
      reader.onload = () => {
        if (this.userInfo != undefined){
          this.imageBlob = reader.result;
          (document.getElementById('picture-icon') as HTMLImageElement).src = URL.createObjectURL(file);
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
    if (this.imageBlob != undefined) {
      this.userInfoService.updateUserImage(this.imageBlob).subscribe(_ => {

        this.userInfoService.imageProfileUrl = GLOBALCONFIG.backEndLocation + "/" + GLOBALCONFIG.profileImageUrl + "?t=" + new Date().getTime();

        this.userInfoService.changeUserinfo(this.userInfo).subscribe(userInfoUpdated => {
          this.userInfoService.userInfo = userInfoUpdated;
          this.goBack();
        });
      });
    } else {
      this.userInfoService.changeUserinfo(this.userInfo).subscribe(userInfoUpdated => {
        this.userInfoService.userInfo = userInfoUpdated;
        this.goBack();
      });
    }
  }  

  delete() {
    this.userInfoService.deleteUser().subscribe(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    });
  }

}
