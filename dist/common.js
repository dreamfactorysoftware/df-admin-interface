"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["common"],{

/***/ 52493:
/*!****************************************************************************************!*\
  !*** ./src/app/shared/components/df-duplicate-dialog/df-duplicate-dialog.component.ts ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfDuplicateDialogComponent: () => (/* binding */ DfDuplicateDialogComponent)
/* harmony export */ });
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/material/dialog */ 12587);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);













function DfDuplicateDialogComponent_mat_error_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 1, "validation.required"), " ");
  }
}
function DfDuplicateDialogComponent_mat_error_13_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 1, "validation.nameExists"), " ");
  }
}
function DfDuplicateDialogComponent_mat_error_14_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 1, "validation.sameAsOriginal"), " ");
  }
}
class DfDuplicateDialogComponent {
  constructor(dialogRef, data) {
    this.dialogRef = dialogRef;
    this.data = data;
    this.nameControl = new _angular_forms__WEBPACK_IMPORTED_MODULE_1__.FormControl('', [_angular_forms__WEBPACK_IMPORTED_MODULE_1__.Validators.required, this.uniqueNameValidator.bind(this)]);
  }
  uniqueNameValidator(control) {
    if (this.data.existingNames && this.data.existingNames.includes(control.value)) {
      return {
        nameExists: true
      };
    }
    if (control.value === this.data.originalName) {
      return {
        sameName: true
      };
    }
    return null;
  }
  onDuplicate() {
    if (this.nameControl.valid) {
      this.dialogRef.close(this.nameControl.value);
    }
  }
  onCancel() {
    this.dialogRef.close(null);
  }
  static {
    this.ɵfac = function DfDuplicateDialogComponent_Factory(t) {
      return new (t || DfDuplicateDialogComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_2__.MatDialogRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_2__.MAT_DIALOG_DATA));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DfDuplicateDialogComponent,
      selectors: [["df-duplicate-dialog"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      decls: 22,
      vars: 21,
      consts: [["mat-dialog-title", ""], ["mat-dialog-content", ""], ["appearance", "outline", 1, "full-width"], ["matInput", "", "cdkFocusInitial", "", 3, "formControl", "placeholder"], [4, "ngIf"], ["mat-dialog-actions", ""], ["mat-flat-button", "", "type", "button", 3, "click"], ["mat-flat-button", "", "type", "button", "color", "primary", 3, "disabled", "click"]],
      template: function DfDuplicateDialogComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "h1", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "div", 1)(4, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](6, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "mat-form-field", 2)(8, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](10, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](11, "input", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](12, DfDuplicateDialogComponent_mat_error_12_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](13, DfDuplicateDialogComponent_mat_error_13_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](14, DfDuplicateDialogComponent_mat_error_14_Template, 3, 3, "mat-error", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](15, "div", 5)(16, "button", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfDuplicateDialogComponent_Template_button_click_16_listener() {
            return ctx.onCancel();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](17);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](18, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](19, "button", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfDuplicateDialogComponent_Template_button_click_19_listener() {
            return ctx.onDuplicate();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](20);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](21, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 11, ctx.data.title));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](6, 13, ctx.data.message));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](10, 15, ctx.data.label));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("formControl", ctx.nameControl)("placeholder", ctx.data.originalName);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.nameControl.hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.nameControl.hasError("nameExists"));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.nameControl.hasError("sameName"));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](18, 17, "cancel"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("disabled", !ctx.nameControl.valid);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](21, 19, "duplicate"), " ");
        }
      },
      dependencies: [_angular_material_dialog__WEBPACK_IMPORTED_MODULE_2__.MatDialogModule, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_2__.MatDialogTitle, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_2__.MatDialogContent, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_2__.MatDialogActions, _angular_material_button__WEBPACK_IMPORTED_MODULE_3__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_3__.MatButton, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_4__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_4__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_4__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_4__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_5__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_5__.MatInput, _angular_forms__WEBPACK_IMPORTED_MODULE_1__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_1__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_1__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_1__.FormControlDirective, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_6__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_7__.NgIf],
      styles: [".full-width[_ngcontent-%COMP%] {\n  width: 100%;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtZHVwbGljYXRlLWRpYWxvZy9kZi1kdXBsaWNhdGUtZGlhbG9nLmNvbXBvbmVudC5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBQTtBQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLmZ1bGwtd2lkdGgge1xuICB3aWR0aDogMTAwJTtcbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
}

