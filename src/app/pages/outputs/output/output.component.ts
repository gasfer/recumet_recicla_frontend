import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ClientsService } from '../services/clients.service';
import { ProductsService } from '../../inventories/services/products.service';
import { OutputService } from '../services/output.service';
import { ComponentsService } from 'src/app/core/services/components.service';
import { Client } from '../interfaces/client.interface';
import { Product } from '../../inventories/interfaces/products.interface';
import { SucursalesService } from '../../managements/services/sucursales.service';
import { Storage } from '../../managements/interfaces/sucursales.interface';
import { AuthService } from 'src/app/auth/auth.service';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styles: [`
  .card {
    border-radius: 20px;
    box-sizing: border-box;
  }
`
  ]
})
export class OutputComponent implements OnInit {
  fb                = inject( FormBuilder  );
  clientsService    = inject( ClientsService );
  productService    = inject( ProductsService );
  outputService     = inject( OutputService );
  componentService  = inject( ComponentsService );
  sucursalService   = inject( SucursalesService );
  authService       = inject( AuthService);
  validatorsService = inject(ValidatorsService);

  suggestedClients      = signal<Client[]>([]);
  suggestedProducts     = signal<Product[]>([]);
  txtSearchClient       = signal('');
  txtSearchProduct      = signal('');
  loadingSearchClient   = signal(false);
  loadingSearchProduct  = signal(false);
  storages              = signal<Storage[]>([]);
  
  totalItems            = computed(() => this.outputService.detailSale().length);
  clientSelect          = computed(() => this.outputService.clientSelect());

  formReport:UntypedFormGroup = this.fb.group({
    id_sucursal: ['',[Validators.required]],
    id_storage: ['',[Validators.required]],
  });

  ngOnInit(): void {
    const id_storage_pos  = localStorage.getItem('id_storage_pos');
    const findStorage = this.validatorsService.storages().find(resp => resp.id === Number(id_storage_pos));
    this.formReport.patchValue({
      id_sucursal: this.validatorsService.id_sucursal(),
      id_storage: findStorage ? Number(id_storage_pos) : null
    });
    this.formReport.markAllAsTouched();
    if(!this.outputService.isEdit){
      this.outputService.resetOutput();
    } else {
      const output_edit =  this.outputService.dataOutputForEdit();
      this.formReport.patchValue({id_storage:Number(output_edit?.id_storage)})
    }
  }

  suggestedClient(txtSearchClient: string){
    if(txtSearchClient.length==0) {
      this.txtSearchClient.set('');
      this.suggestedClients.set([]);
      return;
    }
    this.loadingSearchClient.set(true);
    this.txtSearchClient.set(txtSearchClient);
    this.suggestedClients.set([]);
    this.clientsService.getAllAndSearch(1, 1000, true, 'pos' ,txtSearchClient)
        .subscribe({
          next: (resp) => { 
            this.suggestedClients.set(resp.clients.data);
            this.loadingSearchClient.set(false);
          },
          error: (err) => {
            this.loadingSearchClient.set(false);
          }
        });    
  }

  selectClient(client: Client) {
    this.suggestedClients.set([]);
    this.txtSearchClient.set('');
    this.componentService.clearInputSearch$.next(true);
    this.outputService.clientSelect.set({
      id:client.id,
      cod:client.cod,
      full_names:client.full_names,
      number_document:client.number_document,
      razon_social:client.razon_social,
      email:client.email,
      cellphone:client.cellphone,
      business_name:client.business_name,
      address:client.address,
      type:client.type,
      photo:client.photo,
      id_sucursal:client.id_sucursal,
      status:client.status,
      createdAt:client.createdAt,
      updatedAt:client.updatedAt,
    });
  }

  newClient() {
    this.clientsService.isEdit = false;
    this.clientsService.showModal = true;
  }

  suggestedProduct(txtSearchProduct: string){
    if(txtSearchProduct.length==0) {
      this.txtSearchProduct.set('');
      this.suggestedProducts.set([]);
      return;
    }
    this.loadingSearchProduct.set(true);
    this.txtSearchProduct.set(txtSearchProduct);
    this.suggestedProducts.set([]);
    this.productService.getAllAndSearch(1,1000,true,'pos',txtSearchProduct,true,this.formReport.get('id_sucursal')?.value,this.formReport.get('id_storage')?.value)
        .subscribe({
          next: (resp) => {
            this.suggestedProducts.set(resp.products.data);
            this.loadingSearchProduct.set(false);
            if(this.outputService._outputConfig.searchForCode){
              this.addItemCar(this.suggestedProducts()[0]);
              this.componentService.clearInputSearch$.next(true);
            }
          },
          error: (e) => {
            this.loadingSearchProduct.set(false);
          }
        });
  }

  addItemCar(product:Product) {
    if(!this.validateStockAndStorage(product)) return;
    this.outputService.updateDetailSale(product);
    if(this.outputService._outputConfig.clearInputAfterProductSearch){
      this.componentService.clearInputSearch$.next(true);
    }
  }

  addItemCarByViewProduct(product:Product) {
    if(!this.validateStockAndStorage(product)) return;
    this.outputService.updateDetailSale(product);
  }
  addItemCarByCodProduct(product:Product) {
    if(this.outputService._outputConfig.searchForCode){
      if(!this.validateStockAndStorage(product)) return;
      this.addItemCar(product);
      this.componentService.clearInputSearch$.next(false);
    }
  }

  validateStockAndStorage(product:Product) {
    this.formReport.markAllAsTouched();
    if(this.formReport.invalid){
      Swal.fire({ 
        title: 'Ops, Para ingresar productos!', 
        text: `Selecciona una sucursal y un almacén.`,
        icon: 'warning', 
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      })
      return false;
    }
    if(product.total_stock! < 0.1) {
      Swal.fire({ 
        title: 'Ops, Stock insuficiente', 
        text: `No podemos continuar por que no tienes stock, prueba con otra sucursal o almacén.`,
        icon: 'warning', 
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      })
      return false;
    }   
    return true; 
  }

 

  setSelectStorage() {
    const id_storage = this.formReport.get('id_storage')?.value;
    if(id_storage){
      localStorage.setItem('id_storage_pos', id_storage);
    }
    this.outputService.resetOutput();
  }

}
