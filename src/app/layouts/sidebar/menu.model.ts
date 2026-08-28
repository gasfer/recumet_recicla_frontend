import { PermissionAction } from 'src/app/core/constants/application-navigation.constants';

export interface MenuItem {
    name?: string ;
    action?: PermissionAction;
    id?: number;
    label?: string;
    icon?: string;
    link?: string;
    subItems?: MenuItem[];
    view?: boolean;
    isTitle?: boolean;
    badge?: any;
    parentId?: number;
    isLayout?: boolean;
}
