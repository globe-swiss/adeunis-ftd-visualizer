import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Source, Target } from './data.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private afs: AngularFirestore) {}

  public data(date: string | undefined = undefined): Observable<Target[]> {
    console.log('date: ' + date);

    return this.afs
      .collection<Source>('data', (ref) => {
        if (date) {
          return ref.where('date', '==', date);
        } else {
          return ref;
        }
      })
      .valueChanges()
      .pipe(
        map((result) =>
          result.map((s) => {
            const t: Target[] = [];
            s.payloads.forEach((p) => {
              t.push({
                ...p,
                deveui: s.deveui,
                strength: this.getStrength(this.calcESP(p.rssi, p.snr)),
              } as Target);
            });
            return t;
          })
        ),
        map((t2d) => {
          let result: Target[] = [];
          t2d.forEach((t1d) => t1d.forEach((t) => result.push(t)));
          return result;
        })
      );
  }

  private calcESP(rssi: number, snr: number): number {
    return rssi - 10 * Math.log10((1 + 10) ^ (-snr / 10));
  }

  private getStrength(esp: number): 0 | 1 | 2 {
    if (esp >= -100) {
      return 0;
    } else if (esp >= -130) {
      return 1;
    } else {
      return 2;
    }
  }
}
