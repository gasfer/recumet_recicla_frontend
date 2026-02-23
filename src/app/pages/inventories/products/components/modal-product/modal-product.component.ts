import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProductsService } from '../../../services/products.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CategoriesService } from '../../../services/categories.service';
import { UnitsService } from '../../../services/units.service';
import * as dz from 'dropzone';
const Dropzone = (dz as any).default || dz;

@Component({
  selector: 'app-modal-product',
  templateUrl: './modal-product.component.html',
  styles: [
    `@import 'dropzone/dist/dropzone.css';`,
    `.dropzone { border: 2px dashed #adb5bd; border-radius: 10px; background: #f8f9fa; padding: 30px; min-height: 150px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }`,
    `.dropzone:hover { border-color: var(--primary-color, #0d6efd); background: #f1f5f9; }`,
    `.dropzone .dz-message { margin: 0; text-align: center; }`
  ]
})
export class ModalProductComponent implements OnInit, OnDestroy, AfterViewInit {
  validatorsService = inject(ValidatorsService);
  productsService = inject(ProductsService);
  categoriesService = inject(CategoriesService);
  unitsService = inject(UnitsService);
  fb = inject(FormBuilder);
  loading = signal(false);
  decimalLength = signal(this.validatorsService.decimalLength());
  imgPathProd?: string;
  imagenProd?: File;
  imgTempProd: any = null;
  validImgProd: boolean = false;
  @ViewChild('dropzoneElement') dropzoneElement!: ElementRef;
  dropzone!: Dropzone;
  isEditSub$!: Subscription;
  inventariable = signal([
    { name: 'SI', code: true },
    { name: 'NO', code: false },
  ]);
  categories = signal<{ name: string, code: string }[]>([]);
  units = signal<{ name: string, code: string }[]>([]);
  productForm: FormGroup = this.fb.group({
    id: [''],
    cod: ['', [Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(174), this.validatorsService.isSpacesInDynamicTxt]],
    description: ['', [Validators.minLength(4), Validators.maxLength(255)]],
    costo: [0, [Validators.required, Validators.min(0), Validators.max(9999999999999.99)]],
    inventariable: [true],
    id_sucursal: [this.validatorsService.id_sucursal()],
    id_storage: [''],
    stock: [0, [Validators.required, Validators.min(0), Validators.max(9999999999999.99)]],
    id_category: ['', [Validators.required]],
    id_unit: ['', [Validators.required]],
    margen_utilidad: ['', [Validators.required, Validators.min(0)]],
    precio_venta: ['', [Validators.required, Validators.min(0)]],
    img: ['NONE'],
    status: [true]
  });

