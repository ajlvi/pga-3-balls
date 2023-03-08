export interface UserData {
    handle: string;
    email: string;
    groups?: string[]
}

export class RecordData {
    constructor(
        public user: string,
        public wins: number,
        public losses: number,
        public ties: number,
        public lifetimeUnits: number
    ) {}
}