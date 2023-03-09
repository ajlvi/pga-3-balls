import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CurrentEventService } from '../shared/current-event.service';
import { Group } from '../shared/group.interface';
import { SinglePick } from '../shared/pick.interface';
import { SeenDataService } from '../shared/seen-data.service';
import { RecordData } from '../shared/user-data.interface';

@Component({
  selector: 'app-pick-history',
  templateUrl: './pick-history.component.html',
  styleUrls: ['./pick-history.component.css']
})
export class PickHistoryComponent implements OnInit, OnDestroy {
  currentSub: Subscription
  currentRound: string = '';
  currentRoundData: Group[];
  leaders: {[group_num: number]: string} = {}
  progression: string[] = [];
  isLoading: boolean = true;

  username: string = '';
  groups: string[] = [];
  
  activeGroup: string = '';
  groupsLoading: boolean = true;
  roster: string[] = [];

  total_groups: number = 0
  groupData: { 
    [user: string]: {
      handle: string,
      lifetimeRecord: RecordData,
      roundRecord: RecordData,
      picks: { [group_num: number] : SinglePick };
    }} = {};

  constructor(
    private seen: SeenDataService,
    private current: CurrentEventService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.username = this.auth.currentEmail;
    this.roster = [this.username]

    if (this.seen.sawRecord(this.username)) {
      this.initialDataGathering();
    }
    else {
      this.seen.getUserData(this.username).subscribe(
        () => { this.initialDataGathering(); }
      )
    }
  }

  initialDataGathering() {
    //we can be confident here the user doc has been received
    this.groups = this.seen.UserData[this.username]["groups"];
    this.groupData[this.username] = 
      {
        handle: this.seen.UserData[this.username].handle,
        lifetimeRecord: this.seen.RecordData[this.username],
        roundRecord: new RecordData(this.username, -1, -1, -1, 0),
        picks: {}
      };

    this.currentSub = this.current.currentSubject.subscribe(
      round => {
        if (round) {
          this.currentRound = round;
          this.progression = this.current.progression;
          if (!this.seen.sawRound(round)) {
            this.seen.getRound(round).subscribe(
              () => { 
                this.currentRoundData = this.seen.groupsByRound[round]
                this.setLeaders();
                this.getGroupmateData(round); 
              } //will get own pick history
            )
          }
          else { 
            this.currentRoundData = this.seen.groupsByRound[round]
            this.setLeaders();
            this.getGroupmateData(round); 
          }
        }
      }
    )
  }

  getGroupmateData(round: string) {
    let candidates = this.activeGroup? this.seen.GroupRosters[this.activeGroup] : this.roster;
    let needsPicks = []
    for (let user of candidates) {
      if (! this.seen.sawPicks(user, round) ) {
        needsPicks.push(user)
      }
    }
    if (needsPicks.length > 0) {
      this.groupsLoading = true;
      this.seen.getMultiplePicks(needsPicks, round).subscribe(
        () => { this.processGroupPicks(round); }
      )
    }
    else { this.processGroupPicks(round); }
  }

  processGroupPicks(round: string) {
    let userlist = this.activeGroup ? this.seen.GroupRosters[this.activeGroup] : this.roster ;
    for (let user of userlist) {
      this.groupData[user] = {
        handle: this.seen.UserData[user].handle,
        lifetimeRecord: this.seen.RecordData[user],
        roundRecord: this.seen.recordInRound(user, round),
        picks: this.seen.playerPicks[user][round].picks
      }
    }
    if (this.activeGroup) { 
      this.roster = [this.username];
      for (let user of userlist) { 
        if (user !== this.username) { this.roster.push(user) }
      } 
    }
    this.total_groups = this.seen.totalGroups(round)
    this.isLoading = false;
    this.groupsLoading = false;
  }

  onGroupSelected(group: string) {
    this.groupsLoading = true;
    this.activeGroup = group;
    if (group === "xx") {
      this.groupsLoading = false;
      this.roster = [this.username]
    }
    else if (this.seen.sawGroup(group)) {
      this.getGroupmateData(this.currentRound)
    }
    else {
      this.seen.getGroupRoster(group).subscribe(
        () => { this.getGroupmateData(this.currentRound) }
      )
    }
  }

  //copied from pick-history
  setLeaders() {
    this.leaders = {}
    for (let j=0; j < this.currentRoundData.length; j++ ) {
      if (this.currentRoundData[j].score1 !== undefined) {
        const to_par = [
          this.currentRoundData[j].score1,
          this.currentRoundData[j].score2,
          this.currentRoundData[j].score3
        ];
        const lowest = Math.min(...to_par)
        //does the lowest score appear more than once?
        if (to_par.indexOf(lowest) === to_par.lastIndexOf(lowest)) {
          this.leaders[j] = this.currentRoundData[j]["player" + (1+to_par.indexOf(lowest)).toString()]
        }
      }
    }
  }

  onRoundSelected(round: string) {
    //
  }

  ngOnDestroy(): void {
    this.currentSub.unsubscribe();
  }

}
