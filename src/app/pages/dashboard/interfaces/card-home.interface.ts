export interface CardHome  {
    id?:        number;
    icon? :     string;
    class?:     string;
    title?:     string;
    subtitle?:  string;
    text?:      string;
    loading?:    boolean;
    linkRedirect?: string;
    section?: string;
    active?:boolean;
    description?: string;
    data?: any;
}