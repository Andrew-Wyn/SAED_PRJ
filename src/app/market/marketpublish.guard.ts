import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserInfoService } from '../user-info.service';

@Injectable({
  providedIn: 'root'
})
export class MarketpublishGuard implements CanActivate {

  constructor (private userInfoService: UserInfoService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkIsInsrtrumentSupplier();
  }

  checkIsInsrtrumentSupplier(): Promise<boolean | UrlTree> {
    return new Promise((resolve) => {
      this.userInfoService.retriveUserInfo().subscribe(userInfo => {
        if (userInfo.instrument_supplier) {
          resolve(true);
        } else {
          resolve(this.router.parseUrl('/app/home'));
        }
      });
    });
  
  }
  
}
