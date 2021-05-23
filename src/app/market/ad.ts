export interface Ad {
    id?: number;
    photo?: string | ArrayBuffer | null;
    title?: string;
    price?: number;
    owner?: string;
    can_edit?: boolean;
    type?: string;
}