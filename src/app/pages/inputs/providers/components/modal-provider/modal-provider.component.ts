import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ElementRef, ViewChild } from '@angular/core';
import { Observable, Subscription, switchMap, forkJoin, of, catchError, map } from 'rxjs';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProvidersService } from '../../../services/providers.service';
import Swal from 'sweetalert2';
import { CategoriesService } from 'src/app/pages/inventories/services/categories.service';
import { ProductsService } from 'src/app/pages/inventories/services/products.service';
import { ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';
import { BOLIVIA_DEPARTMENTS } from 'src/app/core/constants/bolivia-geography.constants';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { UsersService } from 'src/app/pages/managements/services/users.service';
import { InputsService } from '../../../services/inputs.service';
import { GetAllInputs, Input } from '../../../interfaces/input.interface';
import * as L from 'leaflet';
import { BankService } from 'src/app/pages/managements/services/bank.service';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';
import {
  PROVIDER_ACCOUNT_TYPES, PROVIDER_CURRENCIES, PROVIDER_ENTITY_TYPES,
  PROVIDER_FREQUENCIES, PROVIDER_NEGOTIATION_CONDITIONS, PROVIDER_ORIGIN_CHANNELS,
  PROVIDER_RELATIONSHIP_STATUSES, PROVIDER_SERVICE_MODES, PROVIDER_OPERATIONAL_TYPES,
} from 'src/app/core/constants/provider-commercial.constants';
import {
  ProviderCompanyProfile, ProviderContactProfile, ProviderSiteProfile,
  ProviderEntityType, ProviderFrequency, ProviderNegotiationCondition, ProviderOriginChannel,
  ProviderRelationshipStatus, ProviderServiceMode, ProviderOperationalType,
} from '../../../interfaces/provider-commercial-profile.interface';

type LocationSource = 'stored' | 'imported' | 'manual' | 'device';
type MaterialFrequencySuggestion = { has_sufficient_history: boolean; frequency: string | null; average_days: number | null; total_deliveries: number; estimated_volume?: number | null };
type MapDraft = { values: Record<string, unknown>; center?: L.LatLng; zoom?: number };

@Component({
  selector: 'app-modal-provider',
  templateUrl: './modal-provider.component.html',
  styles: [`
    .provider-validation-summary { border:1px solid #fecdd3; background:#fff1f2; color:#9f1239; padding:.65rem .8rem; border-radius:7px; margin-bottom:.7rem; font-size:11px; }
    .provider-validation-summary ul { margin:.35rem 0 0; padding-left:1.2rem; }
    .provider-validation-summary button { border:0; background:transparent; color:inherit; text-align:left; padding:.15rem 0; text-decoration:underline; }
    :host ::ng-deep .provider-fields .p-multiselect-label { display:flex; flex-wrap:wrap; gap:.25rem; white-space:normal; }
    :host ::ng-deep .provider-fields .p-multiselect-token { max-width:100%; font-size:11px; background:#ecfdf5; color:#065f46; }
    :host ::ng-deep .provider-fields .p-multiselect-token-label { white-space:normal; overflow-wrap:anywhere; }
    .provider-type-theme { --provider-accent:#059669; --provider-tint:#ecfdf5; }
    .provider-type-theme[data-provider-type="B"] { --provider-accent:#2563eb; --provider-tint:#eff6ff; }
    .provider-type-theme[data-provider-type="C"] { --provider-accent:#d97706; --provider-tint:#fffbeb; }
    .provider-type-theme[data-provider-type="D"] { --provider-accent:#ea580c; --provider-tint:#fff7ed; }
    .provider-type-theme[data-provider-type="E"] { --provider-accent:#7c3aed; --provider-tint:#f5f3ff; }
    .provider-type-theme[data-provider-type="F"] { --provider-accent:#e11d48; --provider-tint:#fff1f2; }
    .provider-sheet-heading .provider-sheet-icon { background:var(--provider-accent); }
    .provider-heading-type { font-size:10px; padding:.2rem .45rem; border-radius:4px; background:var(--provider-tint); color:var(--provider-accent); font-weight:700; }
    :host ::ng-deep .provider-letter-dialog { width:min(96vw,850px) !important; }
    :host ::ng-deep .provider-letter-dialog .p-dialog-header { border-bottom:3px solid #059669; }
    :host ::ng-deep .provider-template-B .p-dialog-header { border-bottom-color:#2563eb; }
    :host ::ng-deep .provider-template-C .p-dialog-header { border-bottom-color:#d97706; }
    :host ::ng-deep .provider-template-D .p-dialog-header { border-bottom-color:#ea580c; }
    :host ::ng-deep .provider-template-E .p-dialog-header { border-bottom-color:#7c3aed; }
    :host ::ng-deep .provider-template-F .p-dialog-header { border-bottom-color:#e11d48; }
    .provider-readonly { max-width:816px; margin:auto; }
    .provider-pdf-frame { display:block; width:100%; height:68vh; min-height:300px; border:1px solid #e2e8f0; border-radius:8px; background:#1e293b; }
    @media (max-width:600px) { .provider-pdf-frame { height:65dvh; min-height:240px; } }
    .provider-sheet-heading { display:flex; align-items:center; gap:.65rem; min-width:0; flex-wrap:wrap; }
    .provider-sheet-heading strong { font-size:14px; }
    .provider-sheet-heading small { display:block; font-size:10px; color:#cbd5e1; margin-top:.2rem; }
    .provider-sheet-icon, .provider-avatar { display:flex; align-items:center; justify-content:center; background:var(--color-primary); color:white; flex-shrink:0; }
    .provider-sheet-icon { width:32px; height:32px; border-radius:8px; }
    .provider-status { font-size:10px; border:1px solid #a7f3d0; background:#ecfdf5; color:#065f46; border-radius:20px; padding:.15rem .5rem; }
    .provider-status-inactive { background:#fff1f2; border-color:#fecdd3; color:#9f1239; }
    .provider-identity-card { display:flex; gap:.8rem; align-items:center; border:1px solid #e2e8f0; border-radius:10px; padding:1rem; margin-bottom:1rem; background:linear-gradient(110deg,#fff 75%,var(--color-primary-light)); }
    .provider-avatar { width:50px; height:50px; border-radius:12px; font-size:20px; font-weight:750; }
    .provider-identity-text { flex:1; min-width:0; }
    .provider-identity-text h2 { font-size:18px; font-weight:750; margin:0 0 .3rem; color:#0f172a; overflow-wrap:anywhere; }
    .provider-identity-text p { font-size:10px; color:#64748b; margin:.4rem 0 0; overflow-wrap:anywhere; }
    .provider-type-badge { display:inline-block; background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; border-radius:4px; font-size:10px; padding:.15rem .4rem; }
    .provider-readonly-label { font-size:10px; color:#64748b; white-space:nowrap; }
    .provider-sheet-tabs { overflow-x:auto; border-radius:0 !important; padding:0 !important; gap:0 !important; }
    .provider-sheet-tabs button { border:0; border-radius:0; min-width:max-content; padding:.75rem; border-bottom:2px solid transparent; background:transparent !important; color:#64748b !important; }
    .provider-sheet-tabs button.btn-success { background:#fff !important; color:#065f46 !important; border-bottom-color:var(--color-primary); box-shadow:none; }
    .provider-information { display:flex; flex-direction:column; gap:.45rem; }
    .provider-information-section { --section-bg: #f1f5f9; --section-border: #cbd5e1; --section-ink: #334155; padding: .75rem; border: 1px solid var(--section-border); border-radius: 8px; background: var(--section-bg); }
    .provider-information-section[data-tone="emerald"] { --section-bg: #ecfdf5; --section-border: #a7f3d0; --section-ink: #065f46; }
    .provider-information-section[data-tone="blue"] { --section-bg: #eff6ff; --section-border: #bfdbfe; --section-ink: #1e40af; }
    .provider-information-section[data-tone="amber"] { --section-bg: #fffbeb; --section-border: #fde68a; --section-ink: #92400e; }
    .provider-information-section[data-tone="violet"] { --section-bg: #f5f3ff; --section-border: #ddd6fe; --section-ink: #5b21b6; }
    .provider-information-section[data-tone="rose"] { --section-bg: #fff1f2; --section-border: #fecdd3; --section-ink: #9f1239; }
    .provider-information-section[data-tone="cyan"] { --section-bg: #ecfeff; --section-border: #a5f3fc; --section-ink: #155e75; }
    .provider-information-section { background:#fff; border-color:#e2e8f0; box-shadow:0 1px 2px #0f172a08; overflow:hidden; }
    .provider-information-section h3 { margin: -.75rem -.75rem .75rem; padding:.75rem; border-bottom:1px solid var(--section-border); background:var(--section-bg); font-size: 11px; font-weight: 750; text-transform: uppercase; color: var(--section-ink); display: flex; align-items: center; gap: .4rem; }
    .provider-information-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem .8rem; margin: 0; }
    .provider-information-grid dt { font-size: 11px; font-weight: 650; color: #475569; margin-bottom: .25rem; }
    .provider-information-grid dd { margin: 0; padding: .5rem .65rem; min-height: 34px; border: 1px solid #e2e8f0; border-radius: 6px; background: #ffffff; color: #0f172a; font-size: 11.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
    .information-full { grid-column: 1 / -1; }
    .provider-information-grid dd.information-empty, .information-empty { color: #64748b; font-weight: 400; }
    .provider-information-record, .provider-information-map { padding: .65rem; border: 1px solid var(--section-border); border-radius: 7px; background: #ffffff; margin-top: .65rem; }
    .provider-information-record h4, .provider-information-map h4 { font-size: 11px; font-weight: 700; color: var(--section-ink); margin: 0 0 .55rem; }
    @media (max-width: 850px) { .provider-information { grid-template-columns:minmax(0,1fr); } }
    @media (max-width: 600px) { .provider-information-grid { grid-template-columns: minmax(0, 1fr); } .provider-identity-card { flex-wrap:wrap; padding:.75rem; } .provider-readonly-label { margin-left:auto; } .provider-identity-text h2 { font-size:15px; } }
    .provider-readonly .provider-identity-card { padding:1rem; margin-bottom:1rem; background:linear-gradient(115deg,#fff 75%,var(--provider-tint)); gap:.8rem; border-color:#e2e8f0; box-shadow:0 1px 3px #0f172a06; }
    .provider-readonly .provider-avatar { width:50px; height:50px; font-size:19px; background:var(--provider-accent); border-radius:12px; box-shadow:0 4px 8px #0f172a12; }
    .provider-readonly .provider-identity-text h2 { font-size:17px; margin:0 0 .25rem; }
    .provider-readonly .provider-type-badge { color:var(--provider-accent); background:white; border-color:var(--provider-accent); font-size:9px; }
    .provider-summary-metrics { display:flex; gap:.5rem; flex-shrink:0; }
    .provider-summary-metrics div { padding:.65rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:7px; min-width:85px; }
    .provider-summary-metrics small { display:block; font-size:8px; text-transform:uppercase; font-weight:700; color:#94a3b8; margin-bottom:.25rem; }
    .provider-summary-metrics strong { font-size:11px; color:#0f172a; }
    .provider-readonly .provider-information { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1rem; align-items:start; }
    .provider-information-column { display:flex; flex-direction:column; gap:1rem; min-width:0; }
    .provider-readonly .provider-information-section { padding:1rem; border-radius:10px; box-shadow:0 1px 2px #0f172a08; }
    .provider-readonly .provider-information-section h3 { margin:-1rem -1rem 1rem; padding:.65rem 1rem; font-size:10px; background:#f8fafc; border-color:#e2e8f0; color:#334155; font-weight:600; }
    .provider-section-number { display:inline-flex; justify-content:center; align-items:center; height:20px; width:20px; border-radius:5px; background:var(--section-bg); color:var(--section-ink); font-weight:750; flex-shrink:0; }
    .provider-readonly .provider-information-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:.65rem; }
    .provider-readonly .provider-information-grid > div { padding:.6rem; border:1px solid #e8edf4; background:#f8fafc; border-radius:7px; min-width:0; }
    .provider-readonly .provider-information-grid dt { font-size:8px; text-transform:uppercase; font-weight:700; color:#94a3b8; margin:0 0 .3rem; line-height:1.35; }
    .provider-readonly .provider-information-grid dd { padding:0; min-height:0; border:0; background:transparent; font-size:11px; font-weight:600; line-height:1.5; }
    .provider-readonly .information-full { grid-column:1 / -1; }
    .provider-readonly .provider-information-record { padding:.65rem; margin-top:.65rem; border-color:#e2e8f0; }
    .provider-readonly .provider-information-record h4 { font-size:10px; margin-bottom:.5rem; }
    .provider-readonly .provider-information-map { padding:.6rem; margin-top:.75rem; background:var(--section-bg); }
    .provider-readonly .provider-information-map h4 { font-size:10px; }
    .provider-readonly .provider-information-map .location-map { height:270px; margin-top:.5rem; border-radius:7px; }
    @media(max-width:700px) { .provider-information-column { display:contents; } .provider-readonly .provider-information { grid-template-columns:minmax(0,1fr); } .provider-summary-metrics { width:100%; } .provider-summary-metrics div { flex:1; min-width:0; } .provider-readonly .provider-identity-card { flex-wrap:wrap; } }
    @media(max-width:400px) { .provider-readonly .provider-information-grid { grid-template-columns:minmax(0,1fr); } }
    :host ::ng-deep .provider-readonly .provider-fields button,
    :host ::ng-deep .provider-readonly .provider-fields .erp-error-msg { display: none; }
    :host ::ng-deep .provider-readonly .required::after { display: none; }
    :host ::ng-deep .type-a-provider-dialog { width: min(1400px, 96vw); }
    :host ::ng-deep .type-a-provider-dialog .p-dialog-content { max-height: 78vh; overflow-y: auto; padding: 1.25rem 1.75rem; }
    .type-a-profile { margin-top: 1.25rem; }
    .type-a-profile h6 { margin: 1.1rem 0 .7rem; padding: .7rem .9rem; border-radius: .55rem; background: linear-gradient(90deg, #e8f1ff, #f8fbff); border-left: 4px solid #2f80ed; color: #164f96; font-size: .82rem; font-weight: 800; letter-spacing: .03em; }
    .type-a-profile h6::before { content: '✓ '; color: #16803c; }
    .type-a-profile small.text-muted { display: block; padding: .7rem .85rem; border-radius: .45rem; background: #fff8e6; color: #6c5412 !important; border: 1px solid #f5df9c; }
    .type-a-profile hr { border-color: #dce7f5; margin: 1.15rem 0 .2rem; }
    .provider-profile { background:#f8fafc; padding:.25rem; }
    .profile-note { background:#e9f5ff; color:#165d91; padding:.7rem .9rem; border-radius:.4rem; margin-bottom:.7rem; font-size:.82rem; }
    .profile-steps { display:flex; gap:1rem; overflow:auto; white-space:nowrap; padding:.55rem; font-size:.73rem; color:#64748b; border-bottom:1px solid #dce7f5; }
    .profile-card { background:#fff; border:1px solid #dfe7f1; border-radius:.55rem; padding:1rem; margin:.85rem 0; }
    .profile-card:nth-of-type(1) { border-top:4px solid #2563eb; } .profile-card:nth-of-type(2) { border-top:4px solid #0891b2; } .profile-card:nth-of-type(3) { border-top:4px solid #7c3aed; } .profile-card:nth-of-type(4) { border-top:4px solid #16a34a; } .profile-card:nth-of-type(5) { border-top:4px solid #d97706; } .profile-card:nth-of-type(6) { border-top:4px solid #db2777; } .profile-card:nth-of-type(7) { border-top:4px solid #0284c7; } .profile-card:nth-of-type(8) { border-top:4px solid #64748b; }
    .profile-card h6 { display:flex; align-items:center; gap:.55rem; margin:0 0 .85rem; padding-bottom:.65rem; border-bottom:1px solid #e6edf5; color:#26374d; font-weight:800; }
    .profile-card h6 b { background:#dbeafe; color:#2563eb; padding:.2rem .45rem; border-radius:.35rem; } .profile-card h6 small { margin-left:auto; color:#94a3b8; font-weight:400; }
    .profile-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.75rem; } .profile-grid label,.wide { display:flex; flex-direction:column; gap:.3rem; font-size:.76rem; font-weight:700; color:#475569; } .wide{grid-column:1/-1;} @media(max-width:768px){.profile-grid{grid-template-columns:1fr;}.wide{grid-column:auto;}}
    .branch-management { background:linear-gradient(90deg,#f5f3ff,#fff); } .assigned-branches { display:flex; flex-wrap:wrap; gap:.45rem; margin-top:.85rem; } .assigned-branch { background:#ede9fe; color:#5b21b6; border:1px solid #c4b5fd; border-radius:999px; padding:.3rem .65rem; font-size:.76rem; } .assigned-branch i { margin-right:.35rem; }
    .type-a-profile .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin-left: 0; margin-right: 0; }
    .type-a-profile .row > [class*='col-'] { width: auto; max-width: none; padding-left: 0; padding-right: 0; }
    .type-a-profile .row:has(textarea) { grid-template-columns: 1fr; }
    @media (max-width: 768px) { :host ::ng-deep .type-a-provider-dialog { width: 98vw; } :host ::ng-deep .type-a-provider-dialog .p-dialog-content { max-height: 68vh; padding: 1rem; } }
     :host ::ng-deep .supplier-editor-dialog .p-dialog-header { background:#0f172a; color:#fff; padding:.85rem 1.1rem; } :host ::ng-deep .supplier-editor-dialog .p-dialog-header-icons button { color:#fff; } :host ::ng-deep .supplier-editor-dialog .p-dialog-content { padding:0; background:#f8fafc; max-height:72vh; overflow:auto; } :host ::ng-deep .supplier-editor-dialog .p-dialog-footer { padding:0; border:0; }
    .location-editor{border:1px solid #a7f3d0;background:#fff;border-radius:.65rem;padding:.75rem}.location-toolbar{display:flex;align-items:center;gap:.5rem;margin-bottom:.7rem}.location-toolbar>div{flex:1}.location-toolbar b,.location-toolbar small{display:block;font-size:.72rem}.location-toolbar b{color:#065f46}.location-toolbar small{color:#64748b;margin-top:.15rem}.location-map{width:100%;height:210px;border:1px solid #dbe4ee;border-radius:.55rem;margin-top:.65rem}.location-map-empty{height:120px;border:1px dashed #94a3b8;border-radius:.55rem;background:#f8fafc;color:#64748b;display:flex;align-items:center;justify-content:center;gap:.6rem;font-size:.75rem}.location-map-empty i{font-size:1.25rem;color:#10b981}
    :host ::ng-deep .provider-map-pin{background:transparent;border:0}:host ::ng-deep .provider-map-pin__body{position:relative;display:block;width:34px;height:42px}:host ::ng-deep .provider-map-pin__body i{font-size:2.55rem;color:#059669;filter:drop-shadow(0 3px 3px #0f172a55)}:host ::ng-deep .provider-map-pin__body b{position:absolute;left:0;top:7px;width:34px;text-align:center;color:#fff;font-size:.61rem;line-height:1;font-weight:900}:host ::ng-deep .provider-map-pin--b i{color:#2563eb}:host ::ng-deep .provider-map-pin--c i{color:#d97706}:host ::ng-deep .provider-map-pin--d i{color:#ea580c}:host ::ng-deep .provider-map-pin--e i{color:#7c3aed}:host ::ng-deep .provider-map-pin--f i{color:#e11d48}.google-map-search{border-top:1px solid #e2e8f0;padding-top:.65rem}.location-map-help{display:flex;align-items:center;justify-content:space-between;gap:.65rem;flex-wrap:wrap;margin:.55rem 0 .15rem;color:#64748b;font-size:.68rem}.location-map-help span{display:inline-flex;align-items:center;gap:.35rem}.location-map-help .pin-legend{border:1px solid #a7f3d0;background:#ecfdf5;color:#047857;border-radius:999px;padding:.22rem .5rem}.location-map-help .pin-legend i{color:#059669}.location-map-help .pin-legend--b{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8}.location-map-help .pin-legend--b i{color:#2563eb}.location-map-help .pin-legend--c{border-color:#fde68a;background:#fffbeb;color:#92400e}.location-map-help .pin-legend--c i{color:#d97706}.location-map-help .pin-legend--d{border-color:#fed7aa;background:#fff7ed;color:#9a3412}.location-map-help .pin-legend--d i{color:#ea580c}.location-map-help .pin-legend--e{border-color:#ddd6fe;background:#f5f3ff;color:#6d28d9}.location-map-help .pin-legend--e i{color:#7c3aed}.location-map-help .pin-legend--f{border-color:#fecdd3;background:#fff1f2;color:#be123c}.location-map-help .pin-legend--f i{color:#e11d48}.location-status{color:#047857!important;font-weight:700}
    .supplier-header{display:flex;align-items:center;gap:.8rem;}.supplier-header>i{background:#064e3b;border:1px solid #10b981;padding:.65rem;border-radius:.55rem;color:#6ee7b7}.supplier-header b,.supplier-header small{display:block}.supplier-header b{font-size:.98rem}.supplier-header small{font-size:.72rem;color:#bfdbfe;margin-top:.2rem}.supplier-header span{margin-left:auto;border:1px solid #10b981;background:#064e3b;color:#a7f3d0;border-radius:999px;padding:.25rem .55rem;font-size:.68rem}.supplier-tabs{display:flex;background:#fff;border-bottom:1px solid #e2e8f0;overflow:auto}.supplier-tabs button{border:0;border-bottom:2px solid transparent;background:#fff;padding:.85rem 1.05rem;color:#64748b;font-size:.74rem;font-weight:700;white-space:nowrap}.supplier-tabs button.active{border-color:#059669;background:#ecfdf5;color:#047857}.supplier-tabs b{background:#059669;color:white;border-radius:999px;padding:.1rem .35rem;margin-left:.25rem}.supplier-body{padding:1.25rem;max-width:1450px;margin:auto}.supplier-notice,.branch-notice{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:.6rem;padding:.75rem 1rem;font-size:.75rem;margin-bottom:1rem}.branch-notice{background:#ecfdf5;border-color:#a7f3d0;color:#047857}.supplier-card{background:#fff;border:1px solid #e2e8f0;border-radius:.7rem;padding:1rem;margin-bottom:1rem}.supplier-card h6{font-size:.73rem;font-weight:800;color:#0f172a;border-bottom:1px solid #f1f5f9;padding-bottom:.7rem;margin:0 0 .9rem}.supplier-card h6 b{background:#d1fae5;color:#047857;padding:.25rem .45rem;border-radius:.35rem;margin-right:.45rem}.supplier-card h6 small{float:right;color:#64748b;font-weight:500}.supplier-card h6 .green{color:#059669}.supplier-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}.supplier-grid label{display:flex;flex-direction:column;gap:.3rem;font-size:.7rem;font-weight:700;color:#334155}.span-2{grid-column:span 2}.span-3{grid-column:1/-1}.compliance{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem}.compliance div{border:1px solid #e2e8f0;background:#f8fafc;padding:.75rem;border-radius:.5rem;position:relative}.compliance strong,.compliance span{display:block;font-size:.7rem}.compliance span{color:#64748b;margin-top:.25rem}.compliance p-tag{position:absolute;right:.6rem;top:.6rem}.branch-layout{display:grid;grid-template-columns:290px 1fr;gap:1rem}.branch-layout aside>b{font-size:.72rem;color:#0f172a;margin-bottom:.5rem;display:block}.branch-layout aside button{width:100%;border:1px solid #e2e8f0;background:#fff;border-radius:.55rem;padding:.75rem;margin-bottom:.6rem;display:flex;gap:.55rem;text-align:left;font-size:.72rem;color:#334155}.branch-layout aside button.active{border-color:#10b981;box-shadow:0 2px 6px #10b98130}.branch-layout aside strong{background:#d1fae5;color:#047857;padding:.25rem;border-radius:.3rem}.branch-layout aside span{flex:1}.branch-layout aside small{display:block;color:#64748b;margin-top:.2rem}.branch-layout aside button> :last-child{color:#10b981}.summary-banner{background:#0f172a;color:#fff;border-radius:.7rem;padding:1rem;display:flex;gap:.8rem;align-items:center}.summary-banner i{color:#6ee7b7;font-size:1.3rem}.summary-banner b,.summary-banner small{display:block}.summary-banner small{color:#94a3b8;font-size:.72rem}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.8rem;margin:1rem 0}.kpis div{background:#fff;border:1px solid #e2e8f0;border-radius:.65rem;padding:.9rem}.kpis small,.kpis span{display:block;font-size:.68rem;color:#64748b}.kpis b{display:block;font-size:1.35rem;color:#047857;margin:.35rem 0}.supplier-card table{width:100%;border-collapse:collapse;font-size:.73rem}.supplier-card th,.supplier-card td{padding:.7rem;border-bottom:1px solid #e2e8f0;text-align:left}.supplier-card th{color:#64748b;font-size:.65rem}.supplier-footer{background:#fff;border-top:1px solid #e2e8f0;padding:.7rem 1rem;display:flex;justify-content:space-between;align-items:center;font-size:.7rem;color:#64748b}.supplier-footer div{display:flex;gap:.5rem}@media(max-width:800px){.supplier-grid,.kpis,.compliance,.branch-layout{grid-template-columns:1fr}.span-2,.span-3{grid-column:auto}.supplier-header span{display:none}.supplier-footer{flex-direction:column;align-items:stretch}.supplier-footer div{justify-content:flex-end}}
  `]
})

export class ModalProviderComponent implements OnInit, OnDestroy {
  validatorsService = inject( ValidatorsService );
  providersService  = inject( ProvidersService );
  categoriesService = inject( CategoriesService );
  productsService = inject(ProductsService);
  sucursalesService = inject(SucursalesService);
  usersService      = inject(UsersService);
  inputsService     = inject(InputsService);
  bankService       = inject(BankService);
  fb                = inject( FormBuilder );
  loading           = signal(false);
  serverErrors = signal<Record<string, string[]>>({});
  availableProviders = signal<any[]>([]);
  selectedCompanyProviders = signal<any[]>([]);
  companySites = signal<ProviderSiteProfile[]>([]);
  creatingBranch = signal(false);
  activeTab = signal<'company' | 'branches' | 'summary'>('company');
  selectedBranchId = signal<number | null>(null);
  readonly productContext = ProductAccessContext.Purchases;
  isEditSub$!: Subscription;
  isReloadSub$!: Subscription;
  types = signal<{name:string, code:string, id:string}[]>([]);
  categories = signal<{name:string,code:string}[]>([]);
  rawProducts = signal<{id: number, name:string,code:string,id_category: number, categoryName:string}[]>([]);
  productsLoaded = signal(false);
  products = signal<{name:string,code:string,categoryName:string}[]>([]);
  sectors = signal<{name:string,code:string}[]>([]);
  departments = BOLIVIA_DEPARTMENTS.map(item => ({ name: item.name, code: item.name }));
  provinces = signal<{ name: string; code: string }[]>([]);
  commercialUsers = signal<{ id: number; full_names: string }[]>([]);
  locating = signal(false);
  importingLocation = signal(false);
  locationStatus = signal('');
  banks = signal<Bank[]>([]);
  @ViewChild('locationMap') locationMap?: ElementRef<HTMLDivElement>;
  private map?: L.Map;
  private locationMarker?: L.Marker;
  private mapDrafts: Partial<Record<'company' | 'branches', MapDraft>> = {};
  private frequencyRequest?: Subscription;
  materialFrequencySuggestions = signal<Partial<Record<number, MaterialFrequencySuggestion>>>({});
  storedCertificate = signal('');
  registeredDocuments = signal<{ document_type: string; original_name: string }[]>([]);
  registeredCommercialUser = signal('');
  frequencies = signal(PROVIDER_FREQUENCIES.map(option => ({ name: option.label, code: option.value })));
  frequencyMode = signal<'automatic' | 'manual'>('automatic');
  frequencyAnalysis = signal<{
    has_sufficient_history: boolean;
    total_deliveries: number;
    average_days: number | null;
    frequency: string | null;
    frequency_mode: 'automatic' | 'manual';
    last_delivery_date: string | null;
    next_estimated_date: string | null;
        first_delivery_date?: string | null;
        total_purchases?: number;
        elapsed_days?: number;
        total_kg?: number;
        estimated_volume?: number | null;
        recommended_contact_date?: string | null;
        overdue_days?: number;
        purchases?: { id: number; cod: string; purchase_date: string; total_kg: number }[];
    message?: string;
  } | null>(null);
  loadingFrequency = signal(false);

  // Historial compras
  providerPurchases = signal<Input[]>([]);
  loadingPurchases = signal(false);
  totalPurchasesAmount = signal(0);
  totalPurchasesCount = signal(0);
  lastPurchaseDate = signal<string | null>(null);
  entityTypes = PROVIDER_ENTITY_TYPES;
  serviceModes = PROVIDER_SERVICE_MODES;
  originChannels = PROVIDER_ORIGIN_CHANNELS;
  relationshipStatuses = PROVIDER_RELATIONSHIP_STATUSES;
  negotiationConditions = PROVIDER_NEGOTIATION_CONDITIONS;
  accountTypes = PROVIDER_ACCOUNT_TYPES;
  currencies = PROVIDER_CURRENCIES;
  operationalTypes = PROVIDER_OPERATIONAL_TYPES;
  wholesaleFrequencies = PROVIDER_FREQUENCIES.filter(option => option.value !== 'ANNUAL');
  wholesaleOriginChannels = [
    { label: 'Prospección', value: 'PROSPECTION' }, { label: 'Referido', value: 'REFERRAL' },
    { label: 'Redes', value: 'SOCIAL_MEDIA' }, { label: 'Puerta', value: 'DOOR' },
    { label: 'Ruteo', value: 'ROUTING_VISIT' }, { label: 'Contacto directo', value: 'DIRECT_CONTACT' },
    { label: 'Otro', value: 'OTHER' },
  ];
  wholesaleRelationshipStatuses = [
    { label: 'En gestión', value: 'IN_PROGRESS' }, { label: 'Activo', value: 'ACTIVE' },
    { label: 'Sin movimiento', value: 'DORMANT' }, { label: 'Recuperación', value: 'TO_RECOVER' },
    { label: 'Perdido', value: 'LOST' },
  ];
  logisticsConditions = [
    { label: 'Entrega proveedor', value: 'SUPPLIER_DELIVERY' }, { label: 'Recojo Recumet', value: 'RECUMET_PICKUP' },
    { label: 'Según volumen', value: 'BY_VOLUME' }, { label: 'A coordinar', value: 'TO_COORDINATE' },
  ];
  negotiationModes = [
    { label: 'Directa', value: 'DIRECT' }, { label: 'Requiere negociación', value: 'NEGOTIATION_REQUIRED' },
    { label: 'Cotización previa', value: 'PRIOR_QUOTATION' },
  ];
  priceLevels = [
    { label: 'Precio minorista', value: 'LIST_PRICE' },
    { label: 'Ajuste autorizado', value: 'AUTHORIZED_SPECIAL_PRICE' },
  ];
  documentFiles = signal<Partial<Record<'CERTIFICATE' | 'TRACEABILITY_REPORT', File>>>({});
  branchOptions = [
    { name: 'No', code: false },
    { name: 'Sí', code: true },
  ];
  providerForm: FormGroup = this.fb.group({
    id: [''],
    site_name: [''],
    company_id: [null],
    full_names: [ '', [Validators.minLength(2),Validators.maxLength(174)]],
    id_sector: [''],
    number_document: [null, [Validators.maxLength(50)]],
    cellphone: [ null, [Validators.min(60000000),Validators.max(79999999)]],
    direction: [ null, [Validators.maxLength(254)]],
    id_type_provider: ['', [Validators.required]],
    mayorista: [ false, []],
    name_contact: [ null, [Validators.maxLength(174)]],
    cellphone_contact: [ null, [Validators.min(60000000),Validators.max(79999999)]],
    id_category: [ ''],
    id_categories: [[]],
    id_sucursal: [ null],
    companyContacts:[ '', [Validators.maxLength(254)]],
    commercial_name: ['', [Validators.maxLength(174)]],
    corporate_phone: ['', [Validators.maxLength(60)]], corporate_cellphone: ['', [Validators.maxLength(30)]],
    corporate_email: ['', [Validators.email]], website: ['', [Validators.pattern(/^https?:\/\/.+/i)]],
    entity_type: ['PRIVATE', []],
    id_commercial_user: [null],
    has_branches: [false],
    provider_ids: [[]],
    service_mode: ['BOTH', []],
    origin_channel: ['DIRECT_CONTACT', []],
    relationship_status: ['ACTIVE', []],
    negotiation_condition: ['', []],
    commercial_observations: ['', [Validators.maxLength(2000)]],
    usual_service_mode: [null], logistics_condition: ['RECUMET_PICKUP'], negotiation_mode: [null], price_policy: ['LIST_PRICE'],
    habitual_price_adjustment: ['', Validators.maxLength(500)],
    commercialized_materials: ['', Validators.maxLength(1000)],
    contact_frequency: ['MONTHLY'],
    wholesale_materials: this.fb.array([]),
    requires_certificate: [false, []],
    requires_traceability_report: [false, []],
    general_observations: ['', [Validators.maxLength(2000)]],
    department: [''], province: [''], city: [''], zone: [''], latitude: [null], longitude: [null], geolocation_text: [''], google_maps_url: [''], contact_email: [''],
    id_bank: [''], account_holder: [''], account_number: [''], account_type: [''], currency: ['BOB'],
    frequency:[ 'MONTHLY', [Validators.maxLength(254)]],
    frequency_mode: ['automatic'],
    workAreaOrPositionOrUnit: ['', [Validators.maxLength(254)]],
    contacts: this.fb.array([]),
    material_ids: [[]],
    operational_type: ['RAW_MATERIAL'],
    bankAccounts: this.fb.array([]),
    status: [true]
  });

  formP = {
    full_names: { label: '', view: true },
    id_sector: { label: '', view: true },
    number_document: { label: '', view: true },
    cellphone: { label: '', view: true },
    direction: { label: '', view: true },
    mayorista: { label: '', view: true },
    name_contact: { label: '', view: true },
    cellphone_contact: { label: '', view: true },
    id_category: { label: '', view: true },
    status: { label: '', view: true },
    companyContacts: { label: '', view: true},
    frequency: { label: '', view: true},
    workAreaOrPositionOrUnit: { label: '', view: true},
  };
  ngOnInit(): void {
    this.getAllCategories();
    this.getAllProducts();
    this.getAllSectors();
    this.getAllTypes();
    this.loadBanks();
    this.loadCommercialUsers();
    this.ensureCollectionRows();
    this.loadAvailableProviders(0);
    this.loadDefaultBranchCity();
    this.isEditSub$ = this.providersService.editSubs.subscribe(resp => {
      this.loadProviderForm(resp);
      this.loadAvailableProviders(resp.id);
      this.providersService.getCommercialDetails(resp.id).subscribe({
        next: ({ provider }) => {
          if (provider) {
            this.loadProviderForm(provider);
            if (provider.company?.id) this.loadCompanySites(provider.company.id, provider.id); else this.restoreRegistrationDraft();
          }
        },
        error: () => {
          this.restoreRegistrationDraft();
        }
      });
    });
    this.isReloadSub$ = this.providersService.reloadCategoriesSectors$
                            .subscribe(resp=>{
                                this.providerForm.patchValue({id_sector: ''});
                                this.getAllSectors()
                            });
  }

  get contactRows(): FormArray { return this.providerForm.get('contacts') as FormArray; }
  get bankAccountRows(): FormArray { return this.providerForm.get('bankAccounts') as FormArray; }

  addContact(contact: Partial<ProviderContactProfile> = {}) {
    this.contactRows.push(this.fb.group({
      id: [contact.id || null],
      full_name: [contact.full_name || '', [Validators.required, Validators.maxLength(174)]],
      position_area: [contact.position_area || '', [...(this.supportsBranches() ? [Validators.required] : []), Validators.maxLength(254)]],
      cellphone: [contact.cellphone || '', [...(this.supportsBranches() ? [Validators.required] : []), Validators.pattern(/^[67]\d{7}$/)]],
      email: [contact.email || '', Validators.email],
      is_main_contact: [contact.is_main_contact ?? this.contactRows.length === 0],
      status: [contact.status !== false],
    }));
  }

  removeContact(index: number) {
    if (this.contactRows.length === 1) return;
    const wasMain = this.contactRows.at(index).get('is_main_contact')?.value;
    this.contactRows.removeAt(index);
    if (wasMain && this.contactRows.length) this.setMainContact(0);
  }

  setMainContact(index: number) {
    this.contactRows.controls.forEach((control, current) => control.get('is_main_contact')?.setValue(current === index));
  }

  addBankAccount(account: Record<string, unknown> = {}) {
    this.bankAccountRows.push(this.fb.group({
      id: [account['id'] || null], id_bank: [account['id_bank'] || null, Validators.required],
      account_holder: [account['account_holder'] || '', Validators.required],
      account_number: [account['account_number'] || '', Validators.required],
      account_type: [account['account_type'] || 'CAJA_AHORRO', Validators.required],
      currency: [account['currency'] || 'BOB', Validators.required],
      is_main: [account['is_main'] ?? this.bankAccountRows.length === 0], status: [account['status'] !== false],
    }));
  }

  removeBankAccount(index: number) {
    const wasMain = this.bankAccountRows.at(index).get('is_main')?.value;
    this.bankAccountRows.removeAt(index);
    if (wasMain && this.bankAccountRows.length) this.setMainBankAccount(0);
  }

  setMainBankAccount(index: number) {
    this.bankAccountRows.controls.forEach((control, current) => control.get('is_main')?.setValue(current === index));
  }

  private ensureCollectionRows() {
    if (!this.contactRows.length) this.addContact();
  }

  private loadBanks() {
    this.bankService.getAllAndSearch(1, 1000, true).subscribe({
      next: response => this.banks.set(response.banks.data),
      error: () => this.banks.set([]),
    });
  }

  private loadCollections(provider: any) {
    this.contactRows.clear();
    (provider.contacts || []).forEach((contact: ProviderContactProfile) => this.addContact(contact));
    if (!this.contactRows.length && provider.name_contact) {
      this.addContact({ full_name: provider.name_contact, position_area: provider.workAreaOrPositionOrUnit || '', cellphone: String(provider.cellphone_contact || ''), is_main_contact: true });
    }
    this.ensureCollectionRows();
    this.bankAccountRows.clear();
    (provider.bankAccounts || []).forEach((account: Record<string, unknown>) => this.addBankAccount(account));
    const materialIds = (provider.materials || []).filter((item: any) => item.status !== false && item.id_product).map((item: any) => Number(item.id_product));
    this.providerForm.patchValue({
      material_ids: materialIds,
    });
    this.wholesaleMaterialRows.clear();
    (provider.materials || []).filter((item: any) => item.status !== false && item.id_product)
      .forEach((item: any) => this.addWholesaleMaterial(item));
    const all = this.rawProducts();
    const categoriesFromMaterials = new Set<string>();
    (provider.materials || []).filter((item: any) => item.status !== false && item.id_category)
      .forEach((item: any) => categoriesFromMaterials.add(String(item.id_category)));
    materialIds.forEach((id: number) => {
      const prod = all.find(p => p.id === id);
      if (prod && prod.id_category) categoriesFromMaterials.add(String(prod.id_category));
    });
    if (provider.id_category) categoriesFromMaterials.add(String(provider.id_category));
    const catArray = Array.from(categoriesFromMaterials);
    if (catArray.length) {
      this.providerForm.patchValue({ id_categories: catArray });
      this.filterProductsByCategories(catArray);
    }
    if (!this.supportsMultipleContacts()) this.contactRows.disable({ emitEvent: false });
  }

  private loadCompanySites(companyId: number, selectedProviderId?: number) {
    this.providersService.getCommercialCompany(companyId).subscribe(({ company }) => {
      this.registeredDocuments.set(company.documents || []);
      const sites = company.operatingProviders || [];
      this.companySites.set(sites);
      const selected = sites.find(site => site.id === selectedProviderId) || sites[0];
      if (selected) this.selectCompanySite(selected);
    });
  }

  selectCompanySite(site: ProviderSiteProfile) {
    delete this.mapDrafts.branches;
    this.creatingBranch.set(false);
    this.selectedBranchId.set(site.id || null);
    const location = site.location;
    this.providerForm.patchValue({
      id: site.id || null, site_name: site.full_names, cellphone: site.cellphone || null,
      frequency: site.frequency, service_mode: site.service_mode, status: site.status,
      id_sucursal: (site as ProviderSiteProfile & { id_sucursal?: number }).id_sucursal || this.validatorsService.id_sucursal(),
      department: location?.department || '', province: location?.province || '', city: location?.city || '',
      zone: location?.zone || '', direction: location?.address || '', latitude: location?.latitude || null,
      longitude: location?.longitude || null, geolocation_text: location?.geolocation_text || '', google_maps_url: location?.google_maps_url || '',
      material_ids: site.materials.filter(item => item.id_product).map(item => Number(item.id_product)),
    });
    this.loadCollections(site);
    this.updateProvinceOptions(false);
    this.refreshMap('stored');
    this.restoreRegistrationDraft();
    if (this.providersService.isInfo) this.providerForm.disable({ emitEvent: false });
  }

  startNewBranch() {
    delete this.mapDrafts.branches;
    this.creatingBranch.set(true);
    this.selectedBranchId.set(null);
    this.providerForm.patchValue({
      id: null, site_name: '', cellphone: null, frequency: 'UNDETERMINED', service_mode: 'BOTH', status: true,
      id_sucursal: this.validatorsService.id_sucursal(), department: '', province: '', city: '', zone: '', direction: '',
      latitude: null, longitude: null, geolocation_text: '', google_maps_url: '', material_ids: [],
      name_contact: '', workAreaOrPositionOrUnit: '', cellphone_contact: '', contact_email: '',
    });
    this.contactRows.clear(); this.bankAccountRows.clear();
    this.locationMarker?.remove(); this.locationMarker = undefined;
    this.loadDefaultBranchCity(); this.restoreRegistrationDraft();
  }

  saveBranch() {
    if (this.providersService.isInfo) return;
    const companyId = Number(this.providerForm.get('company_id')?.value);
    const providerType = this.providerForm.get('id_type_provider')?.value;
    if (!companyId) {
      Swal.fire({ icon: 'warning', title: 'Guarde primero la empresa matriz' });
      return;
    }
    if (!this.validateBeforeSave()) return;
    const draftKey = this.registrationDraftKey();
    const site = this.buildSiteProfile(providerType, this.creatingBranch() ? 'BRANCH' : this.currentSiteRole());
    this.loading.set(true);
    const request$: Observable<unknown> = this.creatingBranch()
      ? this.providersService.createCommercialSite(companyId, site)
      : this.providersService.updateCommercialSite(companyId, Number(this.selectedBranchId()), site);
    request$.subscribe({
      next: () => {
        this.removeRegistrationDraft(draftKey);
        this.loadCompanySites(companyId, this.creatingBranch() ? undefined : Number(this.selectedBranchId()));
        this.creatingBranch.set(false);
        Swal.fire({ icon: 'success', title: 'Sede guardada', timer: 1500, showConfirmButton: false });
      },
      error: (error: { error?: { errors?: Array<{ msg?: string }> } }) => this.handleSaveError(error),
      complete: () => this.loading.set(false),
    });
  }

  private currentSiteRole(): 'HEADQUARTERS' | 'BRANCH' {
    return this.companySites().find(site => site.id === this.selectedBranchId())?.site_role || 'BRANCH';
  }

  private loadProviderForm(resp: any) {
    if (!resp) return;
    this.mapDrafts = {};
    this.storedCertificate.set(resp.certificate_file_name || '');
    const companyProviders = resp.company?.operatingProviders || [];
    const corporate = resp.company || resp;
    this.registeredDocuments.set(corporate.documents || []);
    this.registeredCommercialUser.set(corporate.commercialUser?.full_names || resp.commercialUser?.full_names || '');
    const typeCode = resp.type?.code || 'A';
    this.updateFormLabels(typeCode);

    const mainBranch = (resp.branches || []).find((item: any) => item.is_main) || {};
    const departmentVal = mainBranch.department || resp.department || '';
    const zoneVal = mainBranch.zone || resp.zone || '';
    const directionVal = resp.direction || mainBranch.address || '';
    const latVal = mainBranch.latitude !== undefined && mainBranch.latitude !== null ? mainBranch.latitude : (resp.latitude ?? null);
    const lngVal = mainBranch.longitude !== undefined && mainBranch.longitude !== null ? mainBranch.longitude : (resp.longitude ?? null);
    const geoText = mainBranch.geolocation_text || resp.geolocation_text || '';
    const gMapsUrl = mainBranch.google_maps_url || resp.google_maps_url || '';

    const mainBank = (resp.bankAccounts || []).find((item: any) => item.is_main) || {};
    const mainContact = (resp.contacts || []).find((item: any) => item.is_main_contact) || {};

    this.providerForm.patchValue({
      id: resp.id,
      site_name: resp.full_names || '',
      company_id: resp.company?.id || null,
      id_sucursal: resp.id_sucursal || this.validatorsService.id_sucursal(),
      full_names: corporate.full_names || resp.full_names || '',
      id_sector: resp.sector?.id?.toString() || resp.id_sector?.toString() || '',
      number_document: corporate.number_document || resp.number_document || null,
      cellphone: resp.cellphone || null,
      direction: directionVal,
      id_type_provider: resp.type ? {
        name: resp.type.name?.toString() || '',
        code: resp.type.code?.toString() || 'A',
        id: resp.type.id?.toString() || '',
      } : this.providerForm.get('id_type_provider')?.value,
      mayorista: resp.mayorista ?? false,
      name_contact: mainContact.full_name || resp.name_contact || null,
      companyContacts: resp.companyContacts || '',
      commercial_name: corporate.commercial_name || resp.commercial_name || '',
      corporate_phone: corporate.corporate_phone || '',
      corporate_cellphone: corporate.corporate_cellphone || '',
      corporate_email: corporate.corporate_email || '',
      website: corporate.website || '',
      entity_type: corporate.entity_type || resp.entity_type || 'PRIVATE',
      operational_type: corporate.operational_type || resp.operational_type || 'RAW_MATERIAL',
      id_commercial_user: corporate.id_commercial_user || resp.id_commercial_user || (this.providersService.isInfo ? null : this.validatorsService.user()?.id) || null,
      has_branches: resp.company?.has_branches ?? false,
      provider_ids: companyProviders.filter((item: any) => item.id !== resp.id).map((item: any) => item.id),
      service_mode: resp.service_mode || (this.providersService.isInfo ? null : 'BOTH'),
      origin_channel: corporate.origin_channel || resp.origin_channel || (this.providersService.isInfo ? null : 'DIRECT_CONTACT'),
      relationship_status: corporate.relationship_status || resp.relationship_status || (this.providersService.isInfo ? null : 'ACTIVE'),
      negotiation_condition: corporate.negotiation_condition || resp.negotiation_condition || null,
      commercial_observations: corporate.commercial_observations || resp.commercial_observations || '',
      usual_service_mode: resp.usual_service_mode || null,
      logistics_condition: resp.logistics_condition || (this.providersService.isInfo ? null : 'RECUMET_PICKUP'),
      negotiation_mode: resp.negotiation_mode || null,
      price_policy: resp.price_policy || (this.providersService.isInfo ? null : 'LIST_PRICE'),
      habitual_price_adjustment: resp.habitual_price_adjustment || '',
      commercialized_materials: resp.commercialized_materials || '',
      contact_frequency: resp.contact_frequency || resp.frequency || 'MONTHLY',
      requires_certificate: corporate.requires_certificate ?? resp.requires_certificate ?? false,
      requires_traceability_report: corporate.requires_traceability_report ?? resp.requires_traceability_report ?? false,
      general_observations: corporate.general_observations || resp.general_observations || '',
      department: departmentVal,
      province: mainBranch.province || resp.province || '',
      city: mainBranch.city || resp.city || '',
      zone: zoneVal,
      latitude: latVal,
      longitude: lngVal,
      geolocation_text: geoText,
      google_maps_url: gMapsUrl,
      contact_email: mainContact.email || resp.contact_email || '',
      id_bank: mainBank.id_bank || resp.id_bank || '',
      account_holder: mainBank.account_holder || resp.account_holder || '',
      account_number: mainBank.account_number || resp.account_number || '',
      account_type: mainBank.account_type || resp.account_type || '',
      currency: mainBank.currency || resp.currency || 'BOB',
      frequency: resp.frequency || (this.providersService.isInfo ? null : 'MONTHLY'),
      frequency_mode: String(resp.frequency_mode || '').toLowerCase() === 'manual' ? 'manual' : 'automatic',
      workAreaOrPositionOrUnit: mainContact.position_area || resp.workAreaOrPositionOrUnit || '',
      cellphone_contact: mainContact.cellphone || resp.cellphone_contact || null,
      id_category: resp.id_category?.toString() || '',
      status: resp.status !== false,
    });
    this.selectedCompanyProviders.set(companyProviders.filter((item: any) => item.id !== resp.id));
    this.changeLabelAndForm();
    this.loadCollections(resp);
    this.updateProvinceOptions(false);
    this.locationStatus.set(latVal ? 'Ubicación registrada cargada' : '');
    this.refreshMap('stored');

    this.frequencyMode.set(String(resp.frequency_mode || '').toLowerCase() === 'manual' ? 'manual' : 'automatic');
    this.selectedBranchId.set(resp.id);
    this.activeTab.set('company');
    this.initializeLocationMap();
    this.fetchFrequencyAnalysis();
    this.loadPurchasesHistory(resp.id);
    if (this.providersService.isInfo) this.providerForm.disable({ emitEvent: false });
  }

  private loadAvailableProviders(currentProviderId: number) {
    this.providersService.getAllAndSearch(1, 1000, true).subscribe({
      next: (response: any) => this.availableProviders.set((response.providers?.data || []).filter((provider: any) => provider.id !== currentProviderId)),
    });
  }

  isTypeA() {
    return this.providerForm.get('id_type_provider')?.value?.code === 'A';
  }

  isTypeB() {
    return this.providerForm.get('id_type_provider')?.value?.code === 'B';
  }

  isTypeC() {
    return this.providerForm.get('id_type_provider')?.value?.code === 'C';
  }

  isTypeD() {
    return this.providerForm.get('id_type_provider')?.value?.code === 'D';
  }

  usesCommercialTerms() {
    const code = this.providerForm.get('id_type_provider')?.value?.code;
    return code === 'B' || code === 'C';
  }

  get wholesaleMaterialRows(): FormArray {
    return this.providerForm.get('wholesale_materials') as FormArray;
  }

  private addWholesaleMaterial(material: any) {
    this.wholesaleMaterialRows.push(this.fb.group({
      id: [material.id || null], id_product: [Number(material.id_product)],
      estimated_volume: [material.estimated_volume == null ? null : Number(material.estimated_volume), Validators.min(0)],
      frequency: [material.frequency || this.providerForm.get('frequency')?.value || 'UNDETERMINED'],
      frequency_mode: [String(material.frequency_mode || '').toLowerCase() === 'manual' ? 'manual' : 'automatic'],
    }));
  }

  syncWholesaleMaterials() {
    const selected = (this.providerForm.get('material_ids')?.value || []).map(Number);
    for (let i = this.wholesaleMaterialRows.length - 1; i >= 0; i--) {
      if (!selected.includes(Number(this.wholesaleMaterialRows.at(i).get('id_product')?.value))) {
        this.wholesaleMaterialRows.removeAt(i);
      }
    }
    selected.forEach((id: number) => {
      if (!this.wholesaleMaterialRows.controls.some(row => Number(row.get('id_product')?.value) === id)) {
        this.addWholesaleMaterial({ id_product: id });
      }
    });
  }

  materialName(productId: number): string {
    return this.rawProducts().find(product => product.id === Number(productId))?.name || `Producto #${productId}`;
  }

  private buildProviderPayload() {
    const value = this.providerForm.getRawValue();
    const { wholesale_materials, ...profile } = value;
    profile.id_sucursal = value.id_sucursal || this.validatorsService?.id_sucursal() || null;
    if (!this.isTypeB()) {
      const { contacts, ...legacyProfile } = profile;
      if (this.isTypeD()) {
        for (const field of ['cellphone', 'companyContacts']) delete legacyProfile[field];
      }
      if (this.isTypeC() || this.isTypeD()) {
        delete legacyProfile.requires_certificate;
        delete legacyProfile.requires_traceability_report;
      }
      return {
        ...legacyProfile,
        id_sector: value.id_sector || null,
        id_category: value.id_categories?.[0] || value.id_category || null,
        materials: (value.material_ids || []).map((id: number) => ({
          id_product: Number(id), frequency: value.frequency, frequency_mode: value.frequency_mode,
          service_mode: value.service_mode, status: true,
        })),
        ...(!this.isTypeA() ? {
          contacts: value.contacts.filter((contact: any) => contact.full_name?.trim() || contact.cellphone),
          name_contact: value.contacts.find((contact: any) => contact.is_main_contact)?.full_name || value.contacts[0]?.full_name || null,
          cellphone_contact: value.contacts.find((contact: any) => contact.is_main_contact)?.cellphone || value.contacts[0]?.cellphone || null,
          workAreaOrPositionOrUnit: value.contacts.find((contact: any) => contact.is_main_contact)?.position_area || value.contacts[0]?.position_area || '',
          contact_email: value.contacts.find((contact: any) => contact.is_main_contact)?.email || value.contacts[0]?.email || '',
        } : {}),
      };
    }
    const contacts = value.contacts.filter((contact: any) => contact.full_name?.trim() || contact.cellphone?.trim());
    const mainContact = contacts.find((contact: any) => contact.is_main_contact) || contacts[0];
    const mainBank = value.bankAccounts.find((account: any) => account.is_main) || value.bankAccounts[0];
    const materials = wholesale_materials.map((material: any) => ({
      ...material, estimated_volume: material.estimated_volume === '' ? null : material.estimated_volume,
      frequency_mode: this.frequencyMode() === 'automatic' && this.materialFrequencySuggestions()[material.id_product]?.has_sufficient_history ? 'automatic' : 'manual',
      service_mode: value.service_mode, status: true,
    }));
    return {
      ...profile, id_sector: value.id_sector || null, contacts, materials,
      id_category: value.id_categories[0] || value.id_category || null,
      name_contact: mainContact?.full_name || null, cellphone_contact: mainContact?.cellphone || null,
      workAreaOrPositionOrUnit: mainContact?.position_area || '', contact_email: mainContact?.email || '',
      id_bank: mainBank?.id_bank || null, account_holder: mainBank?.account_holder || '',
      account_number: mainBank?.account_number || '', account_type: mainBank?.account_type || '',
      currency: mainBank?.currency || 'BOB',
    };
  }

  trackInformationSection(index: number, section: { id: number }) {
    return section.id;
  }
  hasInformationCoordinates(): boolean {
    const { latitude, longitude } = this.providerForm.getRawValue();
    return latitude !== null && latitude !== undefined && latitude !== '' && longitude !== null && longitude !== undefined && longitude !== '' && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  }
  validationAttempted = signal(false);
  savingDraft = signal(false);
  draftNotice = signal('');

  private registrationDraftKey(): string {
    const value = this.providerForm.getRawValue();
    if (this.activeTab() === 'branches') return this.creatingBranch() ? `company-${value.company_id}-newbranch` : `branch-${value.id}`;
    if (!this.providersService.isEdit) return 'new';
    return value.id ? `provider-${value.id}` : 'new';
  }

  saveRegistrationDraft(notify = true) {
    if (this.providersService.isInfo || this.savingDraft()) return;
    this.savingDraft.set(true);
    const key = this.registrationDraftKey();
    this.providersService.saveRegistrationDraft(key, this.providerForm.getRawValue()).subscribe({
      next: () => {
        this.savingDraft.set(false);
        if (!this.providersService.showModal || this.registrationDraftKey() !== key) return;
        this.draftNotice.set('Avance guardado en la base de datos. Puede cerrar y continuar después.');
        if (notify) Swal.fire({ icon: 'success', title: 'Avance guardado', text: 'Sus datos se recuperarán al volver a editar. Complete los campos pendientes cuando pueda.' });
      },
      error: () => {
        this.savingDraft.set(false);
        this.draftNotice.set('No se pudo guardar el avance. Mantenga abierta la ficha y vuelva a intentar.');
      },
    });
  }

  restoreRegistrationDraft() {
    if (this.providersService.isInfo) return;
    const key = this.registrationDraftKey();
    this.providersService.getRegistrationDraft(key).subscribe({
      next: ({ draft }) => {
        if (!draft || !this.providersService.showModal || this.providersService.isInfo || this.registrationDraftKey() !== key) return;
        const values = draft.values;
        this.providerForm.patchValue(values, { emitEvent: false });
        this.changeLabelAndForm();
        this.loadCollections({ ...values, materials: values['wholesale_materials']?.length ? values['wholesale_materials'] : (values['material_ids'] || []).map((id: number) => ({ id_product: Number(id) })) });
        this.providerForm.patchValue(values, { emitEvent: false });
        this.frequencyMode.set(values['frequency_mode'] === 'manual' ? 'manual' : 'automatic');
        this.filterProductsByCategories();
        this.draftNotice.set('Se recuperó su avance guardado. La ficha sigue editable y tiene datos pendientes de validar.');
        this.initializeLocationMap();
      },
      error: () => {},
    });
  }

  private removeRegistrationDraft(key = this.registrationDraftKey()) {
    this.providersService.deleteRegistrationDraft(key).subscribe({ error: () => {} });
    this.draftNotice.set('');
  }
  private readonly formHost = inject(ElementRef<HTMLElement>);

  validationMessages(requiredOnly = true): { path: string; message: string }[] {
    if (!this.validationAttempted()) return [];
    const labels: Record<string, string> = { full_names: 'Nombre completo / Razón social', department: 'Departamento', id_type_provider: 'Tipo de proveedor', id_commercial_user: 'Responsable comercial', origin_channel: 'Canal de origen', relationship_status: 'Estado de relación', material_ids: 'Productos', id_categories: 'Categorías', full_name: 'Nombre del contacto', position_area: 'Área de trabajo o cargo', cellphone: 'Celular', account_holder: 'Titular de cuenta', account_number: 'Número de cuenta', id_bank: 'Banco', frequency: 'Frecuencia', service_mode: 'Modalidad de atención', price_policy: 'Nivel de precio', logistics_condition: 'Condición logística', latitude: 'Latitud del punto geográfico', longitude: 'Longitud del punto geográfico', site_name: 'Nombre de la sucursal' };
    const errors: { path: string; message: string }[] = [];
    const visit = (control: AbstractControl, path: string) => {
      if (control.disabled) return;
      if (control instanceof FormGroup || control instanceof FormArray) {
        Object.entries(control.controls).forEach(([key, child]) => visit(child as AbstractControl, path ? `${path}.${key}` : key));
      }
      if (!control.errors) return;
      if (requiredOnly && !control.hasValidator(Validators.required) && !control.errors['required']) return;
      const name = path.split('.').pop() || path;
      const element = this.validationElement(path);
      const label = element?.closest('.erp-field')?.querySelector('label')?.textContent?.replace(/\s*\*\s*$/, '').trim() || labels[name] || name;
      const row = path.match(/\.(\d+)\./);
      const prefix = row ? `${path.startsWith('bankAccounts') ? 'Cuenta' : path.startsWith('contacts') ? 'Contacto' : 'Material'} ${Number(row[1]) + 1}: ` : '';
      const issue = control.errors['server'] ? String(control.errors['server'])
        : control.errors['required'] ? 'es obligatorio; complete o seleccione este dato.'
        : control.errors['email'] ? 'debe tener un correo electrónico válido.'
        : control.errors['minlength'] ? `requiere al menos ${control.errors['minlength'].requiredLength} caracteres.`
        : control.errors['maxlength'] ? `admite como máximo ${control.errors['maxlength'].requiredLength} caracteres.`
        : control.errors['min'] ? `debe ser mayor o igual a ${control.errors['min'].min}.`
        : control.errors['max'] ? `debe ser menor o igual a ${control.errors['max'].max}.`
        : control.errors['pattern'] && name.includes('cellphone') ? 'debe tener 8 dígitos y comenzar con 6 o 7.'
        : 'tiene un formato inválido; revise el valor ingresado.';
      errors.push({ path, message: `${prefix}${label}: ${issue}` });
    };
    visit(this.providerForm, '');
    return errors;
  }

  private validationElement(path: string): HTMLElement | undefined {
    const parts = path.split('.');
    const name = parts[parts.length - 1];
    const root = this.formHost?.nativeElement as HTMLElement | undefined;
    if (path === 'certificate' || path === 'traceability') {
      const upload = root?.querySelectorAll<HTMLInputElement>('input[type="file"]')[path === 'certificate' ? 0 : 1]?.parentElement;
      if (upload) upload.tabIndex = 0;
      return upload || undefined;
    }
    const scope = path.startsWith('contacts.') ? root?.querySelector('app-provider-contacts-section') : path.startsWith('bankAccounts.') ? root?.querySelector('app-provider-bank-accounts-section') : path.startsWith('wholesale_materials.') ? root?.querySelector('[formArrayName="wholesale_materials"]') : root;
    const elements = Array.from((scope || root)?.querySelectorAll<HTMLElement>('[formControlName]') || []).filter(element => element.getAttribute('formControlName') === name);
    const row = parts.find(part => /^\d+$/.test(part));
    return elements[row === undefined ? 0 : Number(row)] || elements[0];
  }

  focusValidationField(path: string) {
    if (path === 'frequency_mode') path = 'frequency';
    const element = this.validationElement(path);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const target = element?.matches('input,textarea,select,button,[tabindex="0"]') ? element : element?.querySelector<HTMLElement>('input:not([type="hidden"]),textarea,button,[tabindex="0"]');
    target?.focus({ preventScroll: true });
  }

  private validateBeforeSave(): boolean {
    const clearServerErrors = (control: AbstractControl) => {
      if (control instanceof FormGroup || control instanceof FormArray) Object.values(control.controls).forEach(child => clearServerErrors(child as AbstractControl));
      if (control.errors?.['server']) control.updateValueAndValidity({ emitEvent: false });
    };
    clearServerErrors(this.providerForm);
    this.providerForm.markAllAsTouched();
    this.validationAttempted.set(true);
    if (this.providerForm.valid) return true;
    this.saveRegistrationDraft(false);
    const first = this.validationMessages()[0];
    if (first) setTimeout(() => this.focusValidationField(first.path));
    else {
      const invalid = this.validationMessages(false)[0];
      if (invalid) Swal.fire({ icon: 'warning', title: 'Revise el dato ingresado', text: invalid.message }).then(() => this.focusValidationField(invalid.path));
    }
    return false;
  }

  informationColumns(branch = false) {
    const sections = this.informationSections(branch);
    return [sections.filter(section => [1, 3, 4, 8].includes(section.id)), sections.filter(section => [2, 5, 6, 7].includes(section.id))];
  }

  trackInformationColumn(index: number) { return index; }

  informationSections(branch = false) {
    const value = this.providerForm.getRawValue();
    const text = (input: unknown): string => input === null || input === undefined || input === '' || input === '—' ? 'Sin registrar' : typeof input === 'boolean' ? (input ? 'Sí' : 'No') : String(input);
    const field = (label: string, input: unknown, full = false) => ({ label, value: text(input), full });
    const option = (options: any[], input: unknown) => options.find(item => String(item.value ?? item.code ?? item.id) === String(input))?.label || options.find(item => String(item.value ?? item.code ?? item.id) === String(input))?.name || input;
    const section = (id: number, title: string, tone: string, icon: string, fields: ReturnType<typeof field>[], records: { title: string; fields: ReturnType<typeof field>[] }[] = [], map = false) => ({ id, title, tone, icon, fields, records, map });
    const sections = [section(1, branch ? 'Identificación de la sede' : 'Identificación Legal & Tipo de Proveedor', 'slate', 'fa-id-card', [
      field('Tipo proveedor', value.id_type_provider?.name, true),
      field(branch ? 'Nombre de la sede / sucursal' : this.formP.full_names.label, branch ? value.site_name : value.full_names),
      field(this.formP.number_document.label, value.number_document),
      ...(!branch && (this.isTypeA() || this.usesCommercialTerms()) ? [field(this.isTypeA() ? 'Nombre comercial' : 'Nombre comercial / Acopiadora', value.commercial_name, true)] : []),
      ...(!branch && this.isTypeA() ? [field('Tipo de entidad', option(this.entityTypes, value.entity_type)), field('Teléfono(s) empresa', value.corporate_phone), field('Celular corporativo', value.corporate_cellphone), field('Correo electrónico', value.corporate_email), field('Página web', value.website, true)] : []),
    ])];
    sections.push(section(2, 'Sector & Ubicación Geográfica', 'emerald', 'fa-map-location-dot', [
      ...(!branch && !this.supportsBranches() && !this.isTypeD() ? [
        ...(this.formP.companyContacts.view ? [field('Contactos / teléfonos de la empresa', value.companyContacts)] : []), field('Celular principal', value.cellphone),
      ] : []),
      field('Departamento', value.department), field(this.isTypeB() ? 'Zona / Sector' : 'Zona / Barrio', value.zone),
      field('Dirección empresa', value.direction, true), field('Latitud', value.latitude), field('Longitud', value.longitude),
      field('Referencia geográfica', value.geolocation_text, true),
    ], [], true));
    {
      const repeated = branch || this.supportsMultipleContacts();
      const contactFields = repeated ? [] : [field('Nombre persona de contacto', value.name_contact), field('Celular persona de contacto', value.cellphone_contact),
        ...(this.formP.id_category.view ? [field('Categoría principal', option(this.categories(), value.id_category))] : []),
        ...(this.formP.workAreaOrPositionOrUnit.view ? [field(this.formP.workAreaOrPositionOrUnit.label, value.workAreaOrPositionOrUnit)] : []),
        field('Frecuencia', this.getFrequencyLabel(value.frequency)), ...(this.formP.companyContacts.view ? [field('Contactos empresa', value.companyContacts)] : []),
      ];
      if (repeated && !this.supportsBranches()) {
        if (this.formP.id_category.view) contactFields.push(field('Categoría principal', option(this.categories(), value.id_category)));
        if (this.formP.workAreaOrPositionOrUnit.view) contactFields.push(field(this.formP.workAreaOrPositionOrUnit.label, value.workAreaOrPositionOrUnit));
        contactFields.push(field('Frecuencia', this.getFrequencyLabel(value.frequency)));
        if (this.formP.companyContacts.view) contactFields.push(field('Contactos empresa', value.companyContacts));
      }
      contactFields.push(field('Estado', value.status === false ? 'Inactivo' : 'Activo'));
      sections.push(section(3, 'Contacto Comercial', 'blue', 'fa-user-tie', contactFields,
        repeated ? (value.contacts || []).filter((contact: any) => contact.status !== false && contact.full_name).map((contact: any, index: number) => ({
          title: `Contacto ${index + 1}${contact.is_main_contact ? ' · Principal' : ''}`,
          fields: [field('Nombre completo', contact.full_name), field('Área de trabajo o cargo', contact.position_area), field('Celular', contact.cellphone), field('Correo', contact.email)],
        })) : []));
    }
    sections.push(section(4, 'Modalidad de Operación y Material', 'amber', 'fa-boxes-stacked', [
      field('Categoría(s) de material entregado', (value.id_categories || []).map((id: string) => option(this.categories(), id)).join(', ')),
      field('Producto(s) según categoría seleccionada', (value.material_ids || []).map((id: number) => this.materialName(id)).join(', ')),
      field('Frecuencia de venta', this.getFrequencyLabel(value.frequency)), field('Modo de frecuencia', value.frequency_mode === 'manual' ? 'Manual' : 'Automático'),
      field('Modalidad de atención', option(this.serviceModes, value.service_mode)),
      ...(this.isTypeB() ? [field('Modalidad habitual', option(this.serviceModes, value.usual_service_mode))] : []),
    ], this.isTypeB() ? (value.wholesale_materials || []).map((material: any) => ({
      title: this.materialName(material.id_product),
      fields: [field('Volumen estimado (kg)', material.estimated_volume), field('Frecuencia por producto', this.getFrequencyLabel(material.frequency))],
    })) : []));
    if (!branch) {
      sections.push(section(5, 'Gestión Comercial', 'violet', 'fa-handshake', [
        field('Responsable comercial', this.commercialUsers().find(user => Number(user.id) === Number(value.id_commercial_user))?.full_names || this.registeredCommercialUser?.()),
        field('Canal de origen', option(this.isTypeB() ? this.wholesaleOriginChannels : this.originChannels, value.origin_channel)),
        field('Estado de relación', option(this.isTypeB() ? this.wholesaleRelationshipStatuses : this.relationshipStatuses, value.relationship_status)),
        field('Condición de negociación', option(this.negotiationConditions, value.negotiation_condition)),
        ...(this.isTypeB() ? [field('Modalidad de negociación', option(this.negotiationModes, value.negotiation_mode))] : []),
        ...(this.usesCommercialTerms() ? [field('Condición logística', option(this.logisticsConditions, value.logistics_condition)), field('Nivel de precio', option(this.priceLevels, value.price_policy)), field('Ajuste habitual', value.habitual_price_adjustment)] : []),
        field('Instrucciones de manejo comercial', value.commercial_observations, true),
      ]));
      if (!this.isTypeC() && !this.isTypeD()) sections.push(section(6, 'Requerimientos Documentales', 'rose', 'fa-file-shield', [
        field('¿Requiere certificado?', value.requires_certificate),
        ...(value.requires_certificate ? [field('Certificado registrado', this.registeredDocuments().filter(document => document.document_type === 'CERTIFICATE').map(document => document.original_name).join(', ') || this.storedCertificate())] : []),
        ...(!this.isTypeB() ? [field('¿Requiere informe de trazabilidad?', value.requires_traceability_report), ...(value.requires_traceability_report ? [field('Informe registrado', this.registeredDocuments().filter(document => document.document_type === 'TRACEABILITY_REPORT').map(document => document.original_name).join(', '))] : [])] : []),
      ]));
    }
    sections.push(section(7, 'Información bancaria de la sede', 'cyan', 'fa-building-columns', [],
      (value.bankAccounts || []).filter((account: any) => account.status !== false).map((account: any, index: number) => ({
        title: `Cuenta ${index + 1}${account.is_main ? ' · Principal' : ''}`,
        fields: [field('Banco', this.banks().find(bank => Number(bank.id) === Number(account.id_bank))?.name), field('Titular de cuenta', account.account_holder), field('N.º de cuenta', account.account_number), field('Tipo de cuenta', option(this.accountTypes, account.account_type)), field('Moneda', account.currency)],
      }))));
    sections.push(section(8, 'Observaciones Generales', 'slate', 'fa-note-sticky', [field('Observaciones generales', value.general_observations, true)]));
    return sections;
  }
  exportingSheet = signal(false);
  sheetPreviewVisible = false;
  sheetPreviewUrl: SafeResourceUrl | null = null;
  private sheetObjectUrl: string | null = null;
  private sheetFileName = 'ficha-proveedor.pdf';
  private readonly sanitizer = inject(DomSanitizer);

  closeSheetPreview() {
    this.sheetPreviewVisible = false;
    this.sheetPreviewUrl = null;
    if (this.sheetObjectUrl) URL.revokeObjectURL(this.sheetObjectUrl);
    this.sheetObjectUrl = null;
  }

  downloadSheetPreview() {
    if (!this.sheetObjectUrl) return;
    const link = document.createElement('a');
    link.href = this.sheetObjectUrl;
    link.download = this.sheetFileName;
    link.click();
  }

  providerInitials(): string {
    return String(this.providerForm.get('full_names')?.value || '').trim().split(/\s+/).slice(0, 2).map(word => word[0] || '').join('') || 'PR';
  }

  exportRegistrationSheet(preview = false) {
    if (!this.providersService.isInfo || this.exportingSheet() || this.loading()) return;
    const value = this.providerForm.getRawValue();
    const branch = this.activeTab() === 'branches';
    const sheet = {
      name: String((branch ? value.site_name : value.full_names) || 'Proveedor'),
      reference: `ID: ${value.id || 'Sin registrar'}`,
      status: value.status === false ? 'Inactivo' : 'Activo',
      sections: this.informationSections(branch),
    };
    this.exportingSheet.set(true);
    this.providersService.exportRegistrationSheet(sheet).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        if (preview) {
          this.closeSheetPreview();
          this.sheetObjectUrl = url;
          this.sheetFileName = `ficha-proveedor-${value.id || 'registro'}.pdf`;
          this.sheetPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.sheetPreviewVisible = true;
          this.exportingSheet.set(false);
          return;
        }
        const link = document.createElement('a');
        link.href = url;
        link.download = `ficha-proveedor-${value.id || 'registro'}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.exportingSheet.set(false);
      },
      error: () => {
        this.exportingSheet.set(false);
        Swal.fire('No se pudo exportar', 'Intente nuevamente descargar la ficha de registro.', 'error');
      },
    });
  }
  supportsBranches() {
    const code = this.providerForm.get('id_type_provider')?.value?.code;
    return code === 'A' || code === 'B';
  }
  supportsMultipleContacts() { return true; }

  updateProvinceOptions(clearProvince = true) {
    const department = this.providerForm.get('department')?.value;
    const item = BOLIVIA_DEPARTMENTS.find(entry => entry.name === department);
    this.provinces.set((item?.provinces || []).map(name => ({ name, code: name })));
    if (clearProvince) this.providerForm.patchValue({ province: '' });
  }

  captureCurrentLocation() {
    if (!navigator.geolocation) {
      Swal.fire({ icon: 'warning', title: 'Geolocalización no disponible' });
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(position => {
      const latitude = Number(position.coords.latitude.toFixed(7));
      const longitude = Number(position.coords.longitude.toFixed(7));
      this.setMapLocation(latitude, longitude, true, 'device');
      this.locating.set(false);
    }, () => {
      this.locating.set(false);
      Swal.fire({ icon: 'warning', title: 'No se pudo obtener la ubicación', text: 'Permita el acceso o registre las coordenadas manualmente.' });
    }, { enableHighAccuracy: true, timeout: 12000 });
  }

  initializeLocationMap() {
    setTimeout(() => {
      if (!this.providersService.showModal || this.activeTab() === 'summary' || !this.locationMap?.nativeElement) return;
      if (this.map?.getContainer() === this.locationMap.nativeElement) {
        this.map.invalidateSize();
        return;
      }
      this.map?.remove();
      this.locationMarker = undefined;
      const latitudeValue = this.providerForm.get('latitude')?.value;
      const longitudeValue = this.providerForm.get('longitude')?.value;
      const hasCoordinates = latitudeValue != null && latitudeValue !== '' && longitudeValue != null && longitudeValue !== '' && Number.isFinite(Number(latitudeValue)) && Number.isFinite(Number(longitudeValue));
      const latitude = hasCoordinates ? Number(latitudeValue) : -16.2902;
      const longitude = hasCoordinates ? Number(longitudeValue) : -63.5887;
      this.map = L.map(this.locationMap.nativeElement, { center: [latitude, longitude], zoom: hasCoordinates ? 16 : 5 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(this.map);
      this.map.on('click', event => {
        if (!this.providersService.isInfo) this.setMapLocation(event.latlng.lat, event.latlng.lng, false, 'manual');
      });
      if (hasCoordinates) this.setMapLocation(latitude, longitude, false, 'stored');
      const tab = this.activeTab();
      const draft = tab !== 'summary' ? this.mapDrafts[tab] : undefined;
      if (draft?.center && draft.zoom != null) this.map.setView(draft.center, draft.zoom);
      this.map.invalidateSize();
    });
  }

  refreshMap(source: LocationSource = 'manual') {
    const latitude = Number(this.providerForm.get('latitude')?.value);
    const longitude = Number(this.providerForm.get('longitude')?.value);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (!latitude && !longitude)) return;
    this.initializeLocationMap();
    setTimeout(() => this.setMapLocation(latitude, longitude, true, source));
  }

  searchOnGoogleMaps() {
    const name = this.providerForm.get('full_names')?.value || '';
    const city = this.providerForm.get('city')?.value || '';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city} Bolivia`)}`, '_blank', 'noopener,noreferrer');
  }

  importGoogleMapsLocation() {
    const value = String(this.providerForm.get('google_maps_url')?.value || '').trim();
    const match = value.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) || value.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?)(?:%2C|,)(-?\d+(?:\.\d+)?)/i);
    if (match) {
      this.setMapLocation(Number(match[1]), Number(match[2]), true, 'imported');
      return;
    }
    if (!value) return;
    this.importingLocation.set(true);
    this.providersService.resolveGoogleMapsLink(value).subscribe({
      next: response => {
        this.providerForm.patchValue({ google_maps_url: response.finalUrl || value });
        this.setMapLocation(response.latitude, response.longitude, true, 'imported');
        this.importingLocation.set(false);
      },
      error: () => {
        this.importingLocation.set(false);
        Swal.fire({ icon: 'info', title: 'No se pudo importar el punto', text: 'El enlace se conservará para compartir. Abra Google Maps y arrastre el pin en el mapa hasta la ubicación correcta.' });
      },
    });
  }

  providerTypeCode(): string {
    const code = String(this.providerForm.get('id_type_provider')?.value?.code || 'A').toUpperCase();
    return ['A', 'B', 'C', 'D', 'E', 'F'].includes(code) ? code : 'A';
  }

  private setMapLocation(latitude: number, longitude: number, center = true, source: LocationSource = 'manual') {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;
    const lat = Number(latitude.toFixed(7));
    const lng = Number(longitude.toFixed(7));
    const currentReference = String(this.providerForm.get('geolocation_text')?.value || '').trim();
    const coordinateReference = /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/;
    this.providerForm.patchValue({
      latitude: lat,
      longitude: lng,
      geolocation_text: !currentReference || coordinateReference.test(currentReference) ? `${lat}, ${lng}` : currentReference,
    });
    this.locationStatus.set(this.locationStatusFor(source));
    if (!this.map) {
      this.initializeLocationMap();
      setTimeout(() => this.renderLocationMarker(lat, lng, center));
      return;
    }
    this.renderLocationMarker(lat, lng, center);
  }

  private renderLocationMarker(latitude: number, longitude: number, center: boolean) {
    if (!this.map) return;
    const lat = Number(latitude.toFixed(7));
    const lng = Number(longitude.toFixed(7));
    if (!this.locationMarker) {
      const icon = this.createLocationMarkerIcon();
      this.locationMarker = L.marker([lat, lng], { draggable: !this.providersService.isInfo, icon }).addTo(this.map);
      this.locationMarker.on('dragend', event => {
        const point = (event.target as L.Marker).getLatLng();
        this.setMapLocation(point.lat, point.lng, false, 'manual');
      });
    } else {
      this.locationMarker.setIcon(this.createLocationMarkerIcon());
      this.locationMarker.setLatLng([lat, lng]);
    }
    if (center) this.map.setView([lat, lng], Math.max(this.map.getZoom(), 16));
  }

  private createLocationMarkerIcon(): L.DivIcon {
    const code = this.providerTypeCode();
    return L.divIcon({
      className: `provider-map-pin provider-map-pin--${code.toLowerCase()}`,
      html: `<span class="provider-map-pin__body"><i class="fa-solid fa-location-dot"></i><b>${code}</b></span>`,
      iconSize: [34, 42],
      iconAnchor: [17, 40],
    });
  }

  private locationStatusFor(source: LocationSource): string {
    const messages: Record<LocationSource, string> = {
      stored: 'Ubicación registrada cargada',
      imported: 'Punto importado y fijado; se guardará con el proveedor',
      manual: 'Punto manual actualizado; se guardará con el proveedor',
      device: 'Ubicación del dispositivo fijada; se guardará con el proveedor',
    };
    return messages[source];
  }

  async shareLocation() {
    const latitude = this.providerForm.get('latitude')?.value;
    const longitude = this.providerForm.get('longitude')?.value;
    if (!latitude || !longitude) return;
    const name = this.providerForm.get('full_names')?.value || 'Proveedor RECUMET';
    const address = this.providerForm.get('direction')?.value || 'Sin dirección registrada';
    const url = this.providerForm.get('google_maps_url')?.value || `https://www.google.com/maps?q=${latitude},${longitude}`;
    const text = `${name}\n${address}\n${url}`;
    if (navigator.share) await navigator.share({ title: name, text, url });
    else {
      await navigator.clipboard.writeText(text);
      Swal.fire({ icon: 'success', title: 'Ubicación copiada', timer: 1500, showConfirmButton: false });
    }
  }

  private loadDefaultBranchCity() {
    this.sucursalesService.getAllAndSearch(1, 500, true).subscribe(({ sucursales }) => {
      if (this.providerForm.get('id')?.value || this.providerForm.get('city')?.value) return;
      const activeBranch = sucursales.data.find(branch => branch.id === this.validatorsService.id_sucursal());
      if (activeBranch?.city) this.providerForm.patchValue({ city: activeBranch.city });
    });
  }

  onBranchSelectionChange(providerIds: number[]) {
    const selectedIds = new Set(providerIds || []);
    this.selectedCompanyProviders.set(this.availableProviders().filter(provider => selectedIds.has(provider.id)));
  }

  setActiveTab(tab: 'company' | 'branches' | 'summary') {
    if (tab === 'branches' && !this.supportsBranches()) return;
    if (tab === this.activeTab()) return;
    const previousTab = this.activeTab();
    if (previousTab !== 'summary') {
      const fields = ['department', 'province', 'city', 'zone', 'direction', 'latitude', 'longitude', 'geolocation_text', 'google_maps_url'];
      this.mapDrafts[previousTab] = {
        values: Object.fromEntries(fields.map(field => [field, this.providerForm.get(field)?.value])),
        center: this.map?.getCenter(), zoom: this.map?.getZoom(),
      };
    }
    // The map host is recreated when changing tabs; release the previous Leaflet
    // instance before asking it to bind to the selected site's host.
    this.map?.remove();
    this.map = undefined;
    this.locationMarker = undefined;
    this.activeTab.set(tab);
    if (tab !== 'summary') {
      const draft = this.mapDrafts[tab];
      if (draft) this.providerForm.patchValue(draft.values);
      this.initializeLocationMap();
    }
  }

  companyBranchCount() {
    return this.companySites().length || (1 + (this.providerForm.get('has_branches')?.value ? this.selectedCompanyProviders().length : 0));
  }

  allCompanyBranches() {
    if (this.companySites().length) return this.companySites();
    const principal = {
      id: this.providerForm.get('id')?.value,
      full_names: this.providerForm.get('full_names')?.value || 'Proveedor principal',
      direction: this.providerForm.get('direction')?.value,
      status: this.providerForm.get('status')?.value,
      principal: true,
    };
    return [principal, ...this.selectedCompanyProviders().map(branch => ({ ...branch, principal: false }))];
  }

  ngOnDestroy(): void {
    this.closeSheetPreview();
    this.frequencyRequest?.unsubscribe();
    this.map?.remove();
    this.isEditSub$.unsubscribe();
    this.isReloadSub$.unsubscribe();
  }

  getAllCategories() {
    this.categories.set([]);
    this.categoriesService.getAllAndSearch(1,1000,true,'','', '', 'id', 'DESC', this.productContext).subscribe(resp => {
      const formattedCategory = resp.categories.data.map(category => ({
        name: category.name,
        code: category.id!.toString()
      }));
      this.categories.set(formattedCategory);
    });
  }

  getAllSectors() {
    this.sectors.set([]);
    this.providersService.getAllSectorProvider(1,10000,true).subscribe(resp => {
      const formattedSector = resp.sectors.data.map(sector => ({
        name: sector.name,
        code: sector.id!.toString()
      }));
      this.sectors.set(formattedSector);
    });
  }

  getAllTypes() {
    this.types.set([]);
    this.providersService.getAllTypesProvider().subscribe(resp => {
      const formattedType = resp.typesProvider.map(type => ({
        name: type.name,
        id: type.id!.toString(),
        code: type.code,
      }));
      this.types.set(formattedType);
      if(formattedType.length > 0 && !this.providerForm.get('id')?.value) {
        this.providerForm.get('id_type_provider')?.setValue({
          name: formattedType[0].name,
          id: formattedType[0].id!.toString(),
          code: formattedType[0].code,
        });
        this.changeLabelAndForm();
      }
    });
  }

  newProvider() {
    if (this.providersService.isInfo) return;
    this.serverErrors.set({});
    if (!this.validateBeforeSave()) return;
    const id_type_provider = this.providerForm.get('id_type_provider')?.value;
    if (!this.validateTypeACompany(id_type_provider)) return;
    const draftKey = this.registrationDraftKey();
    this.loading.set(true);
    const formProvider = this.buildProviderPayload();
    const request$ = id_type_provider?.code === 'A'
      ? this.providersService.createCommercialCompany({ company: this.buildCompanyProfile(id_type_provider), headquarters: this.buildSiteProfile(id_type_provider, 'HEADQUARTERS') })
      : this.providersService.postNew({ ...formProvider, id_type_provider: Number(id_type_provider.id) });
    request$.pipe(switchMap(response => this.uploadTypeBCertificate(response))).subscribe({
      next: (response) => {
        const company = id_type_provider?.code === 'A' && 'company' in response ? response.company : null;
        const companyId = company && typeof company === 'object' && 'id' in company
          ? Number(company.id)
          : null;
        if (companyId) this.uploadPendingDocuments(companyId);
      },
      complete: () => {
        this.removeRegistrationDraft(draftKey);
        this.providersService.save$.next(true);
        this.loading.set(false);
        this.providersService.showModal = false;
        Swal.fire({
          title: 'Éxito!',
          text: `Proveedor nuevo agregado correctamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: error => this.handleSaveError(error)
    });
  }

  editProvider() {
    if (this.providersService.isInfo) return;
    this.serverErrors.set({});
    if (!this.validateBeforeSave()) return;
    const id_type_provider = this.providerForm.get('id_type_provider')?.value;
    if (!this.validateTypeACompany(id_type_provider)) return;
    const draftKey = this.registrationDraftKey();
    this.loading.set(true);
    const formProvider = this.buildProviderPayload();
    const request$ = id_type_provider?.code === 'A' && formProvider.company_id
      ? this.providersService.updateCommercialCompany(Number(formProvider.company_id), { company: this.buildCompanyProfile(id_type_provider), headquarters: this.buildSiteProfile(id_type_provider, 'HEADQUARTERS') })
      : this.providersService.putUpdate({ ...formProvider, id_type_provider: Number(id_type_provider.id) });
    request$.pipe(switchMap(response => this.uploadTypeBCertificate(response))).subscribe({
      next: () => {
        if (id_type_provider?.code === 'A' && formProvider.company_id) this.uploadPendingDocuments(Number(formProvider.company_id));
      },
      complete: () => {
        this.removeRegistrationDraft(draftKey);
        this.providersService.save$.next(true);
        this.loading.set(false);
        this.providersService.showModal = false;
        Swal.fire({
          title: 'Éxito!',
          text: `Proveedor modificado correctamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: error => this.handleSaveError(error)
    });
  }

  getAllProducts() {
    this.productsService.getAllAndSearch(1, 2000, true, '', '', false, '', '', 'name', 'ASC', false, '', this.productContext)
      .subscribe({
        next: response => {
          const list = (response.products?.data || []).map((product: any) => ({
            id: Number(product.id),
            name: product.name,
            code: String(product.id),
            id_category: Number(product.id_category || product.category?.id || product.Category?.id || 0),
            categoryName: product.category?.name || product.Category?.name || '',
          }));
          this.rawProducts.set(list);
          this.productsLoaded.set(true);
          this.filterProductsByCategories();
        },
        error: () => {
          this.rawProducts.set([]);
          this.products.set([]);
        },
      });
  }

  loadCommercialUsers() {
    this.usersService.getAllAndSearch(1, 1000, true).subscribe({
      next: (resp) => {
        const users = (resp.users?.data || []).map(u => ({
          id: u.id,
          full_names: u.full_names || `Usuario #${u.id}`
        }));
        this.commercialUsers.set(users);
      },
      error: () => this.commercialUsers.set([])
    });
  }

  onCategoriesChange(selectedCategoryCodes: string[]) {
    this.filterProductsByCategories(selectedCategoryCodes);
  }

  filterProductsByCategories(selectedCategoryCodes?: string[]) {
    if (!this.productsLoaded()) return;
    const codes = selectedCategoryCodes || this.providerForm.get('id_categories')?.value || [];
    const all = this.rawProducts();
    if (!codes || codes.length === 0) {
      this.products.set(all);
      return;
    }
    const catNumSet = new Set(codes.map((c: string | number) => Number(c)));
    const filtered = all.filter(p => catNumSet.has(p.id_category));
    this.products.set(filtered);

    // Prune material_ids not in filtered list
    const currentMaterials: (string | number)[] = this.providerForm.get('material_ids')?.value || [];
    const validProductIds = new Set(filtered.map(p => Number(p.code)));
    const updatedMaterials = currentMaterials.filter(id => validProductIds.has(Number(id)));
    if (updatedMaterials.length !== currentMaterials.length) {
      this.providerForm.patchValue({ material_ids: updatedMaterials });
    }
    this.syncWholesaleMaterials();
    this.fetchFrequencyAnalysis();
  }

  onMaterialSelectionChange() {
    this.syncWholesaleMaterials();
    this.fetchFrequencyAnalysis();
  }

  setFrequencyMode(mode: 'automatic' | 'manual') {
    this.frequencyMode.set(mode);
    this.providerForm.patchValue({ frequency_mode: mode });
    if (mode === 'automatic') {
      this.fetchFrequencyAnalysis();
      this.applyMaterialFrequencySuggestions();
      const analysis = this.frequencyAnalysis();
      if (analysis?.has_sufficient_history && analysis.frequency) {
        this.providerForm.patchValue({ frequency: analysis.frequency });
      }
    }
  }

  fetchFrequencyAnalysis() {
    this.frequencyRequest?.unsubscribe();
    if (this.isTypeB()) {
      this.fetchMaterialFrequencySuggestions();
      return;
    }
    const providerId = this.providerForm.get('id')?.value;
    if (!providerId) {
      this.frequencyAnalysis.set(null);
      return;
    }

    this.loadingFrequency.set(true);
    this.frequencyRequest = this.providersService.getFrequencyAnalysis(Number(providerId)).subscribe({
      next: (res) => {
        this.loadingFrequency.set(false);
        if (res.analysis) {
          this.frequencyAnalysis.set(res.analysis);
          if (!this.providersService.isInfo && this.frequencyMode() === 'automatic' && res.analysis.has_sufficient_history && res.analysis.frequency) {
            this.providerForm.patchValue({ frequency: res.analysis.frequency });
          }
        }
      },
      error: () => {
        this.loadingFrequency.set(false);
      }
    });
  }

  private fetchMaterialFrequencySuggestions() {
    const providerId = Number(this.providerForm.get('id')?.value);
    const productIds: number[] = (this.providerForm.get('material_ids')?.value || []).map(Number);
    this.materialFrequencySuggestions.set({});
    this.frequencyAnalysis.set(null);
    if (!providerId) {
      this.loadingFrequency.set(false);
      return;
    }
    this.loadingFrequency.set(true);
    this.frequencyRequest = forkJoin([this.providersService.getFrequencyAnalysis(providerId).pipe(catchError(() => of(null))), ...productIds.map((productId: number) =>
      this.providersService.getFrequencyAnalysis(providerId, productId).pipe(catchError(() => of(null))),
    )]).subscribe(results => {
      const suggestions: Record<number, MaterialFrequencySuggestion> = {};
      results.slice(1).forEach((result: any, index: number) => {
        if (result?.ok && result.analysis) suggestions[productIds[index]] = result.analysis;
      });
      this.materialFrequencySuggestions.set(suggestions);
      const first = (results[0] as any)?.analysis;
      this.frequencyAnalysis.set(first || null);
      this.loadingFrequency.set(false);
      this.applyMaterialFrequencySuggestions();
    });
  }

  private applyMaterialFrequencySuggestions() {
    if (this.providersService?.isInfo || this.frequencyMode() !== 'automatic') return;
    this.wholesaleMaterialRows.controls.forEach(row => {
      const suggestion = this.materialFrequencySuggestions()[Number(row.get('id_product')?.value)];
      if (suggestion?.estimated_volume != null) row.patchValue({ estimated_volume: suggestion.estimated_volume });
      if (suggestion?.has_sufficient_history && suggestion.frequency) {
        row.patchValue({ frequency: suggestion.frequency, frequency_mode: 'automatic' });
      }
    });
    const first = this.frequencyAnalysis();
    if (first?.has_sufficient_history && first.frequency) this.providerForm.patchValue({ frequency: first.frequency });
  }

  getFrequencyLabel(freq: string | null | undefined): string {
    if (!freq) return '—';
    const found = PROVIDER_FREQUENCIES.find(f => f.value === freq);
    return found ? found.label : freq;
  }

  loadPurchasesHistory(providerId?: number, branchId?: number) {
    const id = providerId || this.providerForm.get('id')?.value;
    if (!id) {
      this.providerPurchases.set([]);
      this.totalPurchasesAmount.set(0);
      this.totalPurchasesCount.set(0);
      this.lastPurchaseDate.set(null);
      return;
    }
    const sucursalId = branchId || Number(this.providerForm.get('id_sucursal')?.value || this.validatorsService.id_sucursal()) || undefined;
    this.loadingPurchases.set(true);
    const searchParams: any = {
      id_provider: Number(id),
      id_sucursal: sucursalId,
      status: 'ACTIVE'
    };
    this.inputsService.getAllAndSearchInputs(1, 50, searchParams).subscribe({
      next: (res: GetAllInputs) => {
        this.loadingPurchases.set(false);
        const data: Input[] = res.inputs?.data || [];
        this.providerPurchases.set(data);
        const total = data.reduce((acc: number, item: Input) => acc + (Number(item.total) || 0), 0);
        this.totalPurchasesAmount.set(total);
        this.totalPurchasesCount.set(res.inputs?.total || data.length);
        this.lastPurchaseDate.set(data.length > 0 ? (data[0].date_voucher || data[0].createdAt) : null);
      },
      error: () => {
        this.loadingPurchases.set(false);
        this.providerPurchases.set([]);
      }
    });
  }

  isRawMaterialProvider(): boolean {
    return this.providerForm.get('operational_type')?.value === 'RAW_MATERIAL';
  }

  private buildCompanyProfile(providerType: { id: string }): ProviderCompanyProfile {
    const value = this.providerForm.getRawValue();
    return {
      id: value.company_id || undefined,
      full_names: String(value.full_names || '').trim(), commercial_name: value.commercial_name || null,
      corporate_phone: value.corporate_phone || null, corporate_cellphone: value.corporate_cellphone || null,
      corporate_email: value.corporate_email || null, website: value.website || null,
      number_document: String(value.number_document || '').trim(), entity_type: value.entity_type as ProviderEntityType,
      id_type_provider: Number(providerType.id), id_commercial_user: Number(value.id_commercial_user || this.validatorsService.user()?.id) || null,
      origin_channel: value.origin_channel as ProviderOriginChannel,
      relationship_status: value.relationship_status as ProviderRelationshipStatus,
      negotiation_condition: (value.negotiation_condition || null) as ProviderNegotiationCondition | null,
      commercial_observations: value.commercial_observations || null,
      requires_certificate: Boolean(value.requires_certificate),
      requires_traceability_report: Boolean(value.requires_traceability_report),
      general_observations: value.general_observations || null,
      operational_type: value.operational_type as ProviderOperationalType,
      status: value.status !== false,
    };
  }

  private buildSiteProfile(providerType: { id: string }, role: 'HEADQUARTERS' | 'BRANCH'): ProviderSiteProfile {
    const value = this.providerForm.getRawValue();
    const materialIds = (value.material_ids || []).filter(Boolean);
    const repeatedContacts = (value.contacts || []).filter((contact: ProviderContactProfile) => String(contact.full_name || '').trim());
    const contacts = repeatedContacts.length ? repeatedContacts : (String(value.name_contact || '').trim() ? [{
      full_name: String(value.name_contact).trim(), position_area: String(value.workAreaOrPositionOrUnit || 'CONTACTO LOCAL'),
      cellphone: String(value.cellphone_contact || value.cellphone || ''), email: value.contact_email || null,
      is_main_contact: true, status: true,
    }] : []);
    return {
      id: value.id || undefined, id_provider_company: value.company_id || null, site_role: role,
      id_sucursal: Number(value.id_sucursal || this.validatorsService.id_sucursal()) || null,
      full_names: String(value.site_name || value.full_names || '').trim(), number_document: String(value.number_document || '').trim(),
      cellphone: value.cellphone ? String(value.cellphone) : null,
      frequency: value.frequency as ProviderFrequency, frequency_mode: value.frequency_mode, service_mode: value.service_mode as ProviderServiceMode,
      status: value.status !== false,
      location: {
        branch_name: value.site_name || value.full_names || 'SEDE PRINCIPAL', department: value.department, province: value.province || null,
        city: value.city, zone: value.zone || null, address: value.direction,
        latitude: value.latitude === null ? null : Number(value.latitude), longitude: value.longitude === null ? null : Number(value.longitude),
        geolocation_text: value.geolocation_text || null, google_maps_url: value.google_maps_url || null,
        is_main: true, status: true,
      },
      contacts,
      materials: materialIds.map((id: string | number) => ({ id_product: Number(id), frequency: value.frequency as ProviderFrequency, frequency_mode: value.frequency_mode, service_mode: value.service_mode as ProviderServiceMode, status: true })),
      bankAccounts: value.bankAccounts,
    };
  }

  serverErrorsFor(section: string): string[] {
    return this.serverErrors()[section] || [];
  }

  private handleSaveError(error: { error?: { errors?: Array<{ msg?: string; field?: string }> } }) {
    this.loading.set(false);
    this.saveRegistrationDraft(false);
    const errors = error.error?.errors || [];
    const grouped: Record<string, string[]> = {};
    errors.forEach(item => {
      const message = item.msg || 'Revise este dato.';
      const section = item.field || this.errorSection(message);
      (grouped[section] ||= []).push(message);
    });
    this.serverErrors.set(grouped);
    this.markServerErrorControls(grouped);
    const message = errors[0]?.msg || 'No fue posible guardar la ficha. Revise los campos marcados.';
    this.validationAttempted.set(true);
    Swal.fire({ icon: 'warning', title: 'Ficha incompleta', text: message }).then(() => {
      const first = this.validationMessages(false)[0];
      const field = errors[0]?.field;
      const path = this.serverErrorField(field || '', message);
      if (path) this.focusValidationField(path);
      else if (first) this.focusValidationField(first.path);
    });
  }

  private errorSection(message: string): string {
    const normalized = message.toLocaleLowerCase();
    if (normalized.includes('cuenta bancaria') || normalized.includes('cuenta principal')) return 'bankAccounts';
    if (normalized.includes('contacto')) return 'contacts';
    if (normalized.includes('material')) return 'materials';
    if (normalized.includes('departamento') || normalized.includes('ciudad') || normalized.includes('dirección') || normalized.includes('coordenada')) return 'location';
    return 'company';
  }

  private serverErrorField(field: string, message: string): string | undefined {
    if (field && this.providerForm.get(field) && !(this.providerForm.get(field) instanceof FormArray)) return field;
    if (message.toLowerCase().includes('modalidad de frecuencia') && !message.toLowerCase().includes('por producto')) return 'frequency_mode';
    const match = Object.keys(this.providerForm.controls).find(key => new RegExp(`\\b${key}\\b`, 'i').test(message));
    return match;
  }

  private markServerErrorControls(grouped: Record<string, string[]>) {
    Object.entries(grouped).forEach(([field, messages]) => messages.forEach(message => {
      const path = this.serverErrorField(field, message);
      const control = path ? this.providerForm.get(path) : null;
      if (!control || control.disabled) return;
      control.setErrors({ ...(control.errors || {}), server: message });
      control.markAsTouched();
    }));
  }
  private validateTypeACompany(providerType: any) {
    if (providerType?.code !== 'A') return true;
    const missingFields = [
      ['full_names', 'la razón social'],
      ['number_document', 'el NIT / documento'],
    ].filter(([field]) => !String(this.providerForm.get(field)?.value || '').trim());
    const selectedDocuments = this.documentFiles();
    if (this.providerForm.get('requires_certificate')?.value && !this.providerForm.get('company_id')?.value && !selectedDocuments.CERTIFICATE) missingFields.push(['certificate', 'el certificado PDF']);
    if (this.providerForm.get('requires_traceability_report')?.value && !this.providerForm.get('company_id')?.value && !selectedDocuments.TRACEABILITY_REPORT) missingFields.push(['traceability', 'el informe de trazabilidad PDF']);
    if (!missingFields.length) return true;
    this.saveRegistrationDraft(false);
    missingFields.forEach(([field]) => this.providerForm.get(field)?.setErrors({ required: true }));
    Swal.fire({ icon: 'warning', title: 'Datos generales incompletos', text: `Para una empresa Tipo A registre ${missingFields.map(([, label]) => label).join(' y ')}.` }).then(() => this.focusValidationField(missingFields[0][0]));
    return false;
  }

  selectDocument(type: 'CERTIFICATE' | 'TRACEABILITY_REPORT', event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const acceptedTypes = this.isTypeB() && type === 'CERTIFICATE' ? ['application/pdf', 'image/png', 'image/jpeg'] : ['application/pdf'];
    if (!acceptedTypes.includes(file.type) || file.size > 8 * 1024 * 1024) {
      Swal.fire('Documento no válido', this.isTypeB() ? 'Adjunte un PDF, PNG o JPG de máximo 8 MB.' : 'Adjunte un PDF de máximo 8 MB.', 'warning');
      return;
    }
    this.documentFiles.update(files => ({ ...files, [type]: file }));
  }

  removeDocument(type: 'CERTIFICATE' | 'TRACEABILITY_REPORT') {
    this.documentFiles.update(files => ({ ...files, [type]: undefined }));
  }

  private uploadTypeBCertificate(response: any): Observable<any> {
    const file = this.documentFiles().CERTIFICATE;
    if (!this.isTypeB() || !this.providerForm.get('requires_certificate')?.value || !file) return of(response);
    const providerId = Number(response.provider?.id || this.providerForm.get('id')?.value);
    this.providerForm.patchValue({ id: providerId });
    this.providersService.isEdit = true;
    return this.providersService.uploadProviderCertificate(providerId, file).pipe(map(result => {
      this.storedCertificate.set(result.certificate_file_name);
      this.removeDocument('CERTIFICATE');
      return response;
    }));
  }

  onDocumentDrop(type: 'CERTIFICATE' | 'TRACEABILITY_REPORT', event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.selectDocument(type, { target: { files: [file] } } as unknown as Event);
  }

  private uploadPendingDocuments(companyId: number) {
    Object.entries(this.documentFiles()).forEach(([type, file]) => {
      if (!file) return;
      this.providersService.uploadCommercialCompanyDocument(companyId, type as 'CERTIFICATE' | 'TRACEABILITY_REPORT', file).subscribe({
        error: () => Swal.fire('Documento pendiente', 'La empresa fue guardada, pero no se pudo cargar uno de sus documentos.', 'warning'),
      });
    });
  }

  resetModal() {
    this.draftNotice.set('');
    this.validationAttempted.set(false);
    this.providersService.isInfo = false;
    this.frequencyRequest?.unsubscribe();
    this.mapDrafts = {};
    this.materialFrequencySuggestions.set({});
    this.storedCertificate.set('');
    this.registeredDocuments.set([]);
    this.registeredCommercialUser.set('');
    this.documentFiles.set({});
    this.activeTab.set('company');
    this.map?.remove();
    this.map = undefined;
    this.locationMarker = undefined;
    this.locationStatus.set('');
    this.serverErrors.set({});
    this.importingLocation.set(false);
    this.providerForm.enable({ emitEvent: false });
    this.resetForm();
    if(this.types().length > 0) {
      this.providerForm.get('id_type_provider')?.setValue({
        name: this.types()[0].name,
        id: this.types()[0].id!.toString(),
        code: this.types()[0].code,
      });
      this.changeLabelAndForm();
    }
  }

  resetForm() {
    this.providerForm.patchValue({
      id: '',
      full_names: '',
      site_name: '',
      id_sector: '',
      number_document: null,
      cellphone: null,
      direction: null,
      type: '',
      mayorista: true,
      name_contact: null,
      cellphone_contact: null,
      id_category: '',
      id_sucursal: null,
      companyContacts: '',
      company_id: null,
      has_branches: false,
      provider_ids: [],
      commercial_name: '', entity_type: 'PRIVATE', id_commercial_user: this.validatorsService.user()?.id || null,
      service_mode: 'BOTH', origin_channel: 'DIRECT_CONTACT', relationship_status: 'ACTIVE',
      negotiation_condition: '', commercial_observations: '', requires_certificate: false,
      usual_service_mode: null, logistics_condition: 'RECUMET_PICKUP', negotiation_mode: null, price_policy: 'LIST_PRICE',
      habitual_price_adjustment: '', commercialized_materials: '', id_categories: [],
      contact_frequency: 'MONTHLY',
      requires_traceability_report: false, general_observations: '',
      department: '', province: '', city: '', zone: '', latitude: null, longitude: null, geolocation_text: '', google_maps_url: '',
      frequency: 'MONTHLY', material_ids: [], operational_type: 'RAW_MATERIAL',
      workAreaOrPositionOrUnit: '',
      status: true,
    });
    this.provinces.set([]);
    this.contactRows.clear();
    this.bankAccountRows.clear();
    this.wholesaleMaterialRows.clear();
    this.ensureCollectionRows();
    this.loadDefaultBranchCity();
  }

  updateFormLabels(typeCode?: string) {
    const defaultFormConfig = {
      full_names: { label: 'Razón Social / Nombre', view: true },
      number_document: { label: 'NIT / CI', view: true },
      direction: { label: 'Dirección exacta', view: true },
      companyContacts: { label: 'Contactos empresa', view: true },
      id_sector: { label: 'Sector (zonas)', view: true },
      mayorista: { label: 'Tipo entrega (Mayorista / Minorista)', view: true },
      name_contact: { label: 'Nombre persona de contacto', view: true },
      cellphone_contact: { label: 'Celular persona de contacto', view: true },
      workAreaOrPositionOrUnit: { label: 'Área / Cargo / Unidad dependiente', view: true },
      id_category: { label: 'Categoría principal', view: true },
      frequency: { label: 'Frecuencia', view: true },
      cellphone: { label: 'Celular principal', view: true },
      status: { label: 'Estado', view: true },
    };

    switch (typeCode) {
      case 'A':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre de empresa', view: true },
          number_document: { label: 'NIT empresa', view: true },
          direction: { label: 'Dirección empresa', view: true },
          companyContacts: { label: 'Contactos empresa', view: true },
          workAreaOrPositionOrUnit: { label: 'Área de trabajo o cargo', view: true },
        };
        break;
      case 'B':
        this.formP = {
          ...defaultFormConfig,
          companyContacts: { label: 'Contactos / teléfonos de la empresa', view: true },
          full_names: { label: 'Nombre completo / Razón social', view: true },
          number_document: { label: 'CI / NIT empresa', view: true },
          direction: { label: 'Dirección empresa', view: true },
          workAreaOrPositionOrUnit: { label: 'Área de trabajo o cargo', view: true },
        };
        break;
      case 'C':
        this.formP = {
          ...defaultFormConfig,
          companyContacts: { label: 'Contactos empresa', view: false },
          workAreaOrPositionOrUnit: { label: 'Área / Cargo / Unidad dependiente', view: false },
          id_category: { label: 'Categoría principal', view: false },
          full_names: { label: 'Nombre Completo Mayorista', view: true },
          direction: { label: 'Dirección de la acopiadora mayorista', view: true },
          number_document: { label: 'CI / NIT', view: true },
        };
        break;
      case 'D':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre Completo Minorista', view: true },
          direction: { label: 'Dirección de la acopiadora minorista', view: true },
          number_document: { label: 'CI / NIT', view: true },
        };
        break;
      case 'E':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre completo', view: true },
          number_document: { label: 'CI / NIT', view: true },
          direction: { label: 'Dirección', view: true },
        };
        break;
      case 'F':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre de empresa pública', view: true },
          number_document: { label: 'NIT empresa', view: true },
          direction: { label: 'Dirección empresa', view: true },
          companyContacts: { label: 'Contactos empresa', view: true },
          workAreaOrPositionOrUnit: { label: 'Área de trabajo o cargo', view: true },
        };
        break;
      default:
        this.formP = { ...defaultFormConfig };
        break;
    }
  }

  changeLabelAndForm() {
    const type = this.providerForm.get('id_type_provider')?.value;
    this.updateFormLabels(type?.code);
    if (!this.providersService?.isInfo) {
      const defaults: Record<string, string> = { origin_channel: 'DIRECT_CONTACT', relationship_status: 'ACTIVE', logistics_condition: 'RECUMET_PICKUP', price_policy: 'LIST_PRICE' };
      for (const [field, value] of Object.entries(defaults)) {
        const control = this.providerForm.get(field);
        if (control && !control.value) control.setValue(value, { emitEvent: false });
      }
    }
    const contacts = this.providerForm.get('contacts');
    if (this.supportsMultipleContacts()) contacts?.enable({ emitEvent: false });
    else contacts?.disable({ emitEvent: false });
    this.contactRows.controls.forEach(row => {
      for (const field of ['position_area', 'cellphone']) {
        const control = row.get(field);
        if (this.supportsBranches()) control?.addValidators(Validators.required);
        else control?.removeValidators(Validators.required);
        control?.updateValueAndValidity({ emitEvent: false });
      }
    });
    for (const field of ['full_names', 'department', 'id_commercial_user', 'origin_channel', 'relationship_status', 'material_ids']) {
      const control = this.providerForm.get(field);
      if (!control) continue;
      if (!control.hasValidator(Validators.required)) control.addValidators(Validators.required);
      control.updateValueAndValidity({ emitEvent: false });
    }
    for (const field of ['id_categories', 'latitude', 'longitude']) {
      const control = this.providerForm.get(field);
      if (!control) continue;
      if (this.providersService?.isEdit && !this.providersService?.isInfo) control.addValidators(Validators.required);
      else control.removeValidators(Validators.required);
      if (field === 'latitude') control.addValidators([Validators.min(-90), Validators.max(90)]);
      if (field === 'longitude') control.addValidators([Validators.min(-180), Validators.max(180)]);
      control.updateValueAndValidity({ emitEvent: false });
    }
    const primaryContact = this.providerForm.get('name_contact');
    for (const field of ['cellphone', 'cellphone_contact', 'name_contact', 'companyContacts', 'workAreaOrPositionOrUnit']) {
      const control = this.providerForm.get(field);
      if (this.isTypeD() && ['cellphone', 'companyContacts'].includes(field)) control?.disable({ emitEvent: false });
      else control?.enable({ emitEvent: false });
    }
    if (this.supportsMultipleContacts() || this.isTypeD()) primaryContact?.removeValidators(Validators.required);
    else primaryContact?.addValidators(Validators.required);
    primaryContact?.updateValueAndValidity({ emitEvent: false });
    const requiredTerms = this.usesCommercialTerms();
    this.providerForm.get('price_policy')?.setValidators(requiredTerms ? [
      Validators.required,
      control => !control.value || this.priceLevels.some(option => option.value === control.value) ? null : { invalidOption: true },
    ] : []);
    this.providerForm.get('logistics_condition')?.setValidators(requiredTerms ? Validators.required : []);
    this.providerForm.get('price_policy')?.updateValueAndValidity({ emitEvent: false });
    this.providerForm.get('logistics_condition')?.updateValueAndValidity({ emitEvent: false });
    if (this.isTypeB()) {
      const status = this.providerForm.get('relationship_status')?.value;
      const statuses: Record<string, string> = { NEW: 'IN_PROGRESS', PROSPECT: 'IN_PROGRESS', FOLLOW_UP: 'IN_PROGRESS', ACTIVE_PROVIDER: 'ACTIVE', INACTIVE: 'DORMANT' };
      if (!this.providersService?.isInfo && statuses[status]) this.providerForm.patchValue({ relationship_status: statuses[status] });
      this.syncWholesaleMaterials();
    }
    if (!this.supportsBranches() && this.activeTab() === 'branches') {
      this.setActiveTab('company');
    }
  }
}
