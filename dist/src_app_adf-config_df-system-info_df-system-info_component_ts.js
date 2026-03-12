"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-config_df-system-info_df-system-info_component_ts"],{

/***/ 12423:
/*!***********************************************************************!*\
  !*** ./src/app/adf-config/df-system-info/df-system-info.component.ts ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfSystemInfoComponent: () => (/* binding */ DfSystemInfoComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/services/df-breakpoint.service */ 52608);
/* harmony import */ var src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var src_app_shared_services_df_license_check_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/services/df-license-check.service */ 14543);








function DfSystemInfoComponent_li_14_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.licenseKey"), ": ", ctx_r0.environment.platform == null ? null : ctx_r0.environment.platform.licenseKey, " ");
  }
}
function DfSystemInfoComponent_ng_container_15_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](1, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](4, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](6, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](3, 4, "systemInfo.instance.subscriptionStatus"), ": ", ctx_r1.status.msg, " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](6, 6, "systemInfo.instance.subscriptionExpirationDate"), ": ", ctx_r1.status.renewalDate, " ");
  }
}
function DfSystemInfoComponent_li_19_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.systemDatabase"), ": ", ctx_r2.environment.platform == null ? null : ctx_r2.environment.platform.dbDriver, " ");
  }
}
function DfSystemInfoComponent_li_20_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.installPath"), ": ", ctx_r3.environment.platform == null ? null : ctx_r3.environment.platform.installPath, " ");
  }
}
function DfSystemInfoComponent_li_21_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.logPath"), ": ", ctx_r4.environment.platform == null ? null : ctx_r4.environment.platform.logPath, " ");
  }
}
function DfSystemInfoComponent_li_22_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.logMode"), ": ", ctx_r5.environment.platform == null ? null : ctx_r5.environment.platform.logMode, " ");
  }
}
function DfSystemInfoComponent_li_23_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r6 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.logLevel"), ": ", ctx_r6.environment.platform == null ? null : ctx_r6.environment.platform.logLevel, " ");
  }
}
function DfSystemInfoComponent_li_24_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.cacheDriver"), ": ", ctx_r7.environment.platform == null ? null : ctx_r7.environment.platform.cacheDriver, " ");
  }
}
function DfSystemInfoComponent_li_25_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.demo"), ": ", ctx_r8.environment.platform == null ? null : ctx_r8.environment.platform.isTrial, " ");
  }
}
function DfSystemInfoComponent_li_26_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r9 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" DreamFactory ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 2, "systemInfo.instance.instanceId"), ": ", ctx_r9.environment.platform == null ? null : ctx_r9.environment.platform.dfInstanceId, " ");
  }
}
function DfSystemInfoComponent_div_27_li_13_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "li")(1, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const package_r13 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](package_r13.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](package_r13.version);
  }
}
function DfSystemInfoComponent_div_27_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 7)(1, "h3");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](4, "div", 8)(5, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](7, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](10, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "div", 9)(12, "ul");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](13, DfSystemInfoComponent_div_27_li_13_Template, 5, 2, "li", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const ctx_r10 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](3, 4, "systemInfo.packages"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](7, 6, "name"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](10, 8, "version"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r10.environment.platform == null ? null : ctx_r10.environment.platform.packages);
  }
}
function DfSystemInfoComponent_ng_container_48_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](1, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](4, "li");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](6, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r11 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" PHP ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](3, 4, "version"), ": ", ctx_r11.environment.php.core.phpVersion, " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" PHP ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](6, 6, "systemInfo.server.serverApi"), ": ", ctx_r11.environment.php.general.serverApi, " ");
  }
}
let DfSystemInfoComponent = class DfSystemInfoComponent {
  constructor(breakpointService, systemConfigDataService, licenseCheckService) {
    this.breakpointService = breakpointService;
    this.systemConfigDataService = systemConfigDataService;
    this.licenseCheckService = licenseCheckService;
    this.environment = this.systemConfigDataService.environment;
  }
  ngOnInit() {
    // Use the existing license check result instead of triggering a new one
    this.licenseCheckService.licenseCheck$.subscribe(licenseCheck => {
      if (licenseCheck) {
        this.status = licenseCheck;
      } else {
        this.status = undefined;
      }
    });
  }
  static {
    this.ɵfac = function DfSystemInfoComponent_Factory(t) {
      return new (t || DfSystemInfoComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_0__.DfBreakpointService), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_1__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](src_app_shared_services_df_license_check_service__WEBPACK_IMPORTED_MODULE_2__.DfLicenseCheckService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdefineComponent"]({
      type: DfSystemInfoComponent,
      selectors: [["df-system-info"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵStandaloneFeature"]],
      decls: 63,
      vars: 68,
      consts: [[1, "system-info-container"], [1, "system-info-instance"], [1, "system-info-platform"], [4, "ngIf"], ["class", "system-info-packages", 4, "ngIf"], [1, "system-info-server"], [1, "system-info-client"], [1, "system-info-packages"], [1, "package-header"], [1, "overflow-scroll"], [4, "ngFor", "ngForOf"]],
      template: function DfSystemInfoComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 0)(1, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](3, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](4, "h2");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](6, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "div", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](8, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](9, "div", 2)(10, "ul")(11, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](12);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](13, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](14, DfSystemInfoComponent_li_14_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](15, DfSystemInfoComponent_ng_container_15_Template, 7, 8, "ng-container", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](16, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](17);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](18, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](19, DfSystemInfoComponent_li_19_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](20, DfSystemInfoComponent_li_20_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](21, DfSystemInfoComponent_li_21_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](22, DfSystemInfoComponent_li_22_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](23, DfSystemInfoComponent_li_23_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](24, DfSystemInfoComponent_li_24_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](25, DfSystemInfoComponent_li_25_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](26, DfSystemInfoComponent_li_26_Template, 3, 4, "li", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](27, DfSystemInfoComponent_div_27_Template, 14, 10, "div", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](28, "h2");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](29);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](30, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](31, "div", 5)(32, "ul")(33, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](34);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](35, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](36, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](37);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](38, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](39, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](40);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](41, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](42, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](43);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](44, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](45, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](46);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](47, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](48, DfSystemInfoComponent_ng_container_48_Template, 7, 8, "ng-container", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](49, "h2");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](50);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](51, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](52, "div", 6)(53, "ul")(54, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](55);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](56, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](57, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](58);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](59, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](60, "li");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](61);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](62, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](3, 38, "systemInfo.subheading"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"]("DreamFactory ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](6, 40, "systemInfo.instance.instance"), "");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵclassProp"]("x-small", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](8, 42, ctx.breakpointService.isXSmallScreen));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](13, 44, "systemInfo.instance.licenseLevel"), ": ", ctx.environment.platform == null ? null : ctx.environment.platform.license, " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.licenseKey);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.status);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" DreamFactory ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](18, 46, "version"), ": ", ctx.environment.platform == null ? null : ctx.environment.platform.version, " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.dbDriver);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.installPath);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.logPath);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.logMode);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.logLevel);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.cacheDriver);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.isTrial);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.dfInstanceId);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.platform == null ? null : ctx.environment.platform.packages);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](30, 48, "systemInfo.server.heading"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](35, 50, "systemInfo.server.os"), ": ", ctx.environment.server.serverOs, " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](38, 52, "systemInfo.server.release"), ": ", ctx.environment.server.release, " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"]("", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](41, 54, "version"), ": ", ctx.environment.server.version, "");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](44, 56, "systemInfo.server.host"), ": ", ctx.environment.server.host, " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](47, 58, "systemInfo.server.machine"), ": ", ctx.environment.server.machine, " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.environment.php);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](51, 60, "systemInfo.client.heading"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](56, 62, "systemInfo.client.userAgent"), ": ", ctx.environment.client == null ? null : ctx.environment.client.userAgent, " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](59, 64, "systemInfo.client.ipAddress"), ": ", ctx.environment.client == null ? null : ctx.environment.client.ipAddress, " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](62, 66, "systemInfo.client.Locale"), ": ", ctx.environment.client == null ? null : ctx.environment.client.locale, " ");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_4__.AsyncPipe, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgFor, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_5__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgIf],
      styles: [".system-info-container[_ngcontent-%COMP%] {\n  padding-bottom: 32px;\n}\n.system-info-container[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%] {\n  list-style-type: none;\n  padding: 0;\n  margin: 0;\n}\n.system-info-container[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  line-height: 3rem;\n}\n.system-info-container[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  border-bottom: 1px solid #e5e5e5;\n  padding-bottom: 10px;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 20px;\n  justify-content: space-between;\n  margin-bottom: 20px;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance[_ngcontent-%COMP%]   .system-info-packages[_ngcontent-%COMP%] {\n  padding-left: 20px;\n  border-left: 1px dashed #000;\n  max-width: 40%;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance[_ngcontent-%COMP%]   .system-info-packages[_ngcontent-%COMP%]   .package-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  font-weight: bold;\n  border-bottom: 2px solid #000;\n  padding-bottom: 5px;\n  margin-bottom: 5px;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance[_ngcontent-%COMP%]   .system-info-packages[_ngcontent-%COMP%]   .overflow-scroll[_ngcontent-%COMP%] {\n  height: 300px;\n  overflow: auto;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance[_ngcontent-%COMP%]   .system-info-packages[_ngcontent-%COMP%]   li[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  gap: 10px;\n  padding-bottom: 0.2rem;\n  border-bottom: 1px dotted #bdbdbd;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance.x-small[_ngcontent-%COMP%] {\n  flex-direction: column;\n  gap: 10px;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance.x-small[_ngcontent-%COMP%]   .system-info-platform[_ngcontent-%COMP%] {\n  max-width: 100%;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance.x-small[_ngcontent-%COMP%]   .system-info-packages[_ngcontent-%COMP%] {\n  max-width: 100%;\n  padding-left: 0;\n  border-left: none;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-instance.x-small[_ngcontent-%COMP%]   .system-info-packages[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%] {\n  padding: 10px 10px 0;\n}\n.system-info-container[_ngcontent-%COMP%]   .system-info-server[_ngcontent-%COMP%] {\n  margin: 20px 0;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWNvbmZpZy9kZi1zeXN0ZW0taW5mby9kZi1zeXN0ZW0taW5mby5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLG9CQUFBO0FBQ0Y7QUFDRTtFQUNFLHFCQUFBO0VBQ0EsVUFBQTtFQUNBLFNBQUE7QUFDSjtBQUNJO0VBQ0UsaUJBQUE7QUFDTjtBQUdFO0VBQ0UsZ0NBQUE7RUFDQSxvQkFBQTtBQURKO0FBSUU7RUFDRSxhQUFBO0VBQ0EsU0FBQTtFQUNBLDhCQUFBO0VBQ0EsbUJBQUE7QUFGSjtBQUlJO0VBQ0Usa0JBQUE7RUFDQSw0QkFBQTtFQUNBLGNBQUE7QUFGTjtBQUdNO0VBQ0UsYUFBQTtFQUNBLDhCQUFBO0VBQ0EsaUJBQUE7RUFDQSw2QkFBQTtFQUNBLG1CQUFBO0VBQ0Esa0JBQUE7QUFEUjtBQUdNO0VBQ0UsYUFBQTtFQUNBLGNBQUE7QUFEUjtBQUlNO0VBQ0UsYUFBQTtFQUNBLDhCQUFBO0VBQ0EsU0FBQTtFQUNBLHNCQUFBO0VBQ0EsaUNBQUE7QUFGUjtBQU1JO0VBQ0Usc0JBQUE7RUFDQSxTQUFBO0FBSk47QUFNTTtFQUNFLGVBQUE7QUFKUjtBQU9NO0VBQ0UsZUFBQTtFQUNBLGVBQUE7RUFDQSxpQkFBQTtBQUxSO0FBT1E7RUFDRSxvQkFBQTtBQUxWO0FBV0U7RUFDRSxjQUFBO0FBVEoiLCJzb3VyY2VzQ29udGVudCI6WyIuc3lzdGVtLWluZm8tY29udGFpbmVyIHtcbiAgcGFkZGluZy1ib3R0b206IDMycHg7XG5cbiAgdWwge1xuICAgIGxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcbiAgICBwYWRkaW5nOiAwO1xuICAgIG1hcmdpbjogMDtcblxuICAgIGxpIHtcbiAgICAgIGxpbmUtaGVpZ2h0OiAzcmVtO1xuICAgIH1cbiAgfVxuXG4gIGgyIHtcbiAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2U1ZTVlNTtcbiAgICBwYWRkaW5nLWJvdHRvbTogMTBweDtcbiAgfVxuXG4gIC5zeXN0ZW0taW5mby1pbnN0YW5jZSB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBnYXA6IDIwcHg7XG4gICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgIG1hcmdpbi1ib3R0b206IDIwcHg7XG5cbiAgICAuc3lzdGVtLWluZm8tcGFja2FnZXMge1xuICAgICAgcGFkZGluZy1sZWZ0OiAyMHB4O1xuICAgICAgYm9yZGVyLWxlZnQ6IDFweCBkYXNoZWQgIzAwMDtcbiAgICAgIG1heC13aWR0aDogNDAlO1xuICAgICAgLnBhY2thZ2UtaGVhZGVyIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICMwMDA7XG4gICAgICAgIHBhZGRpbmctYm90dG9tOiA1cHg7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDVweDtcbiAgICAgIH1cbiAgICAgIC5vdmVyZmxvdy1zY3JvbGwge1xuICAgICAgICBoZWlnaHQ6IDMwMHB4O1xuICAgICAgICBvdmVyZmxvdzogYXV0bztcbiAgICAgICAgLy8gcGFkZGluZy1yaWdodDogMTBweDtcbiAgICAgIH1cbiAgICAgIGxpIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBnYXA6IDEwcHg7XG4gICAgICAgIHBhZGRpbmctYm90dG9tOiAwLjJyZW07XG4gICAgICAgIGJvcmRlci1ib3R0b206IDFweCBkb3R0ZWQgI2JkYmRiZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAmLngtc21hbGwge1xuICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgIGdhcDogMTBweDtcblxuICAgICAgLnN5c3RlbS1pbmZvLXBsYXRmb3JtIHtcbiAgICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgfVxuXG4gICAgICAuc3lzdGVtLWluZm8tcGFja2FnZXMge1xuICAgICAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgICAgIHBhZGRpbmctbGVmdDogMDtcbiAgICAgICAgYm9yZGVyLWxlZnQ6IG5vbmU7XG5cbiAgICAgICAgdWwge1xuICAgICAgICAgIHBhZGRpbmc6IDEwcHggMTBweCAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLnN5c3RlbS1pbmZvLXNlcnZlciB7XG4gICAgbWFyZ2luOiAyMHB4IDA7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
};
DfSystemInfoComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_7__.UntilDestroy)({
  checkProperties: true
})], DfSystemInfoComponent);

/***/ })

}]);
//# sourceMappingURL=src_app_adf-config_df-system-info_df-system-info_component_ts.js.map