import { Component, OnInit } from '@angular/core';
import MarkerClusterer from '@googlemaps/markerclustererplus';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'lora-viz';

  center = { lat: 46.818188, lng: 8.227512 };
  zoom = 9;
  options: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    minZoom: 8,
  };

  marker_color = [
    'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
    'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  ];

  map!: google.maps.Map;

  ngOnInit() {
    const map = new google.maps.Map(document.getElementById('map')!, {
      zoom: 4,
      center: { lat: 41.85, lng: -87.65 },
      maxZoom: 48,
    });
    this.generateMockPinResultsResponse(1000, map);
  }

  private rInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private getRandomUsLat() {
    const max = 48;
    const min = 30;
    const num = this.rInt(min, max);
    return num;
  }

  private getRandomUsLng() {
    const max = -70;
    const min = -110;
    const num = this.rInt(min, max);
    return num;
  }

  public generateMockPinResultsResponse(
    nMarkers: number,
    map: google.maps.Map
  ): void {
    const markers = [];
    for (var i = 0; i < nMarkers; i++) {
      const latitude: number = this.getRandomUsLat();
      const longitude: number = this.getRandomUsLng();
      const marker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        icon: {
          url: this.marker_color[this.rInt(0, 2)],
        },
      });
      markers.push(marker);
    }

    new MarkerClusterer(map, markers, {
      imagePath:
        'https://github.com/googlemaps/js-markerclustererplus/raw/main/images/m',
      maxZoom: 15,
    });
  }
}
