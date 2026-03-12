"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-files_df-log-viewer_df-log-viewer_component_ts"],{

/***/ 66192:
/*!********************************************************************!*\
  !*** ./src/app/adf-files/df-log-viewer/df-log-viewer.component.ts ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfLogViewerComponent: () => (/* binding */ DfLogViewerComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var src_app_shared_components_df_ace_editor_df_ace_editor_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/components/df-ace-editor/df-ace-editor.component */ 63281);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ 95072);








let DfLogViewerComponent = class DfLogViewerComponent {
  constructor(router, activatedRoute) {
    this.router = router;
    this.activatedRoute = activatedRoute;
    this.activatedRoute.data.subscribe(({
      data
    }) => this.content = data);
  }
  goBack() {
    this.router.navigate(['../../'], {
      relativeTo: this.activatedRoute
    });
  }
  static {
    this.ɵfac = function DfLogViewerComponent_Factory(t) {
      return new (t || DfLogViewerComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_2__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_2__.ActivatedRoute));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: DfLogViewerComponent,
      selectors: [["df-log-viewer"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵStandaloneFeature"]],
      decls: 5,
      vars: 5,
      consts: [[1, "details-section"], ["mat-flat-button", "", 1, "save-btn", 3, "click"], [1, "full-width", 3, "readonly", "value"]],
      template: function DfLogViewerComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 0)(1, "button", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DfLogViewerComponent_Template_button_click_1_listener() {
            return ctx.goBack();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](3, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](4, "df-ace-editor", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](3, 3, "goBack"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("readonly", true)("value", ctx.content);
        }
      },
      dependencies: [src_app_shared_components_df_ace_editor_df_ace_editor_component__WEBPACK_IMPORTED_MODULE_0__.DfAceEditorComponent, _angular_material_button__WEBPACK_IMPORTED_MODULE_3__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_3__.MatButton, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_4__.TranslocoPipe],
      encapsulation: 2
    });
  }
};
DfLogViewerComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_6__.UntilDestroy)({
  checkProperties: true
})], DfLogViewerComponent);

/***/ })

}]);
//# sourceMappingURL=src_app_adf-files_df-log-viewer_df-log-viewer_component_ts.js.map