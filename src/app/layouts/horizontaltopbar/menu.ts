import { MenuItem } from "./menu.model";

export const MENU: MenuItem[] = [
    {
        id: 1,
        label: 'MENUITEMS.DASHBOARDS.TEXT',
        icon: 'bx-home-circle',
        subItems: [
            {
                id: 2,
                label: 'MENUITEMS.DASHBOARDS.LIST.DEFAULT',
                link: '/',
                parentId: 1
            },
            {
                id: 3,
                label: 'MENUITEMS.DASHBOARDS.LIST.SAAS',
                link: '/',
                parentId: 1
            },
            {
                id: 4,
                label: 'MENUITEMS.DASHBOARDS.LIST.CRYPTO',
                link: '/',
                parentId: 1
            },
            {
                id: 5,
                label: 'MENUITEMS.DASHBOARDS.LIST.BLOG',
                link: '/',
                parentId: 1
            },
            {
                id: 6,
                label: 'MENUITEMS.DASHBOARDS.LIST.JOBS',
                link: '/',
                parentId: 1,
            },
        ]
    },
    {
        id: 7,
        label: 'MENUITEMS.UIELEMENTS.TEXT',
        icon: 'bx-tone',
        isUiElement: true,
        subItems: [
            {
                id: 8,
                label: 'MENUITEMS.UIELEMENTS.LIST.ALERTS',
                link: '/',
                parentId: 7
            },
            {
                id: 9,
                label: 'MENUITEMS.UIELEMENTS.LIST.MODALS',
                link: '/',
                parentId: 7
            },
            {
                id: 10,
                label: 'MENUITEMS.UIELEMENTS.LIST.TYPOGRAPHY',
                link: '/',
                parentId: 7
            },
            {
                id: 11,
                label: 'MENUITEMS.UIELEMENTS.LIST.BUTTONS',
                link: '/',
                parentId: 7
            },
            {
                id: 12,
                label: 'MENUITEMS.UIELEMENTS.LIST.TOASTS',
                link: '/',
                parentId: 7
            },
            {
                id: 13,
                label: 'MENUITEMS.UIELEMENTS.LIST.CARDS',
                link: '/',
                parentId: 7
            },
            {
                id: 14,
                label: 'MENUITEMS.UIELEMENTS.LIST.RANGESLIDER',
                link: '/',
                parentId: 7
            },
            {
                id: 15,
                label: 'MENUITEMS.UIELEMENTS.LIST.VIDEO',
                link: '/',
                parentId: 7
            },
            {
                id: 16,
                label: 'MENUITEMS.UIELEMENTS.LIST.CAROUSEL',
                link: '/',
                parentId: 7
            },
            {
                id: 17,
                label: 'MENUITEMS.UIELEMENTS.LIST.GENERAL',
                link: '/',
                parentId: 7
            },
            {
                id: 18,
                label: 'MENUITEMS.UIELEMENTS.LIST.DROPDOWNS',
                link: '/',
                parentId: 7
            },
            {
                id: 19,
                label: 'MENUITEMS.UIELEMENTS.LIST.PROGRESSBAR',
                link: '/',
                parentId: 7
            },
            {
                id: 20,
                label: 'MENUITEMS.UIELEMENTS.LIST.COLORS',
                link: '/',
                parentId: 7
            },
            {
                id: 21,
                label: 'MENUITEMS.UIELEMENTS.LIST.GRID',
                link: '/',
                parentId: 7
            },
            {
                id: 22,
                label: 'MENUITEMS.UIELEMENTS.LIST.PLACEHOLDER',
                link: '/',
                parentId: 7
            },
            {
                id: 23,
                label: 'MENUITEMS.UIELEMENTS.LIST.RATING',
                link: '/',
                parentId: 7
            },
            {
                id: 24,
                label: 'MENUITEMS.UIELEMENTS.LIST.IMAGES',
                link: '/',
                parentId: 7
            },
            {
                id: 25,
                label: 'MENUITEMS.UIELEMENTS.LIST.SWEETALERT',
                link: '/',
                parentId: 7
            },
            {
                id: 26,
                label: 'MENUITEMS.UIELEMENTS.LIST.NOTIFICATION',
                link: '/',
                parentId: 7
            },
            {
                id: 27,
                label: 'MENUITEMS.UIELEMENTS.LIST.LIGHTBOX',
                link: '/',
                parentId: 7
            },
            {
                id: 28,
                label: 'MENUITEMS.UIELEMENTS.LIST.TABS',
                link: '/',
                parentId: 7
            },
            
            {
                id: 29,
                label: 'MENUITEMS.UIELEMENTS.LIST.CROPPER',
                link: '/',
                parentId: 7
            },
        ]
    },
    {
        id: 30,
        label: 'MENUITEMS.APPS.TEXT',
        icon: 'bx-customize',
        subItems: [
            {
                id: 31,
                label: 'MENUITEMS.CALENDAR.TEXT',
                link: '/',
                parentId: 30
            },
            {
                id: 32,
                label: 'MENUITEMS.CHAT.TEXT',
                link: '/',
                parentId: 30
            },
            {
                id: 33,
                label: 'MENUITEMS.FILEMANAGER.TEXT',
                link: '/',
                parentId: 30
            },
            {
                id: 34,
                label: 'MENUITEMS.EMAIL.TEXT',
                subItems: [
                    {
                        id: 35,
                        label: 'MENUITEMS.EMAIL.LIST.INBOX',
                        link: '/',
                        parentId: 34
                    },
                    {
                        id: 36,
                        label: 'MENUITEMS.EMAIL.LIST.READEMAIL',
                        link: '/',
                        parentId: 34
                    },
                    {
                        id: 37,
                        label: 'MENUITEMS.EMAIL.LIST.TEMPLATE.TEXT',
                        parentId: 34,
                        subItems: [
                            {
                                id:38 ,
                                label: 'MENUITEMS.EMAIL.LIST.TEMPLATE.LIST.BASIC',
                                link: '/',
                                parentId:37
                            },
                            {
                                id:39,
                                label: 'MENUITEMS.EMAIL.LIST.TEMPLATE.LIST.ALERT',
                                link: '/',
                                parentId:37
                            },
                            {
                                id:40,
                                label: 'MENUITEMS.EMAIL.LIST.TEMPLATE.LIST.BILLING',
                                link: '/',
                                parentId:37
                            }
                        ]
                    }
                ]
            },
            {
                id: 41,
                label: 'MENUITEMS.ECOMMERCE.TEXT',
                subItems: [
                    {
                        id: 42,
                        label: 'MENUITEMS.ECOMMERCE.LIST.PRODUCTS',
                        link: '/',
                        parentId: 41
                    },
                    {
                        id: 43,
                        label: 'MENUITEMS.ECOMMERCE.LIST.PRODUCTDETAIL',
                        link: '/',
                        parentId: 41
                    },
                    {
                        id: 44,
                        label: 'MENUITEMS.ECOMMERCE.LIST.ORDERS',
                        link: '/',
                        parentId: 41
                    },
                    {
                        id: 45,
                        label: 'MENUITEMS.ECOMMERCE.LIST.CUSTOMERS',
                        link: '/',
                        parentId: 41
                    },
                    {
                        id: 46,
                        label: 'MENUITEMS.ECOMMERCE.LIST.CART',
                        link: '/',
                        parentId: 41
                    },
                    {
                        id: 47,
                        label: 'MENUITEMS.ECOMMERCE.LIST.CHECKOUT',
                        link: '/',
                        parentId: 41
                    },
                    {
                        id: 48,
                        label: 'MENUITEMS.ECOMMERCE.LIST.SHOPS',
                        link: '/',
                        parentId: 41
                    },
                    {
                        id: 49,
                        label: 'MENUITEMS.ECOMMERCE.LIST.ADDPRODUCT',
                        link: '/',
                        parentId: 41
                    },
                ]
            },
            {
                id: 50,
                label: 'MENUITEMS.CRYPTO.TEXT',
                icon: 'bx-bitcoin',
                subItems: [
                    {
                        id: 51,
                        label: 'MENUITEMS.CRYPTO.LIST.WALLET',
                        link: '/',
                        parentId: 50
                    },
                    {
                        id: 52,
                        label: 'MENUITEMS.CRYPTO.LIST.BUY/SELL',
                        link: '/',
                        parentId: 50
                    },
                    {
                        id: 53,
                        label: 'MENUITEMS.CRYPTO.LIST.EXCHANGE',
                        link: '/',
                        parentId: 50
                    },
                    {
                        id: 54,
                        label: 'MENUITEMS.CRYPTO.LIST.LENDING',
                        link: '/',
                        parentId: 50
                    },
                    {
                        id: 55,
                        label: 'MENUITEMS.CRYPTO.LIST.ORDERS',
                        link: '/',
                        parentId: 50
                    },
                    {
                        id: 56,
                        label: 'MENUITEMS.CRYPTO.LIST.KYCAPPLICATION',
                        link: '/',
                        parentId: 50
                    },
                    {
                        id: 57,
                        label: 'MENUITEMS.CRYPTO.LIST.ICOLANDING',
                        link: '/',
                        parentd: 50
                    }
                ]
            },
            {
                id: 58,
                label: 'MENUITEMS.PROJECTS.TEXT',
                subItems: [
                    {
                        id: 59,
                        label: 'MENUITEMS.PROJECTS.LIST.GRID',
                        link: '/',
                        parentId: 58
                    },
                    {
                        id: 60,
                        label: 'MENUITEMS.PROJECTS.LIST.PROJECTLIST',
                        link: '/',
                        parentId: 58
                    },
                    {
                        id: 61,
                        label: 'MENUITEMS.PROJECTS.LIST.OVERVIEW',
                        link: '/',
                        parentId: 58
                    },
                    {
                        id: 62,
                        label: 'MENUITEMS.PROJECTS.LIST.CREATE',
                        link: '/',
                        parentId: 58
                    }
                ]
            },
            {
                id: 63,
                label: 'MENUITEMS.TASKS.TEXT',
                subItems: [
                    {
                        id: 64,
                        label: 'MENUITEMS.TASKS.LIST.TASKLIST',
                        link: '/',
                        parentId: 63
                    },
                    {
                        id: 65,
                        label: 'MENUITEMS.TASKS.LIST.KANBAN',
                        link: '/',
                        parentId: 63
                    },
                    {
                        id: 66,
                        label: 'MENUITEMS.TASKS.LIST.CREATETASK',
                        link: '/',
                        parentId: 63
                    }
                ]
            },
            {
                id: 67,
                label: 'MENUITEMS.CONTACTS.TEXT',
                icon: 'bxs-user-detail',
                subItems: [
                    {
                        id: 68,
                        label: 'MENUITEMS.CONTACTS.LIST.USERGRID',
                        link: '/',
                        parentId: 67
                    },
                    {
                        id: 69,
                        label: 'MENUITEMS.CONTACTS.LIST.USERLIST',
                        link: '/',
                        parentId: 67
                    },
                    {
                        id: 70,
                        label: 'MENUITEMS.CONTACTS.LIST.PROFILE',
                        link: '/',
                        parentId: 67
                    }
                ]
            },
            {
                id: 71,
                label: 'MENUITEMS.BLOG.TEXT',
                subItems: [
                    {
                        id: 72,
                        label: 'MENUITEMS.BLOG.LIST.BLOGLIST',
                        link: '/',
                        parentId: 71
                    },
                    {
                        id: 73,
                        label: 'MENUITEMS.BLOG.LIST.BLOGGRID',
                        link: '/',
                        parentId: 71
                    },
                    {
                        id: 74,
                        label: 'MENUITEMS.BLOG.LIST.DETAIL',
                        link: '/',
                        parentId: 71
                    },
                ]
            },
            {
                id: 75,
                label: 'MENUITEMS.JOBS.TEXT',
                icon: 'bx-briefcase-alt',
                badge: {
                    variant: 'success',
                    text: 'MENUITEMS.JOBS.BADGE',
                },
                subItems: [
                    {
                        id: 76,
                        label: 'MENUITEMS.JOBS.LIST.JOBLIST',
                        link: '/',
                        parentId: 75
                    },
                    {
                        id: 77,
                        label: 'MENUITEMS.JOBS.LIST.JOBGRID',
                        link: '/',
                        parentId: 75
                    },
                    {
                        id: 78,
                        label: 'MENUITEMS.JOBS.LIST.APPLYJOB',
                        link: '/',
                        parentId: 75
                    },
                    {
                        id: 79,
                        label: 'MENUITEMS.JOBS.LIST.JOBDETAILS',
                        link: '/',
                        parentId: 75
                    },
                    {
                        id: 80,
                        label: 'MENUITEMS.JOBS.LIST.JOBCATEGORIES',
                        link: '/',
                        parentId: 75
                    },
                    {
                        id: 81,
                        label: 'MENUITEMS.JOBS.LIST.CANDIDATE.TEXT',
                        parentId: 75,
                        subItems: [
                            {
                                id:82,
                                label: 'MENUITEMS.JOBS.LIST.CANDIDATE.LIST.LIST',
                                link: '/',
                                parentId:81
                            },
                            {
                                id:83,
                                label: 'MENUITEMS.JOBS.LIST.CANDIDATE.LIST.OVERVIEW',
                                link: '/',
                                parentId:81
                            }
                        ]
                    }
                ]
            },
        ]
    },
    {
        id: 84,
        icon: 'bx-collection',
        label: 'MENUITEMS.COMPONENTS.TEXT',
        subItems: [
            {
                id: 85,
                label: 'MENUITEMS.FORMS.TEXT',
                subItems: [
                    {
                        id: 86,
                        label: 'MENUITEMS.FORMS.LIST.ELEMENTS',
                        link: '/',
                        parentId: 85
                    },
                    {
                        id: 87,
                        label: 'MENUITEMS.FORMS.LIST.LAYOUTS',
                        link: '/',
                        parentId: 85
                    },
                    {
                        id: 88,
                        label: 'MENUITEMS.FORMS.LIST.VALIDATION',
                        link: '/',
                        parentId: 85
                    },
                    {
                        id: 89,
                        label: 'MENUITEMS.FORMS.LIST.ADVANCED',
                        link: '/',
                        parentId: 85
                    },
                    {
                        id: 90,
                        label: 'MENUITEMS.FORMS.LIST.EDITOR',
                        link: '/',
                        parentId: 85
                    },
                    {
                        id: 91,
                        label: 'MENUITEMS.FORMS.LIST.FILEUPLOAD',
                        link: '/',
                        parentId: 85
                    },
                    {
                        id: 92,
                        label: 'MENUITEMS.FORMS.LIST.REPEATER',
                        link: '/',
                        parentId: 85
                    },
                    {
                        id: 93,
                        label: 'MENUITEMS.FORMS.LIST.WIZARD',
                        link: '/',
                        parentId: 85
                    },
                    {
                        id: 94,
                        label: 'MENUITEMS.FORMS.LIST.MASK',
                        link: '/',
                        parentId: 85
                    }
                ]
            },
            {
                id: 95,
                label: 'MENUITEMS.TABLES.TEXT',
                subItems: [
                    {
                        id: 96,
                        label: 'MENUITEMS.TABLES.LIST.BASIC',
                        link: '/',
                        parentId: 95
                    },
                    {
                        id: 97,
                        label: 'MENUITEMS.TABLES.LIST.DataTables',
                        link: '/',
                        parentId: 95
                    },
                    {
                        id: 98,
                        label: 'MENUITEMS.TABLES.LIST.EditTableTables',
                        link: '/',
                        parentId: 95
                    }
                ]
            },
            {
                id: 99,
                label: 'MENUITEMS.CHARTS.TEXT',
                subItems: [
                    {
                        id: 100,
                        label: 'MENUITEMS.CHARTS.LIST.APEX',
                        link: '/',
                        parentId: 99
                    },
                    {
                        id: 101,
                        label: 'MENUITEMS.CHARTS.LIST.CHARTJS',
                        link: '/',
                        parentId: 99
                    },
                    {
                        id: 102,
                        label: 'MENUITEMS.CHARTS.LIST.CHARTIST',
                        link: '/',
                        parentId: 99
                    },
                    {
                        id: 103,
                        label: 'MENUITEMS.CHARTS.LIST.ECHART',
                        link: '/',
                        parentId: 99
                    }
                ]
            },
            {
                id: 104,
                label: 'MENUITEMS.ICONS.TEXT',
                subItems: [
                    {
                        id: 105,
                        label: 'MENUITEMS.ICONS.LIST.BOXICONS',
                        link: '/',
                        parentId: 104
                    },
                    {
                        id: 106,
                        label: 'MENUITEMS.ICONS.LIST.MATERIALDESIGN',
                        link: '/',
                        parentId: 104
                    },
                    {
                        id: 107,
                        label: 'MENUITEMS.ICONS.LIST.DRIPICONS',
                        link: '/',
                        parentId: 104
                    },
                    {
                        id: 108,
                        label: 'MENUITEMS.ICONS.LIST.FONTAWESOME',
                        link: '/',
                        parentId: 104
                    },
                ]
            },
            {
                id: 109,
                label: 'MENUITEMS.MAPS.TEXT',
                subItems: [
                    // {
                    //     id: 110,
                    //     label: 'MENUITEMS.MAPS.LIST.GOOGLEMAP',
                    //     link: '/',
                    //     parentId: 109
                    // },
                    {
                        id: 111,
                        label: 'MENUITEMS.MAPS.LIST.LEAFLETMAP',
                        link: '/',
                        parentId: 109
                    }
                ]
            }
        ]
    },
    {
        id: 112,
        label: 'HEADER.EXTRA_PAGES.TITLE',
        icon: 'bx-file',
        subItems: [
            {
                id: 113,
                label: 'MENUITEMS.INVOICES.TEXT',
                subItems: [
                    {
                        id: 114,
                        label: 'MENUITEMS.INVOICES.LIST.INVOICELIST',
                        link: '/',
                        parentId: 113
                    },
                    {
                        id: 115,
                        label: 'MENUITEMS.INVOICES.LIST.INVOICEDETAIL',
                        link: '/',
                        parentId: 113
                    },
                ]
            },
            {
                id: 116,
                label: 'MENUITEMS.AUTHENTICATION.TEXT',
                subItems: [
                    {
                        id: 117,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.LOGIN',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 118,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.LOGIN2',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 119,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.REGISTER',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 120,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.REGISTER2',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 121,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.RECOVERPWD',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 122,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.RECOVERPWD2',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 123,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 124,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN2',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 125,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.CONFIRMMAIL',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 126,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.CONFIRMMAIL2',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 127,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.EMAILVERIFICATION',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 128,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.EMAILVERIFICATION2',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 129,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION',
                        link: '/',
                        parentId: 116
                    },
                    {
                        id: 130,
                        label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION2',
                        link: '/',
                        parentId: 116
                    }
                ]
            },
            {
                id: 131,
                label: 'MENUITEMS.UTILITY.TEXT',
                icon: 'bx-file',
                subItems: [
                    {
                        id: 132,
                        label: 'MENUITEMS.UTILITY.LIST.STARTER',
                        link: '/',
                        parentId: 131
                    },
                    {
                        id: 133,
                        label: 'MENUITEMS.UTILITY.LIST.MAINTENANCE',
                        link: '/',
                        parentId: 131
                    },
                    {
                        id: 134,
                        label: 'Coming Soon',
                        link: '/',
                        parentId: 131
                    },
                    {
                        id: 135,
                        label: 'MENUITEMS.UTILITY.LIST.TIMELINE',
                        link: '/',
                        parentId: 131
                    },
                    {
                        id: 136,
                        label: 'MENUITEMS.UTILITY.LIST.FAQS',
                        link: '/',
                        parentId: 131
                    },
                    {
                        id: 137,
                        label: 'MENUITEMS.UTILITY.LIST.PRICING',
                        link: '/',
                        parentId: 131
                    },
                    {
                        id: 138,
                        label: 'MENUITEMS.UTILITY.LIST.ERROR404',
                        link: '/',
                        parentId: 131
                    },
                    {
                        id: 139,
                        label: 'MENUITEMS.UTILITY.LIST.ERROR500',
                        link: '/',
                        parentId: 131
                    },
                ]
            }
        ]
    }
];

