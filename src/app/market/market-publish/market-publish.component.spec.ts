import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketPublishComponent } from './market-publish.component';

describe('MarketPublishComponent', () => {
  let component: MarketPublishComponent;
  let fixture: ComponentFixture<MarketPublishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarketPublishComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketPublishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
