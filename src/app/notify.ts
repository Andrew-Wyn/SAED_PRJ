export interface Notify {
    id: number;
    user_id: number;
    message: string;
    action_url: any; //{component: "market" | "band" | "serate", id_obj: number} 
    picture_url: string;
}