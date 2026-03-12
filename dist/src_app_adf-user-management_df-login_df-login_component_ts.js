"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-user-management_df-login_df-login_component_ts"],{

/***/ 58616:
/*!********************************************************************!*\
  !*** ./src/app/adf-user-management/df-login/df-login.component.ts ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfLoginComponent: () => (/* binding */ DfLoginComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _shared_types_routes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/types/routes */ 23472);
/* harmony import */ var _shared_utilities_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/utilities/icons */ 58923);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_divider__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/divider */ 14102);
/* harmony import */ var _angular_material_card__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/card */ 53777);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var _services_df_auth_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../services/df-auth.service */ 34387);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);
/* harmony import */ var src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! src/app/shared/services/df-snackbar.service */ 75680);
/* harmony import */ var src_app_shared_components_df_popup_popup_overlay_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! src/app/shared/components/df-popup/popup-overlay.service */ 74547);
/* harmony import */ var src_app_shared_services_error_sharing_service__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! src/app/shared/services/error-sharing.service */ 38161);





































function DfLoginComponent_mat_form_field_15_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "mat-option", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const service_r9 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("value", service_r9.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", service_r9.label, " ");
  }
}
function DfLoginComponent_mat_form_field_15_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "mat-form-field", 8)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](4, "mat-select", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelement"](5, "mat-option");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](6, DfLoginComponent_mat_form_field_15_mat_option_6_Template, 2, 2, "mat-option", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](3, 2, "userManagement.controls.services.label"), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngForOf", ctx_r0.ldapServices);
  }
}
function DfLoginComponent_mat_form_field_16_mat_error_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](2, 1, "userManagement.controls.email.errors.invalid"), " ");
  }
}
function DfLoginComponent_mat_form_field_16_mat_error_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](2, 1, "userManagement.controls.email.errors.required"), " ");
  }
}
function DfLoginComponent_mat_form_field_16_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "mat-form-field", 8)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelement"](4, "input", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](5, DfLoginComponent_mat_form_field_16_mat_error_5_Template, 3, 3, "mat-error", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](6, DfLoginComponent_mat_form_field_16_mat_error_6_Template, 3, 3, "mat-error", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"]();
    let tmp_1_0;
    let tmp_2_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](3, 3, "userManagement.controls.email.label"), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", ((tmp_1_0 = ctx_r1.loginForm.get("email")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["email"]) && !((tmp_1_0 = ctx_r1.loginForm.get("email")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]));
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", !((tmp_2_0 = ctx_r1.loginForm.get("email")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["email"]) && ((tmp_2_0 = ctx_r1.loginForm.get("email")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["required"]));
  }
}
function DfLoginComponent_mat_form_field_17_mat_error_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](2, 1, "userManagement.controls.username.errors.required"), " ");
  }
}
function DfLoginComponent_mat_form_field_17_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "mat-form-field", 8)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelement"](4, "input", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](5, DfLoginComponent_mat_form_field_17_mat_error_5_Template, 3, 3, "mat-error", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"]();
    let tmp_1_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](3, 2, "userManagement.controls.username.altLabel"));
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", (tmp_1_0 = ctx_r2.loginForm.get("username")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]);
  }
}
function DfLoginComponent_mat_error_23_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.required"), " ");
  }
}
function DfLoginComponent_ng_container_27_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementContainer"](0);
  }
}
function DfLoginComponent_ng_container_29_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementContainer"](0);
  }
}
function DfLoginComponent_ng_template_35_div_0_ng_container_5_a_1_fa_icon_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "fa-icon", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const service_r17 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"](2).$implicit;
    const ctx_r20 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("icon", ctx_r20.getIcon(service_r17.iconClass));
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate"](service_r17.label);
  }
}
function DfLoginComponent_ng_template_35_div_0_ng_container_5_a_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "a", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](1, DfLoginComponent_ng_template_35_div_0_ng_container_5_a_1_fa_icon_1_Template, 2, 2, "fa-icon", 27);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const service_r17 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"]().$implicit;
    const ctx_r18 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("href", "/api/v2/" + service_r17.path, _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵsanitizeUrl"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵattribute"]("aria-label", service_r17.label);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", ctx_r18.iconExist(service_r17.iconClass));
  }
}
function DfLoginComponent_ng_template_35_div_0_ng_container_5_a_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "a", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const service_r17 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("href", "/api/v2/" + service_r17.path, _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵsanitizeUrl"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", service_r17.label, " ");
  }
}
function DfLoginComponent_ng_template_35_div_0_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](1, DfLoginComponent_ng_template_35_div_0_ng_container_5_a_1_Template, 2, 3, "a", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](2, DfLoginComponent_ng_template_35_div_0_ng_container_5_a_2_Template, 2, 2, "a", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const service_r17 = ctx.$implicit;
    const ctx_r16 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", ctx_r16.iconExist(service_r17.iconClass));
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", !ctx_r16.iconExist(service_r17.iconClass));
  }
}
function DfLoginComponent_ng_template_35_div_0_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "div", 22)(1, "h3");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelement"](3, "mat-divider");
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](4, "div", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](5, DfLoginComponent_ng_template_35_div_0_ng_container_5_Template, 3, 2, "ng-container", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r24 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵnextContext"]();
    const title_r14 = ctx_r24.title;
    const services_r13 = ctx_r24.services;
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate"](title_r14);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngForOf", services_r13);
  }
}
function DfLoginComponent_ng_template_35_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](0, DfLoginComponent_ng_template_35_div_0_Template, 6, 2, "div", 21);
  }
  if (rf & 2) {
    const services_r13 = ctx.services;
    _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", services_r13.length);
  }
}
const _c0 = function (a0, a1) {
  return {
    services: a0,
    title: a1
  };
};
let DfLoginComponent = class DfLoginComponent {
  constructor(fb, systemConfigDataService, authService, router, themeService, snackbarService, popupOverlay, errorSharingService) {
    this.fb = fb;
    this.systemConfigDataService = systemConfigDataService;
    this.authService = authService;
    this.router = router;
    this.themeService = themeService;
    this.snackbarService = snackbarService;
    this.popupOverlay = popupOverlay;
    this.errorSharingService = errorSharingService;
    this.MINIMUM_PASSWORD_LENGTH = 16;
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.envloginAttribute = 'email';
    this.loginAttribute = 'email';
    this.ldapServices = [];
    this.oauthServices = [];
    this.samlServices = [];
    this.fpRoute = `/${_shared_types_routes__WEBPACK_IMPORTED_MODULE_1__.ROUTES.AUTH}/${_shared_types_routes__WEBPACK_IMPORTED_MODULE_1__.ROUTES.FORGOT_PASSWORD}`;
    this.isDarkMode = this.themeService.darkMode$;
    this.iconExist = _shared_utilities_icons__WEBPACK_IMPORTED_MODULE_2__.iconExist;
    this.getIcon = _shared_utilities_icons__WEBPACK_IMPORTED_MODULE_2__.getIcon;
    this.loginForm = this.fb.group({
      services: [''],
      username: [''],
      email: [''],
      password: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required]]
    });
  }
  ngOnInit() {
    // Check for shared error first
    this.errorSharingService.error$.subscribe(sharedError => {
      if (sharedError) {
        // Decode the error message properly (remove URL encoding)
        const decodedError = decodeURIComponent(sharedError.replace(/\+/g, ' '));
        // Set the alert message for the built-in alert display
        this.alertMsg = decodedError;
        this.showAlert = true;
        this.alertType = 'error';
        // Clear the error after displaying it
        this.errorSharingService.clearError();
      }
    });
    this.systemConfigDataService.environment$.subscribe(env => {
      this.envloginAttribute = env.authentication.loginAttribute;
      this.setLoginAttribute(env.authentication.loginAttribute);
      this.ldapServices = env.authentication.adldap;
      this.oauthServices = env.authentication.oauth;
      this.samlServices = env.authentication.saml;
    });
    this.loginForm.controls['services'].valueChanges.subscribe(value => {
      if (value) {
        this.setLoginAttribute('username');
      } else {
        this.setLoginAttribute(this.envloginAttribute);
      }
    });
    this.snackbarService.setSnackbarLastEle('', false);
  }
  setLoginAttribute(attribute) {
    this.loginAttribute = attribute;
    if (attribute === 'username') {
      this.loginForm.controls['username'].addValidators(_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required);
      this.loginForm.controls['email'].clearValidators();
    } else {
      this.loginForm.controls['email'].addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required, _angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.email]);
      this.loginForm.controls['username'].clearValidators();
    }
    this.loginForm.controls['username'].updateValueAndValidity();
    this.loginForm.controls['email'].updateValueAndValidity();
  }
  login() {
    if (this.loginForm.invalid) {
      return;
    }
    const isPasswordTooShort = this.loginForm.value.password.length < this.MINIMUM_PASSWORD_LENGTH;
    const credentials = {
      password: this.loginForm.value.password
    };
    if (this.ldapServices.length && this.loginForm.value.services !== '') {
      credentials.service = this.loginForm.value.services;
    }
    if (this.loginAttribute === 'username') {
      credentials.username = credentials.email = this.loginForm.value.username;
    } else {
      credentials.email = this.loginForm.value.email;
    }
    this.authService.login(credentials).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_11__.catchError)(err => {
      if (err.status === 401 && isPasswordTooShort) {
        this.popupOverlay.open({
          message: `It looks like your password is too short. Our new system requires at least ${this.MINIMUM_PASSWORD_LENGTH} characters. Please reset your password to continue.`,
          showRemindMeLater: false
        });
      } else {
        this.alertMsg = err.error?.error?.message || 'Login failed';
        this.showAlert = true;
      }
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_12__.throwError)(() => new Error(err));
    })).subscribe(() => {
      this.showAlert = false;
      if (isPasswordTooShort) {
        this.popupOverlay.open({
          message: `Your current password is shorter than recommended (less than ${this.MINIMUM_PASSWORD_LENGTH} characters). For better security, we recommend updating your password to a longer one.`,
          showRemindMeLater: true
        });
      }
      this.router.navigate([_shared_types_routes__WEBPACK_IMPORTED_MODULE_1__.ROUTES.HOME]);
    });
  }
  static {
    this.ɵfac = function DfLoginComponent_Factory(t) {
      return new (t || DfLoginComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_services_df_auth_service__WEBPACK_IMPORTED_MODULE_4__.DfAuthService), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_13__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_5__.DfThemeService), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_6__.DfSnackbarService), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](src_app_shared_components_df_popup_popup_overlay_service__WEBPACK_IMPORTED_MODULE_7__.PopupOverlayService), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](src_app_shared_services_error_sharing_service__WEBPACK_IMPORTED_MODULE_8__.ErrorSharingService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdefineComponent"]({
      type: DfLoginComponent,
      selectors: [["df-user-login"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵStandaloneFeature"]],
      decls: 37,
      vars: 39,
      consts: [[1, "user-management-card-container"], [1, "left-panel"], ["src", "assets/img/logo.png", "alt", "DreamFactory Logo", 1, "logo"], [1, "right-panel"], [1, "user-management-card"], [3, "showAlert", "alertType", "alertClosed"], ["name", "login-form", 3, "formGroup", "ngSubmit"], ["appearance", "outline", 4, "ngIf"], ["appearance", "outline"], ["matInput", "", "type", "password", "formControlName", "password"], [4, "ngIf"], ["mat-flat-button", "", "color", "primary", "type", "submit"], [4, "ngTemplateOutlet", "ngTemplateOutletContext"], [1, "action-links"], ["mat-button", "", "target", "_self", 3, "routerLink"], ["authServices", ""], ["formControlName", "services"], [3, "value", 4, "ngFor", "ngForOf"], [3, "value"], ["matInput", "", "type", "email", "formControlName", "email"], ["matInput", "", "type", "text", "formControlName", "username"], ["class", "services-section", 4, "ngIf"], [1, "services-section"], [1, "services-container"], [4, "ngFor", "ngForOf"], ["mat-flat-button", "", "color", "primary", 3, "href", 4, "ngIf"], ["mat-flat-button", "", "color", "primary", 3, "href"], ["size", "2x", 3, "icon", 4, "ngIf"], ["size", "2x", 3, "icon"]],
      template: function DfLoginComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](1, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](2, "div", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelement"](3, "img", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](4, "div", 3)(5, "mat-card", 4)(6, "df-alert", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵlistener"]("alertClosed", function DfLoginComponent_Template_df_alert_alertClosed_6_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](7);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](8, "mat-card-header")(9, "mat-card-title");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](10);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](11, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelement"](12, "mat-divider");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](13, "mat-card-content")(14, "form", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵlistener"]("ngSubmit", function DfLoginComponent_Template_form_ngSubmit_14_listener() {
            return ctx.login();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](15, DfLoginComponent_mat_form_field_15_Template, 7, 4, "mat-form-field", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](16, DfLoginComponent_mat_form_field_16_Template, 7, 5, "mat-form-field", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](17, DfLoginComponent_mat_form_field_17_Template, 6, 4, "mat-form-field", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](18, "mat-form-field", 8)(19, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](20);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](21, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelement"](22, "input", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](23, DfLoginComponent_mat_error_23_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](24, "button", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](25);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](26, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](27, DfLoginComponent_ng_container_27_Template, 1, 0, "ng-container", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](28, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](29, DfLoginComponent_ng_container_29_Template, 1, 0, "ng-container", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](30, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementStart"](31, "div", 13)(32, "a", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtext"](33);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipe"](34, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵelementEnd"]()()()()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplate"](35, DfLoginComponent_ng_template_35_Template, 1, 1, "ng-template", null, 15, _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtemplateRefExtractor"]);
        }
        if (rf & 2) {
          const _r6 = _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵreference"](36);
          let tmp_10_0;
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](1, 19, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate"](ctx.alertMsg);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](11, 21, "userManagement.login"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("formGroup", ctx.loginForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", ctx.ldapServices.length);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", ctx.loginAttribute === "email");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", ctx.loginAttribute === "username");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](21, 23, "userManagement.controls.password.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngIf", (tmp_10_0 = ctx.loginForm.get("password")) == null ? null : tmp_10_0.errors == null ? null : tmp_10_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](26, 25, "userManagement.login"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngTemplateOutlet", _r6)("ngTemplateOutletContext", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpureFunction2"](33, _c0, ctx.oauthServices, _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](28, 27, "userManagement.oAuth")));
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("ngTemplateOutlet", _r6)("ngTemplateOutletContext", _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpureFunction2"](36, _c0, ctx.samlServices, _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](30, 29, "userManagement.saml")));
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵproperty"]("routerLink", ctx.fpRoute);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵpipeBind1"](34, 31, "userManagement.forgotPassword"));
        }
      },
      dependencies: [_angular_material_card__WEBPACK_IMPORTED_MODULE_14__.MatCardModule, _angular_material_card__WEBPACK_IMPORTED_MODULE_14__.MatCard, _angular_material_card__WEBPACK_IMPORTED_MODULE_14__.MatCardContent, _angular_material_card__WEBPACK_IMPORTED_MODULE_14__.MatCardHeader, _angular_material_card__WEBPACK_IMPORTED_MODULE_14__.MatCardTitle, _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_0__.DfAlertComponent, _angular_material_divider__WEBPACK_IMPORTED_MODULE_15__.MatDividerModule, _angular_material_divider__WEBPACK_IMPORTED_MODULE_15__.MatDivider, _angular_forms__WEBPACK_IMPORTED_MODULE_10__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_10__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_10__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_10__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_10__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControlName, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgIf, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_17__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_17__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_17__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_17__.MatError, _angular_material_select__WEBPACK_IMPORTED_MODULE_18__.MatSelectModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_18__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_19__.MatOption, _angular_material_core__WEBPACK_IMPORTED_MODULE_19__.MatOptionModule, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgFor, _angular_material_input__WEBPACK_IMPORTED_MODULE_20__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_20__.MatInput, _angular_material_button__WEBPACK_IMPORTED_MODULE_21__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_21__.MatAnchor, _angular_material_button__WEBPACK_IMPORTED_MODULE_21__.MatButton, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgTemplateOutlet, _angular_router__WEBPACK_IMPORTED_MODULE_13__.RouterLink, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_22__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_22__.FaIconComponent, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_23__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_16__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_16__.AsyncPipe],
      styles: [".user-management-card-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  height: 100%;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%] {\n  padding: 16px 16px;\n  margin: 0 auto;\n  min-width: 300px;\n  max-width: 445px;\n  box-shadow: var(--mdc-elevated-card-container-elevation);\n  --mdc-elevated-card-container-shape: 4px;\n  --mdc-outlined-card-container-shape: 4px;\n  --mdc-outlined-card-outline-width: 1px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-header[_ngcontent-%COMP%] {\n  padding-bottom: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%] {\n  padding-top: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%] {\n  padding-top: 32px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%]   .services-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  padding-top: 16px;\n  gap: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-form-field[_ngcontent-%COMP%], .user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   .action-links[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n}\n\n.user-management-card-container[_ngcontent-%COMP%] {\n  margin-top: 20vh;\n}\n.user-management-card-container.dark-theme[_ngcontent-%COMP%] {\n  background-color: #1e1e1e;\n  color: #fff;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLXVzZXItbWFuYWdlbWVudC9hZGYtdXNlci1tYW5hZ2VtZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSx1QkFBQTtFQUNBLFlBQUE7QUFDRjtBQUNFO0VBQ0Usa0JBQUE7RUFDQSxjQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtFQUNBLHdEQUFBO0VBQ0Esd0NBQUE7RUFDQSx3Q0FBQTtFQUNBLHNDQUFBO0FBQ0o7QUFBSTtFQUNFLG9CQUFBO0FBRU47QUFBSTtFQUNFLGlCQUFBO0FBRU47QUFETTtFQUNFLGlCQUFBO0FBR1I7QUFGUTtFQUNFLGFBQUE7RUFDQSxlQUFBO0VBQ0EsaUJBQUE7RUFDQSxTQUFBO0FBSVY7QUFBSTs7RUFFRSxXQUFBO0FBRU47QUFBSTtFQUNFLGFBQUE7RUFDQSx5QkFBQTtBQUVOOztBQUdBO0VBQ0UsZ0JBQUE7QUFBRjtBQUVFO0VBQ0UseUJBQUE7RUFDQSxXQUFBO0FBQUoiLCJzb3VyY2VzQ29udGVudCI6WyIudXNlci1tYW5hZ2VtZW50LWNhcmQtY29udGFpbmVyIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGhlaWdodDogMTAwJTtcblxuICAudXNlci1tYW5hZ2VtZW50LWNhcmQge1xuICAgIHBhZGRpbmc6IDE2cHggMTZweDtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBtaW4td2lkdGg6IDMwMHB4O1xuICAgIG1heC13aWR0aDogNDQ1cHg7XG4gICAgYm94LXNoYWRvdzogdmFyKC0tbWRjLWVsZXZhdGVkLWNhcmQtY29udGFpbmVyLWVsZXZhdGlvbik7XG4gICAgLS1tZGMtZWxldmF0ZWQtY2FyZC1jb250YWluZXItc2hhcGU6IDRweDtcbiAgICAtLW1kYy1vdXRsaW5lZC1jYXJkLWNvbnRhaW5lci1zaGFwZTogNHB4O1xuICAgIC0tbWRjLW91dGxpbmVkLWNhcmQtb3V0bGluZS13aWR0aDogMXB4O1xuICAgIG1hdC1jYXJkLWhlYWRlciB7XG4gICAgICBwYWRkaW5nLWJvdHRvbTogMTZweDtcbiAgICB9XG4gICAgbWF0LWNhcmQtY29udGVudCB7XG4gICAgICBwYWRkaW5nLXRvcDogMTZweDtcbiAgICAgIC5zZXJ2aWNlcy1zZWN0aW9uIHtcbiAgICAgICAgcGFkZGluZy10b3A6IDMycHg7XG4gICAgICAgIC5zZXJ2aWNlcy1jb250YWluZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgICAgIHBhZGRpbmctdG9wOiAxNnB4O1xuICAgICAgICAgIGdhcDogMTZweDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBtYXQtZm9ybS1maWVsZCxcbiAgICBidXR0b24ge1xuICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuICAgIC5hY3Rpb24tbGlua3Mge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgfVxuICB9XG59XG5cbi51c2VyLW1hbmFnZW1lbnQtY2FyZC1jb250YWluZXIge1xuICBtYXJnaW4tdG9wOiAyMHZoO1xuXG4gICYuZGFyay10aGVtZSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzFlMWUxZTtcbiAgICBjb2xvcjogI2ZmZjtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */", ".left-panel[_ngcontent-%COMP%] {\n  display: block;\n  margin-left: auto;\n  margin-right: auto;\n  margin-top: 16px;\n}\n\n.left-panel[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  min-width: 300px;\n  max-width: 445px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLXVzZXItbWFuYWdlbWVudC9kZi1sb2dpbi9kZi1sb2dpbi5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGNBQUE7RUFDQSxpQkFBQTtFQUNBLGtCQUFBO0VBQ0EsZ0JBQUE7QUFDRjs7QUFFQTtFQUNFLGdCQUFBO0VBQ0EsZ0JBQUE7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbIi5sZWZ0LXBhbmVsIHtcbiAgZGlzcGxheTogYmxvY2s7XG4gIG1hcmdpbi1sZWZ0OiBhdXRvO1xuICBtYXJnaW4tcmlnaHQ6IGF1dG87XG4gIG1hcmdpbi10b3A6IDE2cHg7XG59XG5cbi5sZWZ0LXBhbmVsIGltZyB7XG4gIG1pbi13aWR0aDogMzAwcHg7XG4gIG1heC13aWR0aDogNDQ1cHg7XG59XG4iXSwic291cmNlUm9vdCI6IiJ9 */"]
    });
  }
};
DfLoginComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_24__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_25__.UntilDestroy)({
  checkProperties: true
})], DfLoginComponent);

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

