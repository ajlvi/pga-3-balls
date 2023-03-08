import { Injectable } from "@angular/core";
import { DayPicks } from "./pick.interface";

@Injectable({providedIn: 'root'})
export class CommonService {

    totg_from_document(doc: any) {
        let max_seen: number = 0;
        for ( let key of Object.keys(doc["fields"]) ) {
            if (key.slice(0, 5) === "pick_") {
                const pickno = parseInt(key.slice(5))
                if (pickno > max_seen) { max_seen = pickno }
            }
        }
        return max_seen
    }

    odds_to_units(odds: string) {
        let value = parseInt(odds.slice(1))
        if (odds.slice(0, 1) === "+") {
            return value/100
        }
        else { return 100/value }
    }
}