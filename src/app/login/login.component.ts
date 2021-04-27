import { Component, OnInit} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { AuthService } from '../auth.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  profileForm = new FormGroup({
    uName: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  }

  loginPersonal() {
    this.authService.loginPersonal(this.profileForm.value['uName'], this.profileForm.value['password']);
  }

  login() {
    this.authService.login();
  }

}
