import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { UserInfoService } from '../user-info.service';
import { Location } from '@angular/common';

import { UserInfo } from '../userInfo'
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  @Input() userInfo?: UserInfo;

  constructor(public userInfoService: UserInfoService, private location: Location, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getUserInfo();
  }

  getUserInfo() {
    // pensare di copiare l'oggetto user info dal servizio senza richiamare il backend
    this.userInfoService.retriveUserInfo().subscribe(userInfo => {
      setTimeout(() => {
        this.userInfo=userInfo
      }, 500);
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
          this.userInfo.picture = reader.result;
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
    this.userInfoService.deleteUser(this.userInfo?.email).subscribe(() => this.goBack());
  }

}
