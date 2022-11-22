import { DiceService } from './../dice/dice.service';
import { Injectable } from '@angular/core';

export interface player {
  name: string
  score: number[]
  max?: string
}

@Injectable({
  providedIn: 'root'
})
export class LocalGameService {
  public index = 0;

  constructor(
    private diceService: DiceService,
  ) {
    // this.addPlayers('rsooio', 'mugi', 'albert', 'isaac');
  }

  public players: player[] = [];
  public rankingList: player[] = [];

  public addPlayers(...names: string[]) {
    names.forEach(name => this.players.push({ name, score: new Array(11).fill(0) }));
  }

  public nextRound(point?: number) {
    if (point != undefined) {
      const ruleIndex = this.players[this.index].score.findIndex(v => v);
      const currentPlayer = this.players[this.index];
      if (ruleIndex == -1 || ruleIndex > point) {
        currentPlayer.max = this.diceService.getRule(point)?.name;
      }
      currentPlayer.score[point]++;
      const playerIndex = this.rankingList.findIndex(v => v.name == currentPlayer.name);
      if (playerIndex != -1) this.rankingList.splice(playerIndex, 1);
      const playerRank = this.rankingList.findIndex(v => v.score < currentPlayer.score);
      if (playerRank != -1) this.rankingList.splice(playerRank, 0, currentPlayer);
      else this.rankingList.push(currentPlayer);
    }
    this.index = this.index == this.players.length - 1 ? 0 : this.index + 1;
  }
}
