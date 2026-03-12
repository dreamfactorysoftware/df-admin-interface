"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-users_df-user-details_df-user-details_component_ts"],{

/***/ 40939:
/*!************************************************************************!*\
  !*** ./src/app/adf-users/df-user-details/df-user-details.component.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfUserDetailsComponent: () => (/* binding */ DfUserDetailsComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var src_app_shared_utilities_parse_errors__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/utilities/parse-errors */ 53012);
/* harmony import */ var src_app_shared_components_df_user_details_df_user_details_base_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/components/df-user-details/df-user-details-base.component */ 76765);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _shared_components_df_lookup_keys_df_lookup_keys_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/components/df-lookup-keys/df-lookup-keys.component */ 58751);
/* harmony import */ var _shared_components_df_user_app_roles_df_user_app_roles_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../shared/components/df-user-app-roles/df-user-app-roles.component */ 30877);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! @angular/material/checkbox */ 97024);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_radio__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @angular/material/radio */ 53804);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _shared_components_df_profile_details_df_profile_details_component__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../shared/components/df-profile-details/df-profile-details.component */ 77493);
/* harmony import */ var _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! src/app/shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var src_app_shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! src/app/shared/services/df-breakpoint.service */ 52608);
/* harmony import */ var src_app_shared_services_df_paywall_service__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! src/app/shared/services/df-paywall.service */ 95351);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);




