/***/ 15849:
/*!******************************************************************!*\
  !*** ./src/app/shared/components/df-popup/df-popup.component.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PopupComponent: () => (/* binding */ PopupComponent)
/* harmony export */ });
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/dialog */ 12587);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _types_routes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../types/routes */ 23472);
/* harmony import */ var _popup_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./popup-config */ 10622);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _popup_overlay_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./popup-overlay.service */ 74547);
/* harmony import */ var src_app_adf_user_management_services_df_auth_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/adf-user-management/services/df-auth.service */ 34387);












function PopupComponent_button_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "button", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵlistener"]("click", function PopupComponent_button_11_Template_button_click_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵrestoreView"](_r2);
      const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵresetView"](ctx_r1.closePopup(false));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "Remind me later"), " ");
  }
}
class PopupComponent {
  constructor(router, popupOverlay, authService, config) {
    this.router = router;
    this.popupOverlay = popupOverlay;
    this.authService = authService;
    this.config = config;
  }
  get message() {
    return this.config?.message || 'Your current password is shorter than recommended (less than 17 characters). For better security, we recommend updating your password to a longer one.';
  }
  get showRemindMeLater() {
    return this.config?.showRemindMeLater !== false;
  }
  closePopup(shouldRedirect = false) {
    this.popupOverlay.close();
    if (shouldRedirect) {
      this.authService.logout([_types_routes__WEBPACK_IMPORTED_MODULE_0__.ROUTES.AUTH, _types_routes__WEBPACK_IMPORTED_MODULE_0__.ROUTES.RESET_PASSWORD]);
    }
  }
  static {
    this.ɵfac = function PopupComponent_Factory(t) {
      return new (t || PopupComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_5__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_popup_overlay_service__WEBPACK_IMPORTED_MODULE_2__.PopupOverlayService), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](src_app_adf_user_management_services_df_auth_service__WEBPACK_IMPORTED_MODULE_3__.DfAuthService), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_popup_config__WEBPACK_IMPORTED_MODULE_1__.POPUP_CONFIG, 8));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdefineComponent"]({
      type: PopupComponent,
      selectors: [["df-popup"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵStandaloneFeature"]],
      decls: 15,
      vars: 10,
      consts: [[1, "popup-container"], [1, "popup"], [1, "popup-header"], [1, "popup-content"], [1, "popup-actions"], ["mat-stroked-button", "", "type", "button", 3, "click", 4, "ngIf"], ["mat-flat-button", "", "color", "primary", "type", "button", 3, "click"], ["mat-stroked-button", "", "type", "button", 3, "click"]],
      template: function PopupComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "h2");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](5, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](6, "div", 3)(7, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](8);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](9, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](10, "div", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](11, PopupComponent_button_11_Template, 3, 3, "button", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](12, "button", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵlistener"]("click", function PopupComponent_Template_button_click_12_listener() {
            return ctx.closePopup(true);
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](13);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](14, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]()()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](5, 4, "Password Security Notice"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](9, 6, ctx.message));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.showRemindMeLater);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](14, 8, "Update Password Now"), " ");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_6__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_6__.NgIf, _angular_material_button__WEBPACK_IMPORTED_MODULE_7__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_7__.MatButton, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_8__.MatDialogModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_9__.TranslocoPipe],
      styles: [".popup-container[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  z-index: 10000;\n}\n\n.popup[_ngcontent-%COMP%] {\n  position: relative;\n  width: 90%;\n  max-width: 500px;\n  background: #ffffff;\n  border-radius: 12px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);\n  padding: 24px;\n  z-index: 10001;\n  animation: _ngcontent-%COMP%_popupFadeIn 0.3s ease-out;\n}\n.popup[_ngcontent-%COMP%]   .popup-header[_ngcontent-%COMP%] {\n  margin-bottom: 20px;\n  text-align: center;\n}\n.popup[_ngcontent-%COMP%]   .popup-header[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0;\n  color: #333333;\n  font-size: 1.5rem;\n  font-weight: 600;\n}\n.popup[_ngcontent-%COMP%]   .popup-content[_ngcontent-%COMP%] {\n  margin-bottom: 24px;\n  text-align: center;\n}\n.popup[_ngcontent-%COMP%]   .popup-content[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 8px 0;\n  color: #666666;\n  line-height: 1.5;\n}\n.popup[_ngcontent-%COMP%]   .popup-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: center;\n  gap: 12px;\n}\n.popup[_ngcontent-%COMP%]   .popup-actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  min-width: 120px;\n  padding: 8px 16px;\n  font-weight: 500;\n  transition: all 0.2s ease;\n}\n.popup[_ngcontent-%COMP%]   .popup-actions[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {\n  transform: translateY(-1px);\n}\n\n@keyframes _ngcontent-%COMP%_popupFadeIn {\n  from {\n    opacity: 0;\n    transform: translateY(-20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.actions[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n}\n\n.popup-header[_ngcontent-%COMP%] {\n  font-size: 18px;\n  font-weight: bold;\n  color: #6d4ec9;\n  margin-bottom: 10px;\n}\n\n.popup-content[_ngcontent-%COMP%] {\n  font-size: 14px;\n  margin-bottom: 15px;\n}\n\n.popup-close[_ngcontent-%COMP%] {\n  background: #6d4ec9;\n  color: #fff;\n  border: none;\n  padding: 10px 15px;\n  border-radius: 8px;\n  cursor: pointer;\n  font-size: 14px;\n  transition: background 0.3s ease;\n}\n.popup-close[_ngcontent-%COMP%]:hover {\n  background: #5a3bb3;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtcG9wdXAvZGYtcG9wdXAuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFDRSxhQUFBO0VBQ0EsdUJBQUE7RUFDQSxtQkFBQTtFQUNBLGVBQUE7RUFDQSxNQUFBO0VBQ0EsT0FBQTtFQUNBLFlBQUE7RUFDQSxhQUFBO0VBQ0EsY0FBQTtBQUFGOztBQUdBO0VBQ0Usa0JBQUE7RUFDQSxVQUFBO0VBQ0EsZ0JBQUE7RUFDQSxtQkFBQTtFQUNBLG1CQUFBO0VBQ0EsMENBQUE7RUFDQSxhQUFBO0VBQ0EsY0FBQTtFQUNBLG9DQUFBO0FBQUY7QUFFRTtFQUNFLG1CQUFBO0VBQ0Esa0JBQUE7QUFBSjtBQUVJO0VBQ0UsU0FBQTtFQUNBLGNBQUE7RUFDQSxpQkFBQTtFQUNBLGdCQUFBO0FBQU47QUFJRTtFQUNFLG1CQUFBO0VBQ0Esa0JBQUE7QUFGSjtBQUlJO0VBQ0UsYUFBQTtFQUNBLGNBQUE7RUFDQSxnQkFBQTtBQUZOO0FBTUU7RUFDRSxhQUFBO0VBQ0EsdUJBQUE7RUFDQSxTQUFBO0FBSko7QUFNSTtFQUNFLGdCQUFBO0VBQ0EsaUJBQUE7RUFDQSxnQkFBQTtFQUNBLHlCQUFBO0FBSk47QUFNTTtFQUNFLDJCQUFBO0FBSlI7O0FBVUE7RUFDRTtJQUNFLFVBQUE7SUFDQSw0QkFBQTtFQVBGO0VBU0E7SUFDRSxVQUFBO0lBQ0Esd0JBQUE7RUFQRjtBQUNGO0FBVUE7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7QUFSRjs7QUFZQTtFQUNFLGVBQUE7RUFDQSxpQkFBQTtFQUNBLGNBQUE7RUFDQSxtQkFBQTtBQVRGOztBQWFBO0VBQ0UsZUFBQTtFQUNBLG1CQUFBO0FBVkY7O0FBY0E7RUFDRSxtQkFBQTtFQUNBLFdBQUE7RUFDQSxZQUFBO0VBQ0Esa0JBQUE7RUFDQSxrQkFBQTtFQUNBLGVBQUE7RUFDQSxlQUFBO0VBQ0EsZ0NBQUE7QUFYRjtBQWFFO0VBQ0UsbUJBQUE7QUFYSiIsInNvdXJjZXNDb250ZW50IjpbIi8vIFBvcHVwIENvbnRhaW5lclxuLnBvcHVwLWNvbnRhaW5lciB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHRvcDogMDtcbiAgbGVmdDogMDtcbiAgd2lkdGg6IDEwMHZ3O1xuICBoZWlnaHQ6IDEwMHZoO1xuICB6LWluZGV4OiAxMDAwMDtcbn1cblxuLnBvcHVwIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICB3aWR0aDogOTAlO1xuICBtYXgtd2lkdGg6IDUwMHB4O1xuICBiYWNrZ3JvdW5kOiAjZmZmZmZmO1xuICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICBib3gtc2hhZG93OiAwIDhweCAzMnB4IHJnYmEoMCwgMCwgMCwgMC4xNSk7XG4gIHBhZGRpbmc6IDI0cHg7XG4gIHotaW5kZXg6IDEwMDAxO1xuICBhbmltYXRpb246IHBvcHVwRmFkZUluIDAuM3MgZWFzZS1vdXQ7XG5cbiAgLnBvcHVwLWhlYWRlciB7XG4gICAgbWFyZ2luLWJvdHRvbTogMjBweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG5cbiAgICBoMiB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBjb2xvcjogIzMzMzMzMztcbiAgICAgIGZvbnQtc2l6ZTogMS41cmVtO1xuICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICB9XG4gIH1cblxuICAucG9wdXAtY29udGVudCB7XG4gICAgbWFyZ2luLWJvdHRvbTogMjRweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG5cbiAgICBwIHtcbiAgICAgIG1hcmdpbjogOHB4IDA7XG4gICAgICBjb2xvcjogIzY2NjY2NjtcbiAgICAgIGxpbmUtaGVpZ2h0OiAxLjU7XG4gICAgfVxuICB9XG5cbiAgLnBvcHVwLWFjdGlvbnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgZ2FwOiAxMnB4O1xuXG4gICAgYnV0dG9uIHtcbiAgICAgIG1pbi13aWR0aDogMTIwcHg7XG4gICAgICBwYWRkaW5nOiA4cHggMTZweDtcbiAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBlYXNlO1xuXG4gICAgICAmOmhvdmVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xcHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5Aa2V5ZnJhbWVzIHBvcHVwRmFkZUluIHtcbiAgZnJvbSB7XG4gICAgb3BhY2l0eTogMDtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTIwcHgpO1xuICB9XG4gIHRvIHtcbiAgICBvcGFjaXR5OiAxO1xuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTtcbiAgfVxufVxuXG4uYWN0aW9ucyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG59XG5cbi8vIFBvcHVwIEhlYWRlclxuLnBvcHVwLWhlYWRlciB7XG4gIGZvbnQtc2l6ZTogMThweDtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGNvbG9yOiAjNmQ0ZWM5OyAvLyBNYXRjaGVzIHNpZGViYXIgY29sb3JcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbn1cblxuLy8gUG9wdXAgQ29udGVudFxuLnBvcHVwLWNvbnRlbnQge1xuICBmb250LXNpemU6IDE0cHg7XG4gIG1hcmdpbi1ib3R0b206IDE1cHg7XG59XG5cbi8vIENsb3NlIEJ1dHRvblxuLnBvcHVwLWNsb3NlIHtcbiAgYmFja2dyb3VuZDogIzZkNGVjOTsgLy8gTWF0Y2ggdGhlbWVcbiAgY29sb3I6ICNmZmY7XG4gIGJvcmRlcjogbm9uZTtcbiAgcGFkZGluZzogMTBweCAxNXB4O1xuICBib3JkZXItcmFkaXVzOiA4cHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC1zaXplOiAxNHB4O1xuICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuM3MgZWFzZTtcblxuICAmOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiAjNWEzYmIzOyAvLyBEYXJrZXIgb24gaG92ZXJcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
}