/***/ }),

/***/ 10233:
/*!**********************************************************************!*\
  !*** ./src/app/shared/components/df-paywall/df-paywall.component.ts ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfPaywallComponent: () => (/* binding */ DfPaywallComponent)
/* harmony export */ });
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _services_df_user_data_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../services/df-user-data.service */ 29487);
/* harmony import */ var _services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../services/df-system-config-data.service */ 82298);
/* harmony import */ var _services_df_paywall_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/df-paywall.service */ 95351);





const _c0 = ["calendlyWidget"];
class DfPaywallComponent {
  constructor(userDataService, systemConfigService, dfPaywallService) {
    this.userDataService = userDataService;
    this.systemConfigService = systemConfigService;
    this.dfPaywallService = dfPaywallService;
  }
  ngOnInit() {
    const user = this.userDataService.userData;
    const email = user?.email;
    const ip = this.systemConfigService?.environment?.client?.ipAddress;
    const serviceName = this.serviceName;
    this.dfPaywallService.trackPaywallHit(email, ip, serviceName);
  }
  ngAfterViewInit() {
    window['Calendly'].initInlineWidget({
      url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
      parentElement: this.calendlyWidget.nativeElement,
      autoLoad: false
    });
  }
  static {
    this.ɵfac = function DfPaywallComponent_Factory(t) {
      return new (t || DfPaywallComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_services_df_user_data_service__WEBPACK_IMPORTED_MODULE_0__.DfUserDataService), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_1__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_services_df_paywall_service__WEBPACK_IMPORTED_MODULE_2__.DfPaywallService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdefineComponent"]({
      type: DfPaywallComponent,
      selectors: [["df-paywall"]],
      viewQuery: function DfPaywallComponent_Query(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵviewQuery"](_c0, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵloadQuery"]()) && (ctx.calendlyWidget = _t.first);
        }
      },
      inputs: {
        serviceName: "serviceName"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵStandaloneFeature"]],
      decls: 35,
      vars: 27,
      consts: [[1, "paywall-container"], [1, "details-section"], [1, "info-columns"], [1, "info-column"], [3, "innerHTML"], [1, "calendly-inline-widget"], ["calendlyWidget", ""], [1, "paywall-contact"], ["href", "tel:+1 415-993-5877"], ["href", "mailto:info@dreamfactory.com"]],
      template: function DfPaywallComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 0)(1, "h2");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](3, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](4, "h2");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](6, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "div", 1)(8, "div", 2)(9, "div", 3)(10, "h4");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](11);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](12, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](13, "p", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](14, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "div", 3)(16, "h4");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](17);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](18, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](19, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](20);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](21, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](22, "h2");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](23);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](24, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](25, "div", 5, 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](27, "h3", 7)(28, "a", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](29);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](30, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](31, " | ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](32, "a", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](33);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](34, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](3, 9, "paywall.header"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](6, 11, "paywall.subheader"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](12, 13, "paywall.hostedTrial"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("innerHTML", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](14, 15, "paywall.bookTime"), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵsanitizeHtml"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](18, 17, "paywall.learnMoreTitle"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](21, 19, "paywall.gain"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](24, 21, "paywall.speakToHuman"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](30, 23, "phone"), ": +1 415-993-5877");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"]("", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](34, 25, "email"), ": info@dreamfactory.com");
        }
      },
      dependencies: [_ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__.TranslocoPipe],
      styles: [".paywall-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 20px;\n}\n\n.calendly-inline-widget[_ngcontent-%COMP%] {\n  min-width: 320px;\n  width: 100%;\n  height: 700px;\n  margin: 20px 0;\n}\n\n.details-section[_ngcontent-%COMP%] {\n  margin: 32px 0;\n  max-width: 690px;\n  width: 100%;\n}\n\n.info-columns[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 32px;\n  justify-content: space-between;\n}\n@media (max-width: 768px) {\n  .info-columns[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n}\n\n.info-column[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 0;\n}\n\n.paywall-contact[_ngcontent-%COMP%] {\n  width: 100%;\n  text-align: center;\n  padding: 32px 0;\n  margin-top: 20px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtcGF5d2FsbC9kZi1wYXl3YWxsLmNvbXBvbmVudC5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsYUFBQTtFQUNBLHNCQUFBO0VBQ0EsbUJBQUE7RUFDQSxpQkFBQTtFQUNBLGNBQUE7RUFDQSxhQUFBO0FBQ0Y7O0FBRUE7RUFDRSxnQkFBQTtFQUNBLFdBQUE7RUFDQSxhQUFBO0VBQ0EsY0FBQTtBQUNGOztBQUVBO0VBQ0UsY0FBQTtFQUNBLGdCQUFBO0VBQ0EsV0FBQTtBQUNGOztBQUVBO0VBQ0UsYUFBQTtFQUNBLFNBQUE7RUFDQSw4QkFBQTtBQUNGO0FBQ0U7RUFMRjtJQU1JLHNCQUFBO0VBRUY7QUFDRjs7QUFDQTtFQUNFLE9BQUE7RUFDQSxZQUFBO0FBRUY7O0FBQ0E7RUFDRSxXQUFBO0VBQ0Esa0JBQUE7RUFDQSxlQUFBO0VBQ0EsZ0JBQUE7QUFFRiIsInNvdXJjZXNDb250ZW50IjpbIi5wYXl3YWxsLWNvbnRhaW5lciB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1heC13aWR0aDogMTIwMHB4O1xuICBtYXJnaW46IDAgYXV0bztcbiAgcGFkZGluZzogMjBweDtcbn1cblxuLmNhbGVuZGx5LWlubGluZS13aWRnZXQge1xuICBtaW4td2lkdGg6IDMyMHB4O1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiA3MDBweDtcbiAgbWFyZ2luOiAyMHB4IDA7XG59XG5cbi5kZXRhaWxzLXNlY3Rpb24ge1xuICBtYXJnaW46IDMycHggMDtcbiAgbWF4LXdpZHRoOiA2OTBweDtcbiAgd2lkdGg6IDEwMCU7XG59XG5cbi5pbmZvLWNvbHVtbnMge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDMycHg7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcblxuICBAbWVkaWEgKG1heC13aWR0aDogNzY4cHgpIHtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICB9XG59XG5cbi5pbmZvLWNvbHVtbiB7XG4gIGZsZXg6IDE7XG4gIG1pbi13aWR0aDogMDtcbn1cblxuLnBheXdhbGwtY29udGFjdCB7XG4gIHdpZHRoOiAxMDAlO1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDMycHggMDtcbiAgbWFyZ2luLXRvcDogMjBweDtcbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
}

