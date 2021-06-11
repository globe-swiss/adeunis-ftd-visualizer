import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Source, Target } from './data.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private afs: AngularFirestore) {}

  public data(date: number | undefined) {
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
          result.map((rec) => {
            return {
              lat: rec.payload_decoded.latitude,
              lng: rec.payload_decoded.longitude,
              rssi: rec.payload_decoded.rssi_dl,
              snr: rec.payload_decoded.snr_dl,
              strength: this.getStrength(
                this.calcESP(
                  rec.payload_decoded.rssi_dl,
                  rec.payload_decoded.snr_dl
                )
              ),
            } as Target;
          })
        )
      );
  }

  private calcESP(rssi: number, snr: number) {
    return rssi - 10 * Math.log10((1 + 10) ^ (-snr / 10));
  }

  private getStrength(esp: number) {
    if (esp >= -100) {
      return 0;
    } else if (esp >= -130) {
      return 1;
    } else {
      return 2;
    }
  }
}
