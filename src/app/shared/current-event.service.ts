import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({providedIn: 'root'})
export class CurrentEventService {
    currentSubject = new BehaviorSubject<string>(null);
    public progression: string[] = [];

    constructor(private http: HttpClient) {}

    getCurrentRound() {
        const url = "https://firestore.googleapis.com/v1/projects/pga-3-balls/databases/(default)/documents/rounds/current"
        return this.http.get(url).subscribe(
            response => {
                this.currentSubject.next(response["fields"]["current"]["stringValue"])
                for (let i in response["fields"]["progression"]["arrayValue"]["values"]) {
                    this.progression.push(response["fields"]["progression"]["arrayValue"]["values"][i]["stringValue"])
                }
            }
        )
    }
}