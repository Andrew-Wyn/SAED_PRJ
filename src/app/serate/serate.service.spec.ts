import { TestBed } from '@angular/core/testing';

import { SerateService } from './serate.service';

describe('SerateService', () => {
  let service: SerateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SerateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
