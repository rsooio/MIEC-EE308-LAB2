import { LocalGameService } from './../../service/local-game/local-game.service';
import { DiceService, rule } from './../../service/dice/dice.service';
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Dice3dComponent } from 'src/app/dice/dice3d/dice3d.component';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  animations: [
    trigger("fade", [
      state("void", style({ opacity: 0 })),
      state("*", style({ opacity: 1 })),
      transition(":enter, :leave", animate(150))
    ]),
  ],
  selector: 'app-local-game',
  templateUrl: './local-game.component.html',
  styleUrls: ['./local-game.component.scss']
})
export class LocalGameComponent implements OnInit, AfterViewInit {
  @ViewChild(Dice3dComponent)
  private dice3dComponent!: Dice3dComponent;

  private begin?: number;
  public show = false;
  public running = false;
  public case?: rule;

  constructor(
    private diceService: DiceService,
    private localGameService: LocalGameService,
  ) { (window as any).localGame = this }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {

  }

  public get currentPlayer() {
    return this.localGameService.players[this.localGameService.index];
  }

  public get rankingList() {
    return this.localGameService.rankingList;
  }

  public maxAward(score: number[]) {
    return this.diceService.getRule(score.findIndex(v => v > 0))!.name;
  }

  async throw(event: MouseEvent) {
    let strength = 0.3;
    if (this.begin) {
      const diff = new Date().getTime() - this.begin;
      const totalTime = 2e3;
      if (diff > totalTime) return;
      strength = 1 - Math.abs(diff / totalTime - 0.5) * 2;
    }
    this.begin = undefined;
    this.running = true;
    const vectors = this.dice3dComponent.generateVectors(strength);
    this.dice3dComponent.throw(vectors);
    // this.dice3dComponent.throw(this.dice3dComponent.shiftVectors(vectors, [1]));
    await this.dice3dComponent.done;
    this.case = this.diceService.solve(this.dice3dComponent.getDiceValues());
    // this.case = this.diceService.getRule(0);
    if (this.case) {
      console.log(this.case);
      this.show = true;
      setTimeout(() => {
        this.show = false;
        this.running = false;
        this.localGameService.nextRound(this.case?.point);
      }, 1000);
    } else {
      this.running = false;
      this.localGameService.nextRound();
    }
  }

  throwPrepare() {
    this.begin = new Date().getTime();
  }

  getDicesLogo(dices: number[]): string {
    return String.fromCodePoint(...dices.map(d => 9855 + d));
  }
}
