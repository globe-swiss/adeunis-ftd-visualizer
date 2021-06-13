import { Component, OnDestroy, OnInit } from '@angular/core';
import MarkerClusterer from '@googlemaps/markerclustererplus';
import { BehaviorSubject, Subscription } from 'rxjs';
import { map, switchAll, tap } from 'rxjs/operators';
import { Target } from './data.model';
import { DataService } from './data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  public title = 'lora-viz';
  public filter$ = new BehaviorSubject<string | undefined>(undefined);
  private markerCusterer: MarkerClusterer;

  private mapOptions: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    mapTypeControl: true,
    fullscreenControl: true,
    streetViewControl: false,
    center: { lat: 46.818188, lng: 8.227512 },
    zoom: 9,
    minZoom: 8,
    maxZoom: 48,
  };

  marker_color = [
    'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
    'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  ];

  constructor(private dataService: DataService) {}

  public ngOnInit() {
    const gmap = new google.maps.Map(
      document.getElementById('map')!,
      this.mapOptions
    );

    this.markerCusterer = new MarkerClusterer(gmap, [], {
      imagePath:
        'https://github.com/googlemaps/js-markerclustererplus/raw/main/images/m',
      maxZoom: 15,
    });

    this.filter$
      .pipe(
        map((date) => this.dataService.data(date)),
        switchAll(),
      )
      .subscribe((values) => this.generatePinCluster(values, gmap));
  }

  public ngOnDestroy() {
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

    this.markerCusterer.clearMarkers();
    this.markerCusterer.addMarkers(markers);
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

  public filter(date: string | undefined = undefined) {
    this.filter$.next(date);
  }
}
