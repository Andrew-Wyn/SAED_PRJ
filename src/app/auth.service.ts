import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { OAuthService, NullValidationHandler } from 'angular-oauth2-oidc'

import { authPasswordFlowConfig } from './auth-password-flow.config'
import { googleAuthConfig } from './auth-google.config'
import { UserInfoService } from './user-info.service'

import { UserInfo } from './userInfo'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  redirectUrl: string;
  claims: object | undefined;

  userName?: string;
  password?: string;

  constructor (
    private router: Router,
    private oauthService: OAuthService,
    private userInfoService: UserInfoService
  ) {
    this.redirectUrl = "";

    // this.userName = "max";
    // this.password = "geheim";

    if (this.hasValidAccessToken) {
      // chiamare endpoint /api/get_user_info
      // mettere un cockie di sessione per user info o richiamare ?
      this.userInfoService.getUserInfo(this.email);
    }
  }

  initConfig() {
    if (sessionStorage.getItem('oauthType') == 'google') {
      
      this.oauthGoogleConfig();
      /*
        controllo per evitare di configurare google qual'ora
        si è settata la chiave di sessione ma non si è richiesto il token
        in tal caso si deve eliminare la scelta precedente (cookie google)
        e settare la configurazione di login personale, se invece abbiamo anche un
        token allora in tal caso significa che siamo nel flusso di google e dobbiamo
        lasciare caricata la configurazione di google.
        Per vedere se il token google è valido dobbiamo prima caricare la configurazione relativa. 
      */
      if (this.oauthService.hasValidAccessToken()) {
        console.log("google");
        return;
      }
      sessionStorage.removeItem('oauthType');
    }
    console.log("personal");
    this.oauthPasswordFlowConfig();
  }

  oauthGoogleConfig() {
    this.oauthService.configure(googleAuthConfig);
    this.oauthService.setupAutomaticSilentRefresh();
    this.oauthService.tryLogin({
      onTokenReceived: context => {
        // chiamare endpoint /api/get_user_info
        console.log("logged sucessfull...");
        this.userInfoService.getUserInfo(this.email);
      }
    });
  }

  oauthPasswordFlowConfig() {
    this.oauthService.configure(authPasswordFlowConfig);
    this.oauthService.setupAutomaticSilentRefresh();
    this.oauthService.loadDiscoveryDocument();
  }

  get email() {
    return (this.oauthService.getIdentityClaims as any)["email"];
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

  loginPersonal(uName: string, password: string) { // la logica di autenticazione va qua
    console.log(uName);
    console.log(password);
    this.oauthService
      .fetchTokenUsingPasswordFlowAndLoadUserProfile(
        uName,
        password
      )
      .then(() => {
        // chiamare endpoint /api/get_user_info
        console.log("logged sucessfull...");
        this.userInfoService.getUserInfo(this.email);
        this.router.navigate([this.redirectUrl]);
      })
      .catch(() => {
        console.error("credenziali errate");
        alert("Credenziali errate");
      });
  }

  login() {
    this.oauthGoogleConfig();
    this.oauthService.tokenValidationHandler = new NullValidationHandler();
    this.oauthService.loadDiscoveryDocumentAndLogin();
    sessionStorage.setItem('oauthType', 'google');
  }

  logout(): void {
    this.oauthService.logOut();
    sessionStorage.removeItem('oauthType');
    this.initConfig();
    this.router.navigate(['/login']);
  }

}
