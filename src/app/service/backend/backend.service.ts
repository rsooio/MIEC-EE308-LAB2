import { map, firstValueFrom, Subject } from 'rxjs';
import { CbEvents, CustomElem, GroupJoinSource, OfflinePush, OpenIMSDK, WsResponse } from 'open-im-sdk';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface player {
  name: string
  type: number
}

interface room {
  id: string
  name: string
  playerCount: number
  players?: player[]
  introduction: string
}

export interface message {
  contentType: number
  content: string
  createTime: number
  customElem: CustomElem
  groupID: string
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private open = new OpenIMSDK();

  private JSWSURL = "ws://124.222.115.99:10003";
  private URL = "http://124.222.115.99:8888/";

  public user: string | null = null;
  private token: string | null = null;

  public rooms: room[] = [];

  public ready = new Promise<boolean>(r => this.setReady = r);
  private setReady!: (x: boolean) => void;

  public msg$ = new Subject<message>();

  constructor(
    private http: HttpClient,
  ) {
    this.open.on(CbEvents.ONCONNECTSUCCESS, console.log);
    this.open.on(CbEvents.ONCONNECTFAILED, console.log);
    this.open.on(CbEvents.ONRECVNEWMESSAGE, resp => this.msgHandler(resp));
    this.open.on(CbEvents.ONRECVNEWMESSAGES, console.log);
    this.open.on(CbEvents.ONGROUPINFOCHANGED, console.log);
    this.token = sessionStorage.getItem('token');
    this.user = sessionStorage.getItem('uid');
    if (this.token && this.user) {
      this._login(this.user, this.token);
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('uid');
    }
  }

  private msgHandler(resp: WsResponse) {
    console.log(resp);
    // this.open.createCustomMessage
    const data: message = JSON.parse(resp.data);
    this.msg$.next(data);
  }

  private async onLogin() {
    await this.getRoom();
    this.setReady(true);
  }

  private async getRoom() {
    const resp = await this.open.getJoinedGroupList();
    const conv: (m: any) => room = m => ({ id: m.groupID, name: m.groupName, playerCount: m.memberCount, introduction: m.introduction });
    const find = (id: string) => this.rooms.findIndex(m => m.id == id);
    this.rooms = (JSON.parse(resp.data) as any[]).map<room>(conv);
    this.open.on(CbEvents.ONJOINEDGROUPADDED, resp => {
      const room = conv(JSON.parse(resp.data));
      const index = find(room.id);
      if (index != -1) this.rooms[index] = room;
      else this.rooms.push(room);
    });
    this.open.on(CbEvents.ONJOINEDGROUPDELETED, resp => {
      const index = find(conv(JSON.parse(resp.data)).id);
      if (index != -1) this.rooms.splice(index, 1);
    });
  }

  private test() {
    this.open.getSendGroupApplicationList()
      .then(console.log)
      .catch(console.log);
  }

  private join(id: string, msg: string) {
    this.open.joinGroup({
      groupID: id,
      reqMsg: msg,
      joinSource: GroupJoinSource.Search,
    }).then(console.log)
      .catch(console.log);
  }

  async sendTextMsg(id: string, msg: string) {
    const textMsg = await this.open.createTextMessage(msg);
    await this.open.sendMessage({
      recvID: '',
      groupID: id,
      message: textMsg.data,
    });
  }

  async sendCustomMsg(id: string, desc: string, data: object, ext?: object) {
    const msg = await this.open.createCustomMessage({
      description: desc,
      data: JSON.stringify(data),
      extension: ext ? JSON.stringify(ext) : '',
    });
    await this.open.sendMessage({
      recvID: '',
      groupID: id,
      message: msg.data,
    });
  }

  private async _login(uid: string, token: string) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('uid');
    await this.open.login({
      url: this.JSWSURL,
      userID: uid,
      token: token,
      platformID: 5
    }).catch(() => this.setReady(false));
    this.token = token;
    this.user = uid;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('uid', uid);
    this.onLogin();
  }

  register(username: string, password: string) {
    return firstValueFrom(this.http.post<{ ok: number, msg: string, tk: string }>(this.URL + "user/register", {
      uid: username,
      utk: password,
    }).pipe(
      map(data => {
        if (data.ok) {
          this.setReady(false);
          throw data.msg
        };
        this.ready = new Promise<boolean>(r => this.setReady = r);
        this._login(username, data.tk);
      }),
    ));
  }

  login(username: string, password: string) {
    return firstValueFrom(this.http.post<{ ok: number, msg: string, tk: string }>(this.URL + "user/login", {
      uid: username,
      utk: password
    }).pipe(
      map(data => {
        if (data.ok) {
          this.setReady(false);
          throw data.msg;
        }
        this.ready = new Promise<boolean>(r => this.setReady = r);
        this._login(username, data.tk);
      }),
    ));
  }

  async createRoom(name: string) {
    if (!this.user) throw 'not login';
    return this.open.createGroup({
      groupBaseInfo: {
        groupType: 0,
        groupName: name,
      },
      memberList: [
        { userID: this.user, roleLevel: 3 },
      ]
    });
  }

  async deleteRoom(id: string) {
    if (!this.user) throw 'not login';
    return this.open.dismissGroup(id);
  }
}
