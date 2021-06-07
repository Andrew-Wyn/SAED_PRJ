import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandPublishComponent } from './band-publish.component';

describe('BandPublishComponent', () => {
  let component: BandPublishComponent;
  let fixture: ComponentFixture<BandPublishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BandPublishComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BandPublishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
