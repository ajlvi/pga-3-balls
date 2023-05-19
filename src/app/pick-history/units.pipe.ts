import { Pipe, PipeTransform } from "@angular/core";

@Pipe({'name': 'Units'})
export class UnitPipe implements PipeTransform {
    transform(value: number): string {
        //this formatter comes from https://stackoverflow.com/a/1726662
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,      
            maximumFractionDigits: 2,
         });
         const value_twodigits = formatter.format(value);
         if (value > 0) { return "+" + value_twodigits.toString() }
         else if ( value < 0 ) { return value_twodigits.toString() }
         else { return "0.00" } 
    }
}