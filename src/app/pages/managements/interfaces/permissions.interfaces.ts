export interface Permission {
    id_user: number | null;
    module:  string;
    view:   boolean;
    create:  boolean;
    update:  boolean;
    delete:  boolean;
    reports: boolean;
    status:  boolean;
}
