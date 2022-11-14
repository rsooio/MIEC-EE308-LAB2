import { LocalGameService, player } from './../service/local-game.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-menu',
  animations: [
    trigger("fade", [
      state("void", style({ opacity: 0 })),
      state("*", style({ opacity: 1 })),
      transition(":enter, :leave", animate(150))
    ]),
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  public loginModal = false;
  public loginModalMode: 'login' | 'register' = 'login';
  public roomModal = false;
  public roomModalMode: 'rooms' | 'join' = 'rooms';
  public localModal = false;

  public playerNameInput?: string;

  public rooms: {'id': string, 'name': string, 'player': number}[] = [
    {id: '111111', name: '你好', player: 3},
    {id: '123456', name: '李鑫', player: 6},
    {id: '666666', name: '南方', player: 8},
    {id: '111111', name: '你好', player: 3},
    {id: '123456', name: '李鑫', player: 6},
    {id: '666666', name: '南方', player: 8},
  ]

  get players(): player[] {
    // return ['你好', '李鑫', '南方', '你好', '李鑫', '南方', '你好', '李鑫', '南方', '你好', '李鑫', '南方', '你好', '李鑫', '南方', '你好', '李鑫', '南方', '你好', '李鑫', '南方', '你好', '李鑫', '南方'].map(m => ({name: m}))
    return this.localGameService.players;
  }

  set players(players: player[]) {
    this.localGameService.players = players;
  }

  get playerRows() {
    return Math.ceil(this.localGameService.players.length / 2);
  }

  public invites = this.rooms;

  constructor(
    private localGameService: LocalGameService,
  ) { }

  addPlayer() {
    if (!this.playerNameInput) return;
    this.players.push({name: this.playerNameInput});
    this.playerNameInput = undefined;
  }

  delPlayer(index: number) {
    this.players.splice(index, 1);
    this.players = this.players.slice();
  }

  ngOnInit(): void {
  }

  login() {
    this.loginModal = true;
  }
}
