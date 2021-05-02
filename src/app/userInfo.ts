export interface UserInfo {
    id: number;
    userName: string;
    email: string;
    dataNascita: string;
    picture: string | ArrayBuffer | null; // inizialmente utilizzare url da modificare con blob
    musicista: Boolean;
    propLoc: Boolean;
    fornStrum: Boolean;
}