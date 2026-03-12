"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-roles_df-role-details_df-role-details_component_ts"],{

/***/ 16994:
/*!************************************************************************!*\
  !*** ./src/app/adf-roles/df-role-details/df-role-details.component.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfRoleDetailsComponent: () => (/* binding */ DfRoleDetailsComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var src_app_shared_components_df_lookup_keys_df_lookup_keys_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/components/df-lookup-keys/df-lookup-keys.component */ 58751);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _df_roles_access_df_roles_access_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../df-roles-access/df-roles-access.component */ 94966);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var src_app_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);
/* harmony import */ var src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/app/shared/services/df-snackbar.service */ 75680);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);
























function DfRoleDetailsComponent_mat_error_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 1, "roles.rolesOverview.error.name"), " ");
  }
}
function DfRoleDetailsComponent_span_32_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 1, "save"), " ");
  }
}
function DfRoleDetailsComponent_span_33_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 1, "update"), " ");
  }
}
let DfRoleDetailsComponent = class DfRoleDetailsComponent {
  constructor(roleService, fb, router, activatedRoute, themeService, snackbarService) {
    this.roleService = roleService;
    this.fb = fb;
    this.router = router;
    this.activatedRoute = activatedRoute;
    this.themeService = themeService;
    this.snackbarService = snackbarService;
    this.type = '';
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.visibilityArray = [];
    this.originalLookupKeyIds = [];
    this.deletedLookupKeys = [];
    this.isDarkMode = this.themeService.darkMode$;
    this.filterOp = '';
    this.roleForm = this.fb.group({
      id: [0],
      name: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required],
      description: [''],
      active: [false],
      serviceAccess: this.fb.array([]),
      lookupKeys: this.fb.array([])
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(({
      data,
      type
    }) => {
      this.type = type;
      // Reset deleted lookup keys array when loading a role
      this.deletedLookupKeys = [];
      if (data) {
        this.snackbarService.setSnackbarLastEle(data.label ? data.label : data.name, true);
        this.roleForm.patchValue({
          id: data.id,
          name: data.name,
          description: data.description,
          active: data.isActive
        });
        if (data.roleServiceAccessByRoleId.length > 0) {
          this.filterOp = data.roleServiceAccessByRoleId[0].filterOp;
          data.roleServiceAccessByRoleId.forEach(item => {
            this.visibilityArray.push(true);
            const advancedFilters = new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormArray((item.filters || []).map(each => new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormGroup({
              expandField: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(each.name),
              expandOperator: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(each.operator),
              expandValue: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(each.value),
              filterOp: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.filterOp)
            })));
            this.roleForm.controls['serviceAccess'].push(new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormGroup({
              service: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.serviceId ? item.serviceId : 0, [_angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required]),
              component: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.component),
              access: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(this.handleAccessValue(item.verbMask), [_angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required]),
              requester: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(this.handleRequesterValue(item.requestorMask)),
              advancedFilters: advancedFilters,
              id: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.id),
              extendField: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.extendField),
              extendOperator: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.extendOperator),
              extendValue: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.extendValue),
              filterOp: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.filterOp)
            }));
          });
        }
        if (data.lookupByRoleId.length > 0) {
          data.lookupByRoleId.forEach(item => {
            // Track original lookup key IDs for deletion detection
            if (item.id) {
              this.originalLookupKeyIds.push(item.id);
            }
            this.roleForm.controls['lookupKeys'].push(new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormGroup({
              id: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.id),
              name: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.name, [_angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required]),
              value: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.value),
              private: new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl(item.private)
            }));
          });
        }
      }
    });
  }
  handleRequesterValue(value) {
    if (value === 3) {
      return [1, 2];
    }
    return [value];
  }
  handleAccessValue(totalValue) {
    const originalArray = [1, 2, 4, 8, 16];
    const result = [];
    for (let i = originalArray.length - 1; i >= 0; i--) {
      const currentValue = originalArray[i];
      if (totalValue >= currentValue) {
        result.push(currentValue);
        totalValue -= currentValue;
      }
    }
    return result;
  }
  onLookupDeleted(deletedLookup) {
    // Add deleted lookup to tracking array with role_id set to null for backend deletion
    this.deletedLookupKeys.push({
      ...deletedLookup,
      roleId: null // Setting roleId to null signals the backend to delete this record
    });
  }

  triggerAlert(type, msg) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }
  get serviceAccess() {
    return this.roleForm.get('serviceAccess');
  }
  onSubmit() {
    // Clear validators for all hidden items before validation
    const serviceAccess = this.roleForm.get('serviceAccess');
    serviceAccess.controls.forEach((control, index) => {
      if (!this.visibilityArray[index]) {
        control.get('service')?.clearValidators();
        control.get('component')?.clearValidators();
        control.get('access')?.clearValidators();
        control.get('requester')?.clearValidators();
        control.get('service')?.updateValueAndValidity();
        control.get('component')?.updateValueAndValidity();
        control.get('access')?.updateValueAndValidity();
        control.get('requester')?.updateValueAndValidity();
      }
    });
    if (this.roleForm.invalid) {
      // Mark all controls as touched to show validation errors
      this.roleForm.markAllAsTouched();
      return;
    }
    const formValue = this.roleForm.getRawValue();
    if (formValue.name === '' || formValue.name === null) {
      return;
    }
    const payload = {
      id: formValue.id,
      name: formValue.name,
      description: formValue.description,
      isActive: formValue.active,
      roleServiceAccessByRoleId: formValue.serviceAccess.map((val, index) => {
        const filtersArray = val.advancedFilters.map(filter => ({
          name: filter.expandField,
          operator: filter.expandOperator,
          value: filter.expandValue
        }));
        const filterOp = val.advancedFilters.map(filter => filter.filterOp);
        const roleId = this.visibilityArray[index] ? formValue.id : null;
        return {
          id: val.id,
          roleId: roleId,
          serviceId: val.service === 0 ? null : val.service,
          component: val.component,
          verbMask: val.access.reduce((acc, cur) => acc + cur, 0),
          requestorMask: val.requester.reduce((acc, cur) => acc + cur, 0),
          filters: filtersArray,
          filterOp: filterOp[0]
        };
      }),
      lookupByRoleId: this.getLookupKeysWithDeletions(formValue)
    };
    const createPayload = {
      resource: [payload]
    };
    if (this.type === 'edit' && payload.id) {
      this.roleService.update(payload.id, payload).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_9__.catchError)(err => {
        this.triggerAlert('error', err.error.error.message);
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_10__.throwError)(() => new Error(err));
      })).subscribe(() => {
        this.goBack();
      });
    } else {
      this.roleService.create(createPayload, {
        fields: '*',
        related: 'role_service_access_by_role_id,lookup_by_role_id'
      }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_9__.catchError)(err => {
        this.triggerAlert('error', err.error.error.context.resource[0].message);
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_10__.throwError)(() => new Error(err));
      })).subscribe(() => {
        this.goBack();
      });
    }
  }
  getLookupKeysWithDeletions(formValue) {
    const currentLookupKeys = formValue.lookupKeys;
    const result = [...currentLookupKeys];
    // Find IDs that were deleted (present in original but not in current)
    const currentIds = currentLookupKeys.map(lk => lk.id).filter(id => id);
    const deletedIds = this.originalLookupKeyIds.filter(id => !currentIds.includes(id));
    // Add deleted lookup keys with role_id set to null to trigger deletion
    deletedIds.forEach(id => {
      result.push({
        id: id,
        role_id: null
      });
    });
    return result;
  }
  goBack() {
    this.router.navigate(['../'], {
      relativeTo: this.activatedRoute
    });
  }
  static {
    this.ɵfac = function DfRoleDetailsComponent_Factory(t) {
      return new (t || DfRoleDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__.ROLE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_11__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_11__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_4__.DfThemeService), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_5__.DfSnackbarService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdefineComponent"]({
      type: DfRoleDetailsComponent,
      selectors: [["df-role-details"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵStandaloneFeature"]],
      decls: 34,
      vars: 32,
      consts: [[3, "showAlert", "alertType", "alertClosed"], [1, "details-section", 3, "formGroup", "ngSubmit"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "dynamic-width"], ["matInput", "", "formControlName", "name", "required", ""], [4, "ngIf"], ["formControlName", "active", 1, "dynamic-width"], ["appearance", "outline", "subscriptSizing", "dynamic"], ["rows", "1", "matInput", "", "formControlName", "description"], ["formArrayName", "serviceAccess", 1, "full-width"], [1, "full-width", 3, "visible", "formArray", "roleForm"], ["formArrayName", "lookupKeys", 1, "full-width", 3, "lookupDeleted"], [1, "full-width", "action-bar"], ["mat-flat-button", "", "type", "button", 1, "cancel-btn", 3, "click"], ["mat-flat-button", "", "color", "primary", 1, "save-btn"]],
      template: function DfRoleDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](3, "df-alert", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("alertClosed", function DfRoleDetailsComponent_Template_df_alert_alertClosed_3_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](5, "form", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("ngSubmit", function DfRoleDetailsComponent_Template_form_ngSubmit_5_listener() {
            return ctx.onSubmit();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](6, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](7, "mat-form-field", 2)(8, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](9);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](10, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](11, "input", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](12, DfRoleDetailsComponent_mat_error_12_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](13, "mat-slide-toggle", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](14);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](15, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](16, "mat-form-field", 6)(17, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](18);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](19, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](20, "textarea", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](21, "div", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](22, "df-roles-access", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](23, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](24);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](25, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](26, "df-lookup-keys", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("lookupDeleted", function DfRoleDetailsComponent_Template_df_lookup_keys_lookupDeleted_26_listener($event) {
            return ctx.onLookupDeleted($event);
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](27, "div", 11)(28, "button", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("click", function DfRoleDetailsComponent_Template_button_click_28_listener() {
            return ctx.goBack();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](29);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](30, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](31, "button", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](32, DfRoleDetailsComponent_span_32_Template, 3, 3, "span", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](33, DfRoleDetailsComponent_span_33_Template, 3, 3, "span", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 18, "roles.rolesOverview.description"), "\n");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", ctx.alertMsg, "\n");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](6, 20, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("formGroup", ctx.roleForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](10, 22, "name"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", ctx.roleForm.controls["name"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](15, 24, "active"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](19, 26, "description"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("visible", ctx.visibilityArray)("formArray", ctx.serviceAccess)("roleForm", ctx.roleForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](25, 28, "roles.lookupKeys.description"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](30, 30, "cancel"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", ctx.type === "create");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", ctx.type === "edit");
        }
      },
      dependencies: [_ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_13__.AsyncPipe, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_8__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_8__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.RequiredValidator, _angular_material_input__WEBPACK_IMPORTED_MODULE_14__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_14__.MatInput, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatError, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatFormFieldModule, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormArrayName, src_app_shared_components_df_lookup_keys_df_lookup_keys_component__WEBPACK_IMPORTED_MODULE_1__.DfLookupKeysComponent, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_16__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_16__.MatSlideToggle, _angular_material_button__WEBPACK_IMPORTED_MODULE_17__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_17__.MatButton, _df_roles_access_df_roles_access_component__WEBPACK_IMPORTED_MODULE_2__.DfRolesAccessComponent, _angular_common__WEBPACK_IMPORTED_MODULE_13__.NgIf, src_app_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_3__.DfAlertComponent],
      encapsulation: 2
    });
  }
};
DfRoleDetailsComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_18__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_19__.UntilDestroy)({
  checkProperties: true
})], DfRoleDetailsComponent);