/***/ }),

/***/ 9709:
/*!******************************************************************************!*\
  !*** ./src/app/shared/components/df-verb-picker/df-verb-picker.component.ts ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfVerbPickerComponent: () => (/* binding */ DfVerbPickerComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/tooltip */ 80640);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/core */ 74646);



















function DfVerbPickerComponent_mat_label_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](ctx_r0.schema.label);
  }
}
function DfVerbPickerComponent_mat_option_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-option", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const verb_r3 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("value", verb_r3.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", verb_r3.label, " ");
  }
}
function DfVerbPickerComponent_fa_icon_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "fa-icon", 6);
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("icon", ctx_r2.faCircleInfo)("matTooltip", ctx_r2.schema.description);
  }
}
let DfVerbPickerComponent = class DfVerbPickerComponent {
  constructor(controlDir, themeService) {
    this.controlDir = controlDir;
    this.themeService = themeService;
    this.type = 'verb';
    this.showLabel = true;
    this.faCircleInfo = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_2__.faCircleInfo;
    this.control = new _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControl();
    this.verbs = [{
      value: 1,
      altValue: 'GET',
      label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__.translate)('verbs.get')
    }, {
      value: 2,
      altValue: 'POST',
      label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__.translate)('verbs.post')
    }, {
      value: 4,
      altValue: 'PUT',
      label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__.translate)('verbs.put')
    }, {
      value: 8,
      altValue: 'PATCH',
      label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__.translate)('verbs.patch')
    }, {
      value: 16,
      altValue: 'DELETE',
      label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__.translate)('verbs.delete')
    }];
    this.isDarkMode = this.themeService.darkMode$;
    controlDir.valueAccessor = this;
  }
  ngDoCheck() {
    if (this.controlDir.control instanceof _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControl && this.controlDir.control.hasValidator(_angular_forms__WEBPACK_IMPORTED_MODULE_3__.Validators.required)) {
      this.control.addValidators(_angular_forms__WEBPACK_IMPORTED_MODULE_3__.Validators.required);
    }
  }
  writeValue(value) {
    if (!value) {
      return;
    }
    if (this.type === 'number' && typeof value === 'number') {
      const selectedValues = this.verbs.filter(verb => (value & verb.value) === verb.value).map(verb => verb.value);
      this.control.setValue(selectedValues, {
        emitEvent: false
      });
    } else if (this.type === 'verb' && typeof value === 'string') {
      this.control.setValue(this.verbs.find(vr => vr.altValue === value)?.value ?? '', {
        emitEvent: false
      });
    } else {
      this.control.setValue(value.map(v => this.verbs.find(vr => vr.altValue === v)?.value ?? 0), {
        emitEvent: false
      });
    }
  }
  registerOnChange(fn) {
    this.onChange = fn;
    this.control.valueChanges.subscribe(selected => {
      const total = this.type === 'number' ? (selected || []).reduce((acc, val) => acc | val, 0) : this.type === 'verb_multiple' ? (selected || []).map(v => this.verbs.find(vr => vr.value === v)?.altValue ?? '') : this.verbs.find(vr => vr.value === selected)?.altValue ?? '';
      this.onChange(total);
    });
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(disabled) {
    disabled ? this.control.disable() : this.control.enable();
  }
  static {
    this.ɵfac = function DfVerbPickerComponent_Factory(t) {
      return new (t || DfVerbPickerComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_3__.NgControl, 2), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_0__.DfThemeService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: DfVerbPickerComponent,
      selectors: [["df-verb-picker"]],
      inputs: {
        type: "type",
        schema: "schema",
        showLabel: "showLabel"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵStandaloneFeature"]],
      decls: 7,
      vars: 10,
      consts: [["subscriptSizing", "dynamic", "appearance", "outline"], [4, "ngIf"], [3, "formControl", "multiple"], [3, "value", 4, "ngFor", "ngForOf"], ["class", "tool-tip-trigger", "matSuffix", "", 3, "icon", "matTooltip", 4, "ngIf"], [3, "value"], ["matSuffix", "", 1, "tool-tip-trigger", 3, "icon", "matTooltip"]],
      template: function DfVerbPickerComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](1, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](2, "mat-form-field", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](3, DfVerbPickerComponent_mat_label_3_Template, 2, 1, "mat-label", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](4, "mat-select", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](5, DfVerbPickerComponent_mat_option_5_Template, 2, 2, "mat-option", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](6, DfVerbPickerComponent_fa_icon_6_Template, 1, 2, "fa-icon", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](1, 8, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.showLabel);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("formControl", ctx.control)("multiple", ctx.type === "verb_multiple" || ctx.type === "number");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵattribute"]("aria-label", ctx.schema.label);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx.verbs);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.schema.description);
        }
      },
      dependencies: [_angular_material_select__WEBPACK_IMPORTED_MODULE_5__.MatSelectModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__.MatSuffix, _angular_material_select__WEBPACK_IMPORTED_MODULE_5__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_7__.MatOption, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__.MatFormFieldModule, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControlDirective, _angular_common__WEBPACK_IMPORTED_MODULE_8__.NgFor, _angular_common__WEBPACK_IMPORTED_MODULE_8__.NgIf, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_9__.MatTooltipModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_9__.MatTooltip, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_10__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_10__.FaIconComponent, _angular_common__WEBPACK_IMPORTED_MODULE_8__.AsyncPipe],
      encapsulation: 2
    });
  }
};
DfVerbPickerComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_11__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_12__.UntilDestroy)({
  checkProperties: true
})], DfVerbPickerComponent);

