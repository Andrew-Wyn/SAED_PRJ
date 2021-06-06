import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { OAuthService, NullValidationHandler } from 'angular-oauth2-oidc'
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

import { authPasswordFlowConfig } from './auth-password-flow.config'
import { googleAuthConfig } from './auth-google.config'
import { UserInfoService } from './user-info.service'

import * as GLOBALCONFIG from './global-config'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  redirectUrl: string;
  claims: object | undefined;

  sessionConfigured: boolean = false;

  userName?: string;
  password?: string;

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
      this.sessionConfigured = true

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
  }

  private configureSession() {
    console.log(typeof this.oauthService.getAccessToken());
    this.http.put<any>(`${GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute}session`, {token:this.oauthService.getAccessToken()} as any, this.httpOptions)
    .pipe(
      tap(_ => console.log('configured session')),
      catchError(this.handleError<any>('configureSession'))
    ).subscribe(_ => this.userInfoService.setUserInfo());
  }
  
  initConfig() {
    if (sessionStorage.getItem('oauthType') == 'google') {
      this.oauthGoogleConfig();
    } else { // another type of loggin done or default (personal)
      this.oauthPasswordFlowConfig();
    }
  }

  oauthGoogleConfig() {
    this.oauthService.configure(googleAuthConfig);
    this.oauthService.setupAutomaticSilentRefresh();
    this.oauthService.tryLogin({
      onTokenReceived: context => {
        console.log("logged sucessfull...");
        this.configureSession();
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

  loginPersonal(uName: string, password: string) {
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
        //this.userInfoService.setUserInfo();
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
    this.logOutSession().subscribe(_ => {
      console.log("loggin out ... ");
      this.router.navigate(['/login']);
    });
  }

  logOutSession() {
    return this.http.delete<any>(`${GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute}session`, this.httpOptions);
  }

  isLoggedInSession() {
    return this.http.get<any>(`${GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute}session`, this.httpOptions);
  }

}
