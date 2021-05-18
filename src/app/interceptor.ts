import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';

import { Observable } from 'rxjs';
import * as GLOBALCONFIG from './global-config'

/** Inject With Credentials into the request */
@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    let intercepted = req.url.split('/').slice(0, 4).join('/')
    console.log("interceptor: " + intercepted);
    if (intercepted == GLOBALCONFIG.backEndLocation) {
      req = req.clone({
          withCredentials: true,
      });
    }

      return next.handle(req);
  }
}
