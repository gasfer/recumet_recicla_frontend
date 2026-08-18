import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ModalApprovedTransferComponent } from './modal-approved-transfer.component';
import { TransfersService } from '../../../services/transfers.service';
import { ProductsService } from 'src/app/pages/inventories/services/products.service';
import { ValidatorsService } from 'src/app/services/validators.service';

describe('ModalApprovedTransferComponent', () => {
  let component: ModalApprovedTransferComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ModalApprovedTransferComponent],
      providers: [
        { provide: TransfersService, useValue: {} },
        { provide: ValidatorsService, useValue: { decimalLength: () => 2 } },
        { provide: ProductsService, useValue: { getDifferenceProducts: () => of({ products: [] }) } },
      ],
    }).overrideComponent(ModalApprovedTransferComponent, { set: { template: '' } });

    component = TestBed.createComponent(ModalApprovedTransferComponent).componentInstance;
  });

  const addDetail = (sent: number, received: number) => component.detailsFormArray.push(component.fb.group({
    id_detail: [1], id_product: [10], product_name: ['PRODUCTO'], product_cod: ['MP-001'],
    quantity_sent: [sent], quantity_received: [received], observation: [''],
  }));

  it('recalcula faltante, excedente y totales desde cambios del formulario', () => {
    addDetail(1000, 1000);
    const receivedControl = component.detailsFormArray.at(0).get('quantity_received');

    receivedControl?.setValue(970);
    expect(component.getFaltante(component.detailsFormArray.at(0))).toBe(30);
    expect(component.getTotalFaltante()).toBe(30);
    expect(component.getTotalExcedente()).toBe(0);

    receivedControl?.setValue(1020);
    expect(component.getExcedente(component.detailsFormArray.at(0))).toBe(20);
    expect(component.getTotalFaltante()).toBe(0);
    expect(component.getTotalExcedente()).toBe(20);
  });

  it('preselecciona el producto de diferencia solo cuando existe faltante', () => {
    component.mermaProducts.set([{ id: 55, name: 'DIFERENCIA DE PESO POR TRASLADO – EN REVISIÓN' } as any]);
    addDetail(1000, 970);

    component.checkObservationsRequirement();

    expect(component.approvedForm.get('id_merma_product')?.value).toBe(55);
    expect(component.hasShortage()).toBeTrue();
  });
});
