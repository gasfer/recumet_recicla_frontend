import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Provider, Providers } from '../interfaces/provider.interface';
import { ProvidersService } from '../services/providers.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PurchaseTraceabilityApiService } from 'src/app/core/services/purchase-traceability-api.service';
import { AccountsPayableService } from '../../accounts/services/accounts-payable.service';
import { Account, AccountsPayableProvider } from '../../accounts/interfaces/accounts-payable-provider.interface';
import { ProviderCompanyProfile, ProviderSiteProfile } from '../interfaces/provider-commercial-profile.interface';
import { InputsService } from '../services/inputs.service';
import { GetAllInputs, Input } from '../interfaces/input.interface';
import { UsersService } from 'src/app/pages/managements/services/users.service';
import {
  PROVIDER_ACCOUNT_TYPES, PROVIDER_CURRENCIES, PROVIDER_ENTITY_TYPES,
  PROVIDER_FREQUENCIES, PROVIDER_NEGOTIATION_CONDITIONS, PROVIDER_ORIGIN_CHANNELS,
  PROVIDER_RELATIONSHIP_STATUSES, PROVIDER_SERVICE_MODES, PROVIDER_OPERATIONAL_TYPES,
} from 'src/app/core/constants/provider-commercial.constants';

@Component({
  selector: 'app-providers',
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.scss']
})
export class ProvidersComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,
      iconStyle: { 'color': '#3B71CA'}, command: () => {
      this.type.set('');
      this.estadoRegistro.set('');
      this.getAllAndSearchProviders(1,this.rows(),true);
    }},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can',
      iconStyle: { 'color': '#DC4C64'},
      command: () => {
      this.type.set('');
      this.estadoRegistro.set('');
      this.getAllAndSearchProviders(1,this.rows(),false)
    } },
    { label: 'Pendientes de Validación Comercial', icon: 'fa-solid fa-clock',
      iconStyle: { 'color': '#f57c00' }, command: () => {
      this.type.set('');
      this.estadoRegistro.set('PENDIENTE');
      this.getAllAndSearchProviders(1, this.rows(), true);
    } },
  ]);
  cols = signal<ColsTable[]>([]);
  searchFor = signal<SearchFor[]>([
    {name: 'NOMBRES', code: 'full_names'},
    {name: 'SECTOR', code: 'sector.name'},
    {name: 'CI / NIT', code: 'number_document'},
    {name: 'CELULAR', code: 'cellphone'},
    {name: 'DIRECCIÓN', code: 'direction'},
    {name: 'TIPO', code: 'type.name'},
    {name: 'CONTACTO', code: 'name_contact'},
    {name: 'CELULAR C.', code: 'cellphone_contact'},
    {name: 'CATEGORÍA', code: 'category.name'},
  ]);
  loading   = signal(false);
  loadingReport   = signal(false);
  rows      = signal(50);
  fieldSort = signal('');
  order     = signal('');
  page      = signal(1);
  status    = signal(true);
  type      = signal('');
  query     = signal('');
  estadoRegistro = signal('');
  types = signal<{name:string, code:string}[]>([]);
  types_filtrado = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);

    providers = signal<Providers|undefined>(undefined);
  providerInfoVisible = signal(false);
  providerInfoLoading = signal(false);
  providerInfoTab = signal<'company' | 'branches' | 'summary'>('company');
  selectedProvider = signal<Provider | null>(null);
  selectedCompanyProfile = signal<ProviderCompanyProfile | null>(null);
  selectedInfoSiteId = signal<number | null>(null);
  accountsVisible = signal(false);
  accountsLoading = signal(false);
  providerAccounts = signal<AccountsPayableProvider | null>(null);

  private usersService = inject(UsersService);
  private inputsService = inject(InputsService);
  commercialUsers = signal<{ id: number; full_names: string }[]>([]);
  infoFrequencyAnalysis = signal<{
    has_sufficient_history: boolean;
    total_deliveries: number;
    average_days: number | null;
    frequency: string | null;
    frequency_mode: 'automatic' | 'manual';
    last_delivery_date: string | null;
    next_estimated_date: string | null;
    message?: string;
  } | null>(null);
  infoPurchases = signal<Input[]>([]);
  infoPurchasesLoading = signal(false);
  infoTotalPurchasesAmount = signal(0);
  infoTotalPurchasesCount = signal(0);
  infoLastPurchaseDate = signal<string | null>(null);

  originChannels = PROVIDER_ORIGIN_CHANNELS;
  relationshipStatuses = PROVIDER_RELATIONSHIP_STATUSES;
  entityTypes = PROVIDER_ENTITY_TYPES;
  serviceModes = PROVIDER_SERVICE_MODES;
  frequencies = PROVIDER_FREQUENCIES;

  getOriginChannelLabel(code: string | null | undefined): string {
    if (!code) return 'No registrado';
    const found = this.originChannels.find(item => item.value === code);
    return found ? found.label : code;
  }

  getRelationshipStatusLabel(code: string | null | undefined): string {
    if (!code) return 'No registrado';
    const found = this.relationshipStatuses.find(item => item.value === code);
    return found ? found.label : code;
  }

  getEntityTypeLabel(code: string | null | undefined): string {
    if (!code) return 'Privada';
    const found = this.entityTypes.find(item => item.value === code);
    return found ? found.label : code;
  }

  getServiceModeLabel(code: string | null | undefined): string {
    if (!code) return 'Ambos (Entrega en planta y recojo)';
    const found = this.serviceModes.find(item => item.value === code);
    return found ? found.label : code;
  }

  getFrequencyLabel(code: string | null | undefined): string {
    if (!code) return 'Mensual';
    const found = this.frequencies.find(item => item.value === code);
    return found ? found.label : code;
  }

  getCommercialUserName(userId: number | null | undefined): string {
    if (!userId) return 'No asignado';
    const user = this.commercialUsers().find(u => u.id === Number(userId));
    return user ? user.full_names : `Usuario #${userId}`;
  }

  loadCommercialUsers() {
    this.usersService.getAllAndSearch(1, 1000, true).subscribe({
      next: (resp) => {
        const list = (resp.users?.data || []).map(u => ({
          id: u.id,
          full_names: u.full_names || `Usuario #${u.id}`
        }));
        this.commercialUsers.set(list);
      },
      error: () => this.commercialUsers.set([])
    });
  }

  loadInfoPurchases(providerId: number) {
    this.infoPurchasesLoading.set(true);
    const branchId = Number(this.validatorsService.id_sucursal()) || undefined;
    const searchParams: any = {
      id_provider: String(providerId),
      id_sucursal: branchId ? String(branchId) : undefined,
      status: 'ACTIVE'
    };
    this.inputsService.getAllAndSearchInputs(1, 50, searchParams).subscribe({
      next: (res: GetAllInputs) => {
        this.infoPurchasesLoading.set(false);
        const list = res.inputs?.data || [];
        this.infoPurchases.set(list);
        const total = list.reduce((acc: number, item: Input) => acc + (Number(item.total) || 0), 0);
        this.infoTotalPurchasesAmount.set(total);
        this.infoTotalPurchasesCount.set(res.inputs?.total || list.length);
        this.infoLastPurchaseDate.set(list.length > 0 ? (list[0].date_voucher || list[0].createdAt) : null);
      },
      error: () => {
        this.infoPurchasesLoading.set(false);
        this.infoPurchases.set([]);
      }
    });
  }

  showProviderInfo(provider: Provider) {
    this.providerInfoTab.set('company');
    this.selectedProvider.set(provider);
    this.selectedCompanyProfile.set(null);
    this.selectedInfoSiteId.set(provider.id);
    this.providerInfoVisible.set(true);
    this.providerInfoLoading.set(true);
    this.infoFrequencyAnalysis.set(null);
    this.loadInfoPurchases(provider.id);

    this.providersService.getFrequencyAnalysis(provider.id).subscribe({
      next: (res) => {
        if (res.ok && res.analysis) this.infoFrequencyAnalysis.set(res.analysis);
      }
    });

    this.providersService.getCommercialDetails(provider.id).subscribe({
      next: ({ provider: details }) => {
        this.selectedProvider.set({ ...provider, ...details });
        const companyId = details.company?.id;
        if (companyId) {
          this.providersService.getCommercialCompany(companyId).subscribe({
            next: ({ company }) => {
              this.selectedCompanyProfile.set(company);
              this.selectedInfoSiteId.set(provider.id);
            },
          });
        }
      },
      error: () => {},
      complete: () => this.providerInfoLoading.set(false),
    });
  }


  infoSites(): ProviderSiteProfile[] { return this.selectedCompanyProfile()?.operatingProviders || []; }

  selectedInfoSite(): ProviderSiteProfile | null {
    const sites = this.infoSites();
    return sites.find(site => site.id === this.selectedInfoSiteId()) || sites[0] || null;
  }

  selectInfoSite(site: ProviderSiteProfile) {
    this.selectedInfoSiteId.set(site.id || null);
  }

  maskedAccount(accountNumber: string) {
    const value = String(accountNumber || '');
    if (value.length <= 4) return value ? `•••• ${value}` : 'Sin número';
    return `${'•'.repeat(Math.min(8, value.length - 4))} ${value.slice(-4)}`;
  }

  openStreetMapUrl(site: ProviderSiteProfile) {
    const latitude = site.location?.latitude;
    const longitude = site.location?.longitude;
    return latitude != null && longitude != null ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}` : '';
  }

  siteMapUrl(site: ProviderSiteProfile): SafeResourceUrl | null {
    const latitude = Number(site.location?.latitude);
    const longitude = Number(site.location?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const delta = 0.008;
    const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join('%2C');
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`,
    );
  }

  private providersService = inject(ProvidersService);
  private sanitizer = inject(DomSanitizer);
  private traceabilityApi = inject(PurchaseTraceabilityApiService);
  private accountsPayableService = inject(AccountsPayableService);
  traceabilityVisible = signal(false);
  traceabilityData = signal<any>(null);
  validatorsService = inject(ValidatorsService);
  fb                = inject(FormBuilder);
  save$!: Subscription;
  formReport:UntypedFormGroup = this.fb.group({
    id_type_provider: [],
  });
  pipeNumber      = new DecimalPipe('en-US');
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  ngOnInit(): void {
    this.loadCommercialUsers();
    this.getAllTypes();
    this.save$ = this.providersService.save$.subscribe(resp => this.getAllAndSearchProviders(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }


  getAllAndSearchProviders(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.cols.set(this.loadColsTableByType());
    const id_type_provider = this.formReport.get('id_type_provider')?.value ?? '';
    this.providersService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order(),id_type_provider ? id_type_provider.id : '', this.estadoRegistro()).subscribe({
      next: (resp) => {
        this.providers.set(resp.providers);
        this.providers()!.data.forEach((provider) => {
          provider.options = provider.status  ? [
            {
              label:'', icon:'fa-solid fa-clock-rotate-left', tooltip: 'Ver trazabilidad',
              disabled: this.validatorsService.withPermission('COMPRAS','view'),
              class:'p-button-rounded p-button-info p-button-sm',
              eventClick: () => this.showTraceability(provider),
            },
            {
              label:'',icon:'fa-solid fa-comment-dollar',
              tooltip: 'Cuentas por pagar',
              disabled: this.validatorsService.withPermission('CUENTAS POR COBRAR','view'),
              class:'p-button-rounded  p-button-sm',
              eventClick: () => this.showProviderAccounts(provider)
            },
                        {
              label: '',
              icon: 'fa-solid fa-circle-info',
              tooltip: 'Más información',
              class: 'p-button-rounded p-button-help p-button-sm ms-1',
              eventClick: () => {
                this.showProviderInfo(provider);
              }
            },
            {
              label:'',icon:'fas fa-edit',
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('PROVEEDORES','update'),
              class:'p-button-rounded p-button-warning p-button-sm ms-1',
              eventClick: () => {
                this.editShowModal(provider);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can',
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('PROVEEDORES','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(provider,false);
              }
            },
          ] : [
                        {
              label: '',
              icon: 'fa-solid fa-circle-info',
              tooltip: 'Más información',
              class: 'p-button-rounded p-button-help p-button-sm',
              eventClick: () => {
                this.showProviderInfo(provider);
              }
            },
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('PROVEEDORES','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(provider,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }
  showTraceability(provider: Provider) {
    this.traceabilityApi.getProvider(provider.id, 1, 100, this.currentContext()).subscribe(({ traceability }) => {
      this.traceabilityData.set(traceability);
      this.traceabilityVisible.set(true);
    });
  }

  showProviderAccounts(provider: Provider) {
    this.selectedProvider.set(provider);
    this.providerAccounts.set(null);
    this.accountsVisible.set(true);
    this.accountsLoading.set(true);
    const context = this.currentContext();
    this.accountsPayableService.getAccountsPayableForProvider(provider.id, context['id_sucursal'], context['id_storage']).subscribe({
      next: ({ accountsPayable }) => this.providerAccounts.set(accountsPayable),
      error: () => Swal.fire({ icon: 'error', title: 'No se pudo cargar el historial de cuentas' }),
      complete: () => this.accountsLoading.set(false),
    });
  }

  activePayments(account: Account) {
    return (account.abonosAccountsPayable || []).filter(payment => payment.status !== false);
  }

  private currentContext(): Record<string, number> {
    const context: Record<string, number> = {};
    const branchId = Number(this.validatorsService.id_sucursal());
    const storageId = Number(this.validatorsService.id_storage());
    if (branchId) context['id_sucursal'] = branchId;
    if (storageId) context['id_storage'] = storageId;
    return context;
  }

  updateStatus(provider: Provider,newStatus: boolean) {
    if (!newStatus) {
      this.confirmProviderDeactivation(provider);
      return;
    }
    this.persistProviderStatus(provider, newStatus);
  }

  private confirmProviderDeactivation(provider: Provider) {
    this.accountsPayableService.getAccountsPayableForProvider(provider.id).subscribe({
      next: ({ accountsPayable }) => {
        const totals = accountsPayable.totals;
        Swal.fire({
          title: '¿Dar de baja al proveedor?',
          html: `<div style="text-align:left;font-size:.86rem"><b>${this.escapeHtml(provider.full_names)}</b><hr><p>Cuentas registradas: <b>${totals.total_accounts || 0}</b></p><p>Total comprado: <b>Bs. ${Number(totals.total_account || 0).toFixed(2)}</b></p><p>Total pagado: <b>Bs. ${Number(totals.total_abonados || 0).toFixed(2)}</b></p><p>Saldo pendiente: <b style="color:#b45309">Bs. ${Number(totals.total_restante || 0).toFixed(2)}</b></p><small>La baja no elimina compras, pagos ni deudas. El historial permanecerá disponible.</small></div>`,
          icon: Number(totals.total_restante || 0) > 0 ? 'warning' : 'question',
          confirmButtonText: 'Sí, dar de baja',
          cancelButtonText: 'Cancelar',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          customClass: { container: 'sweetalert2' },
        }).then(result => { if (result.isConfirmed) this.persistProviderStatus(provider, false); });
      },
      error: () => Swal.fire({ icon: 'error', title: 'No se pudo validar el estado de cuenta', text: 'No se realizó la baja.' }),
    });
  }

  private persistProviderStatus(provider: Provider,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Proveedor?`,
      text: `Esta apunto de ${statusText} a ${provider.full_names}`,
      icon: `${newStatus ? 'info' : 'warning'}`,
      confirmButtonText: `Si, ${statusText}!`,
      showLoaderOnConfirm: true,
      showCancelButton: true,
      backdrop:true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      customClass: { container: 'sweetalert2'},
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          this.providersService.putInactiveOrActive(provider.id!,newStatus).subscribe({
            complete: () => resolve(true),
            error: (err) => {
              Swal.showValidationMessage(`Ops...! Lamentablemente no se puedo realizar la solicitud`);
              resolve(false);
            }
          });
        });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if(!result.isConfirmed) return;
      if(result.value) {
        this.getAllAndSearchProviders(1,this.rows(),!newStatus);
        Swal.fire({
          title: 'Éxito!',
          text: `Disponible en la sección de ${newStatus ? "Activos" : "Inactivos"}`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>'\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[char] || char));
  }

  paginate($rows:any) {
    const {rows, page} = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchProviders(this.page(),this.rows(),this.status(),this.type(),this.query())
  }

  customSort($sort:any) {
    let {field, order} = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  search($query:any) {
    const {type, query} = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchProviders(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.providersService.isEdit = false;
    this.providersService.showModal = true;
  }

  editShowModal(provider:Provider) {
    this.providersService.isEdit = true;
    this.providersService.editSubs.emit(provider);
    this.providersService.showModal = true;
  }

  onChangeTypesFilter() {
    const type_filter = this.formReport.get('filterBy')?.value;
    if(type_filter == 'RANGE'){
      this.formReport.get('dates')?.setValue([new Date()]);
    } else {
      this.formReport.get('dates')?.setValue(new Date());
    }
  }

  getAllTypes() {
    this.types.set([]);
    this.providersService.getAllTypesProvider().subscribe(resp => {
      const formattedType = resp.typesProvider.map(type => ({
        name: type.name,
        id: type.id!.toString(),
        code: type.code,
      })).sort((a, b) => a.name.localeCompare(b.name));
      formattedType.unshift(
        {code:'ALL', name:'TODOS',id: ''}
      )
      this.types.set(formattedType);
      if(formattedType.length > 0) {
        this.formReport.get('id_type_provider')?.setValue({
          name: formattedType[0].name,
          id: formattedType[0].id!.toString(),
          code: formattedType[0].code,
        });
        this.getAllAndSearchProviders(1,this.rows(),true);
      }
    });
  }


  clearInputs() {
    this.formReport.patchValue({
      id_type_provider: '1',
    });
  }

  getDefaultColumns() {
    return [
      {
        field: 'type.code',
        field2: 'full_names',
        header: 'PROVEEDOR',
        style:'min-width:230px;max-width:330px;',
        tooltip: true,
        isProviderIdentity: true,
      },
      { field: 'date_last_input', header: 'ULT. COMPRA', style:'min-width:120px;max-width:120px;', tooltip: true, isText: true, isDate: true, isNotDateAndHour: true },
      { field: 'total_products', header: 'COMPRAS [KG]', style:'min-width:100px;max-width:120px;', tooltip: true, isTag: true, field2: 'total_inputs', isDoubleValue: true,
        tagValue: (val: string) => val ? this.pipeNumber.transform(val, this.decimal()) : 0,
        tagColor: (val: string) => 'info',
        tagIcon: (val: string) => '',
      },
      { field: 'saldo_cuentas_por_pagar', header: 'SALDO', style:'min-width:100px;max-width:120px;', tooltip: true, isTag: true,
        tagValue: (val: string) => val ? this.pipeNumber.transform(val, this.decimal()) : 0,
        tagColor: (val: string) => 'success',
        tagIcon: (val: string) => '',
      },
    //  { field: 'sector.name', header: 'SECTOR', style:'min-width:150px;max-width:200px;', tooltip: true, isText: true },
    //  { field: 'frequency', header: 'FRECUENCIA', style:'min-width:120px;max-width:120px;', tooltip: true, isText: true },
    ];
  }

  loadColsTableByType(): any[] {
    const columns = this.getDefaultColumns();
    const type = this.formReport.get('id_type_provider')?.value;
    switch (type.code) {
      case 'A': case 'F':
        return [...columns,
          { field: 'number_document', header: 'NIT', style:'min-width:120px;max-width:120px;', tooltip: true, isText: true },
          { field: 'direction', header: 'DIRECCIÓN', style:'min-width:200px;max-width:200px;', tooltip: true, isText: true },
          { field: 'companyContacts', header: 'CONTACTO', style:'min-width:200px;max-width:200px;', tooltip: true, isText: true },
          { field: 'name_contact', header: 'PERSONA NOMBRE', style:'min-width:150px;max-width:200px;', tooltip: true, isText: true },
          { field: 'cellphone_contact', header: 'PERSONA CELULAR', style:'min-width:120px;max-width:150px;', tooltip: true, isText: true },
         // { field: 'workAreaOrPositionOrUnit', header: 'AREA - UNIDAD', style:'min-width:120px;max-width:150px;', tooltip: true, isText: true },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px;', isButton: true }
        ];
      case 'B':
        return [...columns,
          { field: 'number_document', header: 'CI / NIT', style:'min-width:120px;max-width:120px;', tooltip: true, isText: true },
          { field: 'direction', header: 'DIRECCIÓN', style:'min-width:200px;max-width:200px;', tooltip: true, isText: true },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px;', isButton: true }
        ];
      case 'C': case 'D':
        return [...columns,
          { field: 'number_document', header: 'CI / NIT', style:'min-width:120px;max-width:120px;', tooltip: true, isText: true },
          { field: 'direction', header: type === 'C' ? 'ACOPIADORA MAYORISTA' : 'DIRECCIÓN ACOPIADORA MINORISTA', style:'min-width:200px;max-width:200px;', tooltip: true, isText: true },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px;', isButton: true }
        ];
      case 'E':
        return [...columns,
          { field: 'number_document', header: 'CI / NIT', style:'min-width:120px;max-width:120px;', tooltip: true, isText: true },
          { field: 'name_contact', header: 'PERSONA NOMBRE', style:'min-width:150px;max-width:200px;', tooltip: true, isText: true },
          { field: 'cellphone_contact', header: 'PERSONA CELULAR', style:'min-width:120px;max-width:150px;', tooltip: true, isText: true },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px;', isButton: true }
        ];
      case 'ALL':
          return [...columns,
            { field: 'number_document', header: 'CI / NIT', style: 'min-width:120px;max-width:120px;', tooltip: true, isText: true },
          //  { field: 'direction', header: 'DIRECCIÓN - ACOPIADORA', style: 'min-width:200px;max-width:200px;', tooltip: true, isText: true },
            { field: 'companyContacts', header: 'CONTACTO', style: 'min-width:200px;max-width:200px;', tooltip: true, isText: true },
            { field: 'name_contact', header: 'PERSONA NOMBRE', style: 'min-width:150px;max-width:200px;', tooltip: true, isText: true },
            { field: 'cellphone_contact', header: 'PERSONA CELULAR', style: 'min-width:120px;max-width:150px;', tooltip: true, isText: true },
           // { field: 'workAreaOrPositionOrUnit', header: 'AREA - UNIDAD', style: 'min-width:120px;max-width:150px;', tooltip: true, isText: true },
            { field: 'options', header: 'OPCIONES', style: 'min-width:130px;max-width:130px;', isButton: true }
          ];
      default:
        return [];
    }
  }


  printPdfReport() {
    this.loadingReport.set(true);
    const id_type_provider = this.formReport.get('id_type_provider')?.value ?? '';
    Swal.fire({
      title: 'Generando Excel!',
      html: `Espere un momento`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.providersService.getReportExcel(this.status(),this.type(),this.query(),this.fieldSort(),this.order(),id_type_provider ? id_type_provider.id : '').subscribe({
            next: (data) => {
              this.loadingReport.set(false);
              const fileURL = window.URL.createObjectURL(data);
              window.open(fileURL);
              Swal.close();
            },
            error: (err) => {
              Swal.close();
            },
          });
        });
      },
    });
  }
}

