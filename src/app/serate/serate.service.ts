import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Router, UrlSerializer } from '@angular/router';

import { BandServ } from './bandServ'
import { BandServSearchOpt } from './bandServSearchOpt'

import * as GLOBALCONFIG from '../global-config'

@Injectable({
  providedIn: 'root'
})
export class SerateService {

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
      alert("Errore " + error.statusText);

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }


  getBandServs(): Observable<BandServ[]> {
    return this.http.get<BandServ[]>(`${this.apiURL}band_services`)
    .pipe(
      tap(_ => console.log('fetched band service')),
      catchError(this.handleError<BandServ[]>('getBandServs', []))
    );
  }

  getBandServ(bandServId?: number): Observable<BandServ> {
    const url = `${this.apiURL}band_services/${bandServId}`;
    return this.http.get<BandServ>(url).pipe(
      tap(_ => console.log(`fetched band service id=${bandServId}`)),
      catchError(this.handleError<BandServ>(`getBandServ id=${bandServId}`))
    );
  }

  updateBandServ(bandServId?: number, bandServ?: BandServ): Observable<any> {
    console.log(bandServ);
    return this.http.put(`${this.apiURL}band_services/${bandServId}`, bandServ, this.httpOptions).pipe(
      tap(_ => console.log(`updated band service id=${bandServ?.band_serv_id}`)),
      catchError(this.handleError<any>('updateBandServ'))
    );  
  }

  addBandServ(bandServ: BandServ): Observable<any> {
    console.log(bandServ);
    return this.http.post<any>(`${this.apiURL}band_services`, bandServ, this.httpOptions).pipe(
      tap((bandServ: any) => console.log(`added band service w/ id=${bandServ.band_serv_id}`)),
      catchError(this.handleError<any>('addBandServ'))
    );
  }

  deleteBandServ(bandServId?: number): Observable<BandServ> {
    return this.http.delete<BandServ>(`${this.apiURL}band_services/${bandServId}`, this.httpOptions).pipe(
      tap(_ => console.log(`deleted band service id=${bandServId}`)),
      catchError(this.handleError<BandServ>('deleteBandServ'))
    );
  }

  searchBandServs(terms?: BandServSearchOpt): Observable<any> {

    // set null attributes of AdSearchOpt for those that is "", can raise error in be
    Object.keys(terms as any).map(function(key, _) {
      if ((terms as any)[key] == "") {
        (terms as any)[key] = null;
      }
    });

    let tree = this.router.createUrlTree(["/"], { queryParams: terms });
    let serializedTree = this.serializer.serialize(tree).split("/")[1]
    console.log(`${this.apiURL}band_services${serializedTree}`);
    return this.http.get<any>(`${this.apiURL}band_services${serializedTree}`).pipe(
      tap(x => x.length ?
        console.log(`found band services matching`) :
        console.log(`no band services matching`, x)),
      catchError(this.handleError<any>('searchBandServs', []))
    );
  }

  updateBandServImage(bandServId?: number, imageBlob?: string | ArrayBuffer | null): Observable<any> {    
    return this.http.put<any>(`${this.apiURL}band_services/images/${bandServId}`, imageBlob)
    .pipe(
      tap(_ => console.log('updated user image')),
      catchError(this.handleError<any>('updateUserImage'))
    );
  }

  addPreference(bandServId?: number): Observable<any> {
    return this.http.post<any>(`${this.apiURL}band_services/interested/${bandServId}`, this.httpOptions).pipe(
      tap(_ => console.log(`deleted ad interested id=${bandServId}`)),
      catchError(this.handleError<any>('deletePreference'))
    );
  }

  deletePreference(bandServId?: number): Observable<any> {
    return this.http.delete<any>(`${this.apiURL}band_services/interested/${bandServId}`, this.httpOptions).pipe(
      tap(_ => console.log(`deleted ad interested id=${bandServId}`)),
      catchError(this.handleError<any>('deletePreference'))
    );
  }
}