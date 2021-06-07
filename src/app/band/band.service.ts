import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Router, UrlSerializer } from '@angular/router';

import { Band } from './band'
import { BandSearchOpt } from './bandSearchOpt'

import * as GLOBALCONFIG from '../global-config'

@Injectable({
  providedIn: 'root'
})
export class BandService {

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

  getBands(): Observable<Band[]> {
    return this.http.get<Band[]>(`${this.apiURL}bands`)
    .pipe(
      tap(_ => console.log('fetched bands')),
      catchError(this.handleError<Band[]>('getBands', []))
    );
  }

  getBand(id?: number): Observable<Band> {
    const url = `${this.apiURL}bands/${id}`;
    return this.http.get<Band>(url).pipe(
      tap(_ => console.log(`fetched band id=${id}`)),
      catchError(this.handleError<Band>(`getBand id=${id}`))
    );
  }

  updateBand(bandId?: number, band?: Band): Observable<any> {
    console.log(band);
    return this.http.put(`${this.apiURL}bands/${bandId}`, band, this.httpOptions).pipe(
      tap(_ => console.log(`updated ad id=${band?.band_id}`)),
      catchError(this.handleError<any>('updateBand'))
    );  
  }

  addBand(band: Band): Observable<any> {
    console.log(band);
    return this.http.post<any>(`${this.apiURL}bands`, band, this.httpOptions).pipe(
      tap((band: any) => console.log(`added band w/ id=${band.band_id}`)),
      catchError(this.handleError<any>('addBand'))
    );
  }

  deleteBand(id?: number): Observable<Band> {
    return this.http.delete<Band>(`${this.apiURL}bands/${id}`, this.httpOptions).pipe(
      tap(_ => console.log(`deleted band id=${id}`)),
      catchError(this.handleError<Band>('deleteBand'))
    );
  }

  searchBands(terms?: BandSearchOpt): Observable<any> {

    // set null attributes of AdSearchOpt for those that is "", can raise error in be
    Object.keys(terms as any).map(function(key, _) {
      if ((terms as any)[key] == "") {
        (terms as any)[key] = null;
      }
    });

    let tree = this.router.createUrlTree(["/"], { queryParams: terms });
    let serializedTree = this.serializer.serialize(tree).split("/")[1]
    console.log(`${this.apiURL}bands${serializedTree}`);
    return this.http.get<any>(`${this.apiURL}bands${serializedTree}`).pipe(
      tap(x => x.length ?
        console.log(`found bands matching`) :
        console.log(`no bands matching`, x)),
      catchError(this.handleError<any>('searchBands', []))
    );
  }

  updateBandImage(bandId?: number, imageBlob?: string | ArrayBuffer | null): Observable<any> {    
    return this.http.put<any>(`${this.apiURL}bands/photos/${bandId}`, imageBlob)
    .pipe(
      tap(_ => console.log('updated band image')),
      catchError(this.handleError<any>('updateBandImage'))
    );
  }

  addPreference(bandId?: number): Observable<any> {
    return this.http.post<any>(`${this.apiURL}bands/interested/${bandId}`, this.httpOptions).pipe(
      tap(_ => console.log(`add band interested id=${bandId}`)),
      catchError(this.handleError<Band>('addPreference'))
    );
  }

  deletePreference(bandId?: number): Observable<any> {
    return this.http.delete<any>(`${this.apiURL}bands/interested/${bandId}`, this.httpOptions).pipe(
      tap(_ => console.log(`deleted band interested id=${bandId}`)),
      catchError(this.handleError<Band>('deletePreference'))
    );
  }

  deleteMember(bandId?: number, userId?: number): Observable<any> {
    return this.http.delete<any>(`${this.apiURL}bands/${bandId}/members/${userId}`, this.httpOptions).pipe(
      tap(_ => console.log(`deleted member id=${userId} of band=${bandId}`)),
      catchError(this.handleError<Band>('deleteMember'))
    )
  }

  acceptRequest(bandId?: number, userId?: number): Observable<any> {
    return this.http.post<any>(`${this.apiURL}bands/${bandId}/requests/${userId}`, this.httpOptions).pipe(
      tap(_ => console.log(`accepted request member id=${userId} of band=${bandId}`)),
      catchError(this.handleError<Band>('acceptRequest'))
    );
  }

  declineRequest(bandId?: number, userId?: number): Observable<any> {
    return this.http.delete<any>(`${this.apiURL}bands/${bandId}/requests/${userId}`, this.httpOptions).pipe(
      tap(_ => console.log(`declined request member id=${userId} of band=${bandId}`)),
      catchError(this.handleError<Band>('declineRequest'))
    );
  }
}