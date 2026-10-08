import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProvidersService } from '../services/providers.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProviderManagementCatalogs, ProviderManagementQuery } from '../interfaces/provider-management.interface';
import { PROVIDER_ORIGIN_CHANNELS, PROVIDER_RELATIONSHIP_STATUSES, PROVIDER_SERVICE_MODES, PROVIDER_FREQUENCIES } from 'src/app/core/constants/provider-commercial.constants';

interface FilterField { key: string; label: string; kind: 'text' | 'number' | 'select' | 'multiselect'; options?: Array<{label: string; value: string | number}>; corporate?: boolean; }
interface FilterSection { title: string; icon: string; fields: FilterField[]; }

@Component({
  selector: 'app-provider-management-filters', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownModule, MultiSelectModule, ButtonModule, InputTextModule],
  templateUrl: './provider-management-filters.component.html',
  styleUrls: ['./provider-management-filters.component.scss'],
})
export class ProviderManagementFiltersComponent implements OnInit {
  @Input() loading = false;
  @Output() applyFilters = new EventEmitter<ProviderManagementQuery>();
  private readonly api = inject(ProvidersService);
  private readonly context = inject(ValidatorsService);
  private readonly fb = inject(FormBuilder);
  catalog?: ProviderManagementCatalogs;
  catalogLoading = true;
  error = '';
  expanded = true;
  applied: Array<{ key: string; label: string; value: string }> = [];
  private appliedQuery: ProviderManagementQuery = {};
  sections: FilterSection[] = [];
  modes = [
    { label: 'Todo el historial', value: 'ALL' },
    { label: 'Día específico', value: 'DAY' },
    { label: 'Este mes / Mes', value: 'MONTH' },
    { label: 'Este año / Año', value: 'YEAR' },
    { label: 'Rango personalizado', value: 'RANGE' }
  ];
  dateBasisOptions = [
    { label: 'Compras del período', value: 'PURCHASES' },
    { label: 'Fecha última compra', value: 'LATEST' }
  ];
  readonly yesNo = [{ label: 'Sí', value: 'true' }, { label: 'No', value: 'false' }];
  form = this.fb.group<Record<string, any>>({
    date_mode: 'ALL',
    date_basis: 'PURCHASES',
    date: '',
    date_end: '',
    query: '',
    id_type_provider: null,
    estado_registro: null,
    department: null,
    city: null,
    id_sucursal: [],
    id_storage: [],
    type_registry: null,
    id_categories: [],
    id_products: [],
    id_commercial_user: null,
    origin_channel: null,
    relationship_status: null,
    service_mode: null,
  });

  categoryOptions: Array<{ id: number; name: string }> = [];
  productOptions: Array<{ id: number; name: string; cod: string }> = [];
  departmentOptions: Array<{ label: string; value: string }> = [];
  cityOptions: Array<{ label: string; value: string }> = [];
  branchOptions: Array<{ id: number; name: string }> = [];
  storageOptions: Array<{ id: number; name: string; id_sucursal: number }> = [];
  userOptions: Array<{ label: string; value: number }> = [];

  readonly grades = [
    { code: 'A', label: 'A (Empresas)' },
    { code: 'B', label: 'B (Talleres)' },
    { code: 'C', label: 'C (Acopiadores)' },
    { code: 'D', label: 'D (Mineras)' },
    { code: 'E', label: 'E (Eventuales)' },
    { code: 'F', label: 'F (Observado)' },
  ];

  ngOnInit() { this.loadCatalogs(); }

  loadCatalogs() {
    this.catalogLoading = true;
    this.error = '';
    this.api.getManagementCatalogs().subscribe({
      next: ({ catalogs }) => {
        this.catalog = catalogs;
        this.categoryOptions = (catalogs.categories || []).map(c => ({ id: c.id!, name: c.name || '' }));
        this.productOptions = (catalogs.products || []).map(p => ({
          id: p.id!,
          name: p.name || '',
          cod: p.code || (p as any).cod || ''
        }));
        this.departmentOptions = (catalogs.departments || []).map(d => ({ label: d.name || '', value: d.value || d.name || '' }));
        this.cityOptions = (catalogs.cities || []).map(c => ({ label: c.name || '', value: c.value || c.name || '' }));
        this.branchOptions = (catalogs.branches || []).map(b => ({ id: b.id!, name: b.name || '' }));
        this.storageOptions = (catalogs.storages || []).map(s => ({ id: s.id!, name: s.name || '', id_sucursal: Number(s.id_sucursal) }));
        this.userOptions = (catalogs.users || []).map((u: any) => ({ label: u.full_names || u.name || '', value: u.id! }));

        this.buildSections(catalogs);
        this.catalogLoading = false;
        const defaultSucursalId = Number(this.context.id_sucursal());
        const defaultStorageId = Number(this.context.id_storage());
        this.form.patchValue({
          id_sucursal: defaultSucursalId ? [defaultSucursalId] : [],
          id_storage: defaultStorageId ? [defaultStorageId] : []
        });
        this.apply();
      },
      error: () => {
        this.catalogLoading = false;
        this.error = 'No se pudieron cargar los filtros. Intenta nuevamente.';
      },
    });
  }

