import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SerateBoardComponent } from './serate-board.component';

describe('SerateBoardComponent', () => {
  let component: SerateBoardComponent;
  let fixture: ComponentFixture<SerateBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SerateBoardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SerateBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
