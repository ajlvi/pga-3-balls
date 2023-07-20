import { Injectable } from "@angular/core";
import { map, tap } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { CommonService } from "./common.service";
import { FirestoreService } from "./firestore.service";
import { Group } from "./group.interface";
import { DayPicks, SinglePick } from "./pick.interface";
import { RecordData, UserData } from "./user-data.interface";

@Injectable({providedIn: 'root'})
export class SeenDataService {
    public playerPicks: {[user: string]: { [round: string]: DayPicks} } = {};
    public groupsByRound: { [round: string] : Group[] } = {};
    public RecordData: { [user: string]: RecordData } = {}; 
    public UserData: { [user: string] : UserData } = {};
    public GroupRosters: { [group: string]: string[] } = {}; 

    constructor(
        private fire: FirestoreService,
        private common: CommonService
    ) {}

    getRound(round: string) {
        return this.fire.getRoundDoc(round).pipe(
            tap( (response: Group[]) => { this.groupsByRound[round] = response; })
        )
    }

    getPicks(user: string, round: string) {
        return this.fire.getPlayerPicksSingle(user, round).pipe(
            tap ( (response: DayPicks) => {this.setPicks(user, round, response) })
        )
    }

    getMultiplePicks(users: string[], round: string) {
        return this.fire.getPlayerPicksMultiple(users, round).pipe(
            tap ( (response: {[user: string]: DayPicks}) => {
                for (let user in response) {
                    this.setPicks(user, round, response[user])
                }
            })
        )
    }

    getUserData(email: string) {
        return this.fire.fetchUserData(email).pipe(
            tap( (response: {"userdata": UserData, "record": RecordData} ) => {
                this.UserData[email] = response["userdata"];
                this.RecordData[email] = response["record"];
            })
        )
    }

    getGroupRoster(groupname: string) {
        return this.fire.findGroupMembers(groupname).pipe(
            tap( (response: Object[]) => {
                //we're going to get back a lot of user documents. processing now
                let roster = []
                for (let doc of response) {
                    if (doc["document"]) {
                        let fields = doc["document"]["fields"];
                        const user: string = fields["user"]["stringValue"];
                        const w = parseInt(fields["groupsWon"]["integerValue"]);
                        const l = parseInt(fields["groupsLost"]["integerValue"]);
                        const t = parseInt(fields["groupsTied"]["integerValue"]);
                        const tot = parseFloat(fields["lifetimeUnits"]["doubleValue"]);
                        
                        roster.push(user)
                        if (! (user in this.RecordData)) {
                            this.RecordData[user] = new RecordData(user, w, l, t, tot);
                        }
                        //we are running an if-check here to avoid overwriting current user
                        if (! (user in this.UserData)) {
                            const handle = fields["handle"]["stringValue"]
                            this.UserData[user] = {"email": user, "handle": handle}
                        }
                    }
                }
                this.GroupRosters[groupname] = roster;
            })
        );
    }

    makePicks(
        user: string, 
        round: string, 
        selected: {[group_no: number]: string} 
     ) {
        const totg = this.groupsByRound[round].length;
        let doc_id = '';
        if ( this.playerPicks[user][round].doc_id) {
            doc_id = this.playerPicks[user][round].doc_id;
        }
        let picks: DayPicks = {
            doc_id: doc_id,
            user: user,
            round: round,
            picks: {}
        };
        for (let i=0; i < totg; i++) {
            //we need the time guard here
            //commenting the time guard out 230719 ajlvi
            /*
            if ( (new Date().getTime()) < this.groupsByRound[round][i].time ) {
                if (selected[i]) {
                    let pick_i: SinglePick = {
                        pick: selected[i],
                        group_no: i
                    }
                    picks["picks"][i] = pick_i
                }
            }
            else {
                if (this.playerPicks[user][round].picks[i]) {
                    let pick_i: SinglePick = this.playerPicks[user][round].picks[i];
                    picks["picks"][i] = pick_i;
                }
                console.log( (new Date().getTime()).toString() + " > " + this.groupsByRound[round][i].time.toString() + " BAD")
            }
            */
        }
        return this.fire.make_picks(picks).pipe(
            tap( response => {
                if (!doc_id) {
                    let slashsplit = response["name"].split("/");
                    picks.doc_id = slashsplit[slashsplit.length - 1];
                }
                this.playerPicks[user][round] = picks;
            }),
            map( () => { return picks; })
        )
    }

    setHandle(user: string, newHandle: string) {
        return this.fire.setHandle(user, newHandle).pipe(
            tap( () => { this.UserData[user].handle = newHandle; })
        )
    }

    setPicks(user: string, round: string, picks: DayPicks ) {
        if (!this.playerPicks[user]) { this.playerPicks[user] = {} }
        this.playerPicks[user][round] = picks;
    }

    setGroups(user: string, groupNames: string[]) {
        return this.fire.setGroups(user, groupNames).pipe(
            tap( () => {
                this.UserData[user].groups = groupNames;
                for (let group of groupNames) {
                    if (!this.GroupRosters[group]) {
                        this.GroupRosters[group] = [user];
                    }
                    else if (!this.GroupRosters[group].includes(user)) {
                        this.GroupRosters[group].push(user);
                    }
                }
            })
        )
    }

    totalGroups(round: string) {
        return this.groupsByRound[round].length;
    }

    recordInRound(user: string, round: string) {
        let wins: number = 0;
        let losses: number = 0;
        let ties: number = 0;
        let units: number = 0;
        const picks = this.playerPicks[user][round]
        for (let i = 0; i <= Math.max(...Object.keys(picks.picks).map( x => parseInt(x))); i++ ) {
            if (picks.picks[i]) {
                const result = picks.picks[i].result;
                if (result === 1) { 
                    wins++; 
                    //we need to find the winner.
                    for (let j=1; j<4; j++) {
                        if (picks.picks[i].pick == this.groupsByRound[round][i]["player" + j.toString()]) {
                            units = units + this.common.odds_to_units(this.groupsByRound[round][i]["odds" + j.toString()])
                        }
                    }
                }
                else if ( result === -1 ) { 
                    losses++; 
                    units = units - 1
                }
                else if ( result === 0 ) {
                     ties++; 
                }
            }
        }
        return new RecordData(user, wins, losses, ties, units);
    }

    sawPicks(user: string, round: string): boolean {
        return (!!this.playerPicks[user]) && (round in this.playerPicks[user]) ;
    }
    sawRound(round: string): boolean { return round in this.groupsByRound }
    sawUser (email: string): boolean { return email in this.UserData; }
    sawGroup(group: string): boolean { return group in this.GroupRosters; }
    sawRecord(user: string): boolean { return user in this.RecordData; }
}