  filteredStorages(): Array<{ id: number; name: string; id_sucursal: number }> {
    const selectedBranches = (this.form.get('id_sucursal')?.value as number[]) || [];
    if (!selectedBranches.length) return this.storageOptions;
    return this.storageOptions.filter(s => selectedBranches.includes(s.id_sucursal));
  }

  onBranchChange() {
    const currentStorages = (this.form.get('id_storage')?.value as number[]) || [];
    const validStorageIds = this.filteredStorages().map(s => s.id);
    const updated = currentStorages.filter(id => validStorageIds.includes(id));
    this.form.patchValue({ id_storage: updated });
    this.apply();
  }

  private buildSections(c: ProviderManagementCatalogs) {
    const options = (rows: Array<{id?: number; name?: string; full_names?: string; value?: string}>) => rows.map(row => ({label: row.name || row.full_names || '', value: row.value ?? row.id!}));
    const select = (key: string, label: string, opts: FilterField['options'], corporate = false): FilterField => ({key,label,kind:'select',options:opts,corporate});
    const text = (key: string, label: string, corporate = false): FilterField => ({key,label,kind:'text',corporate});
    const number = (key: string, label: string): FilterField => ({key,label,kind:'number'});
    this.sections = [
      {title:'Identificación y ubicación', icon:'fa-id-card', fields:[text('query','Proveedor · nombre, CI o NIT'), select('id_type_provider','Tipo proveedor',options(c.types)), select('estado_registro','Registro',[{label:'Validado',value:'VALIDADO'},{label:'Pendiente',value:'PENDIENTE'}]), select('department','Departamento',options(c.departments)), select('city','Ciudad',options(c.cities))]},
      {title:'Sucursal y compras',icon:'fa-cart-shopping',fields:[select('id_sucursal','Sucursal RECUMET',options(c.branches)),select('id_storage','Almacén RECUMET',options(c.storages)),select('type_registry','Tipo registro',['FICHA','BOLETA','SIN FICHA'].map(value=>({label:value,value}))),select('old_customer','¿Cliente antiguo?',this.yesNo),select('with_pickup','¿Con recojo?',this.yesNo)]},
      {title:'Relación comercial',icon:'fa-handshake',fields:[select('id_commercial_user','Responsable comercial',options(c.users)),select('origin_channel','¿Cómo nos conociste?',PROVIDER_ORIGIN_CHANNELS),select('relationship_status','Relación comercial',PROVIDER_RELATIONSHIP_STATUSES),select('service_mode','Modalidad de atención',PROVIDER_SERVICE_MODES)]},
      {title:'Productos y actividad',icon:'fa-boxes-stacked',fields:[select('id_category','Categoría comprada',options(c.categories)),select('id_product','Producto comprado',options(c.products)),select('activity','Compras registradas',[{label:'Con compras',value:'WITH'},{label:'Sin compras',value:'WITHOUT'}]),select('frequency','Frecuencia calculada',PROVIDER_FREQUENCIES.filter(o=>o.value!=='EVENTUAL')),number('min_days','Días sin comprar · mín'),number('max_days','Días sin comprar · máx')]},
      {title:'Montos y documentación',icon:'fa-wallet',fields:[number('min_amount','Compras Bs · mín'),number('max_amount','Compras Bs · máx'),number('min_balance','Saldo actual Bs · mín'),number('max_balance','Saldo actual Bs · máx'),select('has_document','CI / NIT registrado',this.yesNo),select('has_bank_account','Cuenta bancaria registrada',this.yesNo)]},
    ];
    for (const section of this.sections) {
      for (const field of section.fields) {
        if (!this.form.contains(field.key)) {
          this.form.addControl(field.key, this.fb.control(null));
        }
      }
    }
  }

  setTypeGrade(code: string) {
    const currentId = this.form.get('id_type_provider')?.value;
    const type = this.catalog?.types.find(t => t.code === code);
    if (!type) return;
    if (Number(currentId) === type.id) {
      this.form.patchValue({ id_type_provider: null });
    } else {
      this.form.patchValue({ id_type_provider: type.id });
    }
    this.typeChanged();
    this.apply();
  }

  isGradeSelected(code: string): boolean {
    const currentId = this.form.get('id_type_provider')?.value;
    if (!currentId) return false;
    const type = this.catalog?.types.find(t => t.id === Number(currentId));
    return type?.code === code;
  }

  corporateVisible() {
    const id = this.form.get('id_type_provider')?.value;
    return !id || this.catalog?.types.find(t => t.id === Number(id))?.code === 'A';
  }

  typeChanged() {
    if (!this.corporateVisible()) this.form.patchValue({ main_contact: null, has_contact: null });
  }

  dateModeChanged() {
    this.form.patchValue({ date: '', date_end: '' });
  }

