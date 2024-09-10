import { Component, Input, inject } from '@angular/core';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';
import { NgIf } from '@angular/common';
import { DFStorageService } from 'src/app/shared/services/df-storage.service';

interface LinkItem {
  name: string;
  icon: IconProp;
  link: string;
}

@Component({
  selector: 'df-icon-link',
  templateUrl: './df-icon-link.component.html',
  styleUrls: ['./df-icon-link.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, TranslocoDirective, TranslocoPipe, NgIf],
})
export class DfIconLinkComponent {
  storageService = inject(DFStorageService);
  @Input() linkItem: LinkItem;
  isFirstTimeUser$ = this.storageService.isFirstTimeUser$;
  ngOnInit(): void {
    console.log(this.linkItem);
  }
}
