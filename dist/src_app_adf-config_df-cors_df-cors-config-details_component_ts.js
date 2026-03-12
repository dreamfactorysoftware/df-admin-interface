"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-config_df-cors_df-cors-config-details_component_ts"],{

/***/ 30615:
/*!************************************************************************!*\
  !*** ./src/app/adf-config/df-cors/df-cors-config-details.component.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfCorsConfigDetailsComponent: () => (/* binding */ DfCorsConfigDetailsComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/checkbox */ 97024);
/* harmony import */ var src_app_shared_components_df_verb_picker_df_verb_picker_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/components/df-verb-picker/df-verb-picker.component */ 9709);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var src_app_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);

























const _c0 = function (a0) {
  return {
    label: a0
  };
};
let DfCorsConfigDetailsComponent = class DfCorsConfigDetailsComponent {
  constructor(corsConfigService, router, activatedRoute, formBuilder, themeService) {
    this.corsConfigService = corsConfigService;
    this.router = router;
    this.activatedRoute = activatedRoute;
    this.formBuilder = formBuilder;
    this.themeService = themeService;
    this.allMethodsSelected = false;
    this.type = 'create';
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.isDarkMode = this.themeService.darkMode$;
    this.corsForm = this.formBuilder.group({
      path: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      description: [''],
      origins: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      headers: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      exposedHeaders: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      maxAge: [0, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      methods: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      credentials: [true],
      enabled: [true]
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(data => {
      this.type = data['type'];
      if (this.type === 'edit') {
        this.corsConfigToEdit = data['data'];
        this.corsForm.setValue({
          path: this.corsConfigToEdit.path,
          description: this.corsConfigToEdit.description,
          origins: this.corsConfigToEdit.origin,
          headers: this.corsConfigToEdit.header,
          exposedHeaders: this.corsConfigToEdit.exposedHeader,
          maxAge: this.corsConfigToEdit.maxAge,
          methods: this.corsConfigToEdit.method,
          credentials: this.corsConfigToEdit.supportsCredentials,
          enabled: this.corsConfigToEdit.enabled
        });
        if (this.corsConfigToEdit.method.length === 5) this.allMethodsSelected = true;
      }
    });
  }
  triggerAlert(type, msg) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }
  assemblePayload() {
    const payload = {
      path: this.corsForm.value.path,
      description: this.corsForm.value.description,
      origin: this.corsForm.value.origins,
      header: this.corsForm.value.headers,
      exposedHeader: this.corsForm.value.exposedHeaders,
      maxAge: this.corsForm.value.maxAge,
      method: this.corsForm.value.methods,
      supportsCredentials: this.corsForm.value.credentials,
      enabled: this.corsForm.value.enabled
    };
    if (this.corsConfigToEdit) {
      return {
        ...payload,
        createdById: this.corsConfigToEdit.createdById,
        createdDate: this.corsConfigToEdit.createdDate,
        lastModifiedById: this.corsConfigToEdit.lastModifiedById,
        lastModifiedDate: this.corsConfigToEdit.lastModifiedDate
      };
    }
    return payload;
  }
  onSubmit() {
    if (this.corsForm.valid) {
      if (!this.corsConfigToEdit) {
        const payload = this.assemblePayload();
        // create mode
        this.corsConfigService.create({
          resource: [payload]
        }, {
          fields: '*',
          snackbarSuccess: 'cors.alerts.createSuccess'
        }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_6__.catchError)(err => {
          this.triggerAlert('error', err.error.error.context.resource[0].message);
          return (0,rxjs__WEBPACK_IMPORTED_MODULE_7__.throwError)(() => new Error(err));
        })).subscribe(res => {
          this.router.navigate(['../', res.resource[0].id], {
            relativeTo: this.activatedRoute
          });
        });
      } else {
        // edit mode
        const payload = this.assemblePayload();
        this.corsConfigService.update(this.corsConfigToEdit.id, payload, {
          snackbarSuccess: 'cors.alerts.updateSuccess'
        }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_6__.catchError)(err => {
          this.triggerAlert('error', err.error.error.message);
          return (0,rxjs__WEBPACK_IMPORTED_MODULE_7__.throwError)(() => new Error(err));
        })).subscribe(res => {
          this.router.navigate(['../', res.id], {
            relativeTo: this.activatedRoute
          });
        });
      }
    }
  }
  onCancel() {
    this.router.navigate(['../'], {
      relativeTo: this.activatedRoute
    });
  }
  static {
    this.ɵfac = function DfCorsConfigDetailsComponent_Factory(t) {
      return new (t || DfCorsConfigDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__.CONFIG_CORS_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_9__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_9__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__.DfThemeService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdefineComponent"]({
      type: DfCorsConfigDetailsComponent,
      selectors: [["df-cors-config-details"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵStandaloneFeature"]],
      decls: 53,
      vars: 46,
      consts: [[3, "showAlert", "alertType", "alertClosed"], [1, "df-cors-config-container"], [1, "details-section", 3, "formGroup", "ngSubmit"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "dynamic-width"], ["matInput", "", "type", "url", "formControlName", "path"], ["matInput", "", "type", "text", "formControlName", "origins"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "full-width"], ["rows", "1", "matInput", "", "type", "text", "formControlName", "description"], ["matInput", "", "type", "text", "formControlName", "headers"], ["matInput", "", "type", "text", "formControlName", "exposedHeaders"], ["matInput", "", "type", "number", "formControlName", "maxAge"], ["formControlName", "methods", "type", "verb_multiple", 1, "dynamic-width", 3, "schema"], ["color", "primary", "formControlName", "credentials", 1, "dynamic-width"], ["color", "primary", "formControlName", "enabled", 1, "dynamic-width"], [1, "full-width", "action-bar"], ["type", "button", "mat-flat-button", "", 1, "cancel-btn", 3, "click"], ["mat-flat-button", "", "color", "primary", "type", "submit", 1, "save-btn"]],
      template: function DfCorsConfigDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](0, "df-alert", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("alertClosed", function DfCorsConfigDetailsComponent_Template_df_alert_alertClosed_0_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](2, "div", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](3, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](4, "h4");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](6, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](7, "form", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("ngSubmit", function DfCorsConfigDetailsComponent_Template_form_ngSubmit_7_listener() {
            return ctx.onSubmit();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](8, "mat-form-field", 3)(9, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](10);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](11, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](12, "input", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](13, "mat-form-field", 3)(14, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](15);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](16, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](17, "input", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](18, "mat-form-field", 6)(19, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](20);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](21, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](22, "textarea", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](23, "mat-form-field", 3)(24, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](25);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](26, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](27, "input", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](28, "mat-form-field", 3)(29, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](30);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](31, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](32, "input", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](33, "mat-form-field", 3)(34, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](35);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](36, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](37, "input", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](38, "df-verb-picker", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](39, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](40, "mat-slide-toggle", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](41);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](42, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](43, "mat-slide-toggle", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](44);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](45, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](46, "div", 14)(47, "button", 15);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("click", function DfCorsConfigDetailsComponent_Template_button_click_47_listener() {
            return ctx.onCancel();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](48);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](49, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](50, "button", 16);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](51);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](52, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]()()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", ctx.alertMsg, "\n");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](3, 18, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](6, 20, "cors.pageSubtitle"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("formGroup", ctx.corsForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](11, 22, "cors.formControls.path"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](16, 24, "cors.formControls.origins"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](21, 26, "cors.formControls.description"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](26, 28, "cors.formControls.headers"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](31, 30, "cors.formControls.exposedHeaders"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](36, 32, "cors.formControls.maxAge"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("schema", _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpureFunction1"](44, _c0, _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](39, 34, "cors.formControls.methods")));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](42, 36, "cors.formControls.supportsCredentials"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](45, 38, "cors.formControls.enabled"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](49, 40, "cancel"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](52, 42, ctx.type === "create" ? "create" : "update"), " ");
        }
      },
      dependencies: [_angular_forms__WEBPACK_IMPORTED_MODULE_5__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_5__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_5__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NumberValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormsModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatLabel, _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_11__.MatCheckboxModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_12__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_12__.MatInput, _angular_material_select__WEBPACK_IMPORTED_MODULE_13__.MatSelectModule, _angular_material_core__WEBPACK_IMPORTED_MODULE_14__.MatOptionModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_15__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_15__.MatSlideToggle, _angular_material_button__WEBPACK_IMPORTED_MODULE_16__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_16__.MatButton, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_17__.TranslocoPipe, src_app_shared_components_df_verb_picker_df_verb_picker_component__WEBPACK_IMPORTED_MODULE_1__.DfVerbPickerComponent, src_app_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_2__.DfAlertComponent, _angular_common__WEBPACK_IMPORTED_MODULE_18__.AsyncPipe],
      encapsulation: 2
    });
  }
};
DfCorsConfigDetailsComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_19__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_20__.UntilDestroy)({
  checkProperties: true
})], DfCorsConfigDetailsComponent);

