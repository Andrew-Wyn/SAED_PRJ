import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

import { Ad } from './ad'
import { AdSearchOpt } from './adSearchOpt'

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  private marketUrl = 'api/heroes';  // URL to web api
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

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }


  getAds(): Observable<Ad[]> {
    return this.http.get<Ad[]>(this.marketUrl)
    .pipe(
      tap(_ => console.log('fetched ads')),
      catchError(this.handleError<Ad[]>('getAds', []))
    );
  }

  /** GET ad by id. Will 404 if id not found */
  getAd(id: number): Observable<Ad> {
    const url = `${this.marketUrl}/${id}`;
    return this.http.get<Ad>(url).pipe(
      tap(_ => console.log(`fetched hero id=${id}`)),
      catchError(this.handleError<Ad>(`getAd id=${id}`))
    );
  }

  /** PUT: update the hero on the server */
  updateAd(ad?: Ad): Observable<any> {
    return this.http.put(this.marketUrl, ad, this.httpOptions).pipe(
      tap(_ => console.log(`updated ad id=${ad!.id}`)),
      catchError(this.handleError<any>('updateAd'))
    );  
  }

  /** POST: add a new hero to the server */
  addAd(ad: Ad): Observable<Ad> {
    console.log(ad);
    return this.http.post<Ad>(this.marketUrl, ad, this.httpOptions).pipe(
      tap((ad: Ad) => console.log(`added ad w/ id=${ad.id}`)),
      catchError(this.handleError<Ad>('addAd'))
    );
  }

  /** DELETE: delete the hero from the server */
  deleteAd(id: number): Observable<Ad> {
    const url = `${this.marketUrl}/${id}`;

    return this.http.delete<Ad>(url, this.httpOptions).pipe(
      tap(_ => console.log(`deleted ad id=${id}`)),
      catchError(this.handleError<Ad>('deleteAd'))
    );
  }

  /* GET heroes whose name contains search term */
  searchAds(term: AdSearchOpt): Observable<Ad[]> {
    // add custom get string for term object
    /*return this.http.get<Ad[]>(`${this.marketUrl}/?name=${term}`).pipe(
      tap(x => x.length ?
        console.log(`found ads matching "${term}"`) :
        console.log(`no ads matching "${term}"`)),
      catchError(this.handleError<Ad[]>('searchAds', []))
    );*/
    return of([{
      id: 1,
      photo: "photo1",
      title: "titolo1",
      price: 11,
      owner: "possessore 1",
      ownerId: 1,
      type: "tipoA",
    } as Ad,{
      id: 2,
      photo: "photo2",
      title: "titolo2",
      price: 22,
      owner: "possessore 2",
      ownerId: 2,
      type: "tipoB",
    }as Ad]);
  }

}