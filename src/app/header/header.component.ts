import { Component, OnInit } from '@angular/core';
import { Observable, of, interval, from } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, repeatWhen, retryWhen, tap } from 'rxjs/operators';


import { AuthService } from '../auth.service'
import { UserInfoService } from '../user-info.service'

import { Notify } from '../notify'

import * as GLOBALCONFIG from '../global-config'
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  private componentMap: {[key: string]: string} = {ad: "market", band: "band", band_service: "serate"}

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

  notifications$: Notify[] = [];
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    public userInfoService: UserInfoService,
    private router: Router
    ) {
  }

  ngOnInit(): void {
    this.getNotify()
  }

  getNotify() {
    const url = `${GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute}notifications`;
    this.http.get<Notify[]>(url)
    .pipe(
      tap(_ => console.log('fetched notify')),
      repeatWhen(() => interval(5000)),
      catchError(this.handleError<Notify[]>('getNotify', []))
    ).subscribe(
      notifications => {
        this.notifications$ = notifications.map(notification => {
          notification.picture_url = GLOBALCONFIG.backEndLocation + notification.picture_url;
          return notification;
        });
        console.log(this.notifications$);  
      }
    );
  }

  logout() {
    this.authService.logout()
  }

  actionNotify(action_url: string) { // action_url = "type;id"
    if (action_url == null) {
      return
    }
    let component = this.componentMap[action_url.split(";")[0]]
    let idObj = action_url.split(";")[1]
    console.log(component, idObj)
    this.router.navigate(['/app/'+component, { id: idObj }]);
  }
}
