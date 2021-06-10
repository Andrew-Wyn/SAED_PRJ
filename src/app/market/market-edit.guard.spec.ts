import { TestBed } from '@angular/core/testing';

import { MarketEditGuard } from './market-edit.guard';

describe('MarketEditGuard', () => {
  let guard: MarketEditGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(MarketEditGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
