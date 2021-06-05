import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service'
import { UserInfoService } from './user-info.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService,
              private userInfoService: UserInfoService,
              private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const url: string = state.url;

      return this.checkLogin(url);
  }
  
  checkLogin(url: string): Promise<true|UrlTree> {
    return new Promise((resolve) => {
      this.authService.isLoggedInSession().subscribe(resp => {
        if (resp.have_session) {
          this.userInfoService.setUserInfo()
          resolve(true);
        } else {
          // necessario quando vengo rimbalzato dal sistema di oauth
          if (this.authService.hasValidAccessToken) {
            resolve(true);
          } else {
            resolve(this.router.parseUrl('/login'));
          }
        }
      });
    });
  }
}
