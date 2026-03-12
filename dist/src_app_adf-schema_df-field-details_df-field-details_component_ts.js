"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-schema_df-field-details_df-field-details_component_ts"],{

/***/ 11616:
/*!***************************************************************************!*\
  !*** ./src/app/adf-schema/df-field-details/df-field-details.component.ts ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfFieldDetailsComponent: () => (/* binding */ DfFieldDetailsComponent)
/* harmony export */ });
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_radio__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/radio */ 53804);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var src_app_shared_validators_json_validator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/validators/json.validator */ 90124);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _df_function_use_df_function_use_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./df-function-use/df-function-use.component */ 24479);
/* harmony import */ var _validators_csv_validator__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../validators/csv.validator */ 3994);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @angular/material/tooltip */ 80640);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);





























function DfFieldDetailsComponent_mat_error_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "schema.fieldDetailsForm.errors.name"), " ");
  }
}
function DfFieldDetailsComponent_mat_option_28_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-option", 33);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r6 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("value", option_r6);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", option_r6, " ");
  }
}
function DfFieldDetailsComponent_mat_option_93_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-option", 33);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const table_r7 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("value", table_r7.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", table_r7.name, " ");
  }
}
function DfFieldDetailsComponent_mat_option_99_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-option", 33);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const field_r8 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("value", field_r8.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](field_r8.label);
  }
}
function DfFieldDetailsComponent_mat_error_107_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "schema.fieldDetailsForm.errors.json"), " ");
  }
}
function DfFieldDetailsComponent_ng_container_109_mat_error_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "schema.fieldDetailsForm.errors.csv"), " ");
  }
}
function DfFieldDetailsComponent_ng_container_109_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](1, "mat-form-field", 2)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](5, "input", 34);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](6, DfFieldDetailsComponent_ng_container_109_mat_error_6_Template, 3, 3, "mat-error", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](4, 2, "schema.fieldDetailsForm.controls.picklist"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx_r5.fieldDetailsForm.controls["picklist"].hasError("csvInvalid"));
  }
}
class DfFieldDetailsComponent {
  constructor(service, formBuilder, activatedRoute, router, themeService) {
    this.service = service;
    this.formBuilder = formBuilder;
    this.activatedRoute = activatedRoute;
    this.router = router;
    this.themeService = themeService;
    this.faCircleInfo = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_7__.faCircleInfo;
    this.typeDropdownMenuOptions = ['I will manually enter a type', 'id', 'string', 'integer', 'text', 'boolean', 'binary', 'float', 'double', 'decimal', 'datetime', 'date', 'time', 'reference', 'user_id', 'user_id_on_create', 'user_id_on_update', 'timestamp', 'timestamp_on_create', 'timestamp_on_update'];
    this.referenceTableDropdownMenuOptions = [];
    this.referenceFieldDropdownMenuOptions = [];
    this.type = '';
    this.isDarkMode = this.themeService.darkMode$;
    this.fieldDetailsForm = this.formBuilder.group({
      name: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required],
      alias: [''],
      label: [''],
      isVirtual: [false],
      isAggregate: [{
        value: false,
        disabled: true
      }],
      type: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required],
      dbType: [{
        value: '',
        disabled: true
      }],
      length: [],
      precision: [{
        value: '',
        disabled: true
      }],
      scale: [{
        value: 0,
        disabled: true
      }],
      fixedLength: [{
        value: false,
        disabled: true
      }],
      supportsMultibyte: [{
        value: false,
        disabled: true
      }],
      allowNull: [false],
      autoIncrement: [false],
      default: [],
      isIndex: [false],
      isUnique: [false],
      isPrimaryKey: [{
        value: false,
        disabled: true
      }],
      isForeignKey: [false],
      refTable: [{
        value: '',
        disabled: true
      }],
      refField: [{
        value: '',
        disabled: true
      }],
      validation: ['', src_app_shared_validators_json_validator__WEBPACK_IMPORTED_MODULE_0__.JsonValidator],
      dbFunction: this.formBuilder.array([]),
      picklist: ['', _validators_csv_validator__WEBPACK_IMPORTED_MODULE_3__.CsvValidator]
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(data => {
      this.type = data['type'];
    });
    this.dbName = this.activatedRoute.snapshot.params['name'];
    this.tableName = this.activatedRoute.snapshot.params['id'];
    if (this.type === 'edit') {
      this.fieldName = this.activatedRoute.snapshot.params['fieldName'];
    }
    if (this.fieldName) {
      this.service.get(`${this.dbName}/_schema/${this.tableName}/_field/${this.fieldName}`).subscribe(data => {
        this.databaseFieldToEdit = data;
        this.fieldDetailsForm.patchValue({
          name: data.name,
          alias: data.alias,
          label: data.label,
          isVirtual: data.isVirtual,
          isAggregate: data.isAggregate,
          type: data.type,
          dbType: data.dbType,
          length: data.length,
          precision: data.precision,
          scale: data.scale,
          fixedLength: data.fixedLength,
          supportsMultibyte: data.supportsMultibyte,
          allowNull: data.allowNull,
          autoIncrement: data.autoIncrement,
          default: data.default,
          isIndex: data.isIndex,
          isUnique: data.isUnique,
          isPrimaryKey: data.isPrimaryKey,
          isForeignKey: data.isForeignKey,
          refTable: data.refTable,
          refField: data.refField,
          validation: data.validation ?? '',
          picklist: data.picklist
        });
        if (data.dbFunction.length > 0) {
          data.dbFunction.forEach(item => {
            this.fieldDetailsForm.controls['dbFunction'].push(new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormGroup({
              use: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.use, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required),
              function: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.function)
            }));
          });
          this.dbFunctions.updateDataSource();
        }
      });
    }
    this.fieldDetailsForm.get('refTable')?.valueChanges.subscribe(data => {
      if (data) {
        this.service.get(`${this.dbName}/_schema/${data}`).subscribe(data => {
          this.referenceFieldDropdownMenuOptions = data['field'];
          this.enableFormField('refField');
        });
      }
    });
    this.fieldDetailsForm.get('isForeignKey')?.valueChanges.subscribe(data => {
      if (data) {
        this.service.get(`${this.dbName}/_schema`).subscribe(data => {
          this.enableFormField('refTable');
          this.referenceTableDropdownMenuOptions = data['resource'];
        });
      } else {
        this.disableFormField('refTable');
        this.disableFormField('refField');
      }
    });
    this.fieldDetailsForm.get('isVirtual')?.valueChanges.subscribe(data => {
      if (data) {
        this.disableFormField('dbType');
        this.enableFormField('isAggregate');
      } else {
        if (this.fieldDetailsForm.get('type')?.value === this.typeDropdownMenuOptions[0]) this.enableFormField('dbType');
        this.disableFormField('isAggregate');
      }
    });
    this.fieldDetailsForm.get('type')?.valueChanges.subscribe(data => {
      switch (data) {
        case this.typeDropdownMenuOptions[0]:
          if (this.fieldDetailsForm.get('isVirtual')?.value === false) {
            this.enableFormField('dbType');
            this.disableFormField('length');
            this.disableFormField('precision');
            this.disableFormField('scale');
          } else this.disableFormField('dbType');
          this.removeFormField('picklist');
          this.disableFormField('fixedLength');
          this.disableFormField('supportsMultibyte');
          break;
        case 'string':
          this.addFormField('picklist');
          this.disableFormField('dbType');
          this.enableFormField('length');
          this.disableFormField('precision');
          this.disableFormField('scale');
          this.enableFormField('fixedLength');
          this.enableFormField('supportsMultibyte');
          break;
        case 'integer':
          this.addFormField('picklist');
          this.disableFormField('dbType');
          this.enableFormField('length');
          this.disableFormField('precision');
          this.disableFormField('scale');
          this.disableFormField('fixedLength');
          this.disableFormField('supportsMultibyte');
          break;
        case 'text':
        case 'binary':
          this.disableFormField('dbType');
          this.enableFormField('length');
          this.disableFormField('precision');
          this.disableFormField('scale');
          this.removeFormField('picklist');
          this.disableFormField('fixedLength');
          this.disableFormField('supportsMultibyte');
          break;
        case 'float':
        case 'double':
        case 'decimal':
          this.disableFormField('dbType');
          this.disableFormField('length');
          this.enableFormField('precision');
          this.enableFormField('scale', 0);
          this.removeFormField('picklist');
          this.disableFormField('fixedLength');
          this.disableFormField('supportsMultibyte');
          break;
        default:
          this.disableFormField('dbType');
          this.disableFormField('length');
          this.disableFormField('precision');
          this.disableFormField('scale');
          this.removeFormField('picklist');
          this.disableFormField('fixedLength');
          this.disableFormField('supportsMultibyte');
      }
    });
  }
  addFormField(fieldName) {
    this.fieldDetailsForm.addControl(fieldName, this.formBuilder.control(''));
  }
  removeFormField(fieldName) {
    this.fieldDetailsForm.removeControl(fieldName);
  }
  disableFormField(fieldName) {
    this.fieldDetailsForm.controls[fieldName].setValue(null);
    this.fieldDetailsForm.controls[fieldName].disable();
  }
  enableFormField(fieldName, value) {
    if (this.fieldDetailsForm.controls[fieldName].disabled) this.fieldDetailsForm.controls[fieldName].enable();
    if (value) this.fieldDetailsForm.controls[fieldName].setValue(value);
  }
  onSubmit() {
    if (this.fieldDetailsForm.valid) {
      if (this.databaseFieldToEdit) {
        this.service.update(`${this.dbName}/_schema/${this.tableName}/_field`, {
          resource: [this.fieldDetailsForm.value]
        }, {
          snackbarSuccess: 'schema.fieldDetailsForm.updateSuccess',
          snackbarError: 'server'
        }).subscribe(() => {
          this.router.navigate(['../../'], {
            relativeTo: this.activatedRoute
          });
        });
      } else {
        this.service.create({
          resource: [this.fieldDetailsForm.value]
        }, {
          snackbarSuccess: 'schema.fieldDetailsForm.createSuccess',
          snackbarError: 'server'
        }, `${this.dbName}/_schema/${this.tableName}/_field`).subscribe(() => {
          this.router.navigate(['../'], {
            relativeTo: this.activatedRoute
          });
        });
      }
    }
  }
  onCancel() {
    this.router.navigate(['../../'], {
      relativeTo: this.activatedRoute
    });
  }
  static {
    this.ɵfac = function DfFieldDetailsComponent_Factory(t) {
      return new (t || DfFieldDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__.BASE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_9__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_9__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_4__.DfThemeService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdefineComponent"]({
      type: DfFieldDetailsComponent,
      selectors: [["df-field-details"]],
      viewQuery: function DfFieldDetailsComponent_Query(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵviewQuery"](_df_function_use_df_function_use_component__WEBPACK_IMPORTED_MODULE_2__.DfFunctionUseComponent, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵloadQuery"]()) && (ctx.dbFunctions = _t.first);
        }
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵStandaloneFeature"]],
      decls: 116,
      vars: 100,
      consts: [[1, "details-section", 3, "formGroup", "ngSubmit"], [1, "full-width"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "dynamic-width"], ["matInput", "", "formControlName", "name"], [4, "ngIf"], ["matInput", "", "formControlName", "alias"], ["matSuffix", "", 1, "tool-tip-trigger", 3, "icon", "matTooltip"], ["matInput", "", "formControlName", "label"], ["formControlName", "type"], [3, "value", 4, "ngFor", "ngForOf"], ["matInput", "", "formControlName", "dbType"], ["type", "number", "matInput", "", "formControlName", "length"], ["type", "number", "matInput", "", "formControlName", "precision"], ["type", "number", "matInput", "", "formControlName", "scale"], ["matInput", "", "formControlName", "default"], ["color", "primary", "formControlName", "isVirtual", 1, "dynamic-width"], ["color", "primary", "formControlName", "isAggregate", 1, "dynamic-width"], ["color", "primary", "formControlName", "fixedLength", 1, "dynamic-width"], ["color", "primary", "formControlName", "supportsMultibyte", 1, "dynamic-width"], ["color", "primary", "formControlName", "allowNull", 1, "dynamic-width"], ["color", "primary", "formControlName", "autoIncrement", 1, "dynamic-width"], ["color", "primary", "formControlName", "isIndex", 1, "dynamic-width"], ["color", "primary", "formControlName", "isUnique", 1, "dynamic-width"], ["color", "primary", "formControlName", "isPrimaryKey", 1, "dynamic-width"], ["color", "primary", "formControlName", "isForeignKey", 1, "dynamic-width"], ["formControlName", "refTable"], ["formControlName", "refField"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "full-width"], ["matInput", "", "rows", "4", "cols", "6", "formControlName", "validation"], ["formArrayName", "dbFunction", 1, "full-width"], [1, "full-width", "action-bar"], ["type", "button", "mat-flat-button", "", 1, "cancel-btn", 3, "click"], ["mat-flat-button", "", 1, "save-btn"], [3, "value"], ["matInput", "", "formControlName", "picklist"]],
      template: function DfFieldDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "form", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("ngSubmit", function DfFieldDetailsComponent_Template_form_ngSubmit_0_listener() {
            return ctx.onSubmit();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](1, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](2, "div", 1)(3, "mat-form-field", 2)(4, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](6, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](7, "input", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](8, DfFieldDetailsComponent_mat_error_8_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](9, "mat-form-field", 2)(10, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](11);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](12, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](13, "input", 5)(14, "fa-icon", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](15, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](16, "mat-form-field", 2)(17, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](18);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](19, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](20, "input", 7)(21, "fa-icon", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](22, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](23, "mat-form-field", 2)(24, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](25);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](26, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](27, "mat-select", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](28, DfFieldDetailsComponent_mat_option_28_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](29, "fa-icon", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](30, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](31, "mat-form-field", 2)(32, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](33);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](34, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](35, "input", 10)(36, "fa-icon", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](37, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](38, "mat-form-field", 2)(39, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](40);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](41, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](42, "input", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](43, "mat-form-field", 2)(44, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](45);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](46, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](47, "input", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](48, "mat-form-field", 2)(49, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](50);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](51, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](52, "input", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](53, "mat-form-field", 2)(54, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](55);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](56, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](57, "input", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](58, "mat-slide-toggle", 15);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](59);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](60, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](61, "mat-slide-toggle", 16);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](62);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](63, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](64, "mat-slide-toggle", 17);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](65);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](66, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](67, "mat-slide-toggle", 18);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](68);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](69, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](70, "mat-slide-toggle", 19);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](71);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](72, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](73, "mat-slide-toggle", 20);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](74);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](75, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](76, "mat-slide-toggle", 21);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](77);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](78, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](79, "mat-slide-toggle", 22);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](80);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](81, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](82, "mat-slide-toggle", 23);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](83);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](84, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](85, "mat-slide-toggle", 24);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](86);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](87, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](88, "mat-form-field", 2)(89, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](90);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](91, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](92, "mat-select", 25);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](93, DfFieldDetailsComponent_mat_option_93_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](94, "mat-form-field", 2)(95, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](96);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](97, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](98, "mat-select", 26);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](99, DfFieldDetailsComponent_mat_option_99_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](100, "mat-form-field", 27)(101, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](102);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](103, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](104, "textarea", 28)(105, "fa-icon", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](106, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](107, DfFieldDetailsComponent_mat_error_107_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](108, "df-function-use", 29);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](109, DfFieldDetailsComponent_ng_container_109_Template, 7, 4, "ng-container", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](110, "div", 30)(111, "button", 31);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("click", function DfFieldDetailsComponent_Template_button_click_111_listener() {
            return ctx.onCancel();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](112, " Cancel ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](113, "button", 32);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](114);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](115, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](1, 42, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("formGroup", ctx.fieldDetailsForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](6, 44, "schema.fieldDetailsForm.controls.name"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.fieldDetailsForm.controls["name"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](12, 46, "schema.fieldDetailsForm.controls.alias.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("icon", ctx.faCircleInfo)("matTooltip", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](15, 48, "schema.fieldDetailsForm.controls.alias.tooltip"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](19, 50, "schema.fieldDetailsForm.controls.label.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("icon", ctx.faCircleInfo)("matTooltip", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](22, 52, "schema.fieldDetailsForm.controls.label.tooltip"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](26, 54, "schema.fieldDetailsForm.controls.type.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngForOf", ctx.typeDropdownMenuOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("icon", ctx.faCircleInfo)("matTooltip", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](30, 56, "schema.fieldDetailsForm.controls.type.tooltip"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](34, 58, "schema.fieldDetailsForm.controls.databaseType.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("icon", ctx.faCircleInfo)("matTooltip", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](37, 60, "schema.fieldDetailsForm.controls.databaseType.tooltip"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](41, 62, "schema.fieldDetailsForm.controls.length"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](46, 64, "schema.fieldDetailsForm.controls.precision"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](51, 66, "schema.fieldDetailsForm.controls.scale"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](56, 68, "schema.fieldDetailsForm.controls.defaultValue"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](60, 70, "schema.fieldDetailsForm.controls.isVirtual"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](63, 72, "schema.fieldDetailsForm.controls.isAggregate"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](66, 74, "schema.fieldDetailsForm.controls.fixedLength"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](69, 76, "schema.fieldDetailsForm.controls.supportsMultibyte"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](72, 78, "schema.fieldDetailsForm.controls.allowNull"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](75, 80, "schema.fieldDetailsForm.controls.autoIncrement"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](78, 82, "schema.fieldDetailsForm.controls.isIndex"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](81, 84, "schema.fieldDetailsForm.controls.isUnique"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](84, 86, "schema.fieldDetailsForm.controls.isPrimaryKey"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](87, 88, "schema.fieldDetailsForm.controls.isForeignKey"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](91, 90, "schema.fieldDetailsForm.controls.refTable"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngForOf", ctx.referenceTableDropdownMenuOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](97, 92, "schema.fieldDetailsForm.controls.refField"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngForOf", ctx.referenceFieldDropdownMenuOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](103, 94, "schema.fieldDetailsForm.controls.validation.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("icon", ctx.faCircleInfo)("matTooltip", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](106, 96, "schema.fieldDetailsForm.controls.validation.tooltip"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.fieldDetailsForm.controls["validation"].hasError("jsonInvalid"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.fieldDetailsForm.controls["picklist"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](115, 98, ctx.databaseFieldToEdit ? "save" : "create"), " ");
        }
      },
      dependencies: [_df_function_use_df_function_use_component__WEBPACK_IMPORTED_MODULE_2__.DfFunctionUseComponent, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_8__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_8__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.NumberValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormArrayName, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_10__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_10__.MatSlideToggle, _angular_common__WEBPACK_IMPORTED_MODULE_11__.NgIf, _angular_material_radio__WEBPACK_IMPORTED_MODULE_12__.MatRadioModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_13__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_13__.MatButton, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_14__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_14__.FaIconComponent, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatError, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatSuffix, _angular_material_input__WEBPACK_IMPORTED_MODULE_16__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_16__.MatInput, _angular_material_select__WEBPACK_IMPORTED_MODULE_17__.MatSelectModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_17__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_18__.MatOption, _angular_common__WEBPACK_IMPORTED_MODULE_11__.NgFor, _angular_common__WEBPACK_IMPORTED_MODULE_11__.AsyncPipe, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_19__.TranslocoPipe, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_20__.MatTooltipModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_20__.MatTooltip],
      styles: ["form[_ngcontent-%COMP%]   .mat-mdc-form-field[_ngcontent-%COMP%] {\n  padding-bottom: 10px;\n}\nform[_ngcontent-%COMP%]   .slide-toggle-container[_ngcontent-%COMP%] {\n  display: grid;\n  margin-bottom: 1rem;\n}\nform[_ngcontent-%COMP%]   .slide-toggle-container[_ngcontent-%COMP%]   .mat-mdc-slide-toggle[_ngcontent-%COMP%] {\n  padding-bottom: 10px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLXNjaGVtYS9kZi1maWVsZC1kZXRhaWxzL2RmLWZpZWxkLWRldGFpbHMuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0U7RUFDRSxvQkFBQTtBQUFKO0FBR0U7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7QUFESjtBQUdJO0VBQ0Usb0JBQUE7QUFETiIsInNvdXJjZXNDb250ZW50IjpbImZvcm0ge1xuICAubWF0LW1kYy1mb3JtLWZpZWxkIHtcbiAgICBwYWRkaW5nLWJvdHRvbTogMTBweDtcbiAgfVxuXG4gIC5zbGlkZS10b2dnbGUtY29udGFpbmVyIHtcbiAgICBkaXNwbGF5OiBncmlkO1xuICAgIG1hcmdpbi1ib3R0b206IDFyZW07XG5cbiAgICAubWF0LW1kYy1zbGlkZS10b2dnbGUge1xuICAgICAgcGFkZGluZy1ib3R0b206IDEwcHg7XG4gICAgfVxuICB9XG59XG4iXSwic291cmNlUm9vdCI6IiJ9 */"]
    });
  }
}

