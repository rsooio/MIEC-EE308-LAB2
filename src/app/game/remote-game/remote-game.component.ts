import { BackendService, message } from './../../service/backend/backend.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, Observable } from 'rxjs';
import { Dice3dComponent } from 'src/app/dice/dice3d/dice3d.component';

@Component({
  selector: 'app-remote-game',
  templateUrl: './remote-game.component.html',
  styleUrls: ['./remote-game.component.scss']
})
export class RemoteGameComponent implements OnInit {
  private id!: string;
  @ViewChild(Dice3dComponent)
  private dice3dComponent!: Dice3dComponent;

  private msg$!: Observable<message>;

  running = false;
  private begin?: number;
  public show = false;


  constructor(
    private backendService: BackendService,
    private activatedRoute: ActivatedRoute,
  ) { (window as any).remoteGame = this }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(data => this.id = data['id']);
    this.msg$ = this.backendService.msg$.pipe(filter(data => data.groupID == this.id));
    this.msg$
      .pipe(filter(data => data.contentType == 110 && data.customElem.description == "diceVectors"))
      .subscribe(data => this.diceVectorsHandler(data));
  }

  private diceVectorsHandler(data: message) {
    console.log(data);
    this.dice3dComponent.throw(JSON.parse(data.customElem.data));
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
    // const vectors = this.dice3dComponent.generateVectors(strength);
    // this.dice3dComponent.throw(vectors);
    // // this.dice3dComponent.throw(this.dice3dComponent.shiftVectors(vectors, [1]));
    // await this.dice3dComponent.done;
    // this.case = this.diceService.solve(this.dice3dComponent.getDiceValues());
    // // this.case = this.diceService.getRule(0);
    // if (this.case) {
    //   console.log(this.case);
    //   this.show = true;
    //   setTimeout(() => {
    //     this.show = false;
    //     this.running = false;
    //     this.localGameService.nextRound(this.case?.point);
    //   }, 1000);
    // } else {
    //   this.running = false;
    //   this.localGameService.nextRound();
    // }
    this.running = false;
  }

  throwPrepare() {
    this.begin = new Date().getTime();
  }

}