/***/ }),

/***/ 10622:
/*!************************************************************!*\
  !*** ./src/app/shared/components/df-popup/popup-config.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POPUP_CONFIG: () => (/* binding */ POPUP_CONFIG)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);

const POPUP_CONFIG = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.InjectionToken('POPUP_CONFIG');

/***/ }),

/***/ 74547:
/*!*********************************************************************!*\
  !*** ./src/app/shared/components/df-popup/popup-overlay.service.ts ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PopupOverlayService: () => (/* binding */ PopupOverlayService)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_cdk_portal__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/cdk/portal */ 9168);
/* harmony import */ var _df_popup_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./df-popup.component */ 15849);
/* harmony import */ var _popup_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./popup-config */ 10622);
/* harmony import */ var _angular_cdk_overlay__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/cdk/overlay */ 81570);






class PopupOverlayService {
  constructor(overlay, injector) {
    this.overlay = overlay;
    this.injector = injector;
    this.overlayRef = null;
  }
  open(config) {
    if (this.overlayRef) return;
    const injector = _angular_core__WEBPACK_IMPORTED_MODULE_2__.Injector.create({
      providers: [{
        provide: _popup_config__WEBPACK_IMPORTED_MODULE_1__.POPUP_CONFIG,
        useValue: config
      }],
      parent: this.injector
    });
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'popup-backdrop',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block()
    });
    const portal = new _angular_cdk_portal__WEBPACK_IMPORTED_MODULE_3__.ComponentPortal(_df_popup_component__WEBPACK_IMPORTED_MODULE_0__.PopupComponent, null, injector);
    this.overlayRef.attach(portal);
    this.overlayRef.backdropClick().subscribe(() => this.close());
  }
  close() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
  static {
    this.ɵfac = function PopupOverlayService_Factory(t) {
      return new (t || PopupOverlayService)(_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵinject"](_angular_cdk_overlay__WEBPACK_IMPORTED_MODULE_4__.Overlay), _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵinject"](_angular_core__WEBPACK_IMPORTED_MODULE_2__.Injector));
    };
  }
  static {
    this.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineInjectable"]({
      token: PopupOverlayService,
      factory: PopupOverlayService.ɵfac,
      providedIn: 'root'
    });
  }
}

/***/ }),

/***/ 58923:
/*!*******************************************!*\
  !*** ./src/app/shared/utilities/icons.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getIcon: () => (/* binding */ getIcon),
/* harmony export */   iconExist: () => (/* binding */ iconExist)
/* harmony export */ });
/* harmony import */ var _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @fortawesome/free-brands-svg-icons */ 23997);

const supportedIcons = {
  google: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faGoogle,
  github: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faGithub,
  microsoft: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faMicrosoft,
  amazon: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faAmazon,
  apple: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faApple,
  linkedin: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faLinkedin,
  bitbucket: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faBitbucket,
  facebook: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faFacebook,
  salesforce: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faSalesforce,
  twitch: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faTwitch,
  openid: _fortawesome_free_brands_svg_icons__WEBPACK_IMPORTED_MODULE_0__.faOpenid
};
function iconExist(icon) {
  return Object.keys(supportedIcons).includes(icon);
}
function getIcon(icon) {
  return supportedIcons[icon];
}

/***/ })

}]);
//# sourceMappingURL=src_app_adf-user-management_df-login_df-login_component_ts.js.map