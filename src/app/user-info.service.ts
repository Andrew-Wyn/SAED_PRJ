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

  setUserInfo(email?: string): void {
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
      fornStrum: true
    }).subscribe(userInfo => {
      
      setTimeout( () => { this.userInfo = userInfo;}, 500 );
      
    });
  }



  retriveUserInfo(email?: string): Observable<UserInfo> {
    /* var typeAuth = sessionStorage.getItem('oauthType');
    this.http.get<UserInfo>(`${this.url}/get_user_info/${email}?type=${typeAuth}`)
    .pipe(
      tap(_ => console.log('fetched heroes')),
      catchError(this.handleError<UserInfo>('getHeroes'))
    ).subscribe(userInfo => this.userInfo = userInfo); */
    return of({
      id: 1,
      userName: "Pinco Pallo (Google)",
      email: "google acc email",
      dataNascita: "google nato ieri",
      picture: "https://img.icons8.com/cotton/2x/circled-down--v2.png",
      musicista: true,
      propLoc: false,
      fornStrum: false
    });
  }

  changeUserinfo(userInfo?: UserInfo): Observable<UserInfo> {
    return this.http.patch<UserInfo>(`${this.url}/update_user_info`, userInfo, this.httpOptions).pipe(
      tap((userInfoUpdated: UserInfo) => console.log(`changed user: w/ id=${userInfoUpdated.id}`)),
      catchError(this.handleError<UserInfo>('changeUserInfo', this.userInfo))
    );
  }

  deleteUser(email?: string): Observable<UserInfo> {
    var typeAuth = sessionStorage.getItem('oauthType');
    return this.http.delete<UserInfo>(`${this.url}/get_user_info/${email}?type=${typeAuth}`)
    .pipe(
      tap(_ => console.log('deleted user')),
      catchError(this.handleError<UserInfo>('deleteUserInfo'))
    );
  }
}
