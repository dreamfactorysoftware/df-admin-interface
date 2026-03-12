"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-profile_df-profile_df-profile_component_ts"],{

/***/ 44972:
/*!****************************************************************!*\
  !*** ./src/app/adf-profile/df-profile/df-profile.component.ts ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfProfileComponent: () => (/* binding */ DfProfileComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _shared_validators_match_validator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/validators/match.validator */ 69465);
/* harmony import */ var _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _shared_components_df_profile_details_df_profile_details_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/components/df-profile-details/df-profile-details.component */ 77493);
/* harmony import */ var _angular_material_tabs__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/tabs */ 38223);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _services_df_profile_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../services/df-profile.service */ 79846);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var _shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../shared/services/df-breakpoint.service */ 52608);
/* harmony import */ var _adf_user_management_services_df_password_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../adf-user-management/services/df-password.service */ 79676);

























function DfProfileComponent_mat_form_field_9_mat_error_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 1, "userManagement.controls.currentPassword.errors.required"), " ");
  }
}
function DfProfileComponent_mat_form_field_9_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "mat-form-field", 9)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](4, "input", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](5, DfProfileComponent_mat_form_field_9_mat_error_5_Template, 3, 3, "mat-error", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵnextContext"]();
    let tmp_1_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](3, 2, "userManagement.controls.currentPassword.label"));
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", (tmp_1_0 = ctx_r0.profileForm.get("currentPassword")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]);
  }
}
function DfProfileComponent_mat_error_45_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 1, "userManagement.controls.oldPassword.errors.required"), " ");
  }
}
function DfProfileComponent_mat_error_51_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.required"), " ");
  }
}
function DfProfileComponent_mat_error_52_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.length"), " ");
  }
}
function DfProfileComponent_mat_error_58_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](2, 1, "userManagement.controls.confirmPassword.errors.match"), " ");
  }
}
let DfProfileComponent = class DfProfileComponent {
  constructor(profileService, fb, activatedRoute, systemConfigDataService, breakPointService, translateService, passwordService) {
    this.profileService = profileService;
    this.fb = fb;
    this.activatedRoute = activatedRoute;
    this.systemConfigDataService = systemConfigDataService;
    this.breakPointService = breakPointService;
    this.translateService = translateService;
    this.passwordService = passwordService;
    this.loginAttribute = 'email';
    this.isSmallScreen = this.breakPointService.isSmallScreen;
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.needPassword = false;
    this.profileForm = this.fb.group({
      profileDetailsGroup: this.fb.group({
        username: [''],
        email: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.email],
        firstName: [''],
        lastName: [''],
        name: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required],
        phone: ['']
      })
    });
    this.securityQuestionForm = this.fb.group({
      securityQuestion: [''],
      securityAnswer: ['']
    });
    this.updatePasswordForm = this.fb.group({
      oldPassword: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required],
      newPassword: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.minLength(16)]],
      confirmPassword: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required, (0,_shared_validators_match_validator__WEBPACK_IMPORTED_MODULE_0__.matchValidator)('newPassword')]]
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(({
      data
    }) => {
      this.currentProfile = data;
      this.profileForm.patchValue({
        profileDetailsGroup: {
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          name: data.name,
          phone: data.phone
        }
      });
      this.securityQuestionForm.patchValue({
        securityQuestion: data.securityQuestion
      });
    });
    this.systemConfigDataService.environment$.subscribe(env => {
      this.loginAttribute = env.authentication.loginAttribute;
      if (this.loginAttribute === 'username') {
        this.profileForm.get('profileDetailsGroup.username')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required]);
      } else {
        this.profileForm.get('profileDetailsGroup.email')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required]);
      }
    });
    this.profileForm.get('profileDetailsGroup.email')?.valueChanges.subscribe(val => {
      if (this.currentProfile.email !== val) {
        this.needPassword = true;
        this.profileForm.addControl('currentPassword', new _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_8__.Validators.required));
      } else {
        this.needPassword = false;
        this.profileForm.removeControl('currentPassword');
      }
    });
  }
  updateProfile() {
    if (this.profileForm.invalid || this.profileForm.pristine) {
      return;
    }
    const body = {
      ...this.currentProfile,
      ...this.profileForm.controls['profileDetailsGroup'].value
    };
    if (this.needPassword) {
      body.currentPassword = this.profileForm.controls['currentPassword'].value;
    }
    this.profileService.saveProfile(body).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_9__.catchError)(err => {
      this.triggerAlert('error', err.error.error.message);
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_10__.throwError)(() => new Error(err));
    })).subscribe(() => {
      this.triggerAlert('success', this.translateService.translate('userManagement.profile.alerts.detailsUpdated'));
    });
  }
  triggerAlert(type, msg) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }
  updateSecurityQuestion() {
    if (this.securityQuestionForm.invalid || this.securityQuestionForm.pristine) {
      return;
    }
    const body = {
      ...this.currentProfile,
      ...this.securityQuestionForm.value
    };
    this.profileService.saveProfile(body).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_9__.catchError)(err => {
      this.triggerAlert('error', err.error.error.message);
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_10__.throwError)(() => new Error(err));
    })).subscribe(() => {
      this.triggerAlert('success', this.translateService.translate('userManagement.profile.alerts.securtyQuestionUpdated'));
      this.securityQuestionForm.controls['securityAnswer'].setValue(null);
    });
  }
  updatePassword() {
    if (this.updatePasswordForm.invalid || this.updatePasswordForm.pristine) {
      return;
    }
    this.passwordService.updatePassword(this.updatePasswordForm.value).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_9__.catchError)(err => {
      this.triggerAlert('error', err.error.error.message);
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_10__.throwError)(() => new Error(err));
    })).subscribe(() => {
      this.triggerAlert('success', this.translateService.translate('userManagement.profile.alerts.passwordUpdated'));
      this.updatePasswordForm.reset();
    });
  }
  static {
    this.ɵfac = function DfProfileComponent_Factory(t) {
      return new (t || DfProfileComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_services_df_profile_service__WEBPACK_IMPORTED_MODULE_3__.DfProfileService), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_11__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_4__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_5__.DfBreakpointService), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__.TranslocoService), _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdirectiveInject"](_adf_user_management_services_df_password_service__WEBPACK_IMPORTED_MODULE_6__.DfPasswordService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵdefineComponent"]({
      type: DfProfileComponent,
      selectors: [["df-profile"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵStandaloneFeature"]],
      decls: 62,
      vars: 57,
      consts: [["dynamicHeight", "", "mat-stretch-tabs", "false", "mat-align-tabs", "start", 3, "selectedTabChange"], [3, "label"], [1, "tab-container"], [3, "showAlert", "alertType", "alertClosed"], ["name", "user-profile-form", 3, "formGroup", "ngSubmit"], ["formGroupName", "profileDetailsGroup"], ["appearance", "outline", 4, "ngIf"], ["mat-flat-button", "", "color", "primary", "type", "submit"], ["name", "security-question-form", 3, "formGroup", "ngSubmit"], ["appearance", "outline"], ["matInput", "", "formControlName", "securityQuestion"], ["matInput", "", "formControlName", "securityAnswer"], ["name", "update-password-form", 3, "formGroup", "ngSubmit"], ["matInput", "", "type", "password", "formControlName", "oldPassword"], [4, "ngIf"], ["matInput", "", "type", "password", "formControlName", "newPassword"], ["matInput", "", "type", "password", "formControlName", "confirmPassword"], ["matInput", "", "type", "password", "formControlName", "currentPassword"]],
      template: function DfProfileComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](0, "mat-tab-group", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("selectedTabChange", function DfProfileComponent_Template_mat_tab_group_selectedTabChange_0_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](1, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](2, "mat-tab", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](3, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](4, "div", 2)(5, "df-alert", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("alertClosed", function DfProfileComponent_Template_df_alert_alertClosed_5_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](7, "form", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("ngSubmit", function DfProfileComponent_Template_form_ngSubmit_7_listener() {
            return ctx.updateProfile();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](8, "df-profile-details", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](9, DfProfileComponent_mat_form_field_9_Template, 6, 4, "mat-form-field", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](10, "button", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](11);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](12, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]()()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](13, "mat-tab", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](14, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](15, "div", 2)(16, "df-alert", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("alertClosed", function DfProfileComponent_Template_df_alert_alertClosed_16_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](17);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](18, "form", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("ngSubmit", function DfProfileComponent_Template_form_ngSubmit_18_listener() {
            return ctx.updateSecurityQuestion();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](19, "mat-form-field", 9)(20, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](21);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](22, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](23, "input", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](24, "mat-form-field", 9)(25, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](26);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](27, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](28, "input", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](29, "button", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](30);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](31, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]()()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](32, "mat-tab", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](33, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](34, "div", 2)(35, "df-alert", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("alertClosed", function DfProfileComponent_Template_df_alert_alertClosed_35_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](36);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](37, "form", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("ngSubmit", function DfProfileComponent_Template_form_ngSubmit_37_listener() {
            return ctx.updatePassword();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](38, "df-alert", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵlistener"]("alertClosed", function DfProfileComponent_Template_df_alert_alertClosed_38_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](39);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](40, "mat-form-field", 9)(41, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](42);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](43, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](44, "input", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](45, DfProfileComponent_mat_error_45_Template, 3, 3, "mat-error", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](46, "mat-form-field", 9)(47, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](48);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](49, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](50, "input", 15);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](51, DfProfileComponent_mat_error_51_Template, 3, 3, "mat-error", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](52, DfProfileComponent_mat_error_52_Template, 3, 3, "mat-error", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](53, "mat-form-field", 9)(54, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](55);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](56, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelement"](57, "input", 16);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtemplate"](58, DfProfileComponent_mat_error_58_Template, 3, 3, "mat-error", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementStart"](59, "button", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtext"](60);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipe"](61, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵelementEnd"]()()()()();
        }
        if (rf & 2) {
          let tmp_25_0;
          let tmp_27_0;
          let tmp_28_0;
          let tmp_30_0;
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](1, 33, ctx.isSmallScreen) ? "small" : "large");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("label", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](3, 35, "userManagement.profile.tabs.details"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](ctx.alertMsg);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("formGroup", ctx.profileForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", ctx.needPassword);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](12, 37, "save"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("label", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](14, 39, "userManagement.profile.tabs.securityQuestion"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](ctx.alertMsg);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("formGroup", ctx.securityQuestionForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](22, 41, "userManagement.controls.securityQuestion.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](27, 43, "userManagement.controls.securityAnswer.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](31, 45, "save"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("label", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](33, 47, "userManagement.profile.tabs.password"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](ctx.alertMsg);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("formGroup", ctx.updatePasswordForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](ctx.alertMsg);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](43, 49, "userManagement.controls.oldPassword.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", (tmp_25_0 = ctx.updatePasswordForm.get("oldPassword")) == null ? null : tmp_25_0.errors == null ? null : tmp_25_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](49, 51, "userManagement.controls.password.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", (tmp_27_0 = ctx.updatePasswordForm.get("newPassword")) == null ? null : tmp_27_0.errors == null ? null : tmp_27_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", (tmp_28_0 = ctx.updatePasswordForm.get("newPassword")) == null ? null : tmp_28_0.errors == null ? null : tmp_28_0.errors["minlength"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](56, 53, "userManagement.controls.confirmPassword.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵproperty"]("ngIf", (tmp_30_0 = ctx.updatePasswordForm.get("confirmPassword")) == null ? null : tmp_30_0.hasError("doesNotMatch"));
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_7__["ɵɵpipeBind1"](61, 55, "save"), " ");
        }
      },
      dependencies: [_angular_material_tabs__WEBPACK_IMPORTED_MODULE_13__.MatTabsModule, _angular_material_tabs__WEBPACK_IMPORTED_MODULE_13__.MatTab, _angular_material_tabs__WEBPACK_IMPORTED_MODULE_13__.MatTabGroup, _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_1__.DfAlertComponent, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_8__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_8__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_8__.FormGroupName, _shared_components_df_profile_details_df_profile_details_component__WEBPACK_IMPORTED_MODULE_2__.DfProfileDetailsComponent, _angular_common__WEBPACK_IMPORTED_MODULE_14__.NgIf, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_16__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_16__.MatInput, _angular_material_button__WEBPACK_IMPORTED_MODULE_17__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_17__.MatButton, _angular_common__WEBPACK_IMPORTED_MODULE_14__.AsyncPipe, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__.TranslocoPipe],
      encapsulation: 2
    });
  }
};
DfProfileComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_18__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_19__.UntilDestroy)({
  checkProperties: true
})], DfProfileComponent);

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
//# sourceMappingURL=src_app_adf-profile_df-profile_df-profile_component_ts.js.map