import { Pipe, PipeTransform } from "@angular/core";
import { RecordData } from "../shared/user-data.interface";

@Pipe({'name': 'percentage'})
export class PercentagePipe implements PipeTransform {
    transform(value: RecordData) {
        let pct = 100 * value.wins / (value.wins + value.losses)
        return pct.toString().slice(0, 5) + "%"
    }
}