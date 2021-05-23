import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth.service'
import { UserInfoService } from '../user-info.service'


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(public authService: AuthService, public userInfoService: UserInfoService) { }

  ngOnInit(): void {
  }

}