/***/ }),

/***/ 32389:
/*!**********************************************************!*\
  !*** ./src/app/shared/constants/supported-extensions.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EXPORT_TYPES: () => (/* binding */ EXPORT_TYPES)
/* harmony export */ });
const EXPORT_TYPES = ['csv', 'json', 'xml'];

/***/ }),

/***/ 32570:
/*!***************************************************!*\
  !*** ./src/app/shared/constants/table-columns.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   USER_COLUMNS: () => (/* binding */ USER_COLUMNS)
/* harmony export */ });
const USER_COLUMNS = [{
  columnDef: 'active',
  cell: row => row.active,
  header: 'active'
}, {
  columnDef: 'email',
  cell: row => row.email,
  header: 'email'
}, {
  columnDef: 'displayName',
  cell: row => row.displayName,
  header: 'name'
}, {
  columnDef: 'firstName',
  cell: row => row.firstName,
  header: 'firstName'
}, {
  columnDef: 'lastName',
  cell: row => row.lastName,
  header: 'lastName'
}, {
  columnDef: 'registration',
  cell: row => row.registration,
  header: 'registration'
}, {
  columnDef: 'actions'
}];

/***/ }),

/***/ 96957:
/*!*********************************************************!*\
  !*** ./src/app/shared/services/df-analytics.service.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfAnalyticsService: () => (/* binding */ DfAnalyticsService)
