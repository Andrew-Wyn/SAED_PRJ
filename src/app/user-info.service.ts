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
  imageProfileUrl = GLOBALCONFIG.backEndLocation + "/" + GLOBALCONFIG.profileImageUrl;

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

      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  // TODO: change name in localSetUserInfo()
  setUserInfo(): void {
    this.http.get<UserInfo>(`${GLOBALCONFIG.backEndLocation}/api/user_info`)
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
    return this.http.get<UserInfo>(`${GLOBALCONFIG.backEndLocation}/api/user_info`)
    .pipe(
      tap(_ => console.log('get user info')),
      catchError(this.handleError<UserInfo>('retriveUserInfo'))
    );
  }

  changeUserinfo(userInfo?: UserInfo): Observable<UserInfo | undefined> {
    return this.http.patch<UserInfo>(`${GLOBALCONFIG.backEndLocation}/api/user_info`, userInfo, this.httpOptions).pipe(
      tap((userInfoUpdated: UserInfo) => console.log(`changed user: w/ id=${userInfoUpdated.id}`)),
      catchError(this.handleError<UserInfo>('changeUserInfo', this.userInfo))
    );
  }

  deleteUser(): Observable<UserInfo> {
    return this.http.delete<UserInfo>(`${GLOBALCONFIG.backEndLocation}/api/user_info`)
    .pipe(
      tap(_ => console.log('deleted user')),
      catchError(this.handleError<UserInfo>('deleteUserInfo', this.userInfo))
    );
  }

  updateUserImage(imageBlob?: string | ArrayBuffer | null): Observable<any> {    
    return this.http.put<any>(`${GLOBALCONFIG.backEndLocation}/api/user_image`, imageBlob)
    .pipe(
      tap(_ => console.log('updated user image')),
      catchError(this.handleError<any>('updateUserImage'))
    );
  }
}
