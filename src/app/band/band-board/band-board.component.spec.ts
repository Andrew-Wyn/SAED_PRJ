import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandBoardComponent } from './band-board.component';

describe('BandBoardComponent', () => {
  let component: BandBoardComponent;
  let fixture: ComponentFixture<BandBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BandBoardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BandBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
