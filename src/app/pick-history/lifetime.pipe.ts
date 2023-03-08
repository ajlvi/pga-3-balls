import { Pipe, PipeTransform } from "@angular/core";
import { RecordData } from "../shared/user-data.interface";

@Pipe({'name': 'lifetime'})
export class LifetimePipe implements PipeTransform {
    transform(value: RecordData) {
        let output = value.wins.toString();
        output = output + "/" + (value.wins + value.losses).toString()
        return output
    }
}