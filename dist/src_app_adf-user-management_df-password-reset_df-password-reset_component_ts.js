"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-user-management_df-password-reset_df-password-reset_component_ts"],{

/***/ 92626:
/*!**************************************************************************************!*\
  !*** ./src/app/adf-user-management/df-password-reset/df-password-reset.component.ts ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfPasswordResetComponent: () => (/* binding */ DfPasswordResetComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _shared_validators_match_validator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/validators/match.validator */ 69465);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs */ 36647);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_divider__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/divider */ 14102);
/* harmony import */ var _angular_material_card__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/card */ 53777);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _services_df_password_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../services/df-password.service */ 79676);
/* harmony import */ var _shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var _services_df_auth_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../services/df-auth.service */ 34387);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/router */ 95072);

























function DfPasswordResetComponent_mat_form_field_11_mat_error_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](2, 1, "userManagement.controls.email.errors.invalid"), " ");
  }
}
function DfPasswordResetComponent_mat_form_field_11_mat_error_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](2, 1, "userManagement.controls.email.errors.required"), " ");
  }
}
function DfPasswordResetComponent_mat_form_field_11_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-form-field", 5)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](4, "input", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](5, DfPasswordResetComponent_mat_form_field_11_mat_error_5_Template, 3, 3, "mat-error", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](6, DfPasswordResetComponent_mat_form_field_11_mat_error_6_Template, 3, 3, "mat-error", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    let tmp_1_0;
    let tmp_2_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](3, 3, "userManagement.controls.email.label"), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ((tmp_1_0 = ctx_r0.passwordResetForm.get("email")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["email"]) && !((tmp_1_0 = ctx_r0.passwordResetForm.get("email")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]));
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", !((tmp_2_0 = ctx_r0.passwordResetForm.get("email")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["email"]) && ((tmp_2_0 = ctx_r0.passwordResetForm.get("email")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["required"]));
  }
}
function DfPasswordResetComponent_mat_form_field_12_mat_error_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](2, 1, "userManagement.controls.username.errors.required"), " ");
  }
}
function DfPasswordResetComponent_mat_form_field_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-form-field", 5)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](4, "input", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](5, DfPasswordResetComponent_mat_form_field_12_mat_error_5_Template, 3, 3, "mat-error", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    let tmp_1_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](3, 2, "userManagement.controls.username.altLabel"));
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", (tmp_1_0 = ctx_r1.passwordResetForm.get("username")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]);
  }
}
function DfPasswordResetComponent_mat_error_18_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](2, 1, "userManagement.controls.confirmationCode.errors.required"), " ");
  }
}
function DfPasswordResetComponent_mat_error_24_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.required"), " ");
  }
}
function DfPasswordResetComponent_mat_error_25_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.length"), " ");
  }
}
function DfPasswordResetComponent_mat_error_31_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](2, 1, "userManagement.controls.confirmPassword.errors.match"), " ");
  }
}
let DfPasswordResetComponent = class DfPasswordResetComponent {
  constructor(fb, location, passwordResetService, systemConfigDataService, authService, router, route) {
    this.fb = fb;
    this.location = location;
    this.passwordResetService = passwordResetService;
    this.systemConfigDataService = systemConfigDataService;
    this.authService = authService;
    this.router = router;
    this.route = route;
    this.user = {
      email: '',
      username: '',
      code: '',
      admin: ''
    };
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.loginAttribute = 'email';
    this.type = 'reset';
    this.passwordResetForm = this.fb.group({
      username: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required]],
      email: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.email]],
      code: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required]],
      newPassword: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.minLength(16)]],
      confirmPassword: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required, (0,_shared_validators_match_validator__WEBPACK_IMPORTED_MODULE_0__.matchValidator)('newPassword')]]
    });
  }
  ngOnInit() {
    if (this.route.queryParams) {
      this.route.queryParams.subscribe(params => {
        this.user = {
          code: params['code'],
          email: params['email'],
          username: params['username'],
          admin: params['admin']
        };
        this.passwordResetForm.patchValue({
          email: this.user.email,
          username: this.user.username,
          code: this.user.code
        });
      });
    }
    this.systemConfigDataService.environment$.subscribe(env => {
      this.loginAttribute = env.authentication.loginAttribute;
    });
    this.route.data.subscribe(data => {
      if ('type' in data) {
        this.type = data['type'];
      }
    });
  }
  get isAdmin() {
    return this.user.admin === '1';
  }
  resetPassword() {
    if (this.passwordResetForm.invalid) {
      return;
    }
    const {
      confirmPassword,
      ...resetCred
    } = this.passwordResetForm.value;
    this.passwordResetService.resetPassword(resetCred, this.isAdmin).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_7__.switchMap)(() => {
      const credentials = {
        password: resetCred.newPassword
      };
      if (this.loginAttribute === 'email') {
        credentials.email = resetCred.email;
      } else {
        credentials.username = resetCred.username;
      }
      return this.authService.login(credentials);
    }), (0,rxjs__WEBPACK_IMPORTED_MODULE_8__.catchError)(err => {
      this.alertMsg = err.error.error.message;
      this.showAlert = true;
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_9__.throwError)(() => new Error(err));
    })).subscribe(() => {
      this.showAlert = false;
      this.router.navigate(['/']);
    });
  }
  static {
    this.ɵfac = function DfPasswordResetComponent_Factory(t) {
      return new (t || DfPasswordResetComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_6__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_common__WEBPACK_IMPORTED_MODULE_10__.Location), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_services_df_password_service__WEBPACK_IMPORTED_MODULE_2__.DfPasswordService), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_services_df_auth_service__WEBPACK_IMPORTED_MODULE_4__.DfAuthService), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_11__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_11__.ActivatedRoute));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdefineComponent"]({
      type: DfPasswordResetComponent,
      selectors: [["df-password-reset"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵStandaloneFeature"]],
      decls: 35,
      vars: 25,
      consts: [[1, "user-management-card-container"], [1, "user-management-card"], [3, "showAlert", "alertType", "alertClosed"], ["name", "reset-password-form", 3, "formGroup", "ngSubmit"], ["appearance", "outline", 4, "ngIf"], ["appearance", "outline"], ["matInput", "", "type", "text", "formControlName", "code"], [4, "ngIf"], ["matInput", "", "type", "password", "formControlName", "newPassword"], ["matInput", "", "type", "password", "formControlName", "confirmPassword"], ["mat-flat-button", "", "color", "primary", "type", "submit"], ["matInput", "", "type", "email", "formControlName", "email"], ["matInput", "", "type", "text", "formControlName", "username"]],
      template: function DfPasswordResetComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "div", 0)(1, "mat-card", 1)(2, "df-alert", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("alertClosed", function DfPasswordResetComponent_Template_df_alert_alertClosed_2_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](4, "mat-card-header")(5, "mat-card-title");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](7, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](8, "mat-divider");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](9, "mat-card-content")(10, "form", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("ngSubmit", function DfPasswordResetComponent_Template_form_ngSubmit_10_listener() {
            return ctx.resetPassword();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](11, DfPasswordResetComponent_mat_form_field_11_Template, 7, 5, "mat-form-field", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](12, DfPasswordResetComponent_mat_form_field_12_Template, 6, 4, "mat-form-field", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](13, "mat-form-field", 5)(14, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](15);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](16, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](17, "input", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](18, DfPasswordResetComponent_mat_error_18_Template, 3, 3, "mat-error", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](19, "mat-form-field", 5)(20, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](21);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](22, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](23, "input", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](24, DfPasswordResetComponent_mat_error_24_Template, 3, 3, "mat-error", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](25, DfPasswordResetComponent_mat_error_25_Template, 3, 3, "mat-error", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](26, "mat-form-field", 5)(27, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](28);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](29, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](30, "input", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](31, DfPasswordResetComponent_mat_error_31_Template, 3, 3, "mat-error", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](32, "button", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](33);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](34, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()()();
        }
        if (rf & 2) {
          let tmp_8_0;
          let tmp_10_0;
          let tmp_11_0;
          let tmp_13_0;
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](ctx.alertMsg);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](7, 15, "userManagement." + (ctx.type === "reset" ? "resetPassword" : ctx.type === "register" ? "registrationConfirmation" : "invitatonConfirmation")), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("formGroup", ctx.passwordResetForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.loginAttribute === "email");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.loginAttribute === "username");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](16, 17, "userManagement.controls.confirmationCode.label"), "");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", (tmp_8_0 = ctx.passwordResetForm.get("code")) == null ? null : tmp_8_0.errors == null ? null : tmp_8_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](22, 19, "userManagement.controls.password." + (ctx.type === "reset" ? "label" : "altLabel")));
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", (tmp_10_0 = ctx.passwordResetForm.get("newPassword")) == null ? null : tmp_10_0.errors == null ? null : tmp_10_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", (tmp_11_0 = ctx.passwordResetForm.get("newPassword")) == null ? null : tmp_11_0.errors == null ? null : tmp_11_0.errors["minlength"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](29, 21, "userManagement.controls.confirmPassword." + (ctx.type === "reset" ? "label" : "altLabel")));
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", (tmp_13_0 = ctx.passwordResetForm.get("confirmPassword")) == null ? null : tmp_13_0.hasError("doesNotMatch"));
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](34, 23, ctx.type === "reset" ? "userManagement.resetPassword" : "userManagement.confirmUser"), " ");
        }
      },
      dependencies: [_angular_material_card__WEBPACK_IMPORTED_MODULE_12__.MatCardModule, _angular_material_card__WEBPACK_IMPORTED_MODULE_12__.MatCard, _angular_material_card__WEBPACK_IMPORTED_MODULE_12__.MatCardContent, _angular_material_card__WEBPACK_IMPORTED_MODULE_12__.MatCardHeader, _angular_material_card__WEBPACK_IMPORTED_MODULE_12__.MatCardTitle, _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_1__.DfAlertComponent, _angular_material_divider__WEBPACK_IMPORTED_MODULE_13__.MatDividerModule, _angular_material_divider__WEBPACK_IMPORTED_MODULE_13__.MatDivider, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_6__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_6__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.FormControlName, _angular_common__WEBPACK_IMPORTED_MODULE_10__.NgIf, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_15__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_15__.MatInput, _angular_material_button__WEBPACK_IMPORTED_MODULE_16__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_16__.MatButton, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_17__.TranslocoPipe],
      styles: [".user-management-card-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  height: 100%;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%] {\n  padding: 16px 16px;\n  margin: 0 auto;\n  min-width: 300px;\n  max-width: 445px;\n  box-shadow: var(--mdc-elevated-card-container-elevation);\n  --mdc-elevated-card-container-shape: 4px;\n  --mdc-outlined-card-container-shape: 4px;\n  --mdc-outlined-card-outline-width: 1px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-header[_ngcontent-%COMP%] {\n  padding-bottom: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%] {\n  padding-top: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%] {\n  padding-top: 32px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%]   .services-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  padding-top: 16px;\n  gap: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-form-field[_ngcontent-%COMP%], .user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   .action-links[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n}\n\n.user-management-card-container[_ngcontent-%COMP%] {\n  margin-top: 20vh;\n}\n.user-management-card-container.dark-theme[_ngcontent-%COMP%] {\n  background-color: #1e1e1e;\n  color: #fff;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLXVzZXItbWFuYWdlbWVudC9hZGYtdXNlci1tYW5hZ2VtZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSx1QkFBQTtFQUNBLFlBQUE7QUFDRjtBQUNFO0VBQ0Usa0JBQUE7RUFDQSxjQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtFQUNBLHdEQUFBO0VBQ0Esd0NBQUE7RUFDQSx3Q0FBQTtFQUNBLHNDQUFBO0FBQ0o7QUFBSTtFQUNFLG9CQUFBO0FBRU47QUFBSTtFQUNFLGlCQUFBO0FBRU47QUFETTtFQUNFLGlCQUFBO0FBR1I7QUFGUTtFQUNFLGFBQUE7RUFDQSxlQUFBO0VBQ0EsaUJBQUE7RUFDQSxTQUFBO0FBSVY7QUFBSTs7RUFFRSxXQUFBO0FBRU47QUFBSTtFQUNFLGFBQUE7RUFDQSx5QkFBQTtBQUVOOztBQUdBO0VBQ0UsZ0JBQUE7QUFBRjtBQUVFO0VBQ0UseUJBQUE7RUFDQSxXQUFBO0FBQUoiLCJzb3VyY2VzQ29udGVudCI6WyIudXNlci1tYW5hZ2VtZW50LWNhcmQtY29udGFpbmVyIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGhlaWdodDogMTAwJTtcblxuICAudXNlci1tYW5hZ2VtZW50LWNhcmQge1xuICAgIHBhZGRpbmc6IDE2cHggMTZweDtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBtaW4td2lkdGg6IDMwMHB4O1xuICAgIG1heC13aWR0aDogNDQ1cHg7XG4gICAgYm94LXNoYWRvdzogdmFyKC0tbWRjLWVsZXZhdGVkLWNhcmQtY29udGFpbmVyLWVsZXZhdGlvbik7XG4gICAgLS1tZGMtZWxldmF0ZWQtY2FyZC1jb250YWluZXItc2hhcGU6IDRweDtcbiAgICAtLW1kYy1vdXRsaW5lZC1jYXJkLWNvbnRhaW5lci1zaGFwZTogNHB4O1xuICAgIC0tbWRjLW91dGxpbmVkLWNhcmQtb3V0bGluZS13aWR0aDogMXB4O1xuICAgIG1hdC1jYXJkLWhlYWRlciB7XG4gICAgICBwYWRkaW5nLWJvdHRvbTogMTZweDtcbiAgICB9XG4gICAgbWF0LWNhcmQtY29udGVudCB7XG4gICAgICBwYWRkaW5nLXRvcDogMTZweDtcbiAgICAgIC5zZXJ2aWNlcy1zZWN0aW9uIHtcbiAgICAgICAgcGFkZGluZy10b3A6IDMycHg7XG4gICAgICAgIC5zZXJ2aWNlcy1jb250YWluZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgICAgIHBhZGRpbmctdG9wOiAxNnB4O1xuICAgICAgICAgIGdhcDogMTZweDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBtYXQtZm9ybS1maWVsZCxcbiAgICBidXR0b24ge1xuICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuICAgIC5hY3Rpb24tbGlua3Mge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgfVxuICB9XG59XG5cbi51c2VyLW1hbmFnZW1lbnQtY2FyZC1jb250YWluZXIge1xuICBtYXJnaW4tdG9wOiAyMHZoO1xuXG4gICYuZGFyay10aGVtZSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzFlMWUxZTtcbiAgICBjb2xvcjogI2ZmZjtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfPasswordResetComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_18__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_19__.UntilDestroy)({
  checkProperties: true
})], DfPasswordResetComponent);

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

/***/ }),

/***/ 69465:
/*!******************************************************!*\
  !*** ./src/app/shared/validators/match.validator.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   matchValidator: () => (/* binding */ matchValidator)
/* harmony export */ });
function matchValidator(fieldToMatch) {
  return control => {
    const parent = control.parent;
    if (parent) {
      const matchingField = parent.get(fieldToMatch);
      if (matchingField && control.value !== matchingField.value) {
        return {
          doesNotMatch: true
        };
      }
    }
    return null;
  };
}

/***/ })

}]);
//# sourceMappingURL=src_app_adf-user-management_df-password-reset_df-password-reset_component_ts.js.map