import { Component, OnDestroy, OnInit } from '@angular/core';
import MarkerClusterer from '@googlemaps/markerclustererplus';
import { Subscription } from 'rxjs';
import { Target } from './data.model';
import { DataService } from './data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptions = new Subscription();
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

  constructor(private dataService: DataService) {}

  ngOnInit() {
    const map = new google.maps.Map(document.getElementById('map')!, {
      zoom: this.zoom,
      center: this.center,
      maxZoom: 48,
    });
    this.subscriptions.add(
      this.dataService
        .data(undefined)
        .subscribe((values) => this.generatePinCluster(values, map))
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public generatePinCluster(values: Target[], map: google.maps.Map): void {
    const markers: google.maps.Marker[] = [];
    values.forEach((value) => {
      const marker = new google.maps.Marker({
        position: { lat: value.lat, lng: value.lng },
        map: map,
        icon: {
          url: this.marker_color[value.strength],
        },
      });
      this.attachMessage(marker, this.getMessage(value));
      markers.push(marker);
    });

    new MarkerClusterer(map, markers, {
      imagePath:
        'https://github.com/googlemaps/js-markerclustererplus/raw/main/images/m',
      maxZoom: 15,
    });
  }

  private attachMessage(marker: google.maps.Marker, message: string) {
    const infowindow = new google.maps.InfoWindow({
      content: message,
    });

    marker.addListener('click', () => {
      infowindow.open(marker.get('map'), marker);
    });
  }

  private getMessage(target: Target) {
    var message = '<ul>';
    Object.entries(target).forEach((x) => {
      message = message.concat(`<li>${x[0]}: ${x[1]}</li>`);
    });
    message = message.concat('</ul>');
    return message;
  }
}
