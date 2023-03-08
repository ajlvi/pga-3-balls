import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name: 'time'})
export class TimePipe implements PipeTransform {
    transform(value: number): string {
        const time = new Date(+value)
        let hours = time.getHours();
        hours = hours - (hours > 12 ? 12 : 0);
        let minutes = "0" + time.getMinutes().toString()
        return hours.toString() + ":" + minutes.slice(-2);
    }
}