/* harmony export */ });
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! rxjs */ 14876);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs */ 59452);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! rxjs */ 61873);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! rxjs/operators */ 36647);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs/operators */ 86301);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rxjs/operators */ 70271);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/operators */ 98764);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/operators */ 61318);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/common/http */ 46443);




class DfAnalyticsService {
  constructor(http) {
    this.http = http;
    this.CACHE_KEY = 'df_dashboard_stats';
    this.CACHE_DURATION = 30 * 1000; // 30 seconds
    this.REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
    // Initialize the stats observable with automatic refresh
    this.stats$ = (0,rxjs__WEBPACK_IMPORTED_MODULE_0__.timer)(0, this.REFRESH_INTERVAL).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_1__.switchMap)(() => this.fetchStats()), (0,rxjs_operators__WEBPACK_IMPORTED_MODULE_2__.shareReplay)(1));
  }
  getDashboardStats() {
    // Check localStorage cache first
    const cached = this.getCachedStats();
    if (cached) {
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_3__.of)(cached);
    }
    return this.stats$;
  }
  fetchStats() {
    // Fetch minimal data to filter out system services
    const requests = {
      services: this.http.get('/api/v2/system/service?fields=id,name,type&include_count=true'),
      roles: this.http.get('/api/v2/system/role?fields=id,name&include_count=true'),
      appKeys: this.http.get('/api/v2/system/app?include_count=true')
    };
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_4__.forkJoin)(requests).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_5__.map)(responses => this.transformResponses(responses)), (0,rxjs_operators__WEBPACK_IMPORTED_MODULE_6__.tap)(stats => this.cacheStats(stats)), (0,rxjs_operators__WEBPACK_IMPORTED_MODULE_7__.catchError)(() => {
      // Return simple fallback data if API fails
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_3__.of)(this.getSimpleStats());
    }));
  }
  transformResponses(responses) {
    const {
      services,
      roles,
      appKeys
    } = responses;
    // System service names to exclude (comprehensive list of DreamFactory system services)
    // System service names to exclude (comprehensive list of DreamFactory system services)
    const systemServiceNames = ['system', 'api_docs', 'files', 'logs', 'db', 'email', 'user', 'script', 'ui', 'schema', 'api_doc', 'file', 'log', 'admin', 'df-admin', 'dreamfactory', 'cache', 'push', 'pub_sub'].map(s => s.toLowerCase());
    // Common system app names - being very specific to avoid filtering user apps
    const systemAppNames = ['admin', 'api_docs', 'file_manager'].map(s => s.toLowerCase());
    const systemRoleNames = ['administrator', 'user', 'admin', 'sys_admin'].map(s => s.toLowerCase());
    // Filter services - exclude system services by name
    const userServices = (services.resource || []).filter(s => {
      return !systemServiceNames.includes(s.name.toLowerCase());
    });
    // Filter API Keys - exclude system apps by name
    const userApiKeys = (appKeys.resource || []).filter(a => {
      // Check multiple possible field names for API key
      const apiKeyValue = a.apiKey || a.api_key || a.apikey;
      const hasApiKey = !!apiKeyValue;
      const isSystemApp = systemAppNames.includes(a.name.toLowerCase());
      return !isSystemApp && hasApiKey;
    });
    // Filter roles - exclude system roles by name
    const userRoles = (roles.resource || []).filter(r => {
      return !systemRoleNames.includes(r.name.toLowerCase());
    });
    return {
      services: {
        total: userServices.length
      },
      apiKeys: {
        total: userApiKeys.length
      },
      roles: {
        total: userRoles.length
      }
    };
  }
  calculateTrend(previous, current) {
    if (previous === 0) return 0;
    return Math.round((current - previous) / previous * 100);
  }
  getCachedStats() {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return null;
    try {
      const {
        data,
        timestamp
      } = JSON.parse(cached);
      if (Date.now() - timestamp < this.CACHE_DURATION) {
        return data;
      }
    } catch {
      // Invalid cache
    }
    localStorage.removeItem(this.CACHE_KEY);
    return null;
  }
  cacheStats(stats) {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify({
      data: stats,
      timestamp: Date.now()
    }));
  }
  getSimpleStats() {
    // Return simple fallback data
    return {
      services: {
        total: 0
      },
      apiKeys: {
        total: 0
      },
      roles: {
        total: 0
      }
    };
  }
  static {
    this.ɵfac = function DfAnalyticsService_Factory(t) {
      return new (t || DfAnalyticsService)(_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵinject"](_angular_common_http__WEBPACK_IMPORTED_MODULE_9__.HttpClient));
    };
  }
  static {
    this.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdefineInjectable"]({
      token: DfAnalyticsService,
      factory: DfAnalyticsService.ɵfac,
      providedIn: 'root'
    });
  }
}

