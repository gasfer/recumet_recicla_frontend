import { signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { of } from 'rxjs';
import { ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';
import { ModalProviderComponent } from './modal-provider.component';
import { ProvidersComponent } from '../../providers.component';

describe('Avance de registro de proveedor', () => {
  it('guarda una ficha incompleta como borrador y la recupera editable sin alterar Información', () => {
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    component.providerForm = new FormBuilder().group({ id: [12], full_names: ['ANA'], department: ['', Validators.required], number_document: ['00123'], contacts: [[]], bankAccounts: [[]], material_ids: [[]] });
    component.activeTab = signal('company');
    component.savingDraft = signal(false);
    component.draftNotice = signal('');
    component.frequencyMode = signal('automatic');
    const values = component.providerForm.getRawValue();
    const save = jasmine.createSpy('saveRegistrationDraft').and.returnValue(of({ ok: true }));
    const get = jasmine.createSpy('getRegistrationDraft').and.returnValue(of({ draft: { values } }));
    const service = { isInfo: false, isEdit: true, showModal: true, saveRegistrationDraft: save, getRegistrationDraft: get };
    (component as any).providersService = service;
    spyOn(component, 'changeLabelAndForm');
    (component as any).loadCollections = jasmine.createSpy('loadCollections');
    spyOn(component, 'filterProductsByCategories');
    spyOn(component, 'initializeLocationMap');
    component.saveRegistrationDraft(false);
    expect(save).toHaveBeenCalledWith('provider-12', values);
    expect(component.providerForm.invalid).toBeTrue();
    component.providerForm.patchValue({ full_names: 'OTRO' });
    component.restoreRegistrationDraft();
    expect(component.providerForm.get('full_names')?.value).toBe('ANA');
    expect(component.providerForm.get('number_document')?.value).toBe('00123');
    expect(component.providerForm.enabled).toBeTrue();
    service.isInfo = true;
    get.calls.reset();
    component.restoreRegistrationDraft();
    expect(get).not.toHaveBeenCalled();
  });
});

describe('Validación explícita de la ficha', () => {
  it('asigna el error de frecuencia únicamente a su campo y no a toda la sección', () => {
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    component.providerForm = new FormBuilder().group({ frequency_mode: ['automatic'], entity_type: ['PRIVATE'], origin_channel: ['DIRECT_CONTACT'], requires_certificate: [false] });
    (component as any).markServerErrorControls({ company: ['La modalidad de frecuencia no es válida'] });
    expect(component.providerForm.get('frequency_mode')?.hasError('server')).toBeTrue();
    for (const field of ['entity_type', 'origin_channel', 'requires_certificate']) expect(component.providerForm.get(field)?.errors).toBeNull();
  });

  it('lleva el foco al celular del contacto indicado sin confundirlo con el celular principal', () => {
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    const root = document.createElement('div');
    root.innerHTML = '<input formControlName="cellphone"><app-provider-contacts-section><input formControlName="cellphone"><input formControlName="cellphone"></app-provider-contacts-section>';
    (component as any).formHost = { nativeElement: root };
    const target = root.querySelectorAll('app-provider-contacts-section input')[1] as HTMLInputElement;
    const focus = spyOn(target, 'focus');
    spyOn(target, 'scrollIntoView');
    component.focusValidationField('contacts.1.cellphone');
    expect(focus).toHaveBeenCalled();
  });
  it('indica campos obligatorios, formato de celular y fila del contacto y omite campos deshabilitados', () => {
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    const fb = new FormBuilder();
    component.providerForm = fb.group({ department: ['', Validators.required], optionalEmail: ['inválido', Validators.email], hidden: [{ value: '', disabled: true }, Validators.required], contacts: fb.array([fb.group({ full_name: ['', Validators.required], cellphone: ['123', [Validators.required, Validators.pattern(/^[67]\d{7}$/)]] })]) });
    component.validationAttempted = signal(true);
    const errors = component.validationMessages();
    expect(errors.length).toBe(3);
    expect(errors[0].message).toContain('Departamento: es obligatorio');
    expect(errors[1].message).toContain('Contacto 1: Nombre del contacto');
    expect(errors[2].message).toContain('8 dígitos y comenzar con 6 o 7');
    component.providerForm.patchValue({ department: 'Cochabamba', contacts: [{ full_name: 'ANA', cellphone: '70000000' }] });
    expect(component.validationMessages()).toEqual([]);
  });
});

describe('Vista previa del PDF de proveedor', () => {
  it('muestra la ficha registrada y libera el archivo temporal al cerrar', () => {
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    component.providerForm = new FormBuilder().group({ id: [12], full_names: ['Proveedor registrado'], status: [false] });
    component.exportingSheet = signal(false);
    component.loading = signal(false);
    component.activeTab = signal('company');
    const sections = [{ id: 1, title: 'Identificación', fields: [], records: [] }];
    spyOn(component, 'informationSections').and.returnValue(sections as any);
    const exportSheet = jasmine.createSpy('exportRegistrationSheet').and.returnValue(of(new Blob(['pdf'], { type: 'application/pdf' })));
    (component as any).providersService = { isInfo: true, exportRegistrationSheet: exportSheet };
    (component as any).sanitizer = { bypassSecurityTrustResourceUrl: (url: string) => url };
    spyOn(URL, 'createObjectURL').and.returnValue('blob:ficha-prueba');
    const revoke = spyOn(URL, 'revokeObjectURL');
    component.exportRegistrationSheet(true);
    expect(exportSheet).toHaveBeenCalledWith({ name: 'Proveedor registrado', reference: 'ID: 12', status: 'Inactivo', sections });
    expect(component.sheetPreviewVisible).toBeTrue();
    expect(component.sheetPreviewUrl).toBe('blob:ficha-prueba');
    expect(component.exportingSheet()).toBeFalse();
    component.closeSheetPreview();
    expect(component.sheetPreviewVisible).toBeFalse();
    expect(component.sheetPreviewUrl).toBeNull();
    expect(revoke).toHaveBeenCalledWith('blob:ficha-prueba');
  });
});

describe('ModalProviderComponent category catalog', () => {
  it('loads provider categories from the purchases operational context', () => {
    const getAllAndSearch = jasmine.createSpy('getAllAndSearch').and.returnValue(of({
      categories: { data: [] }
    }));
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    component.categories = signal([]);
    component.categoriesService = { getAllAndSearch } as any;
    (component as any).productContext = ProductAccessContext.Purchases;

    component.getAllCategories();

    expect(getAllAndSearch).toHaveBeenCalledWith(
      1,
      1000,
      true,
      '',
      '',
      '',
      'id',
      'DESC',
      ProductAccessContext.Purchases,
    );
  });
});

describe('Formulario de proveedor mayorista B', () => {
  const createComponent = () => {
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    component.fb = new FormBuilder();
    component.providerForm = component.fb.group({
      id_type_provider: [{ code: 'B', id: '2' }],
      id_category: [''], id_categories: [['5']], material_ids: [[10, 20]],
      frequency: ['MONTHLY'], contact_frequency: ['BIWEEKLY'], frequency_mode: ['automatic'],
      service_mode: ['BOTH'], relationship_status: ['PROSPECT'],
      wholesale_materials: component.fb.array([]),
      contacts: component.fb.array([component.fb.group({ full_name: 'Ana', position_area: 'Ventas', cellphone: '70000000', is_main_contact: true })]),
      bankAccounts: component.fb.array([]),
    });
    component.activeTab = signal('company');
    component.frequencyMode = signal('automatic');
    component.frequencyAnalysis = signal(null);
    component.materialFrequencySuggestions = signal({});
    component.loadingFrequency = signal(false);
    (component as any).mapDrafts = {};
    spyOn(component, 'initializeLocationMap');
    component.rawProducts = signal([]);
    component.productsLoaded = signal(false);
    component.products = signal([]);
    component.priceLevels = [
      { label: 'Precio minorista', value: 'LIST_PRICE' },
      { label: 'Ajuste autorizado', value: 'AUTHORIZED_SPECIAL_PRICE' },
    ];
    return component;
  };

  it('conserva volumen y frecuencia por producto al agregar y quitar selecciones', () => {
    const component = createComponent();
    component.syncWholesaleMaterials();
    component.wholesaleMaterialRows.at(0).patchValue({ estimated_volume: 1500, frequency: 'WEEKLY' });
    component.providerForm.patchValue({ material_ids: [10, 30] });
    component.syncWholesaleMaterials();
    const rows = component.wholesaleMaterialRows.getRawValue();
    expect(rows.map(row => row.id_product)).toEqual([10, 30]);
    expect(rows[0].estimated_volume).toBe(1500);
    expect(rows[0].frequency).toBe('WEEKLY');
    expect(rows[1].frequency).toBe('MONTHLY');
  });

  it('envía productos, contactos, cuentas y categoría en el guardado B', () => {
    const component = createComponent();
    component.syncWholesaleMaterials();
    component.wholesaleMaterialRows.at(0).patchValue({ estimated_volume: 1500, frequency: 'WEEKLY' });
    const payload = (component as any).buildProviderPayload();
    expect(payload.id_category).toBe('5');
    expect(payload.name_contact).toBe('Ana');
    expect(payload.cellphone_contact).toBe('70000000');
    expect(payload.contact_frequency).toBe('BIWEEKLY');
    expect(payload.frequency).toBe('MONTHLY');
    expect(payload.materials[0].frequency).toBe('WEEKLY');
    expect(payload.materials[0].estimated_volume).toBe(1500);
    expect(payload.bankAccounts).toEqual([]);
    expect(payload.wholesale_materials).toBeUndefined();
  });

  it('en edición exige categorías y coordenadas y conserva los valores comerciales existentes', () => {
    const component = createComponent();
    component.providersService = { isEdit: true, isInfo: false } as any;
    component.providerForm.addControl('latitude', component.fb.control(null));
    component.providerForm.addControl('longitude', component.fb.control(null));
    component.providerForm.addControl('origin_channel', component.fb.control(''));
    component.providerForm.addControl('logistics_condition', component.fb.control(''));
    component.providerForm.addControl('price_policy', component.fb.control(''));
    component.providerForm.patchValue({ relationship_status: '', id_categories: [] });
    component.changeLabelAndForm();
    for (const field of ['latitude', 'longitude', 'id_categories']) expect(component.providerForm.get(field)?.hasError('required')).toBeTrue();
    expect(component.providerForm.get('origin_channel')?.value).toBe('DIRECT_CONTACT');
    expect(component.providerForm.get('relationship_status')?.value).toBe('ACTIVE');
    expect(component.providerForm.get('logistics_condition')?.value).toBe('RECUMET_PICKUP');
    expect(component.providerForm.get('price_policy')?.value).toBe('LIST_PRICE');
    component.providerForm.patchValue({ latitude: 0, longitude: 0, id_categories: ['5'], origin_channel: 'REFERRED' });
    component.changeLabelAndForm();
    expect(component.providerForm.get('latitude')?.valid).toBeTrue();
    expect(component.providerForm.get('longitude')?.valid).toBeTrue();
    expect(component.providerForm.get('origin_channel')?.value).toBe('REFERRED');
  });

  it('oculta y abandona sucursales al cambiar de B a otro tipo', () => {
    const component = createComponent();
    component.activeTab.set('branches');
    component.providerForm.patchValue({ id_type_provider: { code: 'F', id: '6' } });
    component.changeLabelAndForm();
    expect(component.supportsBranches()).toBeFalse();
    expect(component.activeTab()).toBe('company');
    component.setActiveTab('branches');
    expect(component.activeTab()).toBe('company');
  });

  it('mantiene productos guardados mientras llega el catálogo al abrir la edición', () => {
    const component = createComponent();
    component.syncWholesaleMaterials();
    component.filterProductsByCategories(['5']);
    expect(component.providerForm.get('material_ids')?.value).toEqual([10, 20]);
    component.rawProducts.set([
      { id: 10, name: 'Fierro', code: '10', id_category: 5, categoryName: 'Metales' },
      { id: 20, name: 'Aluminio', code: '20', id_category: 5, categoryName: 'Metales' },
    ]);
    component.productsLoaded.set(true);
    component.filterProductsByCategories(['5']);
    expect(component.providerForm.get('material_ids')?.value).toEqual([10, 20]);
    expect(component.wholesaleMaterialRows.length).toBe(2);
  });

  it('sugiere frecuencias independientes y mantiene manual el producto sin historial', () => {
    const component = createComponent();
    component.providerForm.addControl('id', component.fb.control(7));
    component.validatorsService = { id_sucursal: () => 1 } as any;
    component.providersService = { getFrequencyAnalysis: (_id: number, productId: number) => of({
      ok: true, analysis: { has_sufficient_history: productId === 10, frequency: productId === 10 ? 'WEEKLY' : null, total_deliveries: productId === 10 ? 4 : 1, average_days: productId === 10 ? 7 : null },
    }) } as any;
    component.syncWholesaleMaterials();
    component.fetchFrequencyAnalysis();
    expect(component.wholesaleMaterialRows.at(0).get('frequency')?.value).toBe('WEEKLY');
    expect(component.wholesaleMaterialRows.at(1).get('frequency')?.value).toBe('MONTHLY');
    const payload = (component as any).buildProviderPayload();
    expect(payload.materials[0].frequency_mode).toBe('automatic');
    expect(payload.materials[1].frequency_mode).toBe('manual');
    component.setFrequencyMode('manual');
    component.wholesaleMaterialRows.at(0).patchValue({ frequency: 'QUARTERLY' });
    component.fetchFrequencyAnalysis();
    expect(component.wholesaleMaterialRows.at(0).get('frequency')?.value).toBe('QUARTERLY');
  });

  it('Automático consulta todo el proveedor y rellena el volumen de cada producto', () => {
    const component = createComponent();
    component.providerForm.addControl('id', component.fb.control(7));
    const getFrequencyAnalysis = jasmine.createSpy('getFrequencyAnalysis').and.callFake((_id: number, productId?: number) => of({
      ok: true, analysis: { has_sufficient_history: true, frequency: productId ? 'WEEKLY' : 'MONTHLY', total_deliveries: 4, average_days: productId ? 7 : 30, estimated_volume: productId === 10 ? 100 : 300 },
    }));
    component.providersService = { getFrequencyAnalysis, isInfo: false } as any;
    component.syncWholesaleMaterials();
    component.setFrequencyMode('automatic');
    expect(getFrequencyAnalysis).toHaveBeenCalledWith(7);
    expect(getFrequencyAnalysis).toHaveBeenCalledWith(7, 10);
    expect(getFrequencyAnalysis).toHaveBeenCalledWith(7, 20);
    expect(component.providerForm.get('frequency')?.value).toBe('MONTHLY');
    expect(component.wholesaleMaterialRows.at(0).get('estimated_volume')?.value).toBe(100);
    expect(component.wholesaleMaterialRows.at(1).get('estimated_volume')?.value).toBe(300);
  });

  it('conserva las coordenadas propias de empresa y sucursal al alternar pestañas', () => {
    const component = createComponent();
    component.providerForm.addControl('latitude', component.fb.control(-17.3));
    component.providerForm.addControl('longitude', component.fb.control(-66.1));
    component.setActiveTab('branches');
    component.providerForm.patchValue({ latitude: -16.5, longitude: -68.1 });
    component.setActiveTab('company');
    expect(component.providerForm.get('latitude')?.value).toBe(-17.3);
    component.setActiveTab('summary');
    component.setActiveTab('company');
    expect(component.initializeLocationMap).toHaveBeenCalledTimes(3);
    component.setActiveTab('branches');
    expect(component.providerForm.get('latitude')?.value).toBe(-16.5);
  });

  it('envía productos y varias cuentas para C, D, E y F sin contactos ocultos obligatorios', () => {
    const component = createComponent();
    component.addContact({ full_name: 'Segundo contacto', cellphone: '70000001', is_main_contact: false });
    const bank = { id_bank: 1, account_holder: 'Ana', account_number: '123', account_type: 'CAJA_AHORRO', currency: 'BOB', is_main: true };
    component.addBankAccount(bank);
    component.addBankAccount({ ...bank, account_number: '456', is_main: false });
    for (const code of ['C', 'D', 'E', 'F']) {
      component.providerForm.patchValue({ id_type_provider: { code, id: '3' } });
      component.changeLabelAndForm();
      expect(component.contactRows.enabled).toBeTrue();
      const payload = (component as any).buildProviderPayload();
      expect(payload.materials.map((item: any) => item.id_product)).toEqual([10, 20]);
      expect(payload.id_category).toBe('5');
      expect(payload.bankAccounts.length).toBe(2);
      {
        expect(payload.contacts.length).toBe(2);
        expect(payload.contacts[1].full_name).toBe('Segundo contacto');
      }
    }
    component.providerForm.patchValue({ id_type_provider: { code: 'B' } });
    component.changeLabelAndForm();
    expect(component.contactRows.enabled).toBeTrue();
  });

  it('recupera contactos, cuentas, categorías y volúmenes desde la ficha guardada', () => {
    const component = createComponent();
    const saved = {
      contacts: [{ full_name: 'Ana', position_area: 'Ventas', cellphone: '70000000', is_main_contact: true }],
      bankAccounts: [{ id_bank: 1, account_holder: 'Ana', account_number: '123', account_type: 'CAJA_AHORRO', currency: 'BOB', is_main: true }],
      materials: [{ id_product: 10, id_category: 5, estimated_volume: '123.456', frequency: 'WEEKLY', status: true }],
    };
    (component as any).loadCollections(saved);
    expect(component.contactRows.at(0).get('cellphone')?.value).toBe('70000000');
    expect(component.contactRows.valid).toBeTrue();
    expect(component.bankAccountRows.at(0).get('account_number')?.value).toBe('123');
    expect(component.providerForm.get('material_ids')?.value).toEqual([10]);
    expect(component.providerForm.get('id_categories')?.value).toEqual(['5']);
    expect(component.wholesaleMaterialRows.at(0).get('estimated_volume')?.value).toBe(123.456);
  });
  it('exige nivel de precio y logística para B y C, con ajuste e instrucciones opcionales', () => {
    const component = createComponent();
    component.providerForm.addControl('price_policy', component.fb.control(null));
    component.providerForm.addControl('logistics_condition', component.fb.control(null));
    component.providerForm.addControl('habitual_price_adjustment', component.fb.control(''));
    component.providerForm.addControl('commercial_observations', component.fb.control(''));
    for (const code of ['B', 'C']) {
      component.providerForm.patchValue({ id_type_provider: { code }, price_policy: null, logistics_condition: null });
      component.changeLabelAndForm();
      expect(component.usesCommercialTerms()).toBeTrue();
      expect(component.providerForm.get('price_policy')?.value).toBe('LIST_PRICE');
      expect(component.providerForm.get('logistics_condition')?.value).toBe('RECUMET_PICKUP');
      component.providerForm.patchValue({ price_policy: null, logistics_condition: null });
      expect(component.providerForm.get('price_policy')?.hasError('required')).toBeTrue();
      expect(component.providerForm.get('logistics_condition')?.hasError('required')).toBeTrue();
      component.providerForm.patchValue({ price_policy: 'LIST_PRICE', logistics_condition: 'TO_COORDINATE' });
      expect(component.providerForm.get('price_policy')?.valid).toBeTrue();
      expect(component.providerForm.get('logistics_condition')?.valid).toBeTrue();
      expect(component.providerForm.get('habitual_price_adjustment')?.valid).toBeTrue();
      expect(component.providerForm.get('commercial_observations')?.valid).toBeTrue();
    }
    component.providerForm.patchValue({ id_type_provider: { code: 'A' }, price_policy: null, logistics_condition: null });
    component.changeLabelAndForm();
    expect(component.providerForm.get('price_policy')?.valid).toBeTrue();
    expect(component.providerForm.get('logistics_condition')?.valid).toBeTrue();
  });
});

describe('Ficha compartida de gestión de proveedores', () => {
  it('consulta la misma ficha y cambia al modo editable al crear o modificar', () => {
    const component = Object.create(ProvidersComponent.prototype) as ProvidersComponent;
    const emit = jasmine.createSpy('emit');
    (component as any).providersService = { isInfo: false, isEdit: false, showModal: false, editSubs: { emit } } as any;
    spyOn(component, 'canProviderAction').and.returnValue(true);
    const provider = { id: 12 } as any;

    component.showProviderInfo(provider);
    expect((component as any).providersService.isInfo).toBeTrue();
    expect((component as any).providersService.showModal).toBeTrue();
    expect(emit).toHaveBeenCalledWith(provider);

    component.showModal();
    expect((component as any).providersService.isInfo).toBeFalse();
    expect((component as any).providersService.isEdit).toBeFalse();

    component.showProviderInfo(provider);
    component.editShowModal(provider);
    expect((component as any).providersService.isInfo).toBeFalse();
    expect((component as any).providersService.isEdit).toBeTrue();
  });

  it('impide guardar proveedores y sucursales desde Información', () => {
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    (component as any).providersService = { isInfo: true } as any;
    const markAllAsTouched = jasmine.createSpy('markAllAsTouched');
    component.providerForm = { markAllAsTouched } as any;
    expect(() => component.newProvider()).not.toThrow();
    expect(() => component.editProvider()).not.toThrow();
    expect(() => component.saveBranch()).not.toThrow();
    expect(markAllAsTouched).not.toHaveBeenCalled();
  });
});
describe('Diseño de la información registrada', () => {
  const createInformation = (code: string) => {
    const component = Object.create(ModalProviderComponent.prototype) as ModalProviderComponent;
    component.fb = new FormBuilder();
    component.providerForm = component.fb.group({
      id_type_provider: [{ code, name: 'Proveedor ' + code }], full_names: ['ANA REGISTRADA'], number_document: ['123456'],
      commercial_name: ['ACOPIADORA REGISTRADA'], status: [false], latitude: [0], longitude: [0],
      id_categories: [['1']], material_ids: [[10]], frequency: ['MONTHLY'], frequency_mode: ['manual'], service_mode: ['BOTH'],
      wholesale_materials: component.fb.array([component.fb.group({ id_product: 10, estimated_volume: 0, frequency: 'WEEKLY' })]),
      contacts: component.fb.array([component.fb.group({ full_name: 'CONTACTO REGISTRADO', is_main_contact: true })]),
      bankAccounts: component.fb.array([component.fb.group({ id_bank: 1, account_number: '00123', is_main: true })]),
      requires_certificate: [true], requires_traceability_report: [false],
    });
    component.updateFormLabels(code);
    component.categories = signal([{ name: 'Fierro', code: '1' }]);
    component.rawProducts = signal([{ id: 10, name: 'Fierro registrado' }] as any);
    component.banks = signal([{ id: 1, name: 'Banco registrado' }] as any);
    component.commercialUsers = signal([]);
    component.registeredDocuments = signal([]);
    component.storedCertificate = signal('certificado.pdf');
    for (const key of ['entityTypes', 'serviceModes', 'originChannels', 'relationshipStatuses', 'wholesaleOriginChannels', 'wholesaleRelationshipStatuses', 'negotiationConditions', 'negotiationModes', 'logisticsConditions', 'priceLevels', 'accountTypes']) (component as any)[key] = [];
    return component;
  };

  it('presenta los datos guardados, conserva ceros y números de cuenta y distingue vacíos', () => {
    const sections = createInformation('B').informationSections();
    expect(sections[0].fields.some(field => field.value === 'ACOPIADORA REGISTRADA')).toBeTrue();
    expect(sections.find(section => section.id === 2)?.fields.find(field => field.label === 'Latitud')?.value).toBe('0');
    expect(sections.find(section => section.id === 4)?.records[0].fields[0].value).toBe('0');
    expect(sections.find(section => section.id === 7)?.records[0].fields.find(field => field.label === 'N.º de cuenta')?.value).toBe('00123');
    expect(sections.find(section => section.id === 7)?.records[0].fields[0].value).toBe('Banco registrado');
    expect(sections.find(section => section.id === 8)?.fields[0].value).toBe('Sin registrar');
  });

  it('muestra el mapa solo con coordenadas registradas y conserva coordenadas cero', () => {
    const component = createInformation('F');
    expect(component.hasInformationCoordinates()).toBeTrue();
    component.providerForm.patchValue({ latitude: null, longitude: null });
    expect(component.hasInformationCoordinates()).toBeFalse();
    component.providerForm.patchValue({ latitude: 0, longitude: '' });
    expect(component.hasInformationCoordinates()).toBeFalse();
  });

  it('respeta las secciones y campos ocultos por tipo de proveedor', () => {
    const typeC = createInformation('C').informationSections();
    expect(typeC.some(section => section.id === 6)).toBeFalse();
    expect(typeC.find(section => section.id === 3)?.fields.some(field => field.label === 'Categoría principal')).toBeFalse();
    const typeD = createInformation('D').informationSections();
    expect(typeD.flatMap(section => section.fields).some(field => field.label === 'Enlace de Google Maps')).toBeFalse();
    expect(typeD.some(section => section.id === 3)).toBeTrue();
    expect(typeD.some(section => section.id === 6)).toBeFalse();
    expect(typeD.find(section => section.id === 2)?.fields.some(field => field.label === 'Celular principal')).toBeFalse();
  });

  it('ordena tarjetas en dos columnas sin perder ni duplicar secciones por tipo', () => {
    for (const code of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const component = createInformation(code);
      const columns = component.informationColumns();
      expect(columns.length).toBe(2);
      expect(columns[0][0].id).toBe(1);
      expect(columns[1][0].id).toBe(2);
      expect(columns.flat().map(section => section.id).sort()).toEqual(component.informationSections().map(section => section.id).sort());
      expect(component.trackInformationColumn(0)).toBe(0);
    }
  });
});
