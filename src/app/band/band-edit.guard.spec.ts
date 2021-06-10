import { TestBed } from '@angular/core/testing';

import { BandEditGuard } from './band-edit.guard';

describe('BandEditGuard', () => {
  let guard: BandEditGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(BandEditGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
