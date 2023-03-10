import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { CommonService } from "./common.service";
import { FirestoreQueryService } from "./firestore-query.service";
import { Group } from "./group.interface";
import { DayPicks, SinglePick } from "./pick.interface";
import { RecordData } from "./user-data.interface";

@Injectable({providedIn: 'root'})
export class FirestoreService {
    queryUrl = "https://firestore.googleapis.com/v1/projects/pga-3-balls/databases/(default)/documents:runQuery"

    constructor (
        private http: HttpClient,
        private auth: AuthService,
        private common: CommonService,
        private queryService: FirestoreQueryService
    ) {}

    getRoundDoc(round: string) {
        const url = "https://firestore.googleapis.com/v1/projects/pga-3-balls/databases/(default)/documents/rounds/" + round;
        return this.http.get(url).pipe(
            catchError(this.roundError),
            map( response => {
                return this.processFetchedRound(response)
            })
        )
    }

    processFetchedRound(response: any): Group[] {
        const fields = response["fields"];
        let output = []
        let grpidx = 0
        while ("group" + grpidx.toString() + "_p1" in fields) {
            const prefix = "group" + grpidx.toString() + "_";
            let groupObj: Group = {
                roundname: fields["round_name"]["stringValue"],
                player1: fields[prefix + "p1"]["stringValue"],
                player2: fields[prefix + "p2"]["stringValue"],
                player3: fields[prefix + "p3"]["stringValue"],
                odds1: fields[prefix + "odds1"]["stringValue"],
                odds2: fields[prefix + "odds2"]["stringValue"],
                odds3: fields[prefix + "odds3"]["stringValue"],
                time: parseInt(fields[prefix + "time"]["doubleValue"])
            }
            if (prefix + "s1" in fields) {
                groupObj["score1"] = parseInt(fields[prefix + "s1"]["integerValue"])
            }
            if (prefix + "s2" in fields) {
                groupObj["score2"] = parseInt(fields[prefix + "s2"]["integerValue"])
            }
            if (prefix + "s3" in fields) {
                groupObj["score3"] = parseInt(fields[prefix + "s3"]["integerValue"])
            }
            if (prefix + "thru" in fields) {
                groupObj["thru"] = parseInt(fields[prefix + "thru"]["integerValue"])
            }
            if (prefix + "winner" in fields) {
                groupObj["winner"] = fields[prefix + "winner"]["stringValue"]
            }
            output.push(groupObj)
            grpidx++;
        }
        return output
    }

    getPlayerPicksSingle(user: string, round: string) {
        return this.http.post(
            this.queryUrl,
            this.queryService.query_player_picks_single(user, round)
        ).pipe(
            map( response => {
                //if we don't find anything, then we need a dummy document.
                if (!response[0]["document"]) {
                    return {
                        "doc_id": '',
                        "user": this.auth.currentEmail,
                        "round": round,
                        "picks": {}
                    }
                }
            return this.pruneFetchedPicks(response[0]);
            })
        )
    }

    pruneFetchedPicks(response: any): DayPicks {
        const document = response["document"]
        let slashsplit = document["name"].split("/")
        let output: DayPicks = {
            "doc_id": slashsplit[slashsplit.length - 1],
            "user": document["fields"]["user"]["stringValue"],
            "round": document["fields"]["round"]["stringValue"],
            "picks": {}
        };
        for ( let i=0; i < this.common.totg_from_document(document) + 1; i++ ) {
            if (document["fields"]["pick_" + i.toString()]) {
                const pickedPlayer = document["fields"]["pick_" + i.toString()]["stringValue"];
                let pick_i: SinglePick = {
                    pick: pickedPlayer,
                    group_no: i
                };
                if ( document["fields"]["result_" + i.toString()]) {
                    pick_i["result"] = parseInt(document["fields"]["result_" + i.toString()]["integerValue"])
                }
                if ( document["fields"]["daytotal"]) {
                    pick_i["daytotal"] = document["fields"]["total"]["doubleValue"]
                }
                output.picks[i] = pick_i
            }
        }
        return output
    }

    getPlayerPicksMultiple(users: string[], round: string) {
        let output: {[user: string]: DayPicks} = {};
        for (let user of users) { 
            output[user] = {"doc_id": '', "user": user, "round": round, "picks": {}}; }
        return this.http.post(
            this.queryUrl,
            this.queryService.query_player_picks_multiple(users, round)
        ).pipe(
            map( (response: any[]) => {
                for (let document of response) {
                    if (document["document"]) {
                        const user = document["document"]["fields"]["user"]["stringValue"];
                        output[user] = this.pruneFetchedPicks(document)
                    }
                }
                return output;
            })
        )
    }

    make_picks(picks: DayPicks) {
        const basepath = "https://firestore.googleapis.com/v1"
        if (picks.doc_id) {
          let write_suffix = "/projects/pga-3-balls/databases/(default)/documents:commit"
          return this.http.post(basepath + write_suffix, this.update_picks_payload(picks))
        }
        else {
          let write_suffix = "/projects/pga-3-balls/databases/(default)/documents/picks"
          return this.http.post(basepath + write_suffix, this.new_picks_payload(picks))
        }
    }

