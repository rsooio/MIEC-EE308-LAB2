import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteGameComponent } from './remote-game.component';

describe('RemoteGameComponent', () => {
  let component: RemoteGameComponent;
  let fixture: ComponentFixture<RemoteGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemoteGameComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemoteGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
