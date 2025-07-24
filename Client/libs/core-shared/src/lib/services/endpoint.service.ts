import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MangoAppFacade } from '@mangoSpa/src/app/+state/app/app.facade';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../apps/mango/src/environments/environment.local';

@Injectable()
export abstract class EndpointService {
  private static logged = false;

  constructor(protected http: HttpClient, protected facade: MangoAppFacade) {
    if (environment.name !== 'PROD' && !EndpointService.logged) {
      EndpointService.logged = true;
    }
  }

  protected getHttpHeaders(): any {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      UseQueryOptimization: '1',
    });
  }

  protected handleError(operation = 'operation not provided') {
    return (error: any): Observable<any> => {
      console.error(operation, error);

      if (
        error.status === 404 &&
        error.url.toLowerCase().indexOf('griddata') >= 0
      ) {
        return of({ status: error.status });
      }

      if (error.status === 401) {
        if (operation === 'GetForm') {
          return of({
            success: error.error.success,
            data: error.error.data,
            clientErrorMessage: error.error.clientErrorMessage,
            statusCode: error.status,
          });
        }
      }

      if (error.status === 400) {
        if (operation === 'GetFormItemWidgetByWidgetId') {
          return of({
            success: error.error.success,
            data: error.error.data,
            clientErrorMessage: error.error.clientErrorMessage,
            statusCode: error.status,
          });
        }
      }

      // Checking for ProblemDetails error object
      if (error.error?.type) {
        return of({
          success: false,
          clientErrorMessage: error?.error?.message,
          statusCode: error?.status,
        });
      }

      return of({
        success: false,
        clientErrorMessage: error?.error?.clientErrorMessage,
        statusCode: error?.status,
      });
    };
  }

  // This method processing error response and passes status code and statue message back to calling method.
  // This is here so that when design is ready to display messages for user, we don't have to touch service code.
  protected handleErrorReturnMessage(operation) {
    return (error: any): Observable<any> => {
      console.error(operation, error);
      return of({
        status: error.status,
        statusText: error.statusText,
        errorMessage: error.error.message,
      });
    };
  }

  protected toObject(value: any): any {
    if (value != null && value.hasOwnProperty('status')) {
      const executionSuccessful = value.status === 200 ? true : false;
      return {
        success: executionSuccessful,
        data: value.data,
        statusCode: value?.statusCode,
        clientErrorMessage: executionSuccessful ? null : value.title,
      };
    } else if (
      value != null &&
      !value.hasOwnProperty('succeeded') &&
      !value.hasOwnProperty('success') &&
      !value.hasOwnProperty('clientErrorMessage')
    ) {
      return {
        success: true,
        data: value?.data ? value.data : value,
        statusCode: value?.statusCode,
        clientErrorMessage: null,
      };
    } else {
      let apiSuccess = value?.succeeded
        ? value?.succeeded
        : value?.success
        ? value?.success
        : null;
      let cemsg = value?.message
        ? value?.message
        : value?.clientErrorMessage
        ? value?.clientErrorMessage
        : null;
      return {
        success: apiSuccess,
        data: value?.hasOwnProperty('data') ? value.data : value,
        statusCode: value?.hasOwnProperty('statusCode')
          ? value.statusCode
          : value,
        clientErrorMessage: cemsg,
      };
    }
  }

  protected byteArrayFromResponse(response: any) {
    let data = response.d.hasOwnProperty('Result')
      ? response.d.Result
      : response.d;

    var binary_string = window.atob(data);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }

    return bytes.buffer;
  }

  protected callHttpGet(
    url: string,
    functionName: string,
    httpOptionsParams?: any
  ): Observable<any> {
    let httpOptions = this.getHttpHeaders();
    if (httpOptionsParams) {
      httpOptions.params = httpOptionsParams;
    }

    return this.http.get(url, httpOptions).pipe(
      map((x) => this.toObject(x) as any),
      catchError(this.handleError(functionName))
    );
  }

  protected callHttpGetWithErrorMessage(
    url: string,
    functionName: string,
    httpOptionsParams?: any
  ): Observable<any> {
    let httpOptions = this.getHttpHeaders();
    if (httpOptionsParams) {
      httpOptions.params = httpOptionsParams;
    }

    return this.http.get(url, httpOptions).pipe(
      map((x) => this.toObject(x) as any),
      catchError(this.handleErrorReturnMessage(functionName))
    );
  }

  protected callHttpPost(
    url: string,
    functionName: string,
    postBody: any
  ): Observable<any> {
    let httpHeaders = this.getHttpHeaders();

    return this.http.post(url, postBody, httpHeaders).pipe(
      map((x) => this.toObject(x) as any),
      catchError(this.handleError(functionName))
    );
  }

  protected callHttpPostWithErrorMessage(
    url: string,
    functionName: string,
    postBody: any
  ): Observable<any> {
    let httpHeaders = this.getHttpHeaders();

    return this.http.post(url, postBody, httpHeaders).pipe(
      map((x) => this.toObject(x) as any),
      catchError(this.handleErrorReturnMessage(functionName))
    );
  }

  protected callHttpPostWithBlobResponse(
    url: string,
    functionName: string,
    postBody: any
  ): Observable<any> {
    let httpHeaders = this.getHttpHeaders();
    httpHeaders.responseType = 'blob' as 'json';

    return this.http.post(url, postBody, httpHeaders).pipe(
      map((x) => this.toObject(x) as any),
      catchError(this.handleError(functionName))
    );
  }

  protected callHttpPutWithErrorMessage(
    url: string,
    functionName: string,
    postBody: any
  ): Observable<any> {
    return of(this.getHttpHeaders()).pipe(
      switchMap((httpHeaders) => this.http.put(url, postBody, httpHeaders)),
      map((x) => this.toObject(x) as any),
      catchError(this.handleErrorReturnMessage(functionName))
    );
  }

  protected callHttpPut(
    url: string,
    functionName: string,
    postBody: any
  ): Observable<any> {
    let httpHeaders = this.getHttpHeaders();

    return this.http.put(url, postBody, httpHeaders).pipe(
      map((x) => this.toObject(x) as any),
      catchError(this.handleError(functionName))
    );
  }

  protected callHttpDelete(url: string, functionName: string): Observable<any> {
    let httpHeaders = this.getHttpHeaders();

    return this.http.delete(url, httpHeaders).pipe(
      map((x) => this.toObject(x) as any),
      catchError(this.handleError(functionName))
    );
  }

  protected callHttpDeleteWithBody(
    url: string,
    functionName: string,
    body: any
  ): Observable<any> {
    let httpHeaders = this.getHttpHeaders();

    return this.http
      .delete(url, {
        headers: httpHeaders,
        body: body,
      })
      .pipe(
        map((x) => this.toObject(x) as any),
        catchError(this.handleError(functionName))
      );
  }

  protected callHttpPostByteArray(
    url: string,
    functionName: string,
    postBody: any
  ): Observable<any> {
    let httpHeaders = this.getHttpHeaders();

    return this.http.post(url, postBody, httpHeaders).pipe(
      map((x) => this.byteArrayFromResponse(x) as any),
      catchError(this.handleError(functionName))
    );
  }

  protected downloadFile(url: string): Observable<HttpResponse<Blob>> {
    return this.http.get<Blob>(url, {
      observe: 'response',
      responseType: 'blob' as 'json',
    });
  }
}
