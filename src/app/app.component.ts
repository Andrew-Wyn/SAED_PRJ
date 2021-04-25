import { Component } from '@angular/core';

import { OAuthService } from 'angular-oauth2-oidc';

import { AuthService } from './auth.service'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Musin';

  constructor(private authService: AuthService) {
    authService.oauthPasswordFlowConfig();    
  }

}
