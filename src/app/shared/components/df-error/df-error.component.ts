import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { DfErrorService } from 'src/app/shared/services/df-error.service';

@Component({
  selector: 'df-error',
  templateUrl: './df-error.component.html',
  styleUrls: ['./df-error.component.scss'],
  standalone: true,
  imports: [AsyncPipe],
})
export class DfErrorComponent {
  error$ = this.errorService.error$;
  constructor(private errorService: DfErrorService) {}
}
