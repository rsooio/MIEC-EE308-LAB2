import { BackendService } from './../service/backend/backend.service';
import { LocalGameService, player } from '../service/local-game/local-game.service';
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
  public loginInfo = {
    username: "",
    password: "",
    errMsg: "",
    errShow: false,
  }
  public registerInfo = {
    username: "",
    password: "",
    confirmPassword: "",
    errMsg: "",
    errShow: false,
  }

  get rooms() {
    return this.backendService.rooms;
  }

  get username() {
    return this.backendService.user;
  }

  to36(x: string) {
    return parseInt(x).toString(36);
  }

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

  get invites() {
    return this.rooms;
  }

  constructor(
    private localGameService: LocalGameService,
    private backendService: BackendService,
  ) { }

  addPlayer() {
    if (!this.playerNameInput || this.players.some(p => p.name == this.playerNameInput)) return;
    this.localGameService.addPlayers(this.playerNameInput);
    this.playerNameInput = undefined;
  }

  delPlayer(index: number) {
    this.players.splice(index, 1);
    this.players = this.players.slice();
  }

  ngOnInit(): void {
  }

  login() {
    if (this.loginInfo.username && this.loginInfo.password) {
      this.backendService.login(this.loginInfo.username, this.loginInfo.password)
        .then(() => {
          this.loginInfo.errShow = false;
          this.loginModal = false;
          this.loginInfo.username = "";
          this.loginInfo.password = "";
        })
        .catch(() => {
          this.loginInfo.errMsg = "用户名或密码错误";
          this.loginInfo.errShow = true;
        })
    } else {
      const blank: string[] = [];
      if (!this.loginInfo.username) blank.push("用户名");
      if (!this.loginInfo.password) blank.push("密码");
      this.loginInfo.errMsg = "请输入" + blank.join("及");
      this.loginInfo.errShow = true;
    }
  }

  guestLogin() {
    let guestid = localStorage.getItem('guestid');
    if (!guestid) {
      guestid = (Math.random() * 9e10 + 1e10).toString();
      this.backendService.register(guestid, guestid)
        .catch(() => guestid = null);
      if (!guestid) {
        this.guestLogin();
        return;
      }
      localStorage.setItem('guestid', guestid);
    }
    this.backendService.login(guestid, guestid);
  }

  register() {
    if (this.registerInfo.username && this.registerInfo.password && this.registerInfo.confirmPassword) {
      if (this.registerInfo.password != this.registerInfo.confirmPassword) {
        this.registerInfo.errMsg = "密码不一致";
        this.registerInfo.errShow = true;
      } else {
        this.backendService.register(this.registerInfo.username, this.registerInfo.password)
          .then(() => {
            this.registerInfo.errShow = false;
            this.loginModal = false;
            this.registerInfo.username = "";
            this.registerInfo.password = "";
            this.registerInfo.confirmPassword = "";
          })
          .catch(() => {
            this.registerInfo.errMsg = "用户名已经存在";
            this.registerInfo.errShow = true;
          })
      }
    } else {
      const blank: string[] = [];
      if (!this.registerInfo.username) blank.push("用户名");
      if (!this.registerInfo.password) blank.push("密码");
      if (!this.registerInfo.confirmPassword) blank.push("确认密码");
      this.registerInfo.errMsg = "请输入" + (blank.length == 3 ? `${blank[0]}, ${blank[1]}及${blank[2]}` : blank.join("及"));
      this.registerInfo.errShow = true;
    }
  }
}
