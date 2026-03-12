"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-user-management_df-forgot-password_df-forgot-password_component_ts"],{

/***/ 24060:
/*!****************************************************************************************!*\
  !*** ./src/app/adf-user-management/df-forgot-password/df-forgot-password.component.ts ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfForgotPasswordComponent: () => (/* binding */ DfForgotPasswordComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! rxjs */ 36647);
/* harmony import */ var _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var _shared_validators_match_validator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/validators/match.validator */ 69465);
/* harmony import */ var _shared_types_routes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/types/routes */ 23472);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_divider__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/divider */ 14102);
/* harmony import */ var _angular_material_card__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/card */ 53777);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var _services_df_password_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../services/df-password.service */ 79676);
/* harmony import */ var _services_df_auth_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../services/df-auth.service */ 34387);



























function DfForgotPasswordComponent_form_10_mat_form_field_1_mat_error_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "userManagement.controls.email.errors.invalid"), " ");
  }
}
function DfForgotPasswordComponent_form_10_mat_form_field_1_mat_error_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "userManagement.controls.email.errors.required"), " ");
  }
}
function DfForgotPasswordComponent_form_10_mat_form_field_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-form-field", 10)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](4, "input", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](5, DfForgotPasswordComponent_form_10_mat_form_field_1_mat_error_5_Template, 3, 3, "mat-error", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](6, DfForgotPasswordComponent_form_10_mat_form_field_1_mat_error_6_Template, 3, 3, "mat-error", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"](2);
    let tmp_1_0;
    let tmp_2_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](3, 3, "userManagement.controls.email.label"), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ((tmp_1_0 = ctx_r2.forgetPasswordForm.get("email")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["email"]) && !((tmp_1_0 = ctx_r2.forgetPasswordForm.get("email")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", !((tmp_2_0 = ctx_r2.forgetPasswordForm.get("email")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["email"]) && ((tmp_2_0 = ctx_r2.forgetPasswordForm.get("email")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["required"]));
  }
}
function DfForgotPasswordComponent_form_10_mat_form_field_2_mat_error_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "userManagement.controls.username.errors.required"), " ");
  }
}
function DfForgotPasswordComponent_form_10_mat_form_field_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-form-field", 10)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](4, "input", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](5, DfForgotPasswordComponent_form_10_mat_form_field_2_mat_error_5_Template, 3, 3, "mat-error", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"](2);
    let tmp_1_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](3, 2, "userManagement.controls.username.altLabel"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", (tmp_1_0 = ctx_r3.forgetPasswordForm.get("username")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]);
  }
}
function DfForgotPasswordComponent_form_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "form", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("ngSubmit", function DfForgotPasswordComponent_form_10_Template_form_ngSubmit_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵrestoreView"](_r8);
      const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵresetView"](ctx_r7.requestReset());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](1, DfForgotPasswordComponent_form_10_mat_form_field_1_Template, 7, 5, "mat-form-field", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](2, DfForgotPasswordComponent_form_10_mat_form_field_2_Template, 6, 4, "mat-form-field", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](3, "button", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](5, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("formGroup", ctx_r0.forgetPasswordForm);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx_r0.loginAttribute === "email");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx_r0.loginAttribute === "username");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](5, 4, "userManagement.requestPasswordReset"), " ");
  }
}
function DfForgotPasswordComponent_form_11_mat_error_11_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "userManagement.controls.securityAnswer.errors.required"), " ");
  }
}
function DfForgotPasswordComponent_form_11_mat_error_17_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.required"), " ");
  }
}
function DfForgotPasswordComponent_form_11_mat_error_18_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.length"), " ");
  }
}
function DfForgotPasswordComponent_form_11_mat_error_24_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "userManagement.controls.confirmPassword.errors.match"), " ");
  }
}
function DfForgotPasswordComponent_form_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "form", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("ngSubmit", function DfForgotPasswordComponent_form_11_Template_form_ngSubmit_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵrestoreView"](_r14);
      const ctx_r13 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵresetView"](ctx_r13.resetPassword());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](1, "mat-form-field", 10)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](5, "input", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](6, "mat-form-field", 10)(7, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](8);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](9, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](10, "input", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](11, DfForgotPasswordComponent_form_11_mat_error_11_Template, 3, 3, "mat-error", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](12, "mat-form-field", 10)(13, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](14);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](15, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](16, "input", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](17, DfForgotPasswordComponent_form_11_mat_error_17_Template, 3, 3, "mat-error", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](18, DfForgotPasswordComponent_form_11_mat_error_18_Template, 3, 3, "mat-error", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](19, "mat-form-field", 10)(20, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](21);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](22, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](23, "input", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](24, DfForgotPasswordComponent_form_11_mat_error_24_Template, 3, 3, "mat-error", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](25, "button", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](26);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](27, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
    let tmp_4_0;
    let tmp_6_0;
    let tmp_7_0;
    let tmp_9_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("formGroup", ctx_r1.securityQuestionForm);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](4, 11, "userManagement.controls.securityQuestion.label"), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("readonly", true);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](9, 13, "userManagement.controls.securityAnswer.label"), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", (tmp_4_0 = ctx_r1.securityQuestionForm.get("answer")) == null ? null : tmp_4_0.errors == null ? null : tmp_4_0.errors["required"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](15, 15, "userManagement.controls.password.label"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", (tmp_6_0 = ctx_r1.securityQuestionForm.get("newPassword")) == null ? null : tmp_6_0.errors == null ? null : tmp_6_0.errors["required"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", (tmp_7_0 = ctx_r1.securityQuestionForm.get("newPassword")) == null ? null : tmp_7_0.errors == null ? null : tmp_7_0.errors["minlength"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](22, 17, "userManagement.controls.confirmPassword.label"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", (tmp_9_0 = ctx_r1.securityQuestionForm.get("confirmPassword")) == null ? null : tmp_9_0.hasError("doesNotMatch"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](27, 19, "userManagement.resetPassword"), " ");
  }
}
let DfForgotPasswordComponent = class DfForgotPasswordComponent {
  constructor(fb, systemConfigDataService, passwordService, translateService, router, authService) {
    this.fb = fb;
    this.systemConfigDataService = systemConfigDataService;
    this.passwordService = passwordService;
    this.translateService = translateService;
    this.router = router;
    this.authService = authService;
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.loginAttribute = 'email';
    this.hasSecurityQuestion = false;
    this.loginRoute = `/${_shared_types_routes__WEBPACK_IMPORTED_MODULE_2__.ROUTES.AUTH}/${_shared_types_routes__WEBPACK_IMPORTED_MODULE_2__.ROUTES.LOGIN}`;
    this.forgetPasswordForm = this.fb.group({
      username: [''],
      email: ['']
    });
    this.securityQuestionForm = this.fb.group({
      securityQuestion: [''],
      securityAnswer: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required],
      newPassword: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.minLength(16)]],
      confirmPassword: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required, (0,_shared_validators_match_validator__WEBPACK_IMPORTED_MODULE_1__.matchValidator)('newPassword')]]
    });
  }
  ngOnInit() {
    this.systemConfigDataService.environment$.subscribe(env => {
      this.loginAttribute = env.authentication.loginAttribute;
      if (this.loginAttribute === 'username') {
        this.forgetPasswordForm.controls['username'].setValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]);
      } else {
        this.forgetPasswordForm.controls['email'].setValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.email]);
      }
    });
  }
  requestReset() {
    if (this.forgetPasswordForm.invalid) {
      return;
    }
    this.passwordService.requestPasswordReset(this.loginAttribute === 'username' ? {
      username: this.forgetPasswordForm.controls['username'].value
    } : {
      email: this.forgetPasswordForm.controls['email'].value
    }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_8__.catchError)(err => {
      this.alertMsg = err.error.error.message;
      this.showAlert = true;
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_9__.throwError)(() => new Error(err));
    })).subscribe(res => {
      this.showAlert = false;
      if ('securityQuestion' in res) {
        this.hasSecurityQuestion = true;
        this.securityQuestionForm.controls['securityQuestion'].setValue(res.securityQuestion);
      } else {
        this.alertMsg = this.translateService.translate('userManagement.alerts.resetEmailSent');
        this.showAlert = true;
        this.alertType = 'success';
      }
    });
  }
  resetPassword() {
    if (this.securityQuestionForm.invalid) {
      return;
    }
    this.passwordService.requestPasswordReset({
      ...this.forgetPasswordForm.value,
      ...this.securityQuestionForm.value
    }, true).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_8__.catchError)(err => {
      this.alertMsg = err.error.error.message;
      this.showAlert = true;
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_9__.throwError)(() => new Error(err));
    }), (0,rxjs__WEBPACK_IMPORTED_MODULE_10__.switchMap)(() => {
      const credentials = {
        password: this.securityQuestionForm.controls['newPassword'].value
      };
      if (this.loginAttribute === 'username') {
        credentials['username'] = this.forgetPasswordForm.controls['username'].value;
      } else {
        credentials['email'] = this.forgetPasswordForm.controls['email'].value;
      }
      return this.authService.login(credentials);
    })).subscribe(() => {
      this.showAlert = false;
      this.router.navigate([`/`]);
    });
  }
  static {
    this.ɵfac = function DfForgotPasswordComponent_Factory(t) {
      return new (t || DfForgotPasswordComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_services_df_password_service__WEBPACK_IMPORTED_MODULE_4__.DfPasswordService), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__.TranslocoService), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_12__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_services_df_auth_service__WEBPACK_IMPORTED_MODULE_5__.DfAuthService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdefineComponent"]({
      type: DfForgotPasswordComponent,
      selectors: [["df-forgot-password"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵStandaloneFeature"]],
      decls: 16,
      vars: 12,
      consts: [[1, "user-management-card-container"], [1, "user-management-card"], [3, "showAlert", "alertType", "alertClosed"], ["name", "forget-password-form", 3, "formGroup", "ngSubmit", 4, "ngIf"], ["name", "security-questions-form", 3, "formGroup", "ngSubmit", 4, "ngIf"], [1, "action-links"], ["mat-button", "", "target", "_self", 3, "routerLink"], ["name", "forget-password-form", 3, "formGroup", "ngSubmit"], ["appearance", "outline", 4, "ngIf"], ["mat-flat-button", "", "color", "primary", "type", "submit"], ["appearance", "outline"], ["matInput", "", "type", "email", "formControlName", "email"], [4, "ngIf"], ["matInput", "", "type", "text", "formControlName", "username"], ["name", "security-questions-form", 3, "formGroup", "ngSubmit"], ["matInput", "", "type", "text", "formControlName", "securityQuestion", 3, "readonly"], ["matInput", "", "type", "text", "formControlName", "securityAnswer"], ["matInput", "", "type", "password", "formControlName", "newPassword"], ["matInput", "", "type", "password", "formControlName", "confirmPassword"]],
      template: function DfForgotPasswordComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "div", 0)(1, "mat-card", 1)(2, "df-alert", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("alertClosed", function DfForgotPasswordComponent_Template_df_alert_alertClosed_2_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](4, "mat-card-header")(5, "mat-card-title");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](7, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](8, "mat-divider");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](9, "mat-card-content");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](10, DfForgotPasswordComponent_form_10_Template, 6, 6, "form", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](11, DfForgotPasswordComponent_form_11_Template, 28, 21, "form", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](12, "div", 5)(13, "a", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](14);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](15, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()()()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](ctx.alertMsg);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](7, 8, "userManagement.passwordReset"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", !ctx.hasSecurityQuestion);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.hasSecurityQuestion);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("routerLink", ctx.loginRoute);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](15, 10, "userManagement.login"));
        }
      },
      dependencies: [_angular_material_card__WEBPACK_IMPORTED_MODULE_13__.MatCardModule, _angular_material_card__WEBPACK_IMPORTED_MODULE_13__.MatCard, _angular_material_card__WEBPACK_IMPORTED_MODULE_13__.MatCardContent, _angular_material_card__WEBPACK_IMPORTED_MODULE_13__.MatCardHeader, _angular_material_card__WEBPACK_IMPORTED_MODULE_13__.MatCardTitle, _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_0__.DfAlertComponent, _angular_material_divider__WEBPACK_IMPORTED_MODULE_14__.MatDividerModule, _angular_material_divider__WEBPACK_IMPORTED_MODULE_14__.MatDivider, _angular_common__WEBPACK_IMPORTED_MODULE_15__.NgIf, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_7__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_7__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormControlName, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_16__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_16__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_16__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_16__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_17__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_17__.MatInput, _angular_material_button__WEBPACK_IMPORTED_MODULE_18__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_18__.MatAnchor, _angular_material_button__WEBPACK_IMPORTED_MODULE_18__.MatButton, _angular_router__WEBPACK_IMPORTED_MODULE_12__.RouterLink, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__.TranslocoPipe],
      styles: [".user-management-card-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  height: 100%;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%] {\n  padding: 16px 16px;\n  margin: 0 auto;\n  min-width: 300px;\n  max-width: 445px;\n  box-shadow: var(--mdc-elevated-card-container-elevation);\n  --mdc-elevated-card-container-shape: 4px;\n  --mdc-outlined-card-container-shape: 4px;\n  --mdc-outlined-card-outline-width: 1px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-header[_ngcontent-%COMP%] {\n  padding-bottom: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%] {\n  padding-top: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%] {\n  padding-top: 32px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%]   .services-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  padding-top: 16px;\n  gap: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-form-field[_ngcontent-%COMP%], .user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   .action-links[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n}\n\n.user-management-card-container[_ngcontent-%COMP%] {\n  margin-top: 20vh;\n}\n.user-management-card-container.dark-theme[_ngcontent-%COMP%] {\n  background-color: #1e1e1e;\n  color: #fff;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLXVzZXItbWFuYWdlbWVudC9hZGYtdXNlci1tYW5hZ2VtZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSx1QkFBQTtFQUNBLFlBQUE7QUFDRjtBQUNFO0VBQ0Usa0JBQUE7RUFDQSxjQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtFQUNBLHdEQUFBO0VBQ0Esd0NBQUE7RUFDQSx3Q0FBQTtFQUNBLHNDQUFBO0FBQ0o7QUFBSTtFQUNFLG9CQUFBO0FBRU47QUFBSTtFQUNFLGlCQUFBO0FBRU47QUFETTtFQUNFLGlCQUFBO0FBR1I7QUFGUTtFQUNFLGFBQUE7RUFDQSxlQUFBO0VBQ0EsaUJBQUE7RUFDQSxTQUFBO0FBSVY7QUFBSTs7RUFFRSxXQUFBO0FBRU47QUFBSTtFQUNFLGFBQUE7RUFDQSx5QkFBQTtBQUVOOztBQUdBO0VBQ0UsZ0JBQUE7QUFBRjtBQUVFO0VBQ0UseUJBQUE7RUFDQSxXQUFBO0FBQUoiLCJzb3VyY2VzQ29udGVudCI6WyIudXNlci1tYW5hZ2VtZW50LWNhcmQtY29udGFpbmVyIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGhlaWdodDogMTAwJTtcblxuICAudXNlci1tYW5hZ2VtZW50LWNhcmQge1xuICAgIHBhZGRpbmc6IDE2cHggMTZweDtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBtaW4td2lkdGg6IDMwMHB4O1xuICAgIG1heC13aWR0aDogNDQ1cHg7XG4gICAgYm94LXNoYWRvdzogdmFyKC0tbWRjLWVsZXZhdGVkLWNhcmQtY29udGFpbmVyLWVsZXZhdGlvbik7XG4gICAgLS1tZGMtZWxldmF0ZWQtY2FyZC1jb250YWluZXItc2hhcGU6IDRweDtcbiAgICAtLW1kYy1vdXRsaW5lZC1jYXJkLWNvbnRhaW5lci1zaGFwZTogNHB4O1xuICAgIC0tbWRjLW91dGxpbmVkLWNhcmQtb3V0bGluZS13aWR0aDogMXB4O1xuICAgIG1hdC1jYXJkLWhlYWRlciB7XG4gICAgICBwYWRkaW5nLWJvdHRvbTogMTZweDtcbiAgICB9XG4gICAgbWF0LWNhcmQtY29udGVudCB7XG4gICAgICBwYWRkaW5nLXRvcDogMTZweDtcbiAgICAgIC5zZXJ2aWNlcy1zZWN0aW9uIHtcbiAgICAgICAgcGFkZGluZy10b3A6IDMycHg7XG4gICAgICAgIC5zZXJ2aWNlcy1jb250YWluZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgICAgIHBhZGRpbmctdG9wOiAxNnB4O1xuICAgICAgICAgIGdhcDogMTZweDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBtYXQtZm9ybS1maWVsZCxcbiAgICBidXR0b24ge1xuICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuICAgIC5hY3Rpb24tbGlua3Mge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgfVxuICB9XG59XG5cbi51c2VyLW1hbmFnZW1lbnQtY2FyZC1jb250YWluZXIge1xuICBtYXJnaW4tdG9wOiAyMHZoO1xuXG4gICYuZGFyay10aGVtZSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzFlMWUxZTtcbiAgICBjb2xvcjogI2ZmZjtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfForgotPasswordComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_19__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_20__.UntilDestroy)({
  checkProperties: true
})], DfForgotPasswordComponent);

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
//# sourceMappingURL=src_app_adf-user-management_df-forgot-password_df-forgot-password_component_ts.js.map