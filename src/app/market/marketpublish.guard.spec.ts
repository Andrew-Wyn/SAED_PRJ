import { TestBed } from '@angular/core/testing';

import { MarketpublishGuard } from './marketpublish.guard';

describe('MarketpublishGuard', () => {
  let guard: MarketpublishGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(MarketpublishGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
