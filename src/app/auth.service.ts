import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { OAuthService } from 'angular-oauth2-oidc'

import { authPasswordFlowConfig } from './auth-password-flow.config'
import { googleAuthConfig } from './auth-google.config'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  redirectUrl: string;
  userProfile: object | undefined;

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

  oauthGoogleConfig() {
    this.oauthService.configure(googleAuthConfig);
    this.oauthService.redirectUri = window.location.origin + '/',
    this.oauthService.loadDiscoveryDocumentAndTryLogin()
  }

  oauthPasswordFlowConfig() {
    this.oauthService.configure(authPasswordFlowConfig);
    this.oauthService.loadDiscoveryDocument();
  }

  loadUserProfile(): void {
    this.oauthService.loadUserProfile().then(up => (this.userProfile = up));
  }

  get access_token() {
    return this.oauthService.getAccessToken();
  }

  get access_token_expiration() {
    return this.oauthService.getAccessTokenExpiration();
  }

  loginPersonal() { // la logica di autenticazione va qua
    this.oauthService
      .fetchTokenUsingPasswordFlowAndLoadUserProfile(
        this.userName,
        this.password
      )
      .then(() => {
        console.debug('successfully logged in');
        this.router.navigate([this.redirectUrl]);
      })
      .catch(err => {
        console.error('error logging in', err);
      });
  }

  login() {
    this.oauthGoogleConfig();
    this.oauthService.initImplicitFlow();
  }

  logout(): void {
    this.oauthService.logOut(true);
    this.router.navigate(['/login']);
  }

}
