export interface SinglePick {
    group_no: number;
    pick: string;
    result?: number;
}

export interface DayPicks {
    doc_id: string;
    round: string;
    user: string;
    picks: { [group_num: number] : SinglePick };
    daytotal?: number;
}