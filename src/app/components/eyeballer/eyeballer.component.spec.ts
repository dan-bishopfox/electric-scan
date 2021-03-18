import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EyeballerComponent } from './eyeballer.component';

describe('EyeballerComponent', () => {
  let component: EyeballerComponent;
  let fixture: ComponentFixture<EyeballerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EyeballerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EyeballerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
