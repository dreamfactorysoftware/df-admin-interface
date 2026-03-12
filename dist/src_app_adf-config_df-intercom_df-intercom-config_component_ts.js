"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-config_df-intercom_df-intercom-config_component_ts"],{

/***/ 99480:
/*!************************************************************************!*\
  !*** ./src/app/adf-config/df-intercom/df-intercom-config.component.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfIntercomConfigComponent: () => (/* binding */ DfIntercomConfigComponent)
/* harmony export */ });
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/material/progress-spinner */ 41134);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _df_intercom_config_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./df-intercom-config.service */ 39984);
/* harmony import */ var _shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/services/df-snackbar.service */ 75680);
/* harmony import */ var _shared_services_intercom_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/services/intercom.service */ 45105);












function DfIntercomConfigComponent_div_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](1, "mat-spinner", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](2, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3, "Loading configuration...");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
}
function DfIntercomConfigComponent_mat_slide_toggle_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-slide-toggle", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("ngModelChange", function DfIntercomConfigComponent_mat_slide_toggle_5_Template_mat_slide_toggle_ngModelChange_0_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r4);
      const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r3.intercomEnabled = $event);
    })("change", function DfIntercomConfigComponent_mat_slide_toggle_5_Template_mat_slide_toggle_change_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r4);
      const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r5.onToggleChange());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngModel", ctx_r1.intercomEnabled)("disabled", ctx_r1.saving);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", ctx_r1.intercomEnabled ? "Intercom Widget Enabled" : "Intercom Widget Disabled", " ");
  }
}
function DfIntercomConfigComponent_div_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](1, "mat-spinner", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](2, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3, "Saving...");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
}
class DfIntercomConfigComponent {
  constructor(intercomConfigService, snackbarService, intercomService) {
    this.intercomConfigService = intercomConfigService;
    this.snackbarService = snackbarService;
    this.intercomService = intercomService;
    this.intercomEnabled = true;
    this.loading = false;
    this.saving = false;
  }
  ngOnInit() {
    this.loadConfig();
  }
  loadConfig() {
    this.loading = true;
    this.intercomConfigService.getConfig().subscribe({
      next: config => {
        this.intercomEnabled = config.intercomWidget ?? true;
        this.loading = false;
      },
      error: error => {
        console.error('Failed to load Intercom configuration:', error);
        this.snackbarService.openSnackBar('Failed to load configuration', 'error');
        this.loading = false;
      }
    });
  }
  saveConfig() {
    this.saving = true;
    this.intercomConfigService.updateConfig({
      intercomWidget: this.intercomEnabled
    }).subscribe({
      next: () => {
        this.snackbarService.openSnackBar('Intercom configuration saved successfully', 'success');
        this.saving = false;
        if (this.intercomEnabled) {
          this.intercomService.showIntercom();
        } else {
          this.intercomService.hideIntercom();
        }
      },
      error: error => {
        console.error('Failed to save Intercom configuration:', error);
        this.snackbarService.openSnackBar('Failed to save configuration', 'error');
        this.saving = false;
      }
    });
  }
  onToggleChange() {
    this.saveConfig();
  }
  static {
    this.ɵfac = function DfIntercomConfigComponent_Factory(t) {
      return new (t || DfIntercomConfigComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_df_intercom_config_service__WEBPACK_IMPORTED_MODULE_0__.DfIntercomConfigService), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_1__.DfSnackbarService), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_shared_services_intercom_service__WEBPACK_IMPORTED_MODULE_2__.IntercomService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdefineComponent"]({
      type: DfIntercomConfigComponent,
      selectors: [["df-intercom-config"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵStandaloneFeature"]],
      decls: 7,
      vars: 3,
      consts: [[1, "intercom-config-container"], [1, "config-section"], ["class", "loading-spinner", 4, "ngIf"], ["color", "primary", "class", "toggle-control", 3, "ngModel", "disabled", "ngModelChange", "change", 4, "ngIf"], ["class", "saving-indicator", 4, "ngIf"], [1, "loading-spinner"], ["diameter", "30"], ["color", "primary", 1, "toggle-control", 3, "ngModel", "disabled", "ngModelChange", "change"], [1, "saving-indicator"], ["diameter", "20"]],
      template: function DfIntercomConfigComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 0)(1, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, " Control whether the Intercom chat widget is displayed to users. When disabled, no Intercom resources will be loaded and the widget will not appear. ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](4, DfIntercomConfigComponent_div_4_Template, 4, 0, "div", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](5, DfIntercomConfigComponent_mat_slide_toggle_5_Template, 2, 3, "mat-slide-toggle", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](6, DfIntercomConfigComponent_div_6_Template, 4, 0, "div", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.loading);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", !ctx.loading);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.saving);
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_4__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgIf, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_5__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_5__.MatSlideToggle, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_6__.MatProgressSpinnerModule, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_6__.MatProgressSpinner, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgModel],
      styles: ["/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
}

/***/ })

}]);
//# sourceMappingURL=src_app_adf-config_df-intercom_df-intercom-config_component_ts.js.map