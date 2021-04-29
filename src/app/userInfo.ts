export interface UserInfo {
    id: number;
    userName: string;
    email: string;
    dataNascita: string;
    picture: string; // inizialmente utilizzare url da modificare con blob
    musicista: Boolean;
    propLoc: Boolean;
    fornStrum: Boolean;
}