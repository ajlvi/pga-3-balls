import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CurrentEventService } from '../shared/current-event.service';
import { Group } from '../shared/group.interface';
import { SeenDataService } from '../shared/seen-data.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  currentSub: Subscription
  currentRound: string = '';
  pairings: Group[] = [];
  leaders: {[group_num: number]: string} = {}

  isCommunicating: boolean = true;
  refreshCountdown: any;
  timeLeft: number = 75;

  constructor(
    private seen: SeenDataService,
    private current: CurrentEventService) {}

  ngOnInit(): void {
    this.currentSub = this.current.currentSubject.subscribe(
      round => {
        if (round) {
          this.currentRound = round;
          this.updateData();
          this.timerLoop();
        }
      }
    )
  }

  timerLoop() {
    if (this.refreshCountdown) { 
      clearInterval(this.refreshCountdown)
      this.refreshCountdown = null; 
      this.isCommunicating = false;
      this.timeLeft = 75;
    }
    this.refreshCountdown = setInterval(
      () => {
        this.timeLeft --;
        if (this.timeLeft === 0) { this.updateData(); }
      }, 1000
    )

  }

  updateData() {
    this.isCommunicating = true;
    this.seen.getRound(this.currentRound).subscribe(
      () => {
        this.pairings = this.seen.groupsByRound[this.currentRound]
        this.setLeaders()
        console.log(this.pairings)  
        this.isCommunicating = false;
        if (!this.isDone()) { this.timerLoop(); }
      }
    )
  }

  setLeaders() {
    this.leaders = {}
    for (let j=0; j < this.pairings.length; j++ ) {
      if (this.pairings[j].score1 !== undefined) {
        const to_par = [
          this.pairings[j].score1,
          this.pairings[j].score2,
          this.pairings[j].score3
        ];
        const lowest = Math.min(...to_par)
        //does the lowest score appear more than once?
        if (to_par.indexOf(lowest) === to_par.lastIndexOf(lowest)) {
          this.leaders[j] = this.pairings[j]["player" + (1+to_par.indexOf(lowest)).toString()]
        }
      }
    }
  }

  isDone(): boolean {
    const lastGroup = this.pairings[this.pairings.length - 1]
    return Math.abs(lastGroup.thru) === 18
  }

  ngOnDestroy(): void {
    this.currentSub.unsubscribe()
  }
}
