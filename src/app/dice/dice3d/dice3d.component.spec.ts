import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dice3dComponent } from './dice3d.component';

describe('Dice3dComponent', () => {
  let component: Dice3dComponent;
  let fixture: ComponentFixture<Dice3dComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Dice3dComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dice3dComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
