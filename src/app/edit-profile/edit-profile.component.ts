import { Component, OnInit, Input } from '@angular/core';
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

  constructor(public userInfoService: UserInfoService, private location: Location) { }

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
