import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap, timeout } from 'rxjs/operators';

import { UserInfo } from './userInfo';


@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  userInfo?: UserInfo;

  private url = 'api/';  // URL to web api
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };  

  constructor(private http: HttpClient) { }

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


  getUserInfo(email: string): void {
    /* var typeAuth = sessionStorage.getItem('oauthType');
    this.http.get<UserInfo>(`${this.url}/get_user_info/${email}?type=${typeAuth}`)
    .pipe(
      tap(_ => console.log('fetched heroes')),
      catchError(this.handleError<UserInfo>('getHeroes'))
    ).subscribe(userInfo => this.userInfo = userInfo); */
    of({
      id: 1,
      userName: "Pinco Pallo (Google)",
      email: "google acc email",
      dataNascita: "google nato ieri",
      picture: "https://img.icons8.com/cotton/2x/circled-down--v2.png",
      musicista: true,
      propLoc: false,
      fornStrum: false
    }).subscribe(userInfo => {
      
      setTimeout( () => { console.log("a"); this.userInfo = userInfo; console.log("b")
    }, 1000 );
      
    });
  }

  changeUserinfo(userInfo: UserInfo): Observable<UserInfo> {
    return this.http.post<UserInfo>(`${this.url}/update_user_info`, userInfo, this.httpOptions).pipe(
      tap((userInfoUpdated: UserInfo) => console.log(`added hero w/ id=${userInfoUpdated.id}`)),
      catchError(this.handleError<UserInfo>('addHero'))
    );
  }
}
