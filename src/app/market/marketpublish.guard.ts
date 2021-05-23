import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { UserInfoService } from '../user-info.service';

@Injectable({
  providedIn: 'root'
})
export class MarketpublishGuard implements CanActivate {

  constructor (private userInfoService: UserInfoService, private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkIsFornStrum();
  }

  checkIsFornStrum(): boolean | UrlTree {
    // TODO rivedere logica di guardia
    if (this.userInfoService.userInfo == undefined || !this.userInfoService.userInfo.instrument_supplier) {
      // Redirect to the home page
      return this.router.parseUrl('/app/home');
    }
    return true;
  }
  
}
