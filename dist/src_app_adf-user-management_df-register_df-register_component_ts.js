"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-user-management_df-register_df-register_component_ts"],{

/***/ 59962:
/*!**************************************************************************!*\
  !*** ./src/app/adf-user-management/df-register/df-register.component.ts ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfRegisterComponent: () => (/* binding */ DfRegisterComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/types/routes */ 23472);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _shared_components_df_profile_details_df_profile_details_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/components/df-profile-details/df-profile-details.component */ 77493);
/* harmony import */ var _angular_material_divider__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/divider */ 14102);
/* harmony import */ var _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var _angular_material_card__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/card */ 53777);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var _services_df_auth_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../services/df-auth.service */ 34387);




















function DfRegisterComponent_mat_card_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-card", 2)(1, "df-alert", 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("alertClosed", function DfRegisterComponent_mat_card_1_Template_df_alert_alertClosed_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r3);
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵresetView"](ctx_r2.showAlert = false);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](3, "mat-card-header")(4, "mat-card-title");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](6, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](7, "mat-divider");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](8, "mat-card-content")(9, "form", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("ngSubmit", function DfRegisterComponent_mat_card_1_Template_form_ngSubmit_9_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r3);
      const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵresetView"](ctx_r4.register());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](10, "df-profile-details", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](11, "button", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](12);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](13, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("showAlert", ctx_r0.showAlert)("alertType", ctx_r0.alertType);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](ctx_r0.alertMsg);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](6, 6, "userManagement.register"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("formGroup", ctx_r0.registerForm);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](13, 8, "userManagement.register"), " ");
  }
}
function DfRegisterComponent_mat_card_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "mat-card", 2)(1, "mat-card-header")(2, "mat-card-title");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](5, "mat-divider");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](6, "mat-card-content")(7, "h2");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](8);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](9, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](10, "p");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](11);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](12, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](13, "div", 7)(14, "a", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](15);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](16, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()()();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](4, 5, "userManagement.registerSuccess.header"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](9, 7, "userManagement.registerSuccess.title"));
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](12, 9, "userManagement.registerSuccess.message"));
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("routerLink", ctx_r1.loginRoute);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](16, 11, "userManagement.login"));
  }
}
let DfRegisterComponent = class DfRegisterComponent {
  constructor(fb, systemConfigDataService, authService) {
    this.fb = fb;
    this.systemConfigDataService = systemConfigDataService;
    this.authService = authService;
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.loginAttribute = 'email';
    this.complete = false;
    this.loginRoute = `/${src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_0__.ROUTES.AUTH}/${src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_0__.ROUTES.LOGIN}`;
    this.registerForm = this.fb.group({
      profileDetailsGroup: this.fb.group({
        username: [''],
        email: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.email]],
        firstName: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required]],
        lastName: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required]],
        name: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required]]
      })
    });
  }
  ngOnInit() {
    this.systemConfigDataService.environment$.subscribe(env => {
      this.loginAttribute = env.authentication.loginAttribute;
      if (this.loginAttribute === 'username') {
        this.registerForm.get('profileDetailsGroup.username')?.setValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required]);
      } else {
        this.registerForm.get('profileDetailsGroup.email')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_6__.Validators.required]);
      }
    });
  }
  register() {
    if (this.registerForm.invalid) {
      return;
    }
    this.authService.register(this.registerForm.controls['profileDetailsGroup'].value).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_7__.catchError)(err => {
      this.alertMsg = err.error.error.message;
      this.showAlert = true;
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_8__.throwError)(() => new Error(err));
    })).subscribe(() => {
      this.showAlert = false;
      this.complete = true;
    });
  }
  static {
    this.ɵfac = function DfRegisterComponent_Factory(t) {
      return new (t || DfRegisterComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_6__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_services_df_auth_service__WEBPACK_IMPORTED_MODULE_4__.DfAuthService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdefineComponent"]({
      type: DfRegisterComponent,
      selectors: [["df-register"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵStandaloneFeature"]],
      decls: 3,
      vars: 2,
      consts: [[1, "user-management-card-container"], ["class", "user-management-card", 4, "ngIf"], [1, "user-management-card"], [3, "showAlert", "alertType", "alertClosed"], ["name", "self-register-form", 3, "formGroup", "ngSubmit"], ["formGroupName", "profileDetailsGroup"], ["mat-flat-button", "", "color", "primary", "type", "submit"], [1, "action-links"], ["mat-button", "", "target", "_self", 3, "routerLink"]],
      template: function DfRegisterComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](1, DfRegisterComponent_mat_card_1_Template, 14, 10, "mat-card", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](2, DfRegisterComponent_mat_card_2_Template, 17, 13, "mat-card", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", !ctx.complete);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx.complete);
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_9__.NgIf, _angular_material_card__WEBPACK_IMPORTED_MODULE_10__.MatCardModule, _angular_material_card__WEBPACK_IMPORTED_MODULE_10__.MatCard, _angular_material_card__WEBPACK_IMPORTED_MODULE_10__.MatCardContent, _angular_material_card__WEBPACK_IMPORTED_MODULE_10__.MatCardHeader, _angular_material_card__WEBPACK_IMPORTED_MODULE_10__.MatCardTitle, _shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_2__.DfAlertComponent, _angular_material_divider__WEBPACK_IMPORTED_MODULE_11__.MatDividerModule, _angular_material_divider__WEBPACK_IMPORTED_MODULE_11__.MatDivider, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_6__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_6__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_6__.FormGroupName, _shared_components_df_profile_details_df_profile_details_component__WEBPACK_IMPORTED_MODULE_1__.DfProfileDetailsComponent, _angular_material_button__WEBPACK_IMPORTED_MODULE_12__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_12__.MatAnchor, _angular_material_button__WEBPACK_IMPORTED_MODULE_12__.MatButton, _angular_router__WEBPACK_IMPORTED_MODULE_13__.RouterLink, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_14__.TranslocoPipe],
      styles: [".user-management-card-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  height: 100%;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%] {\n  padding: 16px 16px;\n  margin: 0 auto;\n  min-width: 300px;\n  max-width: 445px;\n  box-shadow: var(--mdc-elevated-card-container-elevation);\n  --mdc-elevated-card-container-shape: 4px;\n  --mdc-outlined-card-container-shape: 4px;\n  --mdc-outlined-card-outline-width: 1px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-header[_ngcontent-%COMP%] {\n  padding-bottom: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%] {\n  padding-top: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%] {\n  padding-top: 32px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%]   .services-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  padding-top: 16px;\n  gap: 16px;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-form-field[_ngcontent-%COMP%], .user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   .action-links[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n}\n\n.user-management-card-container[_ngcontent-%COMP%] {\n  margin-top: 20vh;\n}\n.user-management-card-container.dark-theme[_ngcontent-%COMP%] {\n  background-color: #1e1e1e;\n  color: #fff;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLXVzZXItbWFuYWdlbWVudC9hZGYtdXNlci1tYW5hZ2VtZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSx1QkFBQTtFQUNBLFlBQUE7QUFDRjtBQUNFO0VBQ0Usa0JBQUE7RUFDQSxjQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtFQUNBLHdEQUFBO0VBQ0Esd0NBQUE7RUFDQSx3Q0FBQTtFQUNBLHNDQUFBO0FBQ0o7QUFBSTtFQUNFLG9CQUFBO0FBRU47QUFBSTtFQUNFLGlCQUFBO0FBRU47QUFETTtFQUNFLGlCQUFBO0FBR1I7QUFGUTtFQUNFLGFBQUE7RUFDQSxlQUFBO0VBQ0EsaUJBQUE7RUFDQSxTQUFBO0FBSVY7QUFBSTs7RUFFRSxXQUFBO0FBRU47QUFBSTtFQUNFLGFBQUE7RUFDQSx5QkFBQTtBQUVOOztBQUdBO0VBQ0UsZ0JBQUE7QUFBRjtBQUVFO0VBQ0UseUJBQUE7RUFDQSxXQUFBO0FBQUoiLCJzb3VyY2VzQ29udGVudCI6WyIudXNlci1tYW5hZ2VtZW50LWNhcmQtY29udGFpbmVyIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGhlaWdodDogMTAwJTtcblxuICAudXNlci1tYW5hZ2VtZW50LWNhcmQge1xuICAgIHBhZGRpbmc6IDE2cHggMTZweDtcbiAgICBtYXJnaW46IDAgYXV0bztcbiAgICBtaW4td2lkdGg6IDMwMHB4O1xuICAgIG1heC13aWR0aDogNDQ1cHg7XG4gICAgYm94LXNoYWRvdzogdmFyKC0tbWRjLWVsZXZhdGVkLWNhcmQtY29udGFpbmVyLWVsZXZhdGlvbik7XG4gICAgLS1tZGMtZWxldmF0ZWQtY2FyZC1jb250YWluZXItc2hhcGU6IDRweDtcbiAgICAtLW1kYy1vdXRsaW5lZC1jYXJkLWNvbnRhaW5lci1zaGFwZTogNHB4O1xuICAgIC0tbWRjLW91dGxpbmVkLWNhcmQtb3V0bGluZS13aWR0aDogMXB4O1xuICAgIG1hdC1jYXJkLWhlYWRlciB7XG4gICAgICBwYWRkaW5nLWJvdHRvbTogMTZweDtcbiAgICB9XG4gICAgbWF0LWNhcmQtY29udGVudCB7XG4gICAgICBwYWRkaW5nLXRvcDogMTZweDtcbiAgICAgIC5zZXJ2aWNlcy1zZWN0aW9uIHtcbiAgICAgICAgcGFkZGluZy10b3A6IDMycHg7XG4gICAgICAgIC5zZXJ2aWNlcy1jb250YWluZXIge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgZmxleC13cmFwOiB3cmFwO1xuICAgICAgICAgIHBhZGRpbmctdG9wOiAxNnB4O1xuICAgICAgICAgIGdhcDogMTZweDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBtYXQtZm9ybS1maWVsZCxcbiAgICBidXR0b24ge1xuICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuICAgIC5hY3Rpb24tbGlua3Mge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgfVxuICB9XG59XG5cbi51c2VyLW1hbmFnZW1lbnQtY2FyZC1jb250YWluZXIge1xuICBtYXJnaW4tdG9wOiAyMHZoO1xuXG4gICYuZGFyay10aGVtZSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzFlMWUxZTtcbiAgICBjb2xvcjogI2ZmZjtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfRegisterComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_15__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_16__.UntilDestroy)({
  checkProperties: true
})], DfRegisterComponent);

/***/ })

}]);
//# sourceMappingURL=src_app_adf-user-management_df-register_df-register_component_ts.js.map