import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CurrentEventService } from '../shared/current-event.service';
import { Group } from '../shared/group.interface';
import { DayPicks, SinglePick } from '../shared/pick.interface';
import { SeenDataService } from '../shared/seen-data.service';

@Component({
  selector: 'app-make-picks',
  templateUrl: './make-picks.component.html',
  styleUrls: ['./make-picks.component.css']
})
export class MakePicksComponent implements OnInit, OnDestroy{
  possessData: boolean = false;
  currentRound: string;
  roundSub: Subscription;
  error: string = '';
  message: string = '';
  groups: Group[] = [];

  selected: {[group_no: number]: string} = {}
  serverPicks: {[group_no: number]: string} = {}

  constructor(
    private current: CurrentEventService,
    private seen: SeenDataService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.roundSub = this.current.currentSubject.subscribe(
      round => {
        if (round) {
          this.currentRound = round;
          this.fetchGroupsData();
        }
      }
    )
  }

  fetchGroupsData() {
    if (this.seen.sawRound(this.currentRound)) {
      this.groups = this.seen.groupsByRound[this.currentRound]
      this.possessData = true;
      this.fetchPicksData();
    }
    else {
      this.seen.getRound(this.currentRound).subscribe(
        () => {
          this.groups = this.seen.groupsByRound[this.currentRound];
          this.possessData = true;
          this.fetchPicksData();
        }
      )
    }
  }

  isExpired(group_no: number) {
    return new Date().getTime() > this.groups[group_no].time; 
  }

  toggleSelected(group_no: number, choice: string) {
    if (this.selected[group_no] && this.selected[group_no] === choice) {
      delete this.selected[group_no];
    }
    else {
      this.selected[group_no] = choice;
    }
  }

  fetchPicksData() {
    const username = this.auth.currentEmail;
    if (this.seen.sawPicks(username, this.currentRound)) {
      let seenPicks = this.seen.playerPicks[username][this.currentRound].picks;
      for (let group_no in seenPicks) {
        this.serverPicks[parseInt(group_no)] = seenPicks[group_no].pick;
        this.toggleSelected(parseInt(group_no), seenPicks[group_no].pick)
      }
    }
    else {
      this.seen.getPicks(username, this.currentRound).subscribe(
        (response: DayPicks) => {
          for (let group_no in response.picks) {
            this.serverPicks[parseInt(group_no)] = response.picks[group_no].pick;
            this.toggleSelected(parseInt(group_no), response.picks[group_no].pick)
          }
        }
      )
    }
  }

  onStorePicks() {
    this.possessData = false;
    this.seen.makePicks(this.auth.currentEmail, this.currentRound, this.selected).subscribe(
      (response: DayPicks) => {
        console.log(response); 
        for ( let i=0; i < this.groups.length; i++ ) {
          if (response.picks[i]) {
            this.serverPicks[i] = response.picks[i].pick;
            if (this.selected[i] !== response.picks[i].pick) {
              this.toggleSelected(i, response.picks[i].pick);
            }
          }
          else {
            delete this.selected[i];
            delete this.serverPicks[i];
          }
        }
        this.possessData = true;
      }
    )
  }

  onClearSelected() {
    this.selected = {};
  }

  ngOnDestroy(): void {
    this.roundSub.unsubscribe();
  }
}