/***/ }),

/***/ 70402:
/*!***************************************************************!*\
  !*** ./src/app/shared/services/df-current-service.service.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfCurrentServiceService: () => (/* binding */ DfCurrentServiceService)
/* harmony export */ });
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! rxjs */ 75797);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 37580);


const CURRENT_SERVICE_ID_KEY = 'currentServiceId';
class DfCurrentServiceService {
  constructor() {
    // Initialize with stored value or -1
    const storedId = localStorage.getItem(CURRENT_SERVICE_ID_KEY);
    this.currentServiceId = new rxjs__WEBPACK_IMPORTED_MODULE_0__.BehaviorSubject(storedId ? parseInt(storedId, 10) : -1);
  }
  setCurrentServiceId(id) {
    localStorage.setItem(CURRENT_SERVICE_ID_KEY, id.toString());
    this.currentServiceId.next(id);
  }
  getCurrentServiceId() {
    return this.currentServiceId.asObservable();
  }
  clearCurrentServiceId() {
    localStorage.removeItem(CURRENT_SERVICE_ID_KEY);
    this.currentServiceId.next(-1);
  }
  static {
    this.ɵfac = function DfCurrentServiceService_Factory(t) {
      return new (t || DfCurrentServiceService)();
    };
  }
  static {
    this.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineInjectable"]({
      token: DfCurrentServiceService,
      factory: DfCurrentServiceService.ɵfac,
      providedIn: 'root'
    });
  }
}

/***/ }),

/***/ 16453:
/*!******************************************!*\
  !*** ./src/app/shared/utilities/hash.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   generateApiKey: () => (/* binding */ generateApiKey)
/* harmony export */ });
/* harmony import */ var _Users_oleksandrkitsera_Documents_projects_dreamfactory_development_packages_df_admin_interface_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ 89204);

function generateApiKey(_x, _x2) {
  return _generateApiKey.apply(this, arguments);
}
function _generateApiKey() {
  _generateApiKey = (0,_Users_oleksandrkitsera_Documents_projects_dreamfactory_development_packages_df_admin_interface_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])(function* (hostname, appname) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${hostname}${appname}${Date.now()}`);
    const hashBuffer = yield crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
  });
  return _generateApiKey.apply(this, arguments);
}

/***/ }),

/***/ 90124:
/*!*****************************************************!*\
  !*** ./src/app/shared/validators/json.validator.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   JsonValidator: () => (/* binding */ JsonValidator)
/* harmony export */ });
function JsonValidator(control) {
  if (control.value.length > 0) {
    try {
      JSON.parse(control.value);
    } catch (e) {
      return {
        jsonInvalid: true
      };
    }
  }
  return null;
}

/***/ })

}]);
//# sourceMappingURL=common.js.map