import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-feature-in-development',
  templateUrl: './feature-in-development.component.html',
  styleUrls: ['./feature-in-development.component.scss'],
})
export class FeatureInDevelopmentComponent implements OnInit, OnDestroy {
  title = 'Funcionalidad';
  private routeDataSubscription?: Subscription;

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe((data) => {
      this.title = data['title'] ?? 'Funcionalidad';
    });
  }

  ngOnDestroy(): void {
    this.routeDataSubscription?.unsubscribe();
  }
}
