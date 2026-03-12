"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["default-src_app_shared_components_df-alert_df-alert_component_ts-src_app_shared_components_df-939aa8"],{

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

/***/ 77493:
/*!**************************************************************************************!*\
  !*** ./src/app/shared/components/df-profile-details/df-profile-details.component.ts ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfProfileDetailsComponent: () => (/* binding */ DfProfileDetailsComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _services_df_theme_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../services/df-theme.service */ 52868);













function DfProfileDetailsComponent_mat_error_9_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "userManagement.controls.username.errors.required"), " ");
  }
}
function DfProfileDetailsComponent_mat_error_10_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "userManagement.controls.username.errors.minLength"), " ");
  }
}
function DfProfileDetailsComponent_mat_error_16_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "userManagement.controls.email.errors.invalid"), " ");
  }
}
function DfProfileDetailsComponent_mat_error_17_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "userManagement.controls.email.errors.required"), " ");
  }
}
function DfProfileDetailsComponent_mat_error_23_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "userManagement.controls.firstName.errors.required"), " ");
  }
}
function DfProfileDetailsComponent_mat_error_29_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "userManagement.controls.lastName.errors.required"), " ");
  }
}
function DfProfileDetailsComponent_mat_error_35_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "userManagement.controls.displayName.errors.required"), " ");
  }
}
function DfProfileDetailsComponent_mat_form_field_36_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-form-field", 2)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](4, "input", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](3, 1, "userManagement.controls.phone.label"));
  }
}
let DfProfileDetailsComponent = class DfProfileDetailsComponent {
  constructor(rootFormGroup, themeService) {
    this.rootFormGroup = rootFormGroup;
    this.themeService = themeService;
    this.isDarkMode = this.themeService.darkMode$;
  }
  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit.subscribe(() => {
      this.rootForm.markAllAsTouched();
    });
  }
  controlExists(control) {
    return this.rootForm.get(control) !== null;
  }
  isRequired(control) {
    return !!this.rootForm.get(control)?.hasValidator(_angular_forms__WEBPACK_IMPORTED_MODULE_2__.Validators.required);
  }
  static {
    this.ɵfac = function DfProfileDetailsComponent_Factory(t) {
      return new (t || DfProfileDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_2__.FormGroupDirective), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_services_df_theme_service__WEBPACK_IMPORTED_MODULE_0__.DfThemeService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: DfProfileDetailsComponent,
      selectors: [["df-profile-details"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵStandaloneFeature"]],
      decls: 37,
      vars: 31,
      consts: [["name", "user-details-section", 3, "formGroup"], ["formGroupName", "profileDetailsGroup"], ["appearance", "outline"], ["matInput", "", "type", "text", "formControlName", "username"], [4, "ngIf"], ["matInput", "", "type", "email", "formControlName", "email"], ["matInput", "", "type", "text", "formControlName", "firstName"], ["matInput", "", "formControlName", "lastName"], ["matInput", "", "formControlName", "name"], ["appearance", "outline", 4, "ngIf"], ["matInput", "", "formControlName", "phone"]],
      template: function DfProfileDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](0, 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](1, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](2, 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](3, "mat-form-field", 2)(4, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](6, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](7, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](8, "input", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](9, DfProfileDetailsComponent_mat_error_9_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](10, DfProfileDetailsComponent_mat_error_10_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](11, "mat-form-field", 2)(12, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](13);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](14, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](15, "input", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](16, DfProfileDetailsComponent_mat_error_16_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](17, DfProfileDetailsComponent_mat_error_17_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](18, "mat-form-field", 2)(19, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](20);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](21, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](22, "input", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](23, DfProfileDetailsComponent_mat_error_23_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](24, "mat-form-field", 2)(25, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](26);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](27, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](28, "input", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](29, DfProfileDetailsComponent_mat_error_29_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](30, "mat-form-field", 2)(31, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](32);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](33, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](34, "input", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](35, DfProfileDetailsComponent_mat_error_35_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](36, DfProfileDetailsComponent_mat_form_field_36_Template, 5, 3, "mat-form-field", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]()();
        }
        if (rf & 2) {
          let tmp_3_0;
          let tmp_4_0;
          let tmp_6_0;
          let tmp_7_0;
          let tmp_9_0;
          let tmp_11_0;
          let tmp_13_0;
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](1, 17, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("formGroup", ctx.rootForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"]("", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](6, 19, "userManagement.controls.username.altLabel"), "", !ctx.isRequired("profileDetailsGroup.username") ? " " + _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](7, 21, "userManagement.controls.username.optional") : "", "");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", (tmp_3_0 = ctx.rootForm.get("profileDetailsGroup.username")) == null ? null : tmp_3_0.errors == null ? null : tmp_3_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", (tmp_4_0 = ctx.rootForm.get("profileDetailsGroup.username")) == null ? null : tmp_4_0.errors == null ? null : tmp_4_0.errors["minlength"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](14, 23, "userManagement.controls.email.label"), "");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ((tmp_6_0 = ctx.rootForm.get("profileDetailsGroup.email")) == null ? null : tmp_6_0.errors == null ? null : tmp_6_0.errors["email"]) && !((tmp_6_0 = ctx.rootForm.get("profileDetailsGroup.email")) == null ? null : tmp_6_0.errors == null ? null : tmp_6_0.errors["required"]));
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", !((tmp_7_0 = ctx.rootForm.get("profileDetailsGroup.email")) == null ? null : tmp_7_0.errors == null ? null : tmp_7_0.errors["email"]) && ((tmp_7_0 = ctx.rootForm.get("profileDetailsGroup.email")) == null ? null : tmp_7_0.errors == null ? null : tmp_7_0.errors["required"]));
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](21, 25, "userManagement.controls.firstName.label"), "");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", (tmp_9_0 = ctx.rootForm.get("profileDetailsGroup.firstName")) == null ? null : tmp_9_0.errors == null ? null : tmp_9_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](27, 27, "userManagement.controls.lastName.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", (tmp_11_0 = ctx.rootForm.get("profileDetailsGroup.lastName")) == null ? null : tmp_11_0.errors == null ? null : tmp_11_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](33, 29, "userManagement.controls.displayName.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", (tmp_13_0 = ctx.rootForm.get("profileDetailsGroup.name")) == null ? null : tmp_13_0.errors == null ? null : tmp_13_0.errors["required"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.controlExists("profileDetailsGroup.phone"));
        }
      },
      dependencies: [_angular_material_form_field__WEBPACK_IMPORTED_MODULE_3__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_3__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_3__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_3__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_4__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_4__.MatInput, _angular_forms__WEBPACK_IMPORTED_MODULE_2__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_2__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_2__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_2__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_2__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_2__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_2__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_2__.FormGroupName, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_5__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_6__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_6__.AsyncPipe],
      encapsulation: 2
    });
  }
};
DfProfileDetailsComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_7__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_8__.UntilDestroy)({
  checkProperties: true
})], DfProfileDetailsComponent);

/***/ })

}]);
//# sourceMappingURL=default-src_app_shared_components_df-alert_df-alert_component_ts-src_app_shared_components_df-939aa8.js.map