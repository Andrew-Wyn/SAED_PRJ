import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { OAuthService, NullValidationHandler } from 'angular-oauth2-oidc'

import { authPasswordFlowConfig } from './auth-password-flow.config'
import { googleAuthConfig } from './auth-google.config'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  redirectUrl: string;
  claims: object | undefined;

  userName: string;
  password: string;

  constructor (
    private router: Router,
    private oauthService: OAuthService
  ) {
    this.redirectUrl = "";

    this.userName = "max";
    this.password = "geheim";
  }

  initConfig() {
    if (sessionStorage.getItem('oauthType') == 'google') {
      console.log("google");
      this.oauthGoogleConfig();
    } else {
      console.log("personal");
      this.oauthPasswordFlowConfig();
    } 

  }

  oauthGoogleConfig() {
    this.oauthService.configure(googleAuthConfig);
    this.oauthService.loadDiscoveryDocument();
    this.oauthService.setupAutomaticSilentRefresh();
    this.oauthService.tryLogin();
  }

  oauthPasswordFlowConfig() {
    this.oauthService.configure(authPasswordFlowConfig);
    this.oauthService.loadDiscoveryDocument();
    this.oauthService.setupAutomaticSilentRefresh();
  }

  get email() {
    return (this.oauthService.getIdentityClaims() as any)['email']
  }

  get picture() {
    return (this.oauthService.getIdentityClaims() as any)['picture']
  }

  get accessToken() {
    return this.oauthService.getAccessToken();
  }

  get accessTokenExpiration() {
    return this.oauthService.getAccessTokenExpiration();
  }

  get hasValidAccessToken() {
    return this.oauthService.hasValidAccessToken();
  }

  loginPersonal() { // la logica di autenticazione va qua
    this.oauthService
      .fetchTokenUsingPasswordFlowAndLoadUserProfile(
        this.userName,
        this.password
      )
      .then(() => {
        console.debug('successfully logged in');
        this.claims = this.oauthService.getIdentityClaims();
        this.router.navigate([this.redirectUrl]);
      })
      .catch(err => {
        console.error('error logging in', err);
      });
  }

  login() {
    this.oauthGoogleConfig();
    this.oauthService.tokenValidationHandler = new NullValidationHandler();
    this.oauthService.loadDiscoveryDocumentAndLogin();
    sessionStorage.setItem('oauthType', 'google');
  }

  logout(): void {
    this.oauthService.logOut(true);
    sessionStorage.removeItem('oauthType');
    this.initConfig();
    this.router.navigate(['/login']);
  }

}