/***/ }),

/***/ 51425:
/*!******************************************************************!*\
  !*** ./src/app/shared/components/df-alert/df-alert.component.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfAlertComponent: () => (/* binding */ DfAlertComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);








function DfAlertComponent_div_0_button_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "button", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfAlertComponent_div_0_button_4_Template_button_click_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r3);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r2.dismissAlert());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "fa-icon", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r1.faXmark);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"]("alerts.close");
  }
}
function DfAlertComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "fa-icon", 2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "span", 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](4, DfAlertComponent_div_0_button_4_Template, 3, 2, "button", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassMap"](ctx_r0.alertType);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r0.icon);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r0.dismissible);
  }
}
const _c0 = ["*"];
class DfAlertComponent {
  constructor() {
    this.alertType = 'success';
    this.showAlert = false;
    this.dismissible = true;
    this.alertClosed = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this.faXmark = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faXmark;
  }
  dismissAlert() {
    this.alertClosed.emit();
  }
  get icon() {
    switch (this.alertType) {
      case 'success':
        return _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faCheckCircle;
      case 'error':
        return _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faXmarkCircle;
      case 'warning':
        return _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faExclamationCircle;
      case 'info':
        return _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faInfoCircle;
      default:
        return _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faInfoCircle;
    }
  }
  static {
    this.ɵfac = function DfAlertComponent_Factory(t) {
      return new (t || DfAlertComponent)();
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DfAlertComponent,
      selectors: [["df-alert"]],
      inputs: {
        alertType: "alertType",
        showAlert: "showAlert",
        dismissible: "dismissible"
      },
      outputs: {
        alertClosed: "alertClosed"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      ngContentSelectors: _c0,
      decls: 1,
      vars: 1,
      consts: [["class", "alert-container", 3, "class", 4, "ngIf"], [1, "alert-container"], ["aria-hidden", "true", 1, "alert-icon", 3, "icon"], ["role", "alert", 1, "alert-message"], ["mat-icon-button", "", "class", "dismiss-alert", 3, "click", 4, "ngIf"], ["mat-icon-button", "", 1, "dismiss-alert", 3, "click"], [3, "icon"]],
      template: function DfAlertComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojectionDef"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](0, DfAlertComponent_div_0_Template, 5, 4, "div", 0);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.showAlert);
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_2__.NgIf, _angular_material_button__WEBPACK_IMPORTED_MODULE_3__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_3__.MatIconButton, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_4__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_4__.FaIconComponent],
      styles: [".alert-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  justify-content: space-between;\n  border: 1px solid;\n  border-radius: 5px;\n  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.2);\n  color: black;\n}\n.alert-container[_ngcontent-%COMP%]   .alert-message[_ngcontent-%COMP%] {\n  flex: 1;\n  padding: 8px;\n}\n.alert-container[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%] {\n  padding: 0 10px;\n}\n.alert-container.success[_ngcontent-%COMP%] {\n  border-color: #81c784;\n  background-color: #c8e6c9;\n}\n.alert-container.success[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%] {\n  color: #4caf50;\n}\n.alert-container.error[_ngcontent-%COMP%] {\n  border-color: #e57373;\n  background-color: #ffcdd2;\n}\n.alert-container.error[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%] {\n  color: #f44336;\n}\n.alert-container.warning[_ngcontent-%COMP%] {\n  border-color: #ffb74d;\n  background-color: #ffe0b2;\n}\n.alert-container.warning[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%] {\n  color: #ff9800;\n}\n.alert-container.info[_ngcontent-%COMP%] {\n  border-color: #64b5f6;\n  background-color: #bbdefb;\n}\n.alert-container.info[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%] {\n  color: #2196f3;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtYWxlcnQvZGYtYWxlcnQuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBT0E7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSxtQkFBQTtFQUNBLDhCQUFBO0VBQ0EsaUJBQUE7RUFDQSxrQkFBQTtFQUNBLHdDQUFBO0VBQ0EsWUFBQTtBQU5GO0FBUUU7RUFDRSxPQUFBO0VBQ0EsWUFBQTtBQU5KO0FBUUU7RUFDRSxlQUFBO0FBTko7QUFRRTtFQUNFLHFCQUFBO0VBQ0EseUJBQUE7QUFOSjtBQU9JO0VBQ0UsY0FBQTtBQUxOO0FBUUU7RUFDRSxxQkFBQTtFQUNBLHlCQUFBO0FBTko7QUFPSTtFQUNFLGNBQUE7QUFMTjtBQVFFO0VBQ0UscUJBQUE7RUFDQSx5QkFBQTtBQU5KO0FBT0k7RUFDRSxjQUFBO0FBTE47QUFRRTtFQUNFLHFCQUFBO0VBQ0EseUJBQUE7QUFOSjtBQU9JO0VBQ0UsY0FBQTtBQUxOIiwic291cmNlc0NvbnRlbnQiOlsiQHVzZSAnQGFuZ3VsYXIvbWF0ZXJpYWwnIGFzIG1hdDtcblxuJGdyZWVuLXBhbGV0dGU6IG1hdC5kZWZpbmUtcGFsZXR0ZShtYXQuJGdyZWVuLXBhbGV0dGUpO1xuJHJlZC1wYWxldHRlOiBtYXQuZGVmaW5lLXBhbGV0dGUobWF0LiRyZWQtcGFsZXR0ZSk7XG4kb3JhbmdlLXBhbGV0dGU6IG1hdC5kZWZpbmUtcGFsZXR0ZShtYXQuJG9yYW5nZS1wYWxldHRlKTtcbiRibHVlLXBhbGV0dGU6IG1hdC5kZWZpbmUtcGFsZXR0ZShtYXQuJGJsdWUtcGFsZXR0ZSk7XG5cbi5hbGVydC1jb250YWluZXIge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGJvcmRlcjogMXB4IHNvbGlkO1xuICBib3JkZXItcmFkaXVzOiA1cHg7XG4gIGJveC1zaGFkb3c6IDAgMCA1cHggMCByZ2JhKDAsIDAsIDAsIDAuMik7XG4gIGNvbG9yOiBibGFjaztcblxuICAuYWxlcnQtbWVzc2FnZSB7XG4gICAgZmxleDogMTtcbiAgICBwYWRkaW5nOiA4cHg7XG4gIH1cbiAgLmFsZXJ0LWljb24ge1xuICAgIHBhZGRpbmc6IDAgMTBweDtcbiAgfVxuICAmLnN1Y2Nlc3Mge1xuICAgIGJvcmRlci1jb2xvcjogbWF0LmdldC1jb2xvci1mcm9tLXBhbGV0dGUoJGdyZWVuLXBhbGV0dGUsIDMwMCk7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogbWF0LmdldC1jb2xvci1mcm9tLXBhbGV0dGUoJGdyZWVuLXBhbGV0dGUsIDEwMCk7XG4gICAgLmFsZXJ0LWljb24ge1xuICAgICAgY29sb3I6IG1hdC5nZXQtY29sb3ItZnJvbS1wYWxldHRlKCRncmVlbi1wYWxldHRlLCA1MDApO1xuICAgIH1cbiAgfVxuICAmLmVycm9yIHtcbiAgICBib3JkZXItY29sb3I6IG1hdC5nZXQtY29sb3ItZnJvbS1wYWxldHRlKCRyZWQtcGFsZXR0ZSwgMzAwKTtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBtYXQuZ2V0LWNvbG9yLWZyb20tcGFsZXR0ZSgkcmVkLXBhbGV0dGUsIDEwMCk7XG4gICAgLmFsZXJ0LWljb24ge1xuICAgICAgY29sb3I6IG1hdC5nZXQtY29sb3ItZnJvbS1wYWxldHRlKCRyZWQtcGFsZXR0ZSwgNTAwKTtcbiAgICB9XG4gIH1cbiAgJi53YXJuaW5nIHtcbiAgICBib3JkZXItY29sb3I6IG1hdC5nZXQtY29sb3ItZnJvbS1wYWxldHRlKCRvcmFuZ2UtcGFsZXR0ZSwgMzAwKTtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiBtYXQuZ2V0LWNvbG9yLWZyb20tcGFsZXR0ZSgkb3JhbmdlLXBhbGV0dGUsIDEwMCk7XG4gICAgLmFsZXJ0LWljb24ge1xuICAgICAgY29sb3I6IG1hdC5nZXQtY29sb3ItZnJvbS1wYWxldHRlKCRvcmFuZ2UtcGFsZXR0ZSwgNTAwKTtcbiAgICB9XG4gIH1cbiAgJi5pbmZvIHtcbiAgICBib3JkZXItY29sb3I6IG1hdC5nZXQtY29sb3ItZnJvbS1wYWxldHRlKCRibHVlLXBhbGV0dGUsIDMwMCk7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogbWF0LmdldC1jb2xvci1mcm9tLXBhbGV0dGUoJGJsdWUtcGFsZXR0ZSwgMTAwKTtcbiAgICAuYWxlcnQtaWNvbiB7XG4gICAgICBjb2xvcjogbWF0LmdldC1jb2xvci1mcm9tLXBhbGV0dGUoJGJsdWUtcGFsZXR0ZSwgNTAwKTtcbiAgICB9XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
}

/***/ })

}]);
//# sourceMappingURL=src_app_adf-config_df-cors_df-cors-config-details_component_ts.js.map