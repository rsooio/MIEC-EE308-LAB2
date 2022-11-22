import { Injectable } from '@angular/core';

interface rulePack {
  cases: number[][]
  name: string
  point: number
}

export interface rule {
  case: number[]
  name: string
  point: number
}

@Injectable({
  providedIn: 'root'
})
export class DiceService {

  constructor() { }

  private rules: rule[] = [
    { point: 0, cases: [[1, 4, 4, 4, 4, 1]], name: '状元插金花' },
    { point: 1, cases: [[4, 4, 4, 4, 4, 4]], name: '六抔红' },
    // {point: 4, cases: [[6, 6, 6, 6, 6, 6]], name: '六抔黑'},
    { point: 3, cases: [[1, 2, 3, 4, 5, 6]], name: '对堂' },
    { point: 4, cases: [[4, 4, 4, 4, 4]], name: '五王' },
    { point: 5, cases: [[3, 3, 3, 3, 3]], name: '五子登科' },
    { point: 6, cases: [[4, 4, 4, 4]], name: '状元' },
    { point: 7, cases: [[4, 4, 4]], name: '三红' },
    { point: 8, cases: [[2, 2, 2, 2]], name: '四进' },
    { point: 9, cases: [[4, 4]], name: '二举' },
    { point: 10, cases: [[4]], name: '一秀' },
  ].reduce((rules: rule[], rulePack) => {
    rules.push(...rulePack.cases.map(c => {
      return {case: c, name: rulePack.name, point: rulePack.point};
    }))
    return rules;
  }, []).sort((a, b) => b.case.length - a.case.length);

  private getPoint(dices: number[]) {

  }

  private matcher(a: number[], b: number[]): boolean {
    if (!b.length) return true;
    if (!a.length) return false;
    if (a[0] == b[0]) return this.matcher(a.slice(1), b.slice(1));
    return this.matcher(a.slice(1), b);
  }

  public getRule(point: number) {
    return this.rules.find(r => r.point == point);
  }

  public solve(dices: number[]) {
    return this.rules.find(rule => this.matcher(dices.sort(), rule.case.slice().sort()));
  }
}
