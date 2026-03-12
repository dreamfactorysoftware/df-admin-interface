"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-limits_df-limit-details_df-limit-details_component_ts"],{

/***/ 19709:
/*!***************************************************************************!*\
  !*** ./src/app/adf-limits/df-limit-details/df-limit-details.component.ts ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfLimitDetailsComponent: () => (/* binding */ DfLimitDetailsComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var src_app_shared_components_df_verb_picker_df_verb_picker_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/components/df-verb-picker/df-verb-picker.component */ 9709);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);
/* harmony import */ var src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/app/shared/services/df-snackbar.service */ 75680);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);





























function DfLimitDetailsComponent_ng_container_52_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-option", 32);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const service_r5 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("value", service_r5.id);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", service_r5.name, " ");
  }
}
function DfLimitDetailsComponent_ng_container_52_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](1, "mat-form-field", 2)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](5, "mat-select", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](6, DfLimitDetailsComponent_ng_container_52_mat_option_6_Template, 2, 2, "mat-option", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](4, 2, "limits.service"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngForOf", ctx_r0.serviceDropdownOptions);
  }
}
function DfLimitDetailsComponent_ng_container_53_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-option", 32);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const role_r7 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("value", role_r7.id);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", role_r7.name, " ");
  }
}
function DfLimitDetailsComponent_ng_container_53_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](1, "mat-form-field", 2)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](5, "mat-select", 33);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](6, DfLimitDetailsComponent_ng_container_53_mat_option_6_Template, 2, 2, "mat-option", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](4, 2, "limits.role"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngForOf", ctx_r1.roleDropdownOptions);
  }
}
function DfLimitDetailsComponent_ng_container_54_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-option", 32);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const user_r9 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("value", user_r9.id);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", user_r9.name, " ");
  }
}
function DfLimitDetailsComponent_ng_container_54_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](1, "mat-form-field", 2)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](5, "mat-select", 34);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](6, DfLimitDetailsComponent_ng_container_54_mat_option_6_Template, 2, 2, "mat-option", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](4, 2, "limits.user"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngForOf", ctx_r2.userDropdownOptions);
  }
}
function DfLimitDetailsComponent_ng_container_55_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](1, "mat-form-field", 2)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](5, "input", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](4, 1, "limits.endpoint"));
  }
}
const _c0 = function (a0, a1) {
  return {
    label: a0,
    description: a1
  };
};
let DfLimitDetailsComponent = class DfLimitDetailsComponent {
  constructor(limitService, router, activatedRoute, translateService, formBuilder, themeService, snackbarService) {
    this.limitService = limitService;
    this.router = router;
    this.activatedRoute = activatedRoute;
    this.translateService = translateService;
    this.formBuilder = formBuilder;
    this.themeService = themeService;
    this.snackbarService = snackbarService;
    this.isEditMode = false;
    this.limitTypeToEdit = null;
    this.roleDropdownOptions = [];
    this.userDropdownOptions = [];
    this.serviceDropdownOptions = [];
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.type = 'create';
    this.isDarkMode = this.themeService.darkMode$;
    this.formGroup = this.formBuilder.group({
      limitName: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required],
      description: [''],
      limitType: ['instance', _angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required],
      serviceId: [],
      roleId: [],
      userId: [],
      endpoint: [],
      limitRate: [null, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required],
      limitPeriod: ['minute', _angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required],
      verb: [],
      active: [true]
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(resp => {
      this.type = resp['type'];
      if (resp['type'] === 'edit') {
        this.limitTypeToEdit = resp['data'];
        this.snackbarService.setSnackbarLastEle(this.limitTypeToEdit.name, true);
        this.formGroup.patchValue({
          limitName: this.limitTypeToEdit.name,
          limitType: this.limitTypeToEdit.type,
          serviceId: this.limitTypeToEdit.serviceId,
          roleId: this.limitTypeToEdit.roleId,
          userId: this.limitTypeToEdit.userId,
          limitRate: this.limitTypeToEdit.rate,
          limitPeriod: this.limitTypeToEdit.period,
          active: this.limitTypeToEdit.isActive,
          description: this.limitTypeToEdit.description,
          endpoint: this.limitTypeToEdit.endpoint,
          verb: this.limitTypeToEdit.verb
        });
        if (!this.formGroup.value.serviceId) this.removeFormField('serviceId');
        if (!this.formGroup.value.roleId) this.removeFormField('roleId');
        if (!this.formGroup.value.userId) this.removeFormField('userId');
        if (!this.formGroup.value.endpoint) this.removeFormField('endpoint');
      }
    });
    if (this.type === 'create') {
      this.removeFormField();
      this.renderCorrectHiddenFields('instance');
    }
    this.activatedRoute.data.subscribe(data => {
      this.serviceDropdownOptions = data['services'].resource;
    });
    this.activatedRoute.data.subscribe(data => {
      this.userDropdownOptions = data['users'].resource;
    });
    this.activatedRoute.data.subscribe(data => {
      this.roleDropdownOptions = data['roles'].resource;
    });
    this.formGroup.get('limitType')?.valueChanges.subscribe(data => {
      if (data) {
        this.removeFormField();
        this.renderCorrectHiddenFields(data);
      }
    });
  }
  onSubmit() {
    if (this.formGroup.valid) {
      this.showAlert = false;
      if (this.type === 'create') {
        const payload = this.assembleLimitPayload();
        this.limitService.create({
          resource: [payload]
        }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_8__.catchError)(err => {
          this.alertMsg = err.error.error.message;
          this.showAlert = true;
          return (0,rxjs__WEBPACK_IMPORTED_MODULE_9__.throwError)(() => new Error(err));
        })).subscribe(res => {
          this.router.navigate(['../', res.resource[0].id], {
            relativeTo: this.activatedRoute
          });
        });
      } else if (this.type === 'edit') {
        // edit mode
        const payload = this.assembleLimitPayload();
        this.limitService.update(payload.id, payload).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_8__.catchError)(err => {
          this.alertMsg = err.error.error.message;
          this.showAlert = true;
          return (0,rxjs__WEBPACK_IMPORTED_MODULE_9__.throwError)(() => new Error(err));
        })).subscribe(res => {
          this.router.navigate(['../', res.id], {
            relativeTo: this.activatedRoute
          });
        });
      }
    } else {
      this.alertMsg = this.translateService.translate('limits.invalidForm');
      this.showAlert = true;
    }
  }
  onCancel() {
    this.router.navigate(['../'], {
      relativeTo: this.activatedRoute
    });
  }
  assembleLimitPayload() {
    const data = {
      description: this.formGroup.value.description ?? null,
      endpoint: this.formGroup.value.endpoint ?? null,
      isActive: this.formGroup.value.active,
      name: this.formGroup.value.limitName,
      period: this.formGroup.value.limitPeriod,
      roleId: this.formGroup.value.roleId ?? null,
      serviceId: this.formGroup.value.serviceId ?? null,
      userId: this.formGroup.value.userId ?? null,
      type: this.formGroup.value.limitType,
      verb: this.formGroup.value.verb
    };
    if (this.type === 'edit') {
      return {
        id: this.limitTypeToEdit?.id,
        createdDate: this.limitTypeToEdit?.createdDate,
        lastModifiedDate: this.limitTypeToEdit?.lastModifiedDate,
        rate: this.formGroup.value.limitRate ?? null,
        ...data
      };
    } else {
      return {
        cacheData: {},
        rate: this.formGroup.value.limitRate ? this.formGroup.value.limitRate.toString() : '1',
        ...data
      };
    }
  }
  renderCorrectHiddenFields(data) {
    switch (data) {
      case 'instance':
      case 'instance.each_user':
        break;
      case 'instance.user.service':
        this.formGroup.addControl('serviceId', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        this.formGroup.addControl('userId', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        break;
      case 'instance.each_user.service':
      case 'instance.service':
        this.formGroup.addControl('serviceId', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        break;
      case 'instance.role':
        this.formGroup.addControl('roleId', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        break;
      case 'instance.user':
        this.formGroup.addControl('userId', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        break;
      case 'instance.user.service.endpoint':
        this.formGroup.addControl('userId', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        this.formGroup.addControl('serviceId', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        this.formGroup.addControl('endpoint', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        break;
      case 'instance.service.endpoint':
      case 'instance.each_user.service.endpoint':
        this.formGroup.addControl('serviceId', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        this.formGroup.addControl('endpoint', this.formBuilder.control('', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]));
        break;
      default:
        this.removeFormField();
    }
  }
  removeFormField(fieldName) {
    if (!fieldName) {
      this.formGroup.removeControl('serviceId');
      this.formGroup.removeControl('roleId');
      this.formGroup.removeControl('userId');
      this.formGroup.removeControl('endpoint');
    } else this.formGroup.removeControl(fieldName);
  }
  static {
    this.ɵfac = function DfLimitDetailsComponent_Factory(t) {
      return new (t || DfLimitDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__.LIMIT_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_10__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_10__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__.TranslocoService), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__.DfThemeService), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_4__.DfSnackbarService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdefineComponent"]({
      type: DfLimitDetailsComponent,
      selectors: [["df-limit"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵStandaloneFeature"]],
      decls: 92,
      vars: 89,
      consts: [[3, "showAlert", "alertType", "alertClosed"], [1, "details-section", 3, "formGroup", "ngSubmit"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "dynamic-width"], ["matInput", "", "type", "text", "formControlName", "limitName"], ["formControlName", "verb", 1, "dynamic-width", 3, "schema"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "full-width"], ["rows", "1", "matInput", "", "type", "text", "formControlName", "description"], ["formControlName", "limitType"], ["value", "instance"], ["value", "instance.user"], ["value", "instance.each_user"], ["value", "instance.service"], ["value", "instance.role"], ["value", "instance.user.service"], ["value", "instance.each_user.service"], ["value", "instance.service.endpoint"], ["value", "instance.user.service.endpoint"], ["value", "instance.each_user.service.endpoint"], [4, "ngIf"], ["matInput", "", "type", "number", "formControlName", "limitRate"], ["formControlName", "limitPeriod"], ["value", "minute"], ["value", "hour"], ["value", "day"], ["value", "7-day"], ["value", "30-day"], ["color", "primary", "formControlName", "active", 1, "full-width"], [1, "full-width", "action-bar"], ["type", "button", "mat-flat-button", "", 1, "cancel-btn", 3, "click"], ["mat-flat-button", "", "color", "primary", 1, "save-btn"], ["formControlName", "serviceId"], [3, "value", 4, "ngFor", "ngForOf"], [3, "value"], ["formControlName", "roleId"], ["formControlName", "userId"], ["matInput", "", "type", "text", "formControlName", "endpoint"]],
      template: function DfLimitDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "df-alert", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("alertClosed", function DfLimitDetailsComponent_Template_df_alert_alertClosed_0_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](2, "form", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("ngSubmit", function DfLimitDetailsComponent_Template_form_ngSubmit_2_listener() {
            return ctx.onSubmit();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](3, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](4, "mat-form-field", 2)(5, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](7, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](8, "input", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](9, "df-verb-picker", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](10, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](11, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](12, "mat-form-field", 5)(13, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](14);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](15, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](16, "textarea", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](17, "mat-form-field", 2)(18, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](19);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](20, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](21, "mat-select", 7)(22, "mat-option", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](23);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](24, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](25, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](26);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](27, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](28, "mat-option", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](29);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](30, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](31, "mat-option", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](32);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](33, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](34, "mat-option", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](35);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](36, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](37, "mat-option", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](38);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](39, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](40, "mat-option", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](41);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](42, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](43, "mat-option", 15);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](44);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](45, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](46, "mat-option", 16);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](47);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](48, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](49, "mat-option", 17);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](50);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](51, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](52, DfLimitDetailsComponent_ng_container_52_Template, 7, 4, "ng-container", 18);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](53, DfLimitDetailsComponent_ng_container_53_Template, 7, 4, "ng-container", 18);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](54, DfLimitDetailsComponent_ng_container_54_Template, 7, 4, "ng-container", 18);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](55, DfLimitDetailsComponent_ng_container_55_Template, 6, 3, "ng-container", 18);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](56, "mat-form-field", 2)(57, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](58);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](59, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](60, "input", 19);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](61, "mat-form-field", 2)(62, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](63);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](64, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](65, "mat-select", 20)(66, "mat-option", 21);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](67);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](68, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](69, "mat-option", 22);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](70);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](71, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](72, "mat-option", 23);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](73);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](74, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](75, "mat-option", 24);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](76);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](77, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](78, "mat-option", 25);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](79);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](80, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerStart"](81);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](82, "mat-slide-toggle", 26);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](83);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](84, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](85, "div", 27)(86, "button", 28);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("click", function DfLimitDetailsComponent_Template_button_click_86_listener() {
            return ctx.onCancel();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](87);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](88, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](89, "button", 29);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](90);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](91, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](ctx.alertMsg);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](3, 34, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("formGroup", ctx.formGroup);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](7, 36, "limits.name"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("schema", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpureFunction2"](86, _c0, _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](10, 38, "limits.verb"), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](11, 40, "limits.verbTooltip")));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](15, 42, "limits.description"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](20, 44, "limits.limitType"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](24, 46, "limits.limitTypes.instance"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](27, 48, "limits.limitTypes.user"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](30, 50, "limits.limitTypes.eachUser"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](33, 52, "limits.limitTypes.service"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](36, 54, "limits.limitTypes.role"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](39, 56, "limits.limitTypes.serviceByUser"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](42, 58, "limits.limitTypes.serviceByEachUser"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](45, 60, "limits.limitTypes.endpoint"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](48, 62, "limits.limitTypes.endpointByUser"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](51, 64, "limits.limitTypes.endpointByEachUser"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.formGroup.controls["serviceId"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.formGroup.controls["roleId"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.formGroup.controls["userId"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.formGroup.controls["endpoint"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](59, 66, "limits.limitRate"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](64, 68, "limits.limitPeriod"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](68, 70, "limits.limitPeriods.minute"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](71, 72, "limits.limitPeriods.hour"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](74, 74, "limits.limitPeriods.day"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](77, 76, "limits.limitPeriods.week"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](80, 78, "limits.limitPeriods.30Days"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](84, 80, "limits.active"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](88, 82, "cancel"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](91, 84, "save"), " ");
        }
      },
      dependencies: [_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_0__.DfAlertComponent, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_7__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_7__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NumberValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormControlName, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__.MatLabel, _angular_material_input__WEBPACK_IMPORTED_MODULE_13__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_13__.MatInput, _angular_material_select__WEBPACK_IMPORTED_MODULE_14__.MatSelectModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_14__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_15__.MatOption, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgFor, _angular_material_core__WEBPACK_IMPORTED_MODULE_15__.MatOptionModule, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgIf, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_17__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_17__.MatSlideToggle, _angular_material_button__WEBPACK_IMPORTED_MODULE_18__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_18__.MatButton, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__.TranslocoPipe, src_app_shared_components_df_verb_picker_df_verb_picker_component__WEBPACK_IMPORTED_MODULE_2__.DfVerbPickerComponent, _angular_common__WEBPACK_IMPORTED_MODULE_16__.AsyncPipe],
      styles: [".df-limit-form-container[_ngcontent-%COMP%] {\n  display: flex;\n  height: 100%;\n  width: 100%;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWxpbWl0cy9kZi1saW1pdC1kZXRhaWxzL2RmLWxpbWl0LWRldGFpbHMuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxhQUFBO0VBQ0EsWUFBQTtFQUNBLFdBQUE7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbIi5kZi1saW1pdC1mb3JtLWNvbnRhaW5lciB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGhlaWdodDogMTAwJTtcbiAgd2lkdGg6IDEwMCU7XG59XG4iXSwic291cmNlUm9vdCI6IiJ9 */"]
    });
  }
};
DfLimitDetailsComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_19__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_20__.UntilDestroy)({
  checkProperties: true
})], DfLimitDetailsComponent);

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
//# sourceMappingURL=src_app_adf-limits_df-limit-details_df-limit-details_component_ts.js.map