import { Component, OnInit } from '@angular/core';
import { Observable, of, interval } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, repeatWhen, tap } from 'rxjs/operators';


import { AuthService } from '../auth.service'
import { Notify } from '../notify'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {  

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

  private notificationsUrl = 'api/notify';
  notifications$: Observable<Notify[]> = of([]);
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient, public authService: AuthService) {
  }

  ngOnInit(): void {
    this.notifications$ = this.getNotify(this.authService.email);
  }

  getNotify(uid: any): Observable<Notify[]> {
    /*const url = `${this.notificationsUrl}/${uid}`;
    return this.http.get<Notify[]>(url)
    .pipe(
      tap(_ => console.log('fetched notify')),
      repeatWhen(() => interval(5000)),
      catchError(this.handleError<Notify[]>('geNotify', []))
    );*/
    return of([
      {
        id: 1,
        type: "a",
        text: "b"
      }, 
      {
        id: 2,
        type: "a1",
        text: "b1"
      }
    ]).pipe(
      tap(_ => console.log('fetched notify')),
      repeatWhen(() => interval(5000)), // repeat the notify api call every tot seconds
    );
  }


  logout() {
    this.authService.logout()
  }

}
