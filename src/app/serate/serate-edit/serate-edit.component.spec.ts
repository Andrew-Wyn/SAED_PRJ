import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SerateEditComponent } from './serate-edit.component';

describe('SerateEditComponent', () => {
  let component: SerateEditComponent;
  let fixture: ComponentFixture<SerateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SerateEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SerateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
