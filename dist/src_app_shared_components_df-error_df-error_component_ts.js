"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_shared_components_df-error_df-error_component_ts"],{

/***/ 58909:
/*!******************************************************************!*\
  !*** ./src/app/shared/components/df-error/df-error.component.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfErrorComponent: () => (/* binding */ DfErrorComponent)
/* harmony export */ });
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var src_app_shared_services_df_error_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/services/df-error.service */ 25819);



class DfErrorComponent {
  constructor(errorService) {
    this.errorService = errorService;
    this.error$ = this.errorService.error$;
  }
  static {
    this.ɵfac = function DfErrorComponent_Factory(t) {
      return new (t || DfErrorComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](src_app_shared_services_df_error_service__WEBPACK_IMPORTED_MODULE_0__.DfErrorService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: DfErrorComponent,
      selectors: [["df-error"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵStandaloneFeature"]],
      decls: 5,
      vars: 3,
      consts: [[1, "error-container"], [1, "error"]],
      template: function DfErrorComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 0)(1, "div", 1)(2, "h1");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](4, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](4, 1, ctx.error$));
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_2__.AsyncPipe],
      styles: [".error-container[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: row;\n  justify-content: center;\n  width: 100%;\n  height: 50%;\n  align-items: center;\n}\n.error-container[_ngcontent-%COMP%]   .error[_ngcontent-%COMP%] {\n  max-width: 600px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtZXJyb3IvZGYtZXJyb3IuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSx1QkFBQTtFQUNBLFdBQUE7RUFDQSxXQUFBO0VBQ0EsbUJBQUE7QUFDRjtBQUFFO0VBQ0UsZ0JBQUE7QUFFSiIsInNvdXJjZXNDb250ZW50IjpbIi5lcnJvci1jb250YWluZXIge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogNTAlO1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAuZXJyb3Ige1xuICAgIG1heC13aWR0aDogNjAwcHg7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
}

/***/ })

}]);
//# sourceMappingURL=src_app_shared_components_df-error_df-error_component_ts.js.map