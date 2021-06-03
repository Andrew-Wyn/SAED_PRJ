import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Router, UrlSerializer } from '@angular/router';

import { Ad } from './ad'
import { AdSearchOpt } from './adSearchOpt'

import * as GLOBALCONFIG from '../global-config'

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };  

  constructor(private http: HttpClient, private router: Router, private serializer: UrlSerializer) { }

  apiURL = GLOBALCONFIG.backEndLocation + GLOBALCONFIG.backEndRoute;

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

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }


  getAds(): Observable<Ad[]> {
    return this.http.get<Ad[]>(`${this.apiURL}`)
    .pipe(
      tap(_ => console.log('fetched ads')),
      catchError(this.handleError<Ad[]>('getAds', []))
    );
  }

  getAd(id?: number): Observable<Ad> {
    const url = `${this.apiURL}ads/${id}`;
    return this.http.get<Ad>(url).pipe(
      tap(_ => console.log(`fetched hero id=${id}`)),
      catchError(this.handleError<Ad>(`getAd id=${id}`))
    );
  }

  updateAd(ad?: Ad): Observable<any> {
    return this.http.put(`${this.apiURL}ads`, ad, this.httpOptions).pipe(
      tap(_ => console.log(`updated ad id=${ad!.id}`)),
      catchError(this.handleError<any>('updateAd'))
    );  
  }

  addAd(ad: Ad): Observable<any> {
    console.log(ad);
    return this.http.post<any>(`${this.apiURL}ads`, ad, this.httpOptions).pipe(
      tap((ad: any) => console.log(`added ad w/ id=${ad.id}`)),
      catchError(this.handleError<any>('addAd'))
    );
  }

  deleteAd(id?: number): Observable<Ad> {
    return this.http.delete<Ad>(`${this.apiURL}${id}ads`, this.httpOptions).pipe(
      tap(_ => console.log(`deleted ad id=${id}`)),
      catchError(this.handleError<Ad>('deleteAd'))
    );
  }

  searchAds(terms?: AdSearchOpt): Observable<any> {
    let tree = this.router.createUrlTree(["/"], { queryParams: terms });
    let serializedTree = this.serializer.serialize(tree).split("/")[1]
    console.log(`${this.apiURL}ads${serializedTree}`);
    return this.http.get<any>(`${this.apiURL}ads${serializedTree}`).pipe(
      tap(x => x.length ?
        console.log(`found ads matching`) :
        console.log(`no ads matching`, x)),
      catchError(this.handleError<any>('searchAds', []))
    );
  }

  updateAdImage(idAd?: number, imageBlob?: string | ArrayBuffer | null): Observable<any> {    
    return this.http.put<any>(`${this.apiURL}ads/photos/${idAd}`, imageBlob)
    .pipe(
      tap(_ => console.log('updated user image')),
      catchError(this.handleError<any>('updateUserImage'))
    );
  }
}