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
  imageProfileUrl = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute + GLOBALCONFIG.profileImageUrl;

  private apiURL = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute;  // URL to web api
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

      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  // TODO: change name in localSetUserInfo()
  setUserInfo(): void {
    this.http.get<UserInfo>(`${this.apiURL}user_info`)
    .pipe(
      tap(_ => console.log('get user info')),
      catchError(this.handleError<UserInfo>('setUserInfo'))
    ).subscribe(userInfo =>{
      this.userInfo = userInfo;
      console.log(this.userInfo);
    });
  }

  // TODO: change name in getUserInfo()
  retriveUserInfo(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiURL}user_info`)
    .pipe(
      tap(_ => console.log('get user info')),
      catchError(this.handleError<UserInfo>('retriveUserInfo'))
    );
  }

  changeUserinfo(userInfo?: UserInfo): Observable<UserInfo | undefined> {
    return this.http.put<UserInfo>(`${this.apiURL}user_info`, userInfo, this.httpOptions).pipe(
      tap(_ => console.log(`changed user:`))
    );
  }

  deleteUser(): Observable<UserInfo> {
    return this.http.delete<UserInfo>(`${this.apiURL}user_info`)
    .pipe(
      tap(_ => console.log('deleted user')),
      catchError(this.handleError<UserInfo>('deleteUserInfo', this.userInfo))
    );
  }

  updateUserImage(imageBlob?: string | ArrayBuffer | null): Observable<any> {    
    return this.http.put<any>(`${this.apiURL}user_image`, imageBlob)
    .pipe(
      tap(_ => console.log('updated user image')),
      catchError(this.handleError<any>('updateUserImage'))
    );
  }
}
