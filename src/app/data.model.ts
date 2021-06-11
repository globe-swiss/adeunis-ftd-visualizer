export class Source {
  date: number;
  payload_decoded: {
    longitude: number;
    latitude: number;
    rssi_dl: number;
    snr_dl: number;
  };
}

export class Target {
  lat: number;
  lng: number;
  rssi: number;
  snr: number;
  strength: number;
}
