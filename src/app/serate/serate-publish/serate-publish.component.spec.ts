import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeratePublishComponent } from './serate-publish.component';

describe('SeratePublishComponent', () => {
  let component: SeratePublishComponent;
  let fixture: ComponentFixture<SeratePublishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeratePublishComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeratePublishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
