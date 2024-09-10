export interface MenuItem {
    name?: string ;
    action?: 'view'|'create'|'update'|'delete'|'reports' ;
    id?: number;
    label?: string;
    icon?: string;
    link?: string;
    subItems?: any;
    view?: boolean;
    isTitle?: boolean;
    badge?: any;
    parentId?: number;
    isLayout?: boolean;
}
