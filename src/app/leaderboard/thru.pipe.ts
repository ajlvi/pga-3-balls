import { Pipe, PipeTransform } from "@angular/core";

@Pipe({'name': 'Thru'})
export class ThruPipe implements PipeTransform {
    transform(value: number): string {
        if (!value) { return '' }
        if ( Math.abs(value) === 18 ) { return "F" }
        else if ( value > 0 ) { return value.toString() }
        else if ( value <= -10 ) { return (-value - 9).toString() + "*" }
        else { return (-value + 9).toString() + "*" }
    }
}