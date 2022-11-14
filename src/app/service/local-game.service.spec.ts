import { TestBed } from '@angular/core/testing';

import { LocalGameService } from './local-game.service';

describe('LocalGameService', () => {
  let service: LocalGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