  apply() {
    const q: ProviderManagementQuery = {};
    for (const [key, value] of Object.entries(this.form.getRawValue())) {
      if (value !== null && value !== '' && value !== undefined) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            q[key] = value;
          }
        } else {
          q[key] = value as string | number;
        }
      }
    }
    const mode = q['date_mode'];
    if (mode !== 'ALL' && (!q['date'] || (mode === 'RANGE' && (!q['date_end'] || String(q['date']) > String(q['date_end']))))) {
      this.error = 'Completa las fechas del período en orden.';
      return;
    }
    for (const name of ['amount', 'count', 'balance', 'days', 'average_days']) {
      if (q[`min_${name}`] != null && q[`max_${name}`] != null && Number(q[`min_${name}`]) > Number(q[`max_${name}`])) {
        this.error = 'El mínimo no puede superar al máximo.';
        return;
      }
    }
    const selectedBranches = (Array.isArray(q['id_sucursal']) ? q['id_sucursal'] : q['id_sucursal'] ? [Number(q['id_sucursal'])] : []) as number[];
    const selectedStorages = (Array.isArray(q['id_storage']) ? q['id_storage'] : q['id_storage'] ? [Number(q['id_storage'])] : []) as number[];
    if (selectedBranches.length > 0 && selectedStorages.length > 0) {
      const invalid = selectedStorages.some(sId => {
        const s = this.storageOptions.find(opt => opt.id === Number(sId));
        return s && !selectedBranches.includes(s.id_sucursal);
      });
      if (invalid) {
        this.error = 'Uno o más almacenes no pertenecen a las sucursales seleccionadas.';
        return;
      }
    }
    this.error = '';
    this.appliedQuery = { ...q };
    this.refreshChips();
    this.applyFilters.emit({ ...q });
  }

  clear() {
    const defaultSucursalId = Number(this.context.id_sucursal());
    const defaultStorageId = Number(this.context.id_storage());
    this.form.reset({
      date_mode: 'ALL',
      date_basis: 'PURCHASES',
      date: '',
      date_end: '',
      query: '',
      id_type_provider: null,
      estado_registro: null,
      department: null,
      city: null,
      id_sucursal: defaultSucursalId ? [defaultSucursalId] : [],
      id_storage: defaultStorageId ? [defaultStorageId] : [],
      type_registry: null,
      id_categories: [],
      id_products: [],
      id_commercial_user: null,
      origin_channel: null,
      relationship_status: null,
      service_mode: null,
    });
    this.apply();
  }

  remove(key: string) {
    if (['date', 'date_end', 'date_mode'].includes(key)) {
      delete this.appliedQuery['date'];
      delete this.appliedQuery['date_end'];
      this.appliedQuery['date_mode'] = 'ALL';
      this.form.patchValue({ date_mode: 'ALL', date: '', date_end: '' });
    } else {
      delete this.appliedQuery[key];
      if (['id_categories', 'id_products', 'id_sucursal', 'id_storage'].includes(key)) {
        this.form.get(key)?.setValue([]);
      } else {
        this.form.get(key)?.setValue(null);
      }
    }
    this.refreshChips();
    this.applyFilters.emit({ ...this.appliedQuery });
  }

  private refreshChips() {
    const fields = this.sections.flatMap(s => s.fields);
    this.applied = Object.entries(this.appliedQuery)
      .filter(([key, value]) => !['date_mode', 'date_basis'].includes(key) && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0))
      .map(([key, value]) => {
        if (key === 'id_sucursal') {
          const ids = Array.isArray(value) ? value : String(value).split(',').map(Number);
          const names = ids.map(id => this.branchOptions.find(o => o.id === Number(id))?.name).filter(Boolean);
          return {
            key,
            label: 'Sucursales',
            value: names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} (+${names.length - 2})`
          };
        }
        if (key === 'id_storage') {
          const ids = Array.isArray(value) ? value : String(value).split(',').map(Number);
          const names = ids.map(id => this.storageOptions.find(o => o.id === Number(id))?.name).filter(Boolean);
          return {
            key,
            label: 'Almacenes',
            value: names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} (+${names.length - 2})`
          };
        }
        if (key === 'id_categories') {
          const ids = Array.isArray(value) ? value : String(value).split(',').map(Number);
          const names = ids.map(id => this.categoryOptions.find(o => o.id === Number(id))?.name).filter(Boolean);
          return {
            key,
            label: 'Categorías',
            value: names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} (+${names.length - 2})`
          };
        }
        if (key === 'id_products') {
          const ids = Array.isArray(value) ? value : String(value).split(',').map(Number);
          const names = ids.map(id => this.productOptions.find(o => o.id === Number(id))?.name).filter(Boolean);
          return {
            key,
            label: 'Productos',
            value: names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} (+${names.length - 2})`
          };
        }
        const field = fields.find(f => f.key === key);
        return {
          key,
          label: field?.label || (key === 'date' ? 'Desde' : key === 'date_end' ? 'Hasta' : key),
          value: field?.options?.find(o => String(o.value) === String(value))?.label || String(value)
        };
      });
  }
}
