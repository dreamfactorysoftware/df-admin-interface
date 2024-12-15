import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DfCurrentServiceService } from 'src/app/shared/services/df-current-service.service';

@Component({
  selector: 'df-api-docs-list',
  templateUrl: './df-api-docs-list.component.html',
  styleUrls: ['./df-api-docs-list.component.scss']
})
export class DfApiDocsListComponent implements OnInit {
  services: any[] = [];

  constructor(
    private router: Router,
    private currentServiceService: DfCurrentServiceService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get services from route resolver data
    this.activatedRoute.data.subscribe(({ data }) => {
      if (data?.resource) {
        this.services = data.resource;
      }
    });
  }

  onServiceSelect(service: any) {
    // Store the service ID before navigation
    this.currentServiceService.setCurrentServiceId(service.id);
    this.router.navigate([`/api-connections/api-docs/${service.name}`]);
  }
} 