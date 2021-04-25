import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggedIn: boolean;
  redirectUrl: string;

  constructor (
    public router: Router
  ) {
    this.isLoggedIn = false;
    this.redirectUrl = "";
  }

  login(): Observable<boolean> { // la logica di autenticazione va qua
    return of(true).pipe(
      delay(1000),
      tap(val => {
        this.isLoggedIn = true;
        this.router.navigate([this.redirectUrl]);
      })
    );
  }

  logout(): void {
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

}
