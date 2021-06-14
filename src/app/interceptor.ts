import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';

import { Observable } from 'rxjs';
import * as GLOBALCONFIG from './global-config'
import { PRIMARY_OUTLET, UrlSerializer } from '@angular/router';

/** Inject With Credentials into the request */
@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  constructor(private serializer: UrlSerializer) {}

  intercept(req: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    console.log("-------------------");
    let intercepted = req.url.split('/').slice(3, 5).join('/');
    console.log("/" + intercepted + "/" == GLOBALCONFIG.backEndRoute);
    console.log("interceptor: " + "/" + intercepted + "/");
    console.log("what i look for " + GLOBALCONFIG.backEndRoute);
    console.log("-------------------");
    if ("/" + intercepted + "/" == GLOBALCONFIG.backEndRoute) {
      req = req.clone({
          withCredentials: true,
      });
    }

      return next.handle(req);
  }
}
