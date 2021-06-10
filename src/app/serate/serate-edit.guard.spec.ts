import { TestBed } from '@angular/core/testing';

import { SerateEditGuard } from './serate-edit.guard';

describe('SerateEditGuard', () => {
  let guard: SerateEditGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SerateEditGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
