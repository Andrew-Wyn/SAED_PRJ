import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

import { UserInfo } from './userInfo';
import * as GLOBALCONFIG from './global-config'


@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  userInfo?: UserInfo;

  private url = 'api/';  // URL to web api
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };  

  constructor(private http: HttpClient) {}

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

  setUserInfo(): void {
    this.http.get<UserInfo>(`${GLOBALCONFIG.backEndLocation}/api/user_info`)
    .pipe(
      tap(_ => console.log('fetched heroes')),
      catchError(this.handleError<UserInfo>('getHeroes'))
    ).subscribe(userInfo =>{
      this.userInfo = userInfo;
      console.log(this.userInfo);
    });
  }

  retriveUserInfo(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${GLOBALCONFIG.backEndLocation}/api/user_info`)
    .pipe(
      tap(_ => console.log('fetched heroes')),
      catchError(this.handleError<UserInfo>('getHeroes'))
    );
  }

  changeUserinfo(userInfo?: UserInfo): Observable<UserInfo> {
    console.log(userInfo);
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