  ngOnInit(): void {
    this.getAllCategoriesAndUnits();
    this.isEditSub$ = this.productsService.editSubs.subscribe(resp => {
      this.productForm.reset({
        id: resp.id,
        cod: resp.cod,
        name: resp.name,
        description: resp.description,
        costo: resp.costo,
        inventariable: resp.inventariable,
        id_category: resp.category.id.toString(),
        id_unit: resp.unit.id.toString(),
        margen_utilidad: '0',
        id_sucursal: this.validatorsService.id_sucursal(),
        img: resp.img,
        stock: 0,
        precio_venta: resp.costo, //para pasar la validación
        status: resp.status,
      });
      resp.img != 'NONE' ? this.validImgProd = true : this.validImgProd = false;
      this.imgPathProd = resp.img!;
    });
    // Escuchar cambios en los controles costo y precio
    this.productForm.get('margen_utilidad')?.valueChanges.subscribe(() => {
      this.calcularPrecio();
    });
    this.productForm.get('costo')?.valueChanges.subscribe(() => {
      this.calcularPrecio();
    });
    this.productForm.get('precio_venta')?.valueChanges.subscribe(() => {
      this.calcularMargen();
    });
  }

  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }

  ngAfterViewInit(): void {
    if (this.dropzoneElement) {
      (Dropzone as any).autoDiscover = false;
      this.dropzone = new Dropzone(this.dropzoneElement.nativeElement, {
        url: "#",
        autoProcessQueue: false,
        acceptedFiles: "image/*",
        maxFiles: 1,
        createImageThumbnails: false,
        previewsContainer: false,
        dictInvalidFileType: "No puedes subir archivos de este tipo.",
      });

      this.dropzone.on("addedfile", (file: any) => {
        // Simulated event for back-compat
        const simulatedEvent = {
          target: {
            files: [file]
          }
        };
        this.cambiarImgProd(simulatedEvent);
        // Clear queue to allow dragging/replacing easily again
        this.dropzone.removeFile(file);
      });
    }
  }

  newProduct() {
    if (this.productForm.get('stock')?.value > 0) {
      this.productForm.get('id_storage')?.setValidators([Validators.required]);
    } else {
      this.productForm.get('id_storage')?.clearValidators();
    }
    this.productForm.get('id_storage')?.updateValueAndValidity();

    this.productForm.markAllAsTouched();
    if (!this.productForm.valid) return;
    this.loading.set(true);
    this.productsService.postNew(this.productForm.value).subscribe({
      next: (resp) => {
        if (this.imagenProd && this.validImgProd) { //existe imagen a subir
          this.subirImagen(resp.product.id, this.imagenProd!);
        } else {
          this.productsService.save$.next(true);
          this.loading.set(false);
          this.productsService.showModal = false;
        }
      },
      complete: () => {
        Swal.fire({
          title: 'Éxito!',
          text: `Producto nuevo agregado correctamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });
      },
      error: () => this.loading.set(false)
    });
  }

  subirImagen(idProduct: number, file: File) {
    this.productsService.uploadImage(idProduct, file)
      .subscribe({
        complete: () => {
          this.productsService.save$.next(true);
          this.loading.set(false);
          this.productsService.showModal = false;
        },
        error: (e) => {
          Swal.fire({
            title: 'Aviso', text: 'La acción se realizo pero no pudimos subir la imagen intenta nuevamente', icon: 'info',
            showClass: { popup: 'animated animate fadeInDown' },
            customClass: { container: 'swal-alert' },
          });
        },
      });
  }

  editProduct() {
    if (this.productForm.get('stock')?.value > 0) {
      this.productForm.get('id_storage')?.setValidators([Validators.required]);
    } else {
      this.productForm.get('id_storage')?.clearValidators();
    }
    this.productForm.get('id_storage')?.updateValueAndValidity();

    this.productForm.markAllAsTouched();
    if (!this.productForm.valid) return;
    this.loading.set(true);
    this.productsService.putUpdate(this.productForm.value).subscribe({
      complete: () => {
        if (this.imagenProd && this.validImgProd) { //existe imagen a subir
          this.subirImagen(this.productForm.get('id')?.value, this.imagenProd!);
        } else {
          this.productsService.save$.next(true);
          this.loading.set(false);
          this.productsService.showModal = false;
        }
        Swal.fire({
          title: 'Éxito!',
          text: `Producto modificado correctamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });
      },
      error: () => this.loading.set(false)
    });
  }

  getAllCategoriesAndUnits() {
    this.categories.set([]);
    this.units.set([]);
    this.categoriesService.getAllAndSearch(1, 1000, true).subscribe(resp => {
      const formattedCategories = resp.categories.data.map(category => ({
        name: category.name,
        code: category.id!.toString()
      }));
      this.categories.set(formattedCategories);
    });
    this.unitsService.getAllAndSearch(1, 1000, true).subscribe(resp => {
      const formattedUnits = resp.units.data.map(unit => ({
        name: unit.name,
        code: unit.id!.toString()
      }));
      this.units.set(formattedUnits);
    });
  }

  calcularPrecio() {
    const costo = this.productForm.get('costo')?.value;
    const margen = this.productForm.get('margen_utilidad')?.value;
    const precio = this.productsService.calcularPrecio(costo, margen);
    this.productForm.get('precio_venta')?.setValue(precio, { emitEvent: false });
  }

  calcularMargen() {
    const costo = this.productForm.get('costo')?.value;
    const precio = this.productForm.get('precio_venta')?.value;
    const margen = this.productsService.calcularMargen(costo, precio);
    this.productForm.get('margen_utilidad')?.setValue(margen, { emitEvent: false });
  }

  resetModal() {
    this.quitarProdImg();
    this.productForm.reset({
      id: '',
      cod: '',
      name: '',
      description: '',
      costo: 0,
      inventariable: true,
      id_category: '',
      id_sucursal: this.validatorsService.id_sucursal(),
      id_storage: '',
      stock: 0,
      id_unit: '',
      margen_utilidad: '',
      precio_venta: '',
      img: 'NONE',
      status: true,
    });
  }

  quitarProdImg() {
    this.imagenProd = undefined;
    this.imgTempProd = null;
    this.validImgProd = false;
    this.imgPathProd = 'NONE';
    this.productForm.get('img')?.setValue('NONE');
    if (this.dropzone) {
      this.dropzone.removeAllFiles();
    }
  }

  triggerDropzone() {
    if (this.dropzone) {
      this.dropzone.hiddenFileInput?.click();
    }
  }

  cambiarImgProd(event: any) {
    if (event.target.files[0].size > 22214400) {
      Swal.fire({
        customClass: { container: 'swal-alert' },
        title: 'Aviso', text: 'La imagen no puede superar los 20Mb. | Selecciona otra imagen de menor peso',
        icon: 'info', showClass: { popup: 'animated animate fadeInDown' },
      });
      event.target.files = null;
      return;
    }
    this.imagenProd = event.target.files[0];
    if (!this.imagenProd) {
      this.imgTempProd = false;
      return;
    }
    this.validatorsService.compressLoading = true;
    const reader = new FileReader();
    reader.readAsDataURL(this.imagenProd);
    reader.onloadend = (event: any) => {
      this.validatorsService.compressFile(event.target.result, this.imagenProd!).then((imageFile: File) => {
        this.imgTempProd = this.validatorsService.localCompressedURl;
        this.imagenProd = imageFile;
        this.validImgProd = true;

        // Convertir silenciosamente a WEBP antes de subir
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const currentName = imageFile.name;
                const extension = currentName.substring(currentName.lastIndexOf('.'));
                const newFileName = currentName.replace(extension, '.webp');
                this.imagenProd = new File([blob], newFileName, { type: 'image/webp' });
              }
            }, 'image/webp', 0.95); // Alta calidad ya que el peso ya se redujo
          }
        };
        img.src = objectUrl;

      }).catch(err => {
        Swal.fire({
          title: 'Error', text: 'Ocurrió un error al cargar tu imagen, intenta con otra imagen', icon: 'warning',
          customClass: { container: 'swal-alert' },
          showClass: { popup: 'animated animate fadeInDown' },
        });
        this.quitarProdImg();
      });
    }
    this.productForm.get('img')?.setValue('NONE');
  }
}
