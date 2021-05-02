import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaketPublishComponent } from './maket-publish.component';

describe('MaketPublishComponent', () => {
  let component: MaketPublishComponent;
  let fixture: ComponentFixture<MaketPublishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaketPublishComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaketPublishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
