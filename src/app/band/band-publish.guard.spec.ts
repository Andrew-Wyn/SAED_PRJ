import { TestBed } from '@angular/core/testing';

import { BandPublishGuard } from './band-publish.guard';

describe('BandPublishGuard', () => {
  let guard: BandPublishGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(BandPublishGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
