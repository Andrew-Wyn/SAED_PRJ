import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { OAuthService, NullValidationHandler } from 'angular-oauth2-oidc'
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

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

  private urlConfigureSession = 'api/configure_session';  // URL to web api
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json'}),
  };

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
   private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  constructor (
    private router: Router,
    private oauthService: OAuthService,
    private userInfoService: UserInfoService,
    private http: HttpClient
  ) {
    this.redirectUrl = "";
    if (this.hasValidAccessToken) {
      // chiamare endpoint /api/get_user_info
      // mettere un cockie di sessione per user info o richiamare ?
      this.userInfoService.setUserInfo(this.email);
    }
  }

  private configureSession() {
    this.http.post<any>(`http://localhost:8080/saed/${this.urlConfigureSession}`, {auth_token:this.oauthService.getAccessToken()} as any, this.httpOptions)
    .pipe(
      tap(_ => console.log('configured session')),
      catchError(this.handleError<any>('configureSession'))
    ).subscribe();
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
        this.configureSession();
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
        this.configureSession();
        this.userInfoService.setUserInfo(this.email);
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
        this.configureSession();
        this.userInfoService.setUserInfo(this.email);
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
