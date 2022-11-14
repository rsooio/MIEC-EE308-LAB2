import { Injectable } from '@angular/core';

export interface player {
  name: string
}

@Injectable({
  providedIn: 'root'
})
export class LocalGameService {
  players: player[] = [];

  constructor() { }
}
