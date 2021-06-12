import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserInfoService } from '../user-info.service';

@Injectable({
  providedIn: 'root'
})
export class SerateEditGuard implements CanActivate {

  constructor(
    private userInfoService: UserInfoService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // tale controllo è necessario per capire se entro nella pagina senza esserci stato portato dalla UX
    // in tal caso torno nella sezione serate
    if (this.userInfoService.userInfo == undefined)
      return this.router.parseUrl('/app/serate');
    return true;
  }
  
}
