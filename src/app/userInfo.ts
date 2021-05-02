export interface UserInfo {
    id: number;
    userName: string;
    email: string;
    dataNascita: string;
    picture: string | ArrayBuffer | null;
    musicista: Boolean;
    propLoc: Boolean;
    fornStrum: Boolean;
}