function DfUserDetailsComponent_ng_container_11_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](1, "df-alert", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](4, "mat-radio-group", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](5, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](6, "mat-radio-button", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](8, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](9, "mat-radio-button", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](10);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](11, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"]();
    let tmp_0_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("alertType", ((tmp_0_0 = ctx_r0.userForm.get("pass-invite")) == null ? null : tmp_0_0.touched) && ((tmp_0_0 = ctx_r0.userForm.get("pass-invite")) == null ? null : tmp_0_0.invalid) ? "error" : "info")("showAlert", true)("dismissible", false);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](3, 7, ctx_r0.userType + ".alerts.new"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵattribute"]("aria-label", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](5, 9, "selectAnOption"));
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](8, 11, "userManagement.controls.sendInvite.label"));
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](11, 13, "userManagement.controls.setPassword.label"));
  }
}
function DfUserDetailsComponent_ng_template_12_button_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](0, "button", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵlistener"]("click", function DfUserDetailsComponent_ng_template_12_button_3_Template_button_click_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵrestoreView"](_r9);
      const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵresetView"](ctx_r8.sendInvite());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelement"](3, "fa-icon", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r6 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](2, 2, "sendInvite"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("icon", ctx_r6.faEnvelope);
  }
}
function DfUserDetailsComponent_ng_template_12_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](1, "mat-checkbox", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](3, 1, "userManagement.controls.setPassword.label"), " ");
  }
}
function DfUserDetailsComponent_ng_template_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](0, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](3, DfUserDetailsComponent_ng_template_12_button_3_Template, 4, 4, "button", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](4, DfUserDetailsComponent_ng_template_12_ng_container_4_Template, 4, 3, "ng-container", 8);
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate2"]("", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](2, 4, "confirmed"), ": ", ctx_r2.currentProfile.confirmed ? "Yes" : "No", "");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", !ctx_r2.currentProfile.confirmed);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", ctx_r2.userForm.contains("setPassword"));
  }
}
function DfUserDetailsComponent_ng_container_14_mat_error_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.required"), " ");
  }
}
function DfUserDetailsComponent_ng_container_14_mat_error_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](2, 1, "userManagement.controls.password.errors.length"), " ");
  }
}
function DfUserDetailsComponent_ng_container_14_mat_error_13_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](2, 1, "userManagement.controls.confirmPassword.errors.match"), " ");
  }
}
function DfUserDetailsComponent_ng_container_14_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](1, "mat-form-field", 22)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelement"](5, "input", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](6, DfUserDetailsComponent_ng_container_14_mat_error_6_Template, 3, 3, "mat-error", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](7, DfUserDetailsComponent_ng_container_14_mat_error_7_Template, 3, 3, "mat-error", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](8, "mat-form-field", 22)(9, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](10);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](11, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelement"](12, "input", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](13, DfUserDetailsComponent_ng_container_14_mat_error_13_Template, 3, 3, "mat-error", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"]();
    let tmp_1_0;
    let tmp_2_0;
    let tmp_4_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](4, 5, "userManagement.controls.password.label"));
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", (tmp_1_0 = ctx_r3.userForm.get("password")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", (tmp_2_0 = ctx_r3.userForm.get("password")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["minlength"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](11, 7, "userManagement.controls.confirmPassword.label"));
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", (tmp_4_0 = ctx_r3.userForm.get("confirmPassword")) == null ? null : tmp_4_0.hasError("doesNotMatch"));
  }
}
function DfUserDetailsComponent_ng_container_15_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r13 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](2, 1, ctx_r13.userType + ".alerts.autoRole"));
  }
}
const _c0 = function (a0) {
  return {
    roleId: a0
  };
};
function DfUserDetailsComponent_ng_container_15_ng_template_9_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](1, "transloco");
  }
  if (rf & 2) {
    const ctx_r15 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind2"](1, 1, ctx_r15.userType + ".alerts.roleId", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpureFunction1"](4, _c0, ctx_r15.currentProfile.userToAppToRoleByUserId[0].roleId)));
  }
}
function DfUserDetailsComponent_ng_container_15_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerStart"](0, 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](1, "mat-checkbox", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const tab_r17 = ctx.$implicit;
    const i_r18 = ctx.index;
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("formGroupName", i_r18);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](3, 2, "admins.tabs." + tab_r17.value.title), "");
  }
}
function DfUserDetailsComponent_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](1, "div")(2, "h3");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](5, "df-alert", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](7, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](8, DfUserDetailsComponent_ng_container_15_ng_container_8_Template, 3, 3, "ng-container", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](9, DfUserDetailsComponent_ng_container_15_ng_template_9_Template, 2, 6, "ng-template", null, 26, _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplateRefExtractor"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](11, "mat-checkbox", 27);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵlistener"]("change", function DfUserDetailsComponent_ng_container_15_Template_mat_checkbox_change_11_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵrestoreView"](_r20);
      const ctx_r19 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵresetView"](ctx_r19.selectAllTabs($event));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](12);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](13, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](14, "div", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](15, DfUserDetailsComponent_ng_container_15_ng_container_15_Template, 4, 4, "ng-container", 29);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const _r14 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵreference"](10);
    const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](4, 9, ctx_r4.userType + ".accessByTabs"));
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("showAlert", !ctx_r4.allTabsSelected)("dismissible", false);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](7, 11, ctx_r4.userType + ".alerts.restrictedAdmin"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", ctx_r4.type === "create" || ctx_r4.currentProfile.userToAppToRoleByUserId.length === 0)("ngIfElse", _r14);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("checked", ctx_r4.allTabsSelected);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](13, 13, "selectAll"), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngForOf", ctx_r4.tabs.controls);
  }
}
function DfUserDetailsComponent_df_user_app_roles_16_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelement"](0, "df-user-app-roles", 32);
  }
  if (rf & 2) {
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("apps", ctx_r5.apps)("roles", ctx_r5.roles);
  }
}
let DfUserDetailsComponent = class DfUserDetailsComponent extends src_app_shared_components_df_user_details_df_user_details_base_component__WEBPACK_IMPORTED_MODULE_1__.DfUserDetailsBaseComponent {
  constructor(fb, activatedRoute, systemConfigDataService, breakpointService, translateService, userService, router, paywallService) {
    super(fb, activatedRoute, systemConfigDataService, breakpointService, paywallService);
    this.translateService = translateService;
    this.userService = userService;
    this.router = router;
    this.userType = 'users';
  }
  sendInvite() {
    this.userService.patch(this.currentProfile.id, null, {
      snackbarSuccess: 'inviteSent'
    }).subscribe();
  }
  get userAppRoles() {
    const userAppRoles = this.userForm.value.appRoles.map(item => {
      const appRole = {
        userId: this.currentProfile.id,
        appId: this.apps.find(app => app.name === item.app)?.id,
        roleId: this.roles.find(role => role.name === item.role)?.id
      };
      if (this.type === 'create') {
        return appRole;
      }
      const modified = this.currentProfile.userToAppToRoleByUserId.find(userApp => userApp.appId === appRole.appId && userApp.roleId === appRole.roleId);
      if (modified) {
        return {
          ...appRole,
          id: modified.id
        };
      }
      return appRole;
    });
    if (this.type === 'create') {
      return userAppRoles;
    }
    this.currentProfile.userToAppToRoleByUserId.filter(userApp => !userAppRoles.find(appRole => appRole.appId === userApp.appId && appRole.roleId === userApp.roleId)).forEach(userApp => {
      userAppRoles.push({
        ...userApp,
        userId: null
      });
    });
    return userAppRoles;
  }
  save() {
    if (this.userForm.invalid) {
      return;
    }
    const data = {
      ...this.userForm.value.profileDetailsGroup,
      isActive: this.userForm.value.isActive,
      lookupByUserId: this.userForm.getRawValue().lookupKeys,
      userToAppToRoleByUserId: this.userAppRoles
    };
    if (this.type === 'create') {
      const sendInvite = this.userForm.value['pass-invite'] === 'invite';
      if (!sendInvite) {
        data.password = this.userForm.value.password;
      }
      this.userService.create({
        resource: [data]
      }, {
        snackbarSuccess: 'admins.alerts.createdSuccess',
        additionalParams: [{
          key: 'send_invite',
          value: sendInvite
        }]
      }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_12__.catchError)(err => {
        this.triggerAlert('error', this.translateService.translate((0,src_app_shared_utilities_parse_errors__WEBPACK_IMPORTED_MODULE_0__.parseError)(err.error.error.context.resource[0].message)));
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_13__.throwError)(() => new Error(err));
      })).subscribe(res => {
        this.router.navigate(['../', res.resource[0].id], {
          relativeTo: this.activatedRoute
        });
      });
    } else {
      if (this.userForm.value.setPassword) {
        data.password = this.userForm.value.password;
      }
      this.userService.update(this.currentProfile.id, data, {
        snackbarSuccess: 'admins.alerts.updateSuccess'
      }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_12__.catchError)(err => {
        this.triggerAlert('error', err.error.error.message);
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_13__.throwError)(() => new Error(err));
      })).subscribe(res => {
        this.router.navigate(['../', res.id], {
          relativeTo: this.activatedRoute
        });
      });
    }
  }
  static {
    this.ɵfac = function DfUserDetailsComponent_Factory(t) {
      return new (t || DfUserDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_14__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_15__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdirectiveInject"](src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_7__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdirectiveInject"](src_app_shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_8__.DfBreakpointService), _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdirectiveInject"](_ngneat_transloco__WEBPACK_IMPORTED_MODULE_16__.TranslocoService), _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_2__.USER_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_15__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdirectiveInject"](src_app_shared_services_df_paywall_service__WEBPACK_IMPORTED_MODULE_9__.DfPaywallService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵdefineComponent"]({
      type: DfUserDetailsComponent,
      selectors: [["df-user-details"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵInheritDefinitionFeature"], _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵStandaloneFeature"]],
      decls: 25,
      vars: 27,
      consts: [[3, "showAlert", "alertType", "alertClosed"], ["name", "admin-form", 3, "formGroup", "ngSubmit"], [1, "user-details"], ["formGroupName", "profileDetailsGroup"], [1, "additional-info"], ["color", "primary", "formControlName", "isActive"], [4, "ngIf", "ngIfElse"], ["editMode", ""], [4, "ngIf"], ["formArrayName", "appRoles", 3, "apps", "roles", 4, "ngIf"], ["formArrayName", "lookupKeys"], [1, "full-width", "action-bar"], ["mat-flat-button", "", "type", "button", 1, "cancel-btn", 3, "routerLink"], ["mat-flat-button", "", "color", "primary", "type", "submit", 1, "save-btn"], [3, "alertType", "showAlert", "dismissible"], ["formControlName", "pass-invite", 1, "pass-invite"], ["value", "invite", 1, "userform-invite-radio-btn"], ["value", "password", 1, "userform-password-radio-btn"], ["mat-flat-button", "", "color", "primary", 3, "click", 4, "ngIf"], ["mat-flat-button", "", "color", "primary", 3, "click"], [3, "icon"], ["formControlName", "setPassword"], ["appearance", "outline"], ["matInput", "", "type", "password", "formControlName", "password", 1, "user-details-set-password"], ["matInput", "", "type", "password", "formControlName", "confirmPassword", 1, "user-details-confirm-password"], ["alertType", "warning", 3, "showAlert", "dismissible"], ["hasRole", ""], [3, "checked", "change"], ["formArrayName", "tabs", 1, "access-tabs"], [3, "formGroupName", 4, "ngFor", "ngForOf"], [3, "formGroupName"], ["formControlName", "checked"], ["formArrayName", "appRoles", 3, "apps", "roles"]],
      template: function DfUserDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](0, "df-alert", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵlistener"]("alertClosed", function DfUserDetailsComponent_Template_df_alert_alertClosed_0_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](2, "form", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵlistener"]("ngSubmit", function DfUserDetailsComponent_Template_form_ngSubmit_2_listener() {
            return ctx.save();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](3, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](4, "div", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](5, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelement"](6, "df-profile-details", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](7, "div", 4)(8, "mat-slide-toggle", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](9);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](10, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](11, DfUserDetailsComponent_ng_container_11_Template, 12, 15, "ng-container", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](12, DfUserDetailsComponent_ng_template_12_Template, 5, 6, "ng-template", null, 7, _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplateRefExtractor"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](14, DfUserDetailsComponent_ng_container_14_Template, 14, 9, "ng-container", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](15, DfUserDetailsComponent_ng_container_15_Template, 16, 15, "ng-container", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtemplate"](16, DfUserDetailsComponent_df_user_app_roles_16_Template, 1, 2, "df-user-app-roles", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelement"](17, "df-lookup-keys", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](18, "div", 11)(19, "button", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](20);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](21, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementStart"](22, "button", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtext"](23);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipe"](24, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          const _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵreference"](13);
          let tmp_9_0;
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", ctx.alertMsg, "\n");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](3, 17, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("formGroup", ctx.userForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵclassProp"]("small", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](5, 19, ctx.isSmallScreen));
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](10, 21, "active"));
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", ctx.type === "create")("ngIfElse", _r1);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", ((tmp_9_0 = ctx.userForm.get("pass-invite")) == null ? null : tmp_9_0.value) === "password" || ((tmp_9_0 = ctx.userForm.get("setPassword")) == null ? null : tmp_9_0.value));
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", ctx.accessByTabs.length > 0 && ctx.userType === "admins" && (ctx.type === "create" || ctx.type === "edit" && !ctx.currentProfile.isRootAdmin));
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("ngIf", ctx.userType === "users");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵproperty"]("routerLink", ctx.cancelRoute);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](21, 23, "cancel"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_11__["ɵɵpipeBind1"](24, 25, ctx.type === "create" ? "create" : "update"), " ");
        }
      },
      dependencies: [_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_6__.DfAlertComponent, _angular_forms__WEBPACK_IMPORTED_MODULE_14__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_14__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_14__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_14__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_14__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_14__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_14__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_14__.FormGroupName, _angular_forms__WEBPACK_IMPORTED_MODULE_14__.FormArrayName, _shared_components_df_profile_details_df_profile_details_component__WEBPACK_IMPORTED_MODULE_5__.DfProfileDetailsComponent, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_17__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_17__.MatSlideToggle, _angular_common__WEBPACK_IMPORTED_MODULE_18__.NgIf, _angular_material_radio__WEBPACK_IMPORTED_MODULE_19__.MatRadioModule, _angular_material_radio__WEBPACK_IMPORTED_MODULE_19__.MatRadioGroup, _angular_material_radio__WEBPACK_IMPORTED_MODULE_19__.MatRadioButton, _angular_material_button__WEBPACK_IMPORTED_MODULE_20__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_20__.MatButton, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_21__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_21__.FaIconComponent, _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_22__.MatCheckboxModule, _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_22__.MatCheckbox, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_23__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_23__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_23__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_23__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_24__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_24__.MatInput, _angular_common__WEBPACK_IMPORTED_MODULE_18__.NgFor, _shared_components_df_user_app_roles_df_user_app_roles_component__WEBPACK_IMPORTED_MODULE_4__.DfUserAppRolesComponent, _shared_components_df_lookup_keys_df_lookup_keys_component__WEBPACK_IMPORTED_MODULE_3__.DfLookupKeysComponent, _angular_router__WEBPACK_IMPORTED_MODULE_15__.RouterLink, _angular_common__WEBPACK_IMPORTED_MODULE_18__.AsyncPipe, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_16__.TranslocoPipe],
      styles: [".user-details[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n  gap: 32px;\n}\n.user-details.small[_ngcontent-%COMP%] {\n  flex-direction: column;\n  gap: 16px;\n}\n.user-details[_ngcontent-%COMP%]    > *[_ngcontent-%COMP%] {\n  flex: 1;\n}\n.user-details[_ngcontent-%COMP%]   .additional-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n}\n.user-details[_ngcontent-%COMP%]   .additional-info[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  width: -moz-fit-content;\n  width: fit-content;\n}\n.user-details[_ngcontent-%COMP%]   .access-tabs[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  flex-wrap: wrap;\n  max-height: 240px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtdXNlci1kZXRhaWxzL2RmLXVzZXItZGV0YWlscy1iYXNlLmNvbXBvbmVudC5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsU0FBQTtBQUNGO0FBQUU7RUFDRSxzQkFBQTtFQUNBLFNBQUE7QUFFSjtBQUFFO0VBQ0UsT0FBQTtBQUVKO0FBQUU7RUFDRSxhQUFBO0VBQ0Esc0JBQUE7RUFJQSxTQUFBO0FBREo7QUFGSTtFQUNFLHVCQUFBO0VBQUEsa0JBQUE7QUFJTjtBQUFFO0VBQ0UsYUFBQTtFQUNBLHNCQUFBO0VBQ0EsZUFBQTtFQUNBLGlCQUFBO0FBRUoiLCJzb3VyY2VzQ29udGVudCI6WyIudXNlci1kZXRhaWxzIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgZ2FwOiAzMnB4O1xuICAmLnNtYWxsIHtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGdhcDogMTZweDtcbiAgfVxuICA+ICoge1xuICAgIGZsZXg6IDE7XG4gIH1cbiAgLmFkZGl0aW9uYWwtaW5mbyB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGJ1dHRvbiB7XG4gICAgICB3aWR0aDogZml0LWNvbnRlbnQ7XG4gICAgfVxuICAgIGdhcDogMTZweDtcbiAgfVxuICAuYWNjZXNzLXRhYnMge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgbWF4LWhlaWdodDogMjQwcHg7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
};
DfUserDetailsComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_25__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_26__.UntilDestroy)({
  checkProperties: true
})], DfUserDetailsComponent);

/***/ })

}]);
//# sourceMappingURL=src_app_adf-users_df-user-details_df-user-details_component_ts.js.map