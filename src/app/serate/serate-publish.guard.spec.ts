import { TestBed } from '@angular/core/testing';

import { SeratePublishGuard } from './serate-publish.guard';

describe('SeratePublishGuard', () => {
  let guard: SeratePublishGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SeratePublishGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
