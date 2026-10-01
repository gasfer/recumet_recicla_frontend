import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ElementRef, ViewChild } from '@angular/core';
import { Observable, Subscription, switchMap } from 'rxjs';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProvidersService } from '../../../services/providers.service';
import Swal from 'sweetalert2';
import { CategoriesService } from 'src/app/pages/inventories/services/categories.service';
import { ProductsService } from 'src/app/pages/inventories/services/products.service';
import { ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';
import { BOLIVIA_DEPARTMENTS } from 'src/app/core/constants/bolivia-geography.constants';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
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

@Component({
  selector: 'app-modal-provider',
  templateUrl: './modal-provider.component.html',
  styles: [`
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
  products = signal<{name:string,code:string,categoryName:string}[]>([]);
  sectors = signal<{name:string,code:string}[]>([]);
  departments = BOLIVIA_DEPARTMENTS.map(item => ({ name: item.name, code: item.name }));
  provinces = signal<{ name: string; code: string }[]>([]);
  locating = signal(false);
  importingLocation = signal(false);
  locationStatus = signal('');
  banks = signal<Bank[]>([]);
  @ViewChild('locationMap') locationMap?: ElementRef<HTMLDivElement>;
  private map?: L.Map;
  private locationMarker?: L.Marker;
  frequencies = signal(PROVIDER_FREQUENCIES.map(option => ({ name: option.label, code: option.value })));
  entityTypes = PROVIDER_ENTITY_TYPES;
  serviceModes = PROVIDER_SERVICE_MODES;
  originChannels = PROVIDER_ORIGIN_CHANNELS;
  relationshipStatuses = PROVIDER_RELATIONSHIP_STATUSES;
  negotiationConditions = PROVIDER_NEGOTIATION_CONDITIONS;
  accountTypes = PROVIDER_ACCOUNT_TYPES;
  currencies = PROVIDER_CURRENCIES;
  operationalTypes = PROVIDER_OPERATIONAL_TYPES;
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
    id_category: [ '', [Validators.required]],
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
    relationship_status: ['PROSPECT', []],
    negotiation_condition: ['', []],
    commercial_observations: ['', [Validators.maxLength(2000)]],
    requires_certificate: [false, []],
    requires_traceability_report: [false, []],
    general_observations: ['', [Validators.maxLength(2000)]],
    department: [''], province: [''], city: [''], zone: [''], latitude: [null], longitude: [null], geolocation_text: [''], google_maps_url: [''], contact_email: [''],
    id_bank: [''], account_holder: [''], account_number: [''], account_type: [''], currency: ['BOB'],
    frequency:[ 'MONTHLY', [Validators.maxLength(254)]],
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
    this.ensureCollectionRows();
    this.loadAvailableProviders(0);
    this.loadDefaultBranchCity();
    this.isEditSub$ = this.providersService.editSubs.subscribe(resp => {
      this.loadProviderForm(resp);
      this.loadAvailableProviders(resp.id);
      this.providersService.getCommercialDetails(resp.id).subscribe({
      next: ({ provider }) => {
          this.loadProviderForm(provider);
          if (provider.company?.id) this.loadCompanySites(provider.company.id, provider.id);
        },
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
      full_name: [contact.full_name || '', Validators.required],
      position_area: [contact.position_area || '', Validators.required],
      cellphone: [contact.cellphone || '', Validators.required],
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
    this.ensureCollectionRows();
    this.bankAccountRows.clear();
    (provider.bankAccounts || []).forEach((account: Record<string, unknown>) => this.addBankAccount(account));
    this.providerForm.patchValue({
      material_ids: (provider.materials || []).filter((item: any) => item.status !== false && item.id_product).map((item: any) => Number(item.id_product)),
    });
  }

  private loadCompanySites(companyId: number, selectedProviderId?: number) {
    this.providersService.getCommercialCompany(companyId).subscribe(({ company }) => {
      const sites = company.operatingProviders || [];
      this.companySites.set(sites);
      const selected = sites.find(site => site.id === selectedProviderId) || sites[0];
      if (selected) this.selectCompanySite(selected);
    });
  }

  selectCompanySite(site: ProviderSiteProfile) {
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
  }

  startNewBranch() {
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
    this.loadDefaultBranchCity();
  }

  saveBranch() {
    const companyId = Number(this.providerForm.get('company_id')?.value);
    const providerType = this.providerForm.get('id_type_provider')?.value;
    if (!companyId) {
      Swal.fire({ icon: 'warning', title: 'Guarde primero la empresa matriz' });
      return;
    }
    this.providerForm.markAllAsTouched();
    if (!this.providerForm.valid) return;
    const site = this.buildSiteProfile(providerType, this.creatingBranch() ? 'BRANCH' : this.currentSiteRole());
    this.loading.set(true);
    const request$: Observable<unknown> = this.creatingBranch()
      ? this.providersService.createCommercialSite(companyId, site)
      : this.providersService.updateCommercialSite(companyId, Number(this.selectedBranchId()), site);
    request$.subscribe({
      next: () => {
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
      const companyProviders = resp.company?.operatingProviders || [];
      const corporate = resp.company || resp;
      this.providerForm.reset({
        id: resp.id,
        site_name: resp.full_names,
        company_id: resp.company?.id || null,
        full_names: corporate.full_names || resp.full_names,
        id_sector: resp.sector?.id?.toString() || '',
        number_document: corporate.number_document || resp.number_document,
        cellphone: resp.cellphone,
        direction: resp.direction,
        id_type_provider: {
          name: resp.type?.name.toString(),
          code:resp.type?.code.toString(),
          id: resp.type?.id.toString(),
        },
        mayorista: resp.mayorista ?? false,
        name_contact: resp.name_contact,
        companyContacts: resp.companyContacts,
        commercial_name: corporate.commercial_name || resp.commercial_name,
        corporate_phone: corporate.corporate_phone || '', corporate_cellphone: corporate.corporate_cellphone || '',
        corporate_email: corporate.corporate_email || '', website: corporate.website || '',
        entity_type: corporate.entity_type || resp.entity_type || 'PRIVATE',
        operational_type: corporate.operational_type || 'RAW_MATERIAL',
        id_commercial_user: corporate.id_commercial_user || resp.id_commercial_user || this.validatorsService.user()?.id || null,
        has_branches: resp.company?.has_branches ?? false,
        provider_ids: companyProviders.filter((item: any) => item.id !== resp.id).map((item: any) => item.id),
        service_mode: resp.service_mode,
        origin_channel: corporate.origin_channel || resp.origin_channel || 'DIRECT_CONTACT',
        relationship_status: corporate.relationship_status || resp.relationship_status || 'PROSPECT',
        negotiation_condition: corporate.negotiation_condition || resp.negotiation_condition || null,
        commercial_observations: corporate.commercial_observations || resp.commercial_observations,
        requires_certificate: corporate.requires_certificate ?? resp.requires_certificate ?? false,
        requires_traceability_report: corporate.requires_traceability_report ?? resp.requires_traceability_report ?? false,
        general_observations: corporate.general_observations || resp.general_observations,
        department: (resp as any).branches?.find((item: any) => item.is_main)?.department || '',
        province: (resp as any).branches?.find((item: any) => item.is_main)?.province || '',
        city: (resp as any).branches?.find((item: any) => item.is_main)?.city || '',
        zone: (resp as any).branches?.find((item: any) => item.is_main)?.zone || '',
        latitude: (resp as any).branches?.find((item: any) => item.is_main)?.latitude || null,
        longitude: (resp as any).branches?.find((item: any) => item.is_main)?.longitude || null,
        geolocation_text: (resp as any).branches?.find((item: any) => item.is_main)?.geolocation_text || '',
        google_maps_url: (resp as any).branches?.find((item: any) => item.is_main)?.google_maps_url || '',
        contact_email: (resp as any).contacts?.find((item: any) => item.is_main_contact)?.email || '',
        id_bank: (resp as any).bankAccounts?.find((item: any) => item.is_main)?.id_bank || '',
        account_holder: (resp as any).bankAccounts?.find((item: any) => item.is_main)?.account_holder || '',
        account_number: (resp as any).bankAccounts?.find((item: any) => item.is_main)?.account_number || '',
        account_type: (resp as any).bankAccounts?.find((item: any) => item.is_main)?.account_type || '',
        currency: (resp as any).bankAccounts?.find((item: any) => item.is_main)?.currency || 'BOB',
        frequency: resp.frequency,
        workAreaOrPositionOrUnit: resp.workAreaOrPositionOrUnit,
        cellphone_contact: resp.cellphone_contact,
        id_category: resp.id_category?.toString() || '',
        status: resp.status,
      });
      this.selectedCompanyProviders.set(companyProviders.filter((item: any) => item.id !== resp.id));
      this.loadCollections(resp);
      this.updateProvinceOptions(false);
      this.locationStatus.set((resp as any).branches?.find((item: any) => item.is_main)?.latitude ? 'Ubicación registrada cargada' : '');
      this.refreshMap('stored');
      this.selectedBranchId.set(resp.id);
      this.activeTab.set('company');
  }

  private loadAvailableProviders(currentProviderId: number) {
    this.providersService.getAllAndSearch(1, 1000, true).subscribe({
      next: (response: any) => this.availableProviders.set((response.providers?.data || []).filter((provider: any) => provider.id !== currentProviderId)),
    });
  }

  isTypeA() {
    return this.providerForm.get('id_type_provider')?.value?.code === 'A';
  }

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
      if (!this.locationMap?.nativeElement || this.map) return;
      const latitude = Number(this.providerForm.get('latitude')?.value) || -16.2902;
      const longitude = Number(this.providerForm.get('longitude')?.value) || -63.5887;
      this.map = L.map(this.locationMap.nativeElement, { center: [latitude, longitude], zoom: this.providerForm.get('latitude')?.value ? 16 : 5 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(this.map);
      this.map.on('click', event => this.setMapLocation(event.latlng.lat, event.latlng.lng, false, 'manual'));
      if (this.providerForm.get('latitude')?.value) this.setMapLocation(latitude, longitude, false, 'stored');
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
      this.locationMarker = L.marker([lat, lng], { draggable: true, icon }).addTo(this.map);
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
    // The map host is recreated when changing tabs; release the previous Leaflet
    // instance before asking it to bind to the selected site's host.
    this.map?.remove();
    this.map = undefined;
    this.locationMarker = undefined;
    this.activeTab.set(tab);
    if (tab === 'branches') this.refreshMap('stored');
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
    this.serverErrors.set({});
    this.providerForm.markAllAsTouched();
    if(!this.providerForm.valid) return;
    const id_type_provider = this.providerForm.get('id_type_provider')?.value;
    if (!this.validateTypeACompany(id_type_provider)) return;
    this.loading.set(true);
    const formProvider = this.providerForm.getRawValue();
    const request$ = id_type_provider?.code === 'A'
      ? this.providersService.createCommercialCompany({ company: this.buildCompanyProfile(id_type_provider), headquarters: this.buildSiteProfile(id_type_provider, 'HEADQUARTERS') })
      : this.providersService.postNew({ ...formProvider, id_type_provider: Number(id_type_provider.id) });
    request$.subscribe({
      next: (response) => {
        const company = id_type_provider?.code === 'A' && 'company' in response ? response.company : null;
        const companyId = company && typeof company === 'object' && 'id' in company
          ? Number(company.id)
          : null;
        if (companyId) this.uploadPendingDocuments(companyId);
      },
      complete: () => {
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
    this.serverErrors.set({});
    this.providerForm.markAllAsTouched();
    if(!this.providerForm.valid) return;
    const id_type_provider = this.providerForm.get('id_type_provider')?.value;
    if (!this.validateTypeACompany(id_type_provider)) return;
    this.loading.set(true);
    const formProvider = this.providerForm.getRawValue();
    const request$ = id_type_provider?.code === 'A' && formProvider.company_id
      ? this.providersService.updateCommercialCompany(Number(formProvider.company_id), this.buildCompanyProfile(id_type_provider)).pipe(
          switchMap(() => this.providersService.updateCommercialSite(Number(formProvider.company_id), Number(formProvider.id), this.buildSiteProfile(id_type_provider, 'HEADQUARTERS'))),
        )
      : this.providersService.putUpdate({ ...formProvider, id_type_provider: Number(id_type_provider.id) });
    request$.subscribe({
      next: () => {
        if (id_type_provider?.code === 'A' && formProvider.company_id) this.uploadPendingDocuments(Number(formProvider.company_id));
      },
      complete: () => {
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
        next: response => this.products.set((response.products?.data || []).map((product: any) => ({
          name: product.name, code: String(product.id), categoryName: product.category?.name || product.Category?.name || '',
        }))),
        error: () => this.products.set([]),
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
      frequency: value.frequency as ProviderFrequency, service_mode: value.service_mode as ProviderServiceMode,
      status: value.status !== false,
      location: {
        branch_name: value.site_name || value.full_names || 'SEDE PRINCIPAL', department: value.department, province: value.province || null,
        city: value.city, zone: value.zone || null, address: value.direction,
        latitude: value.latitude === null ? null : Number(value.latitude), longitude: value.longitude === null ? null : Number(value.longitude),
        geolocation_text: value.geolocation_text || null, google_maps_url: value.google_maps_url || null,
        is_main: true, status: true,
      },
      contacts,
      materials: materialIds.map((id: string | number) => ({ id_product: Number(id), frequency: value.frequency as ProviderFrequency, service_mode: value.service_mode as ProviderServiceMode, status: true })),
      bankAccounts: value.bankAccounts,
    };
  }

  serverErrorsFor(section: string): string[] {
    return this.serverErrors()[section] || [];
  }

  private handleSaveError(error: { error?: { errors?: Array<{ msg?: string; field?: string }> } }) {
    this.loading.set(false);
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
    Swal.fire({ icon: 'warning', title: 'Ficha incompleta', text: message });
  }

  private errorSection(message: string): string {
    const normalized = message.toLocaleLowerCase();
    if (normalized.includes('cuenta bancaria') || normalized.includes('cuenta principal')) return 'bankAccounts';
    if (normalized.includes('contacto')) return 'contacts';
    if (normalized.includes('material')) return 'materials';
    if (normalized.includes('departamento') || normalized.includes('ciudad') || normalized.includes('dirección') || normalized.includes('coordenada')) return 'location';
    return 'company';
  }

  private markServerErrorControls(grouped: Record<string, string[]>) {
    const fieldsBySection: Record<string, string[]> = {
      company: ['full_names', 'number_document', 'entity_type', 'origin_channel', 'relationship_status', 'requires_certificate', 'requires_traceability_report'],
      location: ['department', 'city', 'direction', 'latitude', 'longitude'],
      materials: ['material_ids', 'frequency', 'service_mode'],
    };
    Object.entries(fieldsBySection).forEach(([section, fields]) => {
      if (!grouped[section]?.length) return;
      fields.forEach(field => {
        const control = this.providerForm.get(field);
        control?.setErrors({ ...(control.errors || {}), server: grouped[section][0] });
        control?.markAsTouched();
      });
    });
    if (grouped['contacts']?.length) this.contactRows.controls.forEach(control => control.markAllAsTouched());
    if (grouped['bankAccounts']?.length) this.bankAccountRows.controls.forEach(control => control.markAllAsTouched());
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
    missingFields.forEach(([field]) => this.providerForm.get(field)?.setErrors({ required: true }));
    Swal.fire({ icon: 'warning', title: 'Datos generales incompletos', text: `Para una empresa Tipo A registre ${missingFields.map(([, label]) => label).join(' y ')}.` });
    return false;
  }

  selectDocument(type: 'CERTIFICATE' | 'TRACEABILITY_REPORT', event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' || file.size > 8 * 1024 * 1024) {
      Swal.fire('Documento no válido', 'Adjunte un PDF de máximo 8 MB.', 'warning');
      return;
    }
    this.documentFiles.update(files => ({ ...files, [type]: file }));
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
      service_mode: 'BOTH', origin_channel: 'DIRECT_CONTACT', relationship_status: 'PROSPECT',
      negotiation_condition: '', commercial_observations: '', requires_certificate: false,
      requires_traceability_report: false, general_observations: '',
      department: '', province: '', city: '', zone: '', latitude: null, longitude: null, geolocation_text: '', google_maps_url: '',
      frequency: 'MONTHLY', material_ids: [], operational_type: 'RAW_MATERIAL',
      workAreaOrPositionOrUnit: '',
      status: true,
    });
    this.provinces.set([]);
    this.contactRows.clear();
    this.bankAccountRows.clear();
    this.ensureCollectionRows();
    this.loadDefaultBranchCity();
  }

  changeLabelAndForm() {
    this.resetForm();
    const type = this.providerForm.get('id_type_provider')?.value;
    const defaultFormConfig = {
      full_names: { label: '', view: true },
      number_document: { label: '', view: false },
      direction: { label: '', view: true },
      companyContacts: { label: '', view: false },
      id_sector: { label: 'Sector(zonas)', view: true },
      mayorista: { label: '', view: false },
      name_contact: { label: 'Nombre persona de contacto', view: true },
      cellphone_contact: { label: 'Celular persona de contacto.', view: true },
      workAreaOrPositionOrUnit: { label: '', view: false },
      id_category: { label: 'Categoría(tipo de material que entrega)', view: true },
      frequency: { label: 'Frecuencia', view: true },
      //default no document
      cellphone: { label: 'Celular', view: true },
      status: { label: 'Estado:', view: true },
    };

    switch (type?.code) {
      //grandes empresas
      case 'A':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre de empresa', view: true },
          number_document: { label: 'Nit empresa', view: true },
          direction: { label: 'Dirección empresa', view: true },
          companyContacts: { label: 'Contactos empresa', view: true },
          workAreaOrPositionOrUnit: { label: 'Área de trabajo o cargo o unidad dependiente', view: true },
        };
        break;
        //pequeñas empresas
      case 'B':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre del taller o negocio', view: true },
          number_document: {label:'CI / NIT', view: true},
          direction: { label: 'Dirección del taller o negocio', view: true },
        };
        break;
        //acopiadores mayoristas
      case 'C':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre Completo Mayorista', view: true },
          direction: { label: 'Dirección de la acopiadora mayorista', view: true },
          number_document: {label:'CI / NIT', view: true},
          mayorista: {  label: 'Mayorista o minorista', view: true},
          name_contact: { label: 'Nombre de contacto', view: false },
          cellphone_contact: { label: 'Celular de contacto', view: false },

        };
        break;
        //acopiadores minoristas
      case 'D':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre Completo Minorista', view: true },
          direction: { label: 'Dirección de la acopiadora minorista', view: true },
          number_document: {label:'CI / NIT', view: true},
          mayorista: {  label: 'Mayorista o minorista', view: false},
          name_contact: { label: 'Nombre de contacto', view: false },
          cellphone_contact: { label: 'Celular de contacto', view: false },
        };
        break;
        //domiciliarios nuevos
      case 'E':
        this.formP = {
          ...defaultFormConfig,
         full_names: { label: 'Nombre completo', view: true },
          number_document: {label:'CI / Nit', view: true},
          direction: { label: '', view: true },
          name_contact: { label: 'Nombre de contacto', view: false },
          cellphone_contact: { label: 'Celular de contacto', view: false },
        };
        break;
      case 'F':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre de empresa publica', view: true },
          number_document: {label:'Nit empresa', view: true},
          direction: { label: 'Dirección empresa', view: true },
          companyContacts: { label: 'Contactos empresa', view:true },
          workAreaOrPositionOrUnit: {label: 'Área de trabajo o cargo o unidad dependiente', view: true},
        };
        break;
      default:
        this.formP = { ...defaultFormConfig };
        break;
    }
  }
}
