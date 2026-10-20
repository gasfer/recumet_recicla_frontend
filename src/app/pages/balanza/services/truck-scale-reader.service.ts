import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TruckScaleReading {
  ok: boolean;
  peso: number;
  unit: 'kg';
}

@Injectable({ providedIn: 'root' })
export class TruckScaleReaderService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.truckScaleReaderUrl;

  readWeight(): Observable<TruckScaleReading> {
    return this.http.get<TruckScaleReading>(this.url);
  }
}
