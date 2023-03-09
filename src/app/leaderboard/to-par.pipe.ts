import { Pipe, PipeTransform } from "@angular/core";

@Pipe({'name': 'ToPar'})
export class ToParPipe implements PipeTransform {
    transform(value: number): string {
        if ( value === 0 ) { return "E" }
        if (!value) { return '' }
        if (value === 100) {return "WD"} 
        else if ( value === 101 ) { return "DQ"; }
        else if ( value > 0 ) { return "+" + value.toString() }
        else { return value.toString(); }
    }
}