export class Source {
  date: string;
  deveui: string;
  payloads: [
    {
      lng: number;
      lat: number;
      rssi: number;
      snr: number;
      ts: string;
    }
  ];
}

export class Target {
  deveui: string
  ts: string
  lat: number;
  lng: number;
  rssi: number;
  snr: number;
  strength: number;
}
