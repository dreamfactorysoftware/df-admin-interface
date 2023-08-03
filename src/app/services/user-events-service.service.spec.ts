import { TestBed } from '@angular/core/testing';

import { UserEventsService } from './user-events-service.service';

describe('UserEventsServiceService', () => {
  let service: UserEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
