import { Component, OnInit} from '@angular/core';
import { FormGroup, FormControl, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';


const password_check: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const password_repeat = control.get('password_repeat');
  return password_repeat?.value !== password?.value ? { identityRevealed: true } : null;
};

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm = new FormGroup({
    uName: new FormControl(''),
    mail: new FormControl(''),
    password: new FormControl(''),
    password_repeat: new FormControl(''),
    musicista: new FormControl(false),
    prop_loc: new FormControl(false),
    forn_strum: new FormControl(false),
  },{ validators: password_check });

  private registerUrl = '/saed/api/register';  // URL to web api
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
  

  ngOnInit(): void {
  }

  register() {
    this.http.post<any>(this.registerUrl, this.registerForm.value, this.httpOptions).pipe(
      tap(_ => console.log("registered")),
      catchError(this.handleError<any>("register"))
    ).subscribe();
  }

}

