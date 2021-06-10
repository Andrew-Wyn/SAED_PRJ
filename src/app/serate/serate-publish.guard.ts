import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserInfoService } from '../user-info.service';

@Injectable({
  providedIn: 'root'
})
export class SeratePublishGuard implements CanActivate {

  constructor(private userInfoService: UserInfoService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return true;
  }

  checkIsClubOwner(): Promise<boolean | UrlTree> {

    return new Promise((resolve) => {
      this.userInfoService.retriveUserInfo().subscribe(userInfo => {
        if (userInfo.club_owner) {  
          resolve(true);
        } else {
          resolve(this.router.parseUrl('/app/home'));
        }
      });
    });
  }
}
