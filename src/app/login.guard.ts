import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkToken();
  }

  checkToken(): Promise<boolean | UrlTree> {
    return new Promise((resolve) => {
      this.authService.isLoggedInSession().subscribe(resp => {
        if (resp.have_session) {
          resolve(this.router.parseUrl('/app/home'));
        } else {
          resolve(true);
        }
      });
    });
  }
}
