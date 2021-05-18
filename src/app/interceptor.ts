import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';

import { Observable } from 'rxjs';

/** Inject With Credentials into the request */
@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {

    console.log("interceptor: " + req.url.split('/')[2]);
    if (req.url.split('/')[2] == "localhost:8080") {
        req = req.clone({
            withCredentials: true,
        });
    }

      return next.handle(req);
  }
}