/***/ }),

/***/ 24479:
/*!******************************************************************************************!*\
  !*** ./src/app/adf-schema/df-field-details/df-function-use/df-function-use.component.ts ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfFunctionUseComponent: () => (/* binding */ DfFunctionUseComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_expansion__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/expansion */ 19322);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _angular_material_table__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/material/table */ 77697);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/tooltip */ 80640);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/core */ 74646);


























function DfFunctionUseComponent_mat_accordion_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-accordion")(1, "mat-expansion-panel")(2, "mat-expansion-panel-header")(3, "mat-panel-title");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](5, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](6, "fa-icon", 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](7, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "mat-panel-description");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](10, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainer"](11, 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    const _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵreference"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](5, 5, "schema.fieldDetailsForm.controls.dbFunctionTitle"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r0.faCircleInfo)("matTooltip", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](7, 7, "schema.fieldDetailsForm.controls.dfFunctionTooltip"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](10, 9, "schema.fieldDetailsForm.controls.dbFunctionUseDescription"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngTemplateOutlet", _r1);
  }
}
function DfFunctionUseComponent_ng_template_2_mat_header_cell_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-header-cell");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 1, "use"), " ");
  }
}
function DfFunctionUseComponent_ng_template_2_mat_cell_5_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-option", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r15 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("value", option_r15.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"]("", option_r15.name, " ");
  }
}
function DfFunctionUseComponent_ng_template_2_mat_cell_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-cell", 17)(1, "mat-form-field", 18)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "mat-select", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](6, DfFunctionUseComponent_ng_template_2_mat_cell_5_mat_option_6_Template, 2, 2, "mat-option", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const i_r13 = ctx.index;
    const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("formGroupName", i_r13);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](4, 3, "use"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx_r4.functionUsesDropdownOptions);
  }
}
function DfFunctionUseComponent_ng_template_2_mat_header_cell_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-header-cell");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 1, "function"), " ");
  }
}
function DfFunctionUseComponent_ng_template_2_mat_cell_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-cell", 17)(1, "mat-form-field", 18)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](5, "input", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r17 = ctx.index;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("formGroupName", i_r17);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](4, 2, "function"));
  }
}
function DfFunctionUseComponent_ng_template_2_mat_header_cell_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-header-cell")(1, "button", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfFunctionUseComponent_ng_template_2_mat_header_cell_10_Template_button_click_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r19);
      const ctx_r18 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r18.add());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](3, "fa-icon", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("aria-label", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 2, "newEntry"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r7.faPlus);
  }
}
const _c0 = function (a0) {
  return {
    id: a0
  };
};
function DfFunctionUseComponent_ng_template_2_mat_cell_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-cell")(1, "button", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfFunctionUseComponent_ng_template_2_mat_cell_11_Template_button_click_1_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r23);
      const i_r21 = restoredCtx.index;
      const ctx_r22 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r22.remove(i_r21));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](3, "fa-icon", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r21 = ctx.index;
    const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("aria-label", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind2"](2, 2, "deleteRow", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpureFunction1"](5, _c0, i_r21)));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r8.faTrashCan);
  }
}
function DfFunctionUseComponent_ng_template_2_mat_header_row_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "mat-header-row");
  }
}
function DfFunctionUseComponent_ng_template_2_mat_row_13_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "mat-row");
  }
}
function DfFunctionUseComponent_ng_template_2_tr_14_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "tr", 27)(1, "td", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](3, 1, "schema.fieldDetailsForm.controls.noDbFunctions"), " ");
  }
}
function DfFunctionUseComponent_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](0, 5)(1, 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "mat-table", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](3, 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](4, DfFunctionUseComponent_ng_template_2_mat_header_cell_4_Template, 3, 3, "mat-header-cell", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](5, DfFunctionUseComponent_ng_template_2_mat_cell_5_Template, 7, 5, "mat-cell", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](6, 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](7, DfFunctionUseComponent_ng_template_2_mat_header_cell_7_Template, 3, 3, "mat-header-cell", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](8, DfFunctionUseComponent_ng_template_2_mat_cell_8_Template, 6, 4, "mat-cell", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](9, 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](10, DfFunctionUseComponent_ng_template_2_mat_header_cell_10_Template, 4, 4, "mat-header-cell", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](11, DfFunctionUseComponent_ng_template_2_mat_cell_11_Template, 4, 7, "mat-cell", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](12, DfFunctionUseComponent_ng_template_2_mat_header_row_12_Template, 1, 0, "mat-header-row", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](13, DfFunctionUseComponent_ng_template_2_mat_row_13_Template, 1, 0, "mat-row", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](14, DfFunctionUseComponent_ng_template_2_tr_14_Template, 4, 3, "tr", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]()();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("formGroup", ctx_r2.rootForm);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("dataSource", ctx_r2.dataSource);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matHeaderRowDef", ctx_r2.displayedColumns);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matRowDefColumns", ctx_r2.displayedColumns);
  }
}
let DfFunctionUseComponent = class DfFunctionUseComponent {
  constructor(rootFormGroup) {
    this.rootFormGroup = rootFormGroup;
    this.displayedColumns = ['use', 'function', 'actions'];
    this.faTrashCan = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faTrashCan;
    this.faPlus = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faPlus;
    this.faCircleInfo = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faCircleInfo;
    this.showAccordion = true;
    this.functionUsesDropdownOptions = [{
      name: 'SELECT (GET)',
      value: 'SELECT'
    }, {
      name: 'FILTER (GET)',
      value: 'FILTER'
    }, {
      name: 'INSERT (POST)',
      value: 'INSERT'
    }, {
      name: 'UPDATE (PATCH)',
      value: 'UPDATE'
    }];
  }
  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit.subscribe(() => {
      this.keys.markAllAsTouched();
    });
    this.keys = this.rootForm.get('dbFunction');
    this.updateDataSource();
  }
  updateDataSource() {
    this.dataSource = new _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatTableDataSource(this.keys.controls);
  }
  add() {
    this.keys.push(new _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormGroup({
      use: new _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControl([''], _angular_forms__WEBPACK_IMPORTED_MODULE_3__.Validators.required),
      function: new _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControl('')
    }));
    this.updateDataSource();
  }
  remove(index) {
    this.keys.removeAt(index);
    this.updateDataSource();
  }
  static {
    this.ɵfac = function DfFunctionUseComponent_Factory(t) {
      return new (t || DfFunctionUseComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormGroupDirective));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DfFunctionUseComponent,
      selectors: [["df-function-use"]],
      inputs: {
        showAccordion: "showAccordion"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      decls: 4,
      vars: 2,
      consts: [[1, "keys-accordion"], [4, "ngIf", "ngIfElse"], ["dbFunctionUse", ""], ["matSuffix", "", 1, "tool-tip-trigger", 3, "icon", "matTooltip"], [3, "ngTemplateOutlet"], [3, "formGroup"], ["formArrayName", "dbFunction"], [3, "dataSource"], ["matColumnDef", "use"], [4, "matHeaderCellDef"], [3, "formGroupName", 4, "matCellDef"], ["matColumnDef", "function"], ["matColumnDef", "actions", "stickyEnd", ""], [4, "matCellDef"], [4, "matHeaderRowDef"], [4, "matRowDef", "matRowDefColumns"], ["class", "mat-row", 4, "matNoDataRow"], [3, "formGroupName"], ["subscriptSizing", "dynamic"], ["formControlName", "use", "multiple", ""], [3, "value", 4, "ngFor", "ngForOf"], [3, "value"], ["matInput", "", "formControlName", "function"], ["mat-mini-fab", "", "color", "primary", "type", "button", 3, "click"], ["size", "xl", 3, "icon"], ["mat-icon-button", "", "type", "button", 3, "click"], ["size", "xs", 3, "icon"], [1, "mat-row"], ["colspan", "4", 1, "mat-cell"]],
      template: function DfFunctionUseComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, DfFunctionUseComponent_mat_accordion_1_Template, 12, 11, "mat-accordion", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](2, DfFunctionUseComponent_ng_template_2_Template, 15, 4, "ng-template", null, 2, _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplateRefExtractor"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
        if (rf & 2) {
          const _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵreference"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.showAccordion)("ngIfElse", _r1);
        }
      },
      dependencies: [_angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormGroupName, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormArrayName, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgFor, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgTemplateOutlet, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_5__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_5__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_5__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_5__.MatSuffix, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatIconButton, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatMiniFabButton, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatTableModule, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatTable, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatHeaderCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatHeaderRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatColumnDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatHeaderCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatHeaderRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatNoDataRow, _angular_material_input__WEBPACK_IMPORTED_MODULE_7__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_7__.MatInput, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_8__.MatSlideToggleModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_9__.MatSelectModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_9__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_10__.MatOption, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_11__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_11__.FaIconComponent, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_12__.MatExpansionModule, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_12__.MatAccordion, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_12__.MatExpansionPanel, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_12__.MatExpansionPanelHeader, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_12__.MatExpansionPanelTitle, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_12__.MatExpansionPanelDescription, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_13__.TranslocoPipe, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_14__.MatTooltipModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_14__.MatTooltip],
      styles: ["/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfFunctionUseComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_15__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_16__.UntilDestroy)({
  checkProperties: true
})], DfFunctionUseComponent);

/***/ }),

/***/ 3994:
/*!********************************************************!*\
  !*** ./src/app/adf-schema/validators/csv.validator.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CsvValidator: () => (/* binding */ CsvValidator)
/* harmony export */ });
function CsvValidator(control) {
  if (control.value && control.value.length > 0) {
    const regex = /^\w+(?:\s*,\s*\w+)*$/;
    const isCsv = regex.test(control.value);
    if (!isCsv) return {
      csvInvalid: true
    };
  }
  return null;
}

/***/ })

}]);
//# sourceMappingURL=src_app_adf-schema_df-field-details_df-field-details_component_ts.js.map