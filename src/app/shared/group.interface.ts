export interface Group {
    roundname: string,
    
    player1: string,
    odds1: number,
    player2: string,
    odds2: number,
    player3: string,
    odds3: number,

    time?: number,
    winner?: string,
    score1?: number,
    score2?: number,
    score3?: number,
    thru?: number
}