export interface Band {
    id?: number;
    name?: string;
    description?: string;
    band_type?: string;
    owner?: string;
    members?: any[]; // {user_id: number, name: string}
    own?: boolean;
    can_request?: boolean;
    contact_info?: any;
    join_requests?: any[]; // {user_id: number, name: string, rejected: boolean}
    seeking?: boolean;
    rejected?: boolean;
}