    update_picks_payload(picks: DayPicks) {
        const basepath = "projects/pga-3-balls/databases/(default)/documents/picks/"
        let outputObj = { "writes": [] }
        let outputDoc = {
            "name": basepath + picks.doc_id,
            "fields": {
                "user": { "stringValue": picks.user },
                "round": { "stringValue": picks.round }
            }
        }
        // the upper bound is the largest group_num in picks.
        for (let i = 0; i <= Math.max(...Object.keys(picks.picks).map( x => parseInt(x))); i++ ) {
            if ( picks.picks[i] ) {
                outputDoc["fields"]["pick_" + i.toString()] = { stringValue: picks.picks[i].pick }
            }
        }
        outputObj["writes"].push({"update": outputDoc})
        return outputObj;
    }

    new_picks_payload(picks: DayPicks) {
        let outputDoc = {
            "fields": {
                "user": {"stringValue": picks.user},
                "round": {"stringValue": picks.round}
            }
        }
        for (let i = 0; i <= Math.max(...Object.keys(picks.picks).map( x => parseInt(x))); i++ ) {
            if ( picks.picks[i] ) {
                outputDoc["fields"]["pick_" + i.toString()] = { stringValue: picks.picks[i].pick }
            }
        }
        return outputDoc;
    }

    fetchUserData(user: string) {
        const baseurl = "https://firestore.googleapis.com/v1/projects/pga-3-balls/databases/(default)/documents/users/"
        let user_suffix = user + "/";
        return this.http.get(baseurl + user_suffix).pipe( 
            catchError(this.handleError),
            map( response => {
                return this.process_user_data_response(response);
            })
        )
    }

    process_user_data_response(response: any) {
        let outputObj = {};
        const handle = response["fields"]["handle"]["stringValue"];
        const email = response["fields"]["user"]["stringValue"];
        let groups = [];
        if ( 
            response["fields"]["groups"] && 
            response["fields"]["groups"]["arrayValue"]["values"] 
        ) {
            for (let group of response["fields"]["groups"]["arrayValue"]["values"]) {
                groups.push(group["stringValue"]);
            }
        }
        outputObj["userdata"] = {"handle": handle, "groups": groups, "email": email};

        const userWins = parseInt(response["fields"]["groupsWon"]["integerValue"]);
        const userLoss = parseInt(response["fields"]["groupsLost"]["integerValue"]);
        const userTies = parseInt(response["fields"]["groupsTied"]["integerValue"]);
        const userUnits = parseFloat(response["fields"]["lifetimeUnits"]["doubleValue"]);
        outputObj["record"] = new RecordData(email, userWins, userLoss, userTies, userUnits);
        return outputObj;
    }

    setHandle(user: string, newHandle: string) {
        const baseurl = "https://firestore.googleapis.com/v1/projects/pga-3-balls/databases/(default)/documents/users/"
        let user_suffix = user + "/";
        let query_params = new HttpParams().set("updateMask.fieldPaths", "handle");
        let payload = {"fields": {"handle": {"stringValue": newHandle}}};
        return this.http.patch(baseurl+user_suffix, payload, {params: query_params});
    }

    setGroups(user: string, groups: string[]) {
        const baseurl = "https://firestore.googleapis.com/v1/projects/pga-3-balls/databases/(default)/documents/users/"
        let user_suffix = user + "/";
        let query_params = new HttpParams().set("updateMask.fieldPaths", "groups");
        let payload = {
            "fields": {
                "groups": {
                    "arrayValue": {
                        "values": this.groupNamesPayload(groups)
                    }
                }
            }
        };
        return this.http.patch(baseurl + user_suffix, payload, {params: query_params});
    }

    findGroupMembers(groupname: string) {
        return this.http.post(
            this.queryUrl,
            this.queryService.query_group_membership(groupname)
        )
    }

    private groupNamesPayload(groupNames: string[]) {
        let payload = [];
        for (let i=0; i < groupNames.length; i++) {
            payload.push( {"stringValue": groupNames[i]} );
        }
        return payload;
    }

    private roundError(errorResponse: HttpErrorResponse) {
        console.log(errorResponse);
        let errorMessage = "Unknown error occurred :("
        if (!errorResponse.error || !errorResponse.error.error || !errorResponse.error.error.status) {
            return throwError(errorMessage);
        }
        switch (errorResponse.error.error.status) {
            case "NOT_FOUND":
                errorMessage = "There are no games on this date."; break;
            case "UNAUTHENTICATED":
                errorMessage = "You appear to be unauthenticated; try logging in again."; break;
        }
        return throwError(errorMessage);
    }
    
    private handleError(errorResponse: HttpErrorResponse) {
        let errorMessage = "Unknown error occurred :("
        if (!errorResponse.error || !errorResponse.error.error) {
            return throwError(errorMessage);
        }
        switch (errorResponse.error.error.status) {
            case 'NOT_FOUND':
                return new Observable( subscriber => {
                  subscriber.next(new RecordData('', -1, -1, -1, 0));
                });
            case 'TOO_MANY_ATTEMPTS_TRY_LATER':
                errorMessage = "You have tried logging in too many times; try later."; break;
            case 'EMAIL_NOT_FOUND':
                errorMessage = "No account is associated with that e-mail address."; break;
            case "INVALID_PASSWORD":
                errorMessage = "Your password was incorrect."; break;
        }
        return throwError(errorMessage);
      }
}