/***/ }),

/***/ 94966:
/*!************************************************************************!*\
  !*** ./src/app/adf-roles/df-roles-access/df-roles-access.component.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfRolesAccessComponent: () => (/* binding */ DfRolesAccessComponent)
/* harmony export */ });
/* harmony import */ var _Users_oleksandrkitsera_Documents_projects_dreamfactory_development_packages_df_admin_interface_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ 89204);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_table__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/table */ 77697);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_expansion__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/expansion */ 19322);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_button_toggle__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/material/button-toggle */ 59864);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs */ 75797);
/* harmony import */ var _angular_animations__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @angular/animations */ 47172);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);
































function DfRolesAccessComponent_th_16_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "th", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 1, "roles.accessOverview.tableHeadings.service"), " ");
  }
}
function DfRolesAccessComponent_td_17_mat_option_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-option", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r21 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", option_r21.id);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](option_r21.name);
  }
}
function DfRolesAccessComponent_td_17_mat_error_9_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, " Service is required ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function DfRolesAccessComponent_td_17_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "td", 18)(1, "mat-form-field", 19)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "mat-select", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("selectionChange", function DfRolesAccessComponent_td_17_Template_mat_select_selectionChange_5_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r23);
      const i_r18 = restoredCtx.dataIndex;
      const ctx_r22 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r22.getComponents(ctx_r22.getFormArrayIndex(i_r18)));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](6, "mat-option", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](7, "All");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](8, DfRolesAccessComponent_td_17_mat_option_8_Template, 2, 2, "mat-option", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](9, DfRolesAccessComponent_td_17_mat_error_9_Template, 2, 0, "mat-error", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r18 = ctx.dataIndex;
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    let tmp_4_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroupName", ctx_r1.getFormArrayIndex(i_r18));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](4, 5, "roles.accessOverview.tableHeadings.service"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r1.serviceOptions);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r1.formArray.controls[ctx_r1.getFormArrayIndex(i_r18)] == null ? null : (tmp_4_0 = ctx_r1.formArray.controls[ctx_r1.getFormArrayIndex(i_r18)].get("service")) == null ? null : tmp_4_0.hasError("required"));
  }
}
function DfRolesAccessComponent_th_19_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "th", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 1, "roles.accessOverview.tableHeadings.component"), " ");
  }
}
function DfRolesAccessComponent_td_20_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-option", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r28 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", option_r28);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](option_r28);
  }
}
function DfRolesAccessComponent_td_20_mat_error_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, " Component is required ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function DfRolesAccessComponent_td_20_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "td", 18)(1, "mat-form-field", 19)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "mat-select", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](6, DfRolesAccessComponent_td_20_mat_option_6_Template, 2, 2, "mat-option", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](7, DfRolesAccessComponent_td_20_mat_error_7_Template, 2, 0, "mat-error", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r25 = ctx.dataIndex;
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    let tmp_3_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroupName", ctx_r3.getFormArrayIndex(i_r25));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](4, 4, "roles.accessOverview.tableHeadings.component"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r3.getComponentArray(ctx_r3.getFormArrayIndex(i_r25)));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r3.formArray.controls[ctx_r3.getFormArrayIndex(i_r25)] == null ? null : (tmp_3_0 = ctx_r3.formArray.controls[ctx_r3.getFormArrayIndex(i_r25)].get("component")) == null ? null : tmp_3_0.hasError("required"));
  }
}
function DfRolesAccessComponent_th_22_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "th", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 1, "roles.accessOverview.tableHeadings.access"), " ");
  }
}
function DfRolesAccessComponent_td_23_mat_option_6_span_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "span", 27);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const i_r30 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2).dataIndex;
    const ctx_r34 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" (+", (ctx_r34.formArray.controls[ctx_r34.getFormArrayIndex(i_r30)].value.access.length || 0) - 1, " ", ctx_r34.formArray.controls[ctx_r34.getFormArrayIndex(i_r30)].value.access.length === 2 ? "other" : "others", ") ");
  }
}
function DfRolesAccessComponent_td_23_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-option", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](2, DfRolesAccessComponent_td_23_mat_option_6_span_2_Template, 2, 2, "span", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r33 = ctx.$implicit;
    const i_r30 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().dataIndex;
    const ctx_r31 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", option_r33.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"]("", option_r33.label, " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", (ctx_r31.formArray.controls[ctx_r31.getFormArrayIndex(i_r30)].value.access.length || 0) > 1);
  }
}
function DfRolesAccessComponent_td_23_mat_error_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, " Access is required ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function DfRolesAccessComponent_td_23_Template(rf, ctx) {
  if (rf & 1) {
    const _r38 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "td", 18)(1, "mat-form-field", 19)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "mat-select", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("selectionChange", function DfRolesAccessComponent_td_23_Template_mat_select_selectionChange_5_listener($event) {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r38);
      const i_r30 = restoredCtx.dataIndex;
      const ctx_r37 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r37.accessChange(ctx_r37.getFormArrayIndex(i_r30), $event.value));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](6, DfRolesAccessComponent_td_23_mat_option_6_Template, 3, 3, "mat-option", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](7, DfRolesAccessComponent_td_23_mat_error_7_Template, 2, 0, "mat-error", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r30 = ctx.dataIndex;
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    let tmp_3_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroupName", ctx_r5.getFormArrayIndex(i_r30));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](4, 4, "roles.accessOverview.tableHeadings.access"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r5.accessOptions);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r5.formArray.controls[ctx_r5.getFormArrayIndex(i_r30)] == null ? null : (tmp_3_0 = ctx_r5.formArray.controls[ctx_r5.getFormArrayIndex(i_r30)].get("access")) == null ? null : tmp_3_0.hasError("required"));
  }
}
function DfRolesAccessComponent_th_25_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "th", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 1, "roles.accessOverview.tableHeadings.requester"), " ");
  }
}
function DfRolesAccessComponent_td_26_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-option", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r42 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", option_r42.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](option_r42.label);
  }
}
function DfRolesAccessComponent_td_26_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "td", 18)(1, "mat-form-field", 19)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "mat-select", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](6, DfRolesAccessComponent_td_26_mat_option_6_Template, 2, 2, "mat-option", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const i_r40 = ctx.dataIndex;
    const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroupName", ctx_r7.getFormArrayIndex(i_r40));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](4, 3, "roles.accessOverview.tableHeadings.requester"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r7.requesterOptions);
  }
}
function DfRolesAccessComponent_th_28_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "th", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 1, "roles.accessOverview.tableHeadings.advancedFilters"), " ");
  }
}
function DfRolesAccessComponent_td_29_Template(rf, ctx) {
  if (rf & 1) {
    const _r46 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "td", 18)(1, "button", 29);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfRolesAccessComponent_td_29_Template_button_click_1_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r46);
      const row_r43 = restoredCtx.$implicit;
      const i_r44 = restoredCtx.dataIndex;
      const ctx_r45 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r45.toggleRow(row_r43, ctx_r45.getFormArrayIndex(i_r44)));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](2, "fa-icon", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r44 = ctx.dataIndex;
    const ctx_r9 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroupName", ctx_r9.getFormArrayIndex(i_r44));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("icon", ctx_r9.faPlus);
  }
}
function DfRolesAccessComponent_th_31_Template(rf, ctx) {
  if (rf & 1) {
    const _r48 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "th", 17)(1, "button", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfRolesAccessComponent_th_31_Template_button_click_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r48);
      const ctx_r47 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r47.add());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](3, "fa-icon", 32);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r10 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵattribute"]("aria-label", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "newEntry"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("icon", ctx_r10.faPlus);
  }
}
function DfRolesAccessComponent_td_32_Template(rf, ctx) {
  if (rf & 1) {
    const _r52 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "td", 18)(1, "button", 33);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfRolesAccessComponent_td_32_Template_button_click_1_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r52);
      const i_r50 = restoredCtx.dataIndex;
      const ctx_r51 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r51.remove(i_r50));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](2, "fa-icon", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r50 = ctx.dataIndex;
    const ctx_r11 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroupName", ctx_r11.getFormArrayIndex(i_r50));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("icon", ctx_r11.faTrashCan);
  }
}
function DfRolesAccessComponent_td_34_ng_container_2_mat_option_10_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-option", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r59 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", option_r59.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](option_r59.label);
  }
}
function DfRolesAccessComponent_td_34_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r62 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](1, "div", 36)(2, "mat-form-field", 19)(3, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4, "Field");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](5, "input", 37);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](6, "mat-form-field", 19)(7, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](8, "Operator");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](9, "mat-select", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](10, DfRolesAccessComponent_td_34_ng_container_2_mat_option_10_Template, 2, 2, "mat-option", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "mat-form-field", 19)(12, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](13, "Value");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](14, "input", 39);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "div")(16, "mat-button-toggle-group", 40);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("change", function DfRolesAccessComponent_td_34_ng_container_2_Template_mat_button_toggle_group_change_16_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r62);
      const i_r54 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().dataIndex;
      const ctx_r60 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r60.filterOpChange($event, ctx_r60.getFormArrayIndex(i_r54)));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](17, "mat-button-toggle", 41);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](18, "AND");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](19, "mat-button-toggle", 42);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](20, "OR");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](21, "button", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfRolesAccessComponent_td_34_ng_container_2_Template_button_click_21_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r62);
      const i_r54 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().dataIndex;
      const ctx_r63 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r63.addAdvancedFilter(ctx_r63.getFormArrayIndex(i_r54)));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](22, "fa-icon", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](23, "button", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfRolesAccessComponent_td_34_ng_container_2_Template_button_click_23_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r62);
      const j_r57 = restoredCtx.index;
      const i_r54 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().dataIndex;
      const ctx_r65 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r65.removeAdvancedFilter(ctx_r65.getFormArrayIndex(i_r54), j_r57));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](24, "fa-icon", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const j_r57 = ctx.index;
    const ctx_r55 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formArrayName", j_r57);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r55.operatorOptions);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](12);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("icon", ctx_r55.faPlus);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("icon", ctx_r55.faTrashCan);
  }
}
function DfRolesAccessComponent_td_34_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "td", 18)(1, "div", 34);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](2, DfRolesAccessComponent_td_34_ng_container_2_Template, 25, 4, "ng-container", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const element_r53 = ctx.$implicit;
    const i_r54 = ctx.dataIndex;
    const ctx_r12 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroupName", ctx_r12.getFormArrayIndex(i_r54));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵattribute"]("colspan", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("@detailExpand", element_r53 === ctx_r12.expandedElement ? "expanded" : "collapsed");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r12.getAdvancedFilters(ctx_r12.getFormArrayIndex(i_r54)).controls);
  }
}
function DfRolesAccessComponent_tr_35_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](0, "tr", 44);
  }
}
function DfRolesAccessComponent_tr_36_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](0, "tr", 45);
  }
}
function DfRolesAccessComponent_tr_37_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "tr", 46)(1, "td", 47);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](2, "br");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](4, 1, "roles.accessOverview.noAccessRules"), " ");
  }
}
function DfRolesAccessComponent_tr_38_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](0, "tr", 48);
  }
}
const _c0 = function () {
  return ["service", "component", "access", "requester", "advancedFilters", "actions"];
};
const _c1 = function () {
  return ["expandedDetail"];
};
let DfRolesAccessComponent = class DfRolesAccessComponent {
  constructor(activatedRoute, baseService, fb) {
    this.activatedRoute = activatedRoute;
    this.baseService = baseService;
    this.fb = fb;
    this.displayedColumns = ['service', 'component', 'access', 'requester', 'advancedFilters', 'actions'];
    this.expandField = new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('');
    this.faTrashCan = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_5__.faTrashCan;
    this.faPlus = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_5__.faPlus;
    this.serviceOptions = [{
      id: 0,
      name: ''
    }];
    this.expandOperator = new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('');
    this.expandValue = new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('');
    this.componentOptions = [{
      serviceId: 0,
      components: ['*']
    }];
    this.accessOptions = [{
      value: 1,
      label: 'GET (read)'
    }, {
      value: 2,
      label: 'POST (create)'
    }, {
      value: 4,
      label: 'PUT (replace)'
    }, {
      value: 8,
      label: 'PATCH (update)'
    }, {
      value: 16,
      label: 'DELETE (remove)'
    }];
    this.requesterOptions = [{
      value: 1,
      label: 'API'
    }, {
      value: 2,
      label: 'SCRIPT'
    }];
    this.operatorOptions = [{
      value: '=',
      label: '='
    }, {
      value: '!=',
      label: '!='
    }, {
      value: '>',
      label: '>'
    }, {
      value: '<',
      label: '<'
    }, {
      value: '>=',
      label: '>='
    }, {
      value: '<=',
      label: '<='
    }, {
      value: 'in',
      label: 'in'
    }, {
      value: 'not in',
      label: 'not in'
    }, {
      value: 'start with',
      label: 'start with'
    }, {
      value: 'end with',
      label: 'end with'
    }, {
      value: 'contains',
      label: 'contains'
    }, {
      value: 'is null',
      label: 'is null'
    }, {
      value: 'is not null',
      label: 'is not null'
    }];
    this.filteredComponentArray = [];
    this.expandedElement$ = new rxjs__WEBPACK_IMPORTED_MODULE_6__.BehaviorSubject(1);
    this.expandedElement = null;
    this.form = this.fb.group({
      cFormArray: this.fb.array([this.createItem()])
    });
  }
  createItem() {
    return this.fb.group({
      service: [''],
      component: ['']
    });
  }
  ngOnInit() {
    // get services options
    this.activatedRoute.data.subscribe(data => {
      // sort service options by name
      this.serviceOptions = data?.services?.resource.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        } else {
          return 0;
        }
      }) || [];
      // if service ID exists, GET service components
      if (data.type === 'edit' && data.data.roleServiceAccessByRoleId.length > 0) {
        data.data.roleServiceAccessByRoleId.forEach(item => {
          const serviceId = item.serviceId;
          const serviceName = this.serviceOptions.find(service => service.id === serviceId)?.name || '';
          // "GET requests without a resource are not currently supported by the 'email' service."
          if (serviceName === 'email') {
            this.componentOptions.push({
              serviceId,
              components: ['*']
            });
            return;
          }
          // GET Components for service
          this.baseService.get(serviceName, {
            additionalParams: [{
              key: 'as_access_list',
              value: true
            }]
          }).subscribe(response => {
            const components = response.resource;
            this.componentOptions.push({
              serviceId,
              components
            });
          });
        });
      }
    });
    this.initializeFilteredComponents();
    this.updateDataSource();
    // this.add();
  }

  get cFormArray() {
    return this.form.get('formArray');
  }
  initializeFilteredComponents() {
    this.filteredComponentArray = this.formArray.controls.map((_, i) => this.getComponentArray(i));
  }
  getComponentArray(index) {
    const serviceId = this.formArray.at(index).get('service')?.value;
    const components = this.componentOptions.find(option => option.serviceId === serviceId)?.components;
    return components || [];
  }
  getFormArrayIndex(visibleIndex) {
    let visibleCount = 0;
    for (let i = 0; i < this.visible.length; i++) {
      if (this.visible[i]) {
        if (visibleCount === visibleIndex) {
          return i;
        }
        visibleCount++;
      }
    }
    return -1;
  }
  filterOptions(event, index) {
    const input = event.target.value.toLowerCase();
    const serviceId = this.formArray.at(index).get('service')?.value;
    const components = this.componentOptions.find(option => option.serviceId === serviceId)?.components || [];
    this.filteredComponentArray[index] = components.filter(option => option.includes(input));
  }
  getComponents(index) {
    var _this = this;
    return (0,_Users_oleksandrkitsera_Documents_projects_dreamfactory_development_packages_df_admin_interface_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* () {
      const serviceId = _this.formArray.controls[index].get('service')?.value;
      const service = _this.serviceOptions.find(service => service.id === serviceId)?.name || '';
      // "GET requests without a resource are not currently supported by the 'email' service."
      if (service === 'email') {
        _this.componentOptions.push({
          serviceId,
          components: ['*']
        });
        return;
      }
      if (!_this.componentOptions.some(option => option.serviceId === serviceId)) {
        _this.baseService.get(service, {
          additionalParams: [{
            key: 'as_access_list',
            value: true
          }]
        }).subscribe(data => {
          _this.componentOptions.push({
            serviceId,
            components: data.resource
          });
        });
      }
    })();
  }
  getExtendOperator(index) {
    const serviceId = this.serviceAccess.at(index).get('extend-operator')?.value;
    const operators = this.componentOptions.find(option => option.serviceId === serviceId)?.components;
    return operators || [];
  }
  toggleRow(element, index) {
    this.expandedElement = this.expandedElement === element ? null : element;
    if (this.expandedElement) {
      if (this.getAdvancedFilters(index).length === 0) {
        this.addAdvancedFilter(index);
      }
    }
  }
  accessChange(index, value) {
    const access = this.formArray.at(index).get('access');
  }
  updateDataSource() {
    const visibleControls = this.formArray.controls.filter((control, index) => this.visible[index]);
    this.dataSource = new _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatTableDataSource(visibleControls);
  }
  get hasServiceAccess() {
    return this.rootForm.controls['serviceAccess'].value.length > 0;
  }
  add() {
    const advancedFilters = new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormArray([]);
    this.formArray.push(new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroup({
      service: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl(0, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
      component: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
      access: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
      requester: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl([1], _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
      advancedFilters: advancedFilters,
      id: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl(null),
      serviceAccess: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('')
    }));
    this.visible.push(true);
    this.updateDataSource();
  }
  getAdvancedFilters(index) {
    return this.formArray.controls[index].get('advancedFilters');
  }
  addAdvancedFilter(index) {
    const advancedFilters = this.getAdvancedFilters(index);
    advancedFilters.push(new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroup({
      expandField: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
      expandOperator: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
      expandValue: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
      filterOp: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('AND')
    }));
    this.updateDataSource();
  }
  removeAdvancedFilter(serviceAccessIdx, filterIdx) {
    this.getAdvancedFilters(serviceAccessIdx).removeAt(filterIdx);
    if (this.getAdvancedFilters(serviceAccessIdx).length === 0) {
      this.expandedElement = null;
    }
    this.updateDataSource();
  }
  remove(index) {
    if (index >= 0 && index < this.formArray.length) {
      // Find the actual form array index for the nth visible item BEFORE updating visible array
      let visibleCount = 0;
      let actualIndex = -1;
      for (let i = 0; i < this.visible.length; i++) {
        if (this.visible[i]) {
          if (visibleCount === index) {
            actualIndex = i;
            break;
          }
          visibleCount++;
        }
      }
      this.visible = this.updateNthTrueToFalse(this.visible, index);
      // Clear validators for the hidden item
      if (actualIndex !== -1 && actualIndex < this.formArray.length) {
        const formGroup = this.formArray.at(actualIndex);
        formGroup.get('service')?.clearValidators();
        formGroup.get('component')?.clearValidators();
        formGroup.get('access')?.clearValidators();
        formGroup.get('requester')?.clearValidators();
        formGroup.get('service')?.updateValueAndValidity();
        formGroup.get('component')?.updateValueAndValidity();
        formGroup.get('access')?.updateValueAndValidity();
        formGroup.get('requester')?.updateValueAndValidity();
      }
    }
    this.updateDataSource();
  }
  updateNthTrueToFalse(arr, index) {
    let trueCount = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]) {
        if (trueCount === index) {
          arr[i] = false;
          break;
        }
        trueCount++;
      }
    }
    return arr;
  }
  addFilter(index) {
    const filters = this.serviceAccess.at(index).get('advancedFilters');
    if (filters instanceof _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormArray) {
      filters.push(new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroup({
        expandField: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
        expandOperator: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
        expandValue: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
        filterOp: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('')
      }));
    } else {
      console.error('advancedFilters is not a FormArray');
    }
  }
  removeFilter(serviceIndex, filterIndex) {
    const filters = this.serviceAccess.at(serviceIndex).get('advancedFilters');
    filters.removeAt(filterIndex);
  }
  filterOpChange(event, i) {
    this.getAdvancedFilters(i).controls.forEach(filters => {
      filters.get('filterOp')?.setValue(event.value);
    });
  }
  static {
    this.ɵfac = function DfRolesAccessComponent_Factory(t) {
      return new (t || DfRolesAccessComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_8__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__.BASE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormBuilder));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdefineComponent"]({
      type: DfRolesAccessComponent,
      selectors: [["df-roles-access"]],
      inputs: {
        formArray: "formArray",
        roleForm: "roleForm",
        visible: "visible"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵStandaloneFeature"]],
      decls: 39,
      vars: 17,
      consts: [[1, "service-access-accordion", "full-width", 3, "formGroup"], ["expanded", "true"], ["formArrayName", "serviceAccess"], ["mat-table", "", "multiTemplateDataRows", "", 3, "dataSource"], ["matColumnDef", "service"], ["mat-header-cell", "", 4, "matHeaderCellDef"], ["mat-cell", "", 3, "formGroupName", 4, "matCellDef"], ["matColumnDef", "component"], ["matColumnDef", "access"], ["matColumnDef", "requester"], ["matColumnDef", "advancedFilters"], ["matColumnDef", "actions"], ["matColumnDef", "expandedDetail"], ["mat-header-row", "", 4, "matHeaderRowDef"], ["mat-row", "", 4, "matRowDef", "matRowDefColumns"], ["class", "mat-row", 4, "matNoDataRow"], ["mat-row", "", "class", "detail-row", 4, "matRowDef", "matRowDefColumns"], ["mat-header-cell", ""], ["mat-cell", "", 3, "formGroupName"], ["subscriptSizing", "dynamic", "appearance", "outline"], ["formControlName", "service", "panelWidth", "null", "required", "", 3, "selectionChange"], [3, "value"], [3, "value", 4, "ngFor", "ngForOf"], [4, "ngIf"], ["formControlName", "component", "panelWdith", "null", "required", ""], ["formControlName", "access", "multiple", "", "panelWidth", "null", "required", "", 3, "selectionChange"], ["class", "example-additional-selection", 4, "ngIf"], [1, "example-additional-selection"], ["formControlName", "requester", "multiple", "", "panelWidth", "null"], ["mat-icon-button", "", "color", "primary", "type", "button", 3, "click"], ["size", "xs", 3, "icon"], ["mat-mini-fab", "", "color", "primary", "type", "button", 3, "click"], ["size", "xl", 3, "icon"], ["mat-icon-button", "", 3, "click"], ["formArrayName", "advancedFilters", 1, "element-detail"], [4, "ngFor", "ngForOf"], [1, "expandedItems", 3, "formArrayName"], ["matInput", "", "formControlName", "expandField"], ["formControlName", "expandOperator", "panelWidth", "null"], ["formControlName", "expandValue", "matInput", ""], ["aria-label", "Service Definition Type", "formControlName", "filterOp", 3, "change"], ["value", "AND"], ["value", "OR"], ["mat-icon-button", "", "type", "button", 3, "click"], ["mat-header-row", ""], ["mat-row", ""], [1, "mat-row"], ["colspan", "4", 1, "mat-cell"], ["mat-row", "", 1, "detail-row"]],
      template: function DfRolesAccessComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 0)(1, "mat-accordion")(2, "mat-expansion-panel", 1)(3, "mat-expansion-panel-header")(4, "mat-panel-title");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](6, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "mat-panel-description");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](8);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](9, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](10, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](11);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](12, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](13, 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](14, "table", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](15, 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](16, DfRolesAccessComponent_th_16_Template, 3, 3, "th", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](17, DfRolesAccessComponent_td_17_Template, 10, 7, "td", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](18, 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](19, DfRolesAccessComponent_th_19_Template, 3, 3, "th", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](20, DfRolesAccessComponent_td_20_Template, 8, 6, "td", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](21, 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](22, DfRolesAccessComponent_th_22_Template, 3, 3, "th", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](23, DfRolesAccessComponent_td_23_Template, 8, 6, "td", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](24, 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](25, DfRolesAccessComponent_th_25_Template, 3, 3, "th", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](26, DfRolesAccessComponent_td_26_Template, 7, 5, "td", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](27, 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](28, DfRolesAccessComponent_th_28_Template, 3, 3, "th", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](29, DfRolesAccessComponent_td_29_Template, 3, 2, "td", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](30, 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](31, DfRolesAccessComponent_th_31_Template, 4, 4, "th", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](32, DfRolesAccessComponent_td_32_Template, 3, 2, "td", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](33, 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](34, DfRolesAccessComponent_td_34_Template, 3, 4, "td", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](35, DfRolesAccessComponent_tr_35_Template, 1, 0, "tr", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](36, DfRolesAccessComponent_tr_36_Template, 1, 0, "tr", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](37, DfRolesAccessComponent_tr_37_Template, 5, 3, "tr", 15);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](38, DfRolesAccessComponent_tr_38_Template, 1, 0, "tr", 16);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroup", ctx.roleForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](6, 8, "roles.accessOverview.heading"), "");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](9, 10, "roles.accessOverview.tableDescription"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](12, 12, "roles.accessOverview.description"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("dataSource", ctx.dataSource);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](21);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matHeaderRowDef", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction0"](14, _c0));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matRowDefColumns", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction0"](15, _c0));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matRowDefColumns", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpureFunction0"](16, _c1));
        }
      },
      dependencies: [_ngneat_transloco__WEBPACK_IMPORTED_MODULE_9__.TranslocoPipe, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatTableModule, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatTable, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatHeaderCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatHeaderRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatColumnDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatHeaderCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatHeaderRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatNoDataRow, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.RequiredValidator, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroupName, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormArrayName, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatError, _angular_material_select__WEBPACK_IMPORTED_MODULE_11__.MatSelectModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_11__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_12__.MatOption, _angular_material_input__WEBPACK_IMPORTED_MODULE_13__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_13__.MatInput, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_14__.MatExpansionModule, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_14__.MatAccordion, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_14__.MatExpansionPanel, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_14__.MatExpansionPanelHeader, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_14__.MatExpansionPanelTitle, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_14__.MatExpansionPanelDescription, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_15__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_15__.FaIconComponent, _angular_material_button__WEBPACK_IMPORTED_MODULE_16__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_16__.MatIconButton, _angular_material_button__WEBPACK_IMPORTED_MODULE_16__.MatMiniFabButton, _angular_common__WEBPACK_IMPORTED_MODULE_17__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_17__.NgForOf, _angular_common__WEBPACK_IMPORTED_MODULE_17__.NgIf, _angular_material_button_toggle__WEBPACK_IMPORTED_MODULE_18__.MatButtonToggleModule, _angular_material_button_toggle__WEBPACK_IMPORTED_MODULE_18__.MatButtonToggleGroup, _angular_material_button_toggle__WEBPACK_IMPORTED_MODULE_18__.MatButtonToggle, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormsModule],
      styles: ["mat-expansion-panel[_ngcontent-%COMP%] {\n  overflow-x: auto !important;\n}\n\n.mat-mdc-cell[_ngcontent-%COMP%] {\n  padding: 8px;\n}\n\ntable[_ngcontent-%COMP%] {\n  width: 100%;\n}\n\ntr.detail-row[_ngcontent-%COMP%] {\n  height: 0;\n}\n\ntr.element-row[_ngcontent-%COMP%]:not(.example-expanded-row):hover {\n  background: whitesmoke;\n}\n\ntr.element-row[_ngcontent-%COMP%]:not(.example-expanded-row):active {\n  background: #efefef;\n}\n\n.element-row[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  border-bottom-width: 0;\n}\n\n.element-detail[_ngcontent-%COMP%] {\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding-top: 8px;\n}\n.element-detail[_ngcontent-%COMP%]   .expandedItems[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n  gap: 5px;\n}\n\n.detail-input[_ngcontent-%COMP%] {\n  margin-right: 20px;\n}\n\n  .cdk-overlay-pane {\n  width: max-content !important;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLXJvbGVzL2RmLXJvbGVzLWFjY2Vzcy9kZi1yb2xlcy1hY2Nlc3MuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSwyQkFBQTtBQUNGOztBQUNBO0VBQ0UsWUFBQTtBQUVGOztBQUFBO0VBQ0UsV0FBQTtBQUdGOztBQUFBO0VBQ0UsU0FBQTtBQUdGOztBQUFBO0VBQ0Usc0JBQUE7QUFHRjs7QUFBQTtFQUNFLG1CQUFBO0FBR0Y7O0FBQUE7RUFDRSxzQkFBQTtBQUdGOztBQUFBO0VBQ0UsZ0JBQUE7RUFDQSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSxRQUFBO0VBQ0EsZ0JBQUE7QUFHRjtBQUZFO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsUUFBQTtBQUlKOztBQUFBO0VBQ0Usa0JBQUE7QUFHRjs7QUFBRTtFQUNFLDZCQUFBO0FBR0oiLCJzb3VyY2VzQ29udGVudCI6WyJtYXQtZXhwYW5zaW9uLXBhbmVsIHtcbiAgb3ZlcmZsb3cteDogYXV0byAhaW1wb3J0YW50O1xufVxuLm1hdC1tZGMtY2VsbCB7XG4gIHBhZGRpbmc6IDhweDtcbn1cbnRhYmxlIHtcbiAgd2lkdGg6IDEwMCU7XG59XG5cbnRyLmRldGFpbC1yb3cge1xuICBoZWlnaHQ6IDA7XG59XG5cbnRyLmVsZW1lbnQtcm93Om5vdCguZXhhbXBsZS1leHBhbmRlZC1yb3cpOmhvdmVyIHtcbiAgYmFja2dyb3VuZDogd2hpdGVzbW9rZTtcbn1cblxudHIuZWxlbWVudC1yb3c6bm90KC5leGFtcGxlLWV4cGFuZGVkLXJvdyk6YWN0aXZlIHtcbiAgYmFja2dyb3VuZDogI2VmZWZlZjtcbn1cblxuLmVsZW1lbnQtcm93IHRkIHtcbiAgYm9yZGVyLWJvdHRvbS13aWR0aDogMDtcbn1cblxuLmVsZW1lbnQtZGV0YWlsIHtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG4gIHBhZGRpbmctdG9wOiA4cHg7XG4gIC5leHBhbmRlZEl0ZW1zIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgZ2FwOiA1cHg7XG4gIH1cbn1cblxuLmRldGFpbC1pbnB1dCB7XG4gIG1hcmdpbi1yaWdodDogMjBweDtcbn1cbjo6bmctZGVlcCB7XG4gIC5jZGstb3ZlcmxheS1wYW5lIHtcbiAgICB3aWR0aDogbWF4LWNvbnRlbnQgIWltcG9ydGFudDtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */"],
      data: {
        animation: [(0,_angular_animations__WEBPACK_IMPORTED_MODULE_19__.trigger)('detailExpand', [(0,_angular_animations__WEBPACK_IMPORTED_MODULE_19__.state)('collapsed,void', (0,_angular_animations__WEBPACK_IMPORTED_MODULE_19__.style)({
          height: '*',
          minHeight: '0'
        })), (0,_angular_animations__WEBPACK_IMPORTED_MODULE_19__.state)('expanded', (0,_angular_animations__WEBPACK_IMPORTED_MODULE_19__.style)({
          height: '*'
        })), (0,_angular_animations__WEBPACK_IMPORTED_MODULE_19__.transition)('expanded <=> collapsed', (0,_angular_animations__WEBPACK_IMPORTED_MODULE_19__.animate)('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))])]
      }
    });
  }
};
DfRolesAccessComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_20__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_21__.UntilDestroy)({
  checkProperties: true
})], DfRolesAccessComponent);

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
//# sourceMappingURL=src_app_adf-roles_df-role-details_df-role-details_component_ts.js.map