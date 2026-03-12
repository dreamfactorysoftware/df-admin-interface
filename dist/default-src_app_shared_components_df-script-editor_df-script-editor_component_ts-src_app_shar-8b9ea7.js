"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["default-src_app_shared_components_df-script-editor_df-script-editor_component_ts-src_app_shar-8b9ea7"],{

/***/ 47787:
/*!**********************************************************************************!*\
  !*** ./src/app/shared/components/df-script-editor/df-script-editor.component.ts ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfScriptEditorComponent: () => (/* binding */ DfScriptEditorComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/dialog */ 12587);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/checkbox */ 97024);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _constants_tokens__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../constants/tokens */ 24784);
/* harmony import */ var _utilities_file__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utilities/file */ 63035);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _df_scripts_github_dialog_df_scripts_github_dialog_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../df-scripts-github-dialog/df-scripts-github-dialog.component */ 48391);
/* harmony import */ var _df_ace_editor_df_ace_editor_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../df-ace-editor/df-ace-editor.component */ 63281);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs */ 36647);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _services_df_theme_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../services/df-theme.service */ 52868);
/* harmony import */ var _services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../services/df-base-crud.service */ 36225);


























function DfScriptEditorComponent_ng_container_13_mat_form_field_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-form-field", 11)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](4, "input", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](3, 2, "path"));
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("formControl", ctx_r4.storagePath);
  }
}
function DfScriptEditorComponent_ng_container_13_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](1, DfScriptEditorComponent_ng_container_13_mat_form_field_1_Template, 5, 4, "mat-form-field", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", !ctx_r1.storageServiceId || !ctx_r1.storageServiceId.getRawValue());
  }
}
function DfScriptEditorComponent_div_14_button_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "button", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("click", function DfScriptEditorComponent_div_14_button_4_Template_button_click_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵrestoreView"](_r7);
      const ctx_r6 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵresetView"](ctx_r6.deleteCache());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "scripts.deleteCache"), " ");
  }
}
function DfScriptEditorComponent_div_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "div", 13)(1, "button", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("click", function DfScriptEditorComponent_div_14_Template_button_click_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵrestoreView"](_r9);
      const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵresetView"](ctx_r8.viewLatest());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](4, DfScriptEditorComponent_div_14_button_4_Template, 3, 3, "button", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("disabled", !ctx_r2.storageServiceId || !ctx_r2.storageServiceId.getRawValue());
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](3, 3, "scripts.viewLatest"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx_r2.cache);
  }
}
function DfScriptEditorComponent_span_16_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1, "Script Contents");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
}
let DfScriptEditorComponent = class DfScriptEditorComponent {
  constructor(dialog, fileService, cacheService, baseService, themeService) {
    this.dialog = dialog;
    this.fileService = fileService;
    this.cacheService = cacheService;
    this.baseService = baseService;
    this.themeService = themeService;
    this.storageServices = [];
    this.checked = false;
    this.isDarkMode = this.themeService.darkMode$;
    this.baseService.getAll({
      additionalParams: [{
        key: 'group',
        value: 'source control,file'
      }]
    }).subscribe(res => {
      this.storageServices = res.services;
    });
  }
  ngOnInit() {
    if (this.storageServiceId.getRawValue()) {
      this.storagePath.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]);
    }
    this.storageServiceId.valueChanges.subscribe(value => {
      this.storagePath.reset();
      if (value) {
        this.storagePath.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]);
        // this.content.reset();
        // this.content.disable();
      } else {
        if (this.storagePath.hasValidator(_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required)) {
          // this.content.enable();
          this.storagePath.removeValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required]);
        }
      }
      this.storagePath.updateValueAndValidity();
    });
  }
  fileUpload(event) {
    const input = event.target;
    if (input.files) {
      (0,_utilities_file__WEBPACK_IMPORTED_MODULE_1__.readAsText)(input.files[0]).subscribe(value => {
        this.content.setValue(value);
      });
    }
  }
  githubImport() {
    const dialogRef = this.dialog.open(_df_scripts_github_dialog_df_scripts_github_dialog_component__WEBPACK_IMPORTED_MODULE_2__.DfScriptsGithubDialogComponent);
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.content.setValue(window.atob(res.data.content));
      }
    });
  }
  viewLatest() {
    const filePath = `${this.storageServices.find(service => service.id === this.storageServiceId.getRawValue())?.name}/${this.storagePath.getRawValue()}`;
    if (filePath.endsWith('.json')) {
      this.fileService.downloadJson(filePath).subscribe(text => this.content.setValue(text));
      return;
    } else {
      this.fileService.downloadFile(filePath).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_8__.switchMap)(res => (0,_utilities_file__WEBPACK_IMPORTED_MODULE_1__.readAsText)(res))).subscribe(text => this.content.setValue(text));
    }
  }
  deleteCache() {
    if (!this.cache) return;
    this.cacheService.delete(`_event/${this.cache}`, {
      snackbarSuccess: 'scripts.deleteCacheSuccessMsg'
    }).subscribe();
  }
  static {
    this.ɵfac = function DfScriptEditorComponent_Factory(t) {
      return new (t || DfScriptEditorComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_9__.MatDialog), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_constants_tokens__WEBPACK_IMPORTED_MODULE_0__.BASE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_constants_tokens__WEBPACK_IMPORTED_MODULE_0__.CACHE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_constants_tokens__WEBPACK_IMPORTED_MODULE_0__.BASE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_services_df_theme_service__WEBPACK_IMPORTED_MODULE_4__.DfThemeService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdefineComponent"]({
      type: DfScriptEditorComponent,
      selectors: [["df-script-editor"]],
      inputs: {
        isScript: "isScript",
        cache: "cache",
        type: "type",
        storageServiceId: "storageServiceId",
        storagePath: "storagePath",
        content: "content"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵStandaloneFeature"]],
      decls: 18,
      vars: 18,
      consts: [[1, "details-section"], [1, "actions", "full-width"], ["type", "file", 2, "display", "none", 3, "accept", "change"], ["fileInput", ""], ["type", "button", "mat-flat-button", "", 1, "save-btn", 3, "disabled", "click"], [3, "ngModel", "ngModelChange"], [4, "ngIf"], ["class", "actions", 4, "ngIf"], [1, "content"], [1, "full-width", 3, "formControl", "mode"], ["class", "full-width", "subscriptSizing", "dynamic", 4, "ngIf"], ["subscriptSizing", "dynamic", 1, "full-width"], ["matInput", "", 3, "formControl"], [1, "actions"], ["mat-flat-button", "", "color", "primary", "type", "button", 3, "disabled", "click"], ["mat-flat-button", "", "color", "primary", "type", "button", 3, "click", 4, "ngIf"], ["mat-flat-button", "", "color", "primary", "type", "button", 3, "click"]],
      template: function DfScriptEditorComponent_Template(rf, ctx) {
        if (rf & 1) {
          const _r10 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵgetCurrentView"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](1, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](2, "div", 1)(3, "input", 2, 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("change", function DfScriptEditorComponent_Template_input_change_3_listener($event) {
            return ctx.fileUpload($event);
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](5, "button", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("click", function DfScriptEditorComponent_Template_button_click_5_listener() {
            _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵrestoreView"](_r10);
            const _r0 = _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵreference"](4);
            return _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵresetView"](_r0.click());
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](7, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](8, "button", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("click", function DfScriptEditorComponent_Template_button_click_8_listener() {
            return ctx.githubImport();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](9);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](10, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](11, "mat-checkbox", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("ngModelChange", function DfScriptEditorComponent_Template_mat_checkbox_ngModelChange_11_listener($event) {
            return ctx.checked = $event;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](12, " Add path to file");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](13, DfScriptEditorComponent_ng_container_13_Template, 2, 1, "ng-container", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](14, DfScriptEditorComponent_div_14_Template, 5, 5, "div", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](15, "div", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](16, DfScriptEditorComponent_span_16_Template, 2, 0, "span", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](17, "df-ace-editor", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](1, 12, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("disabled", !ctx.storageServiceId);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](7, 14, "desktopFile"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("disabled", !ctx.storageServiceId);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](10, 16, "githubFile"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngModel", ctx.checked);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.checked);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.storageServiceId.getRawValue());
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.isScript);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("formControl", ctx.content)("mode", ctx.type.getRawValue());
        }
      },
      dependencies: [_angular_material_button__WEBPACK_IMPORTED_MODULE_10__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_10__.MatButton, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_12__.NgIf, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_13__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_13__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_13__.MatLabel, _angular_material_select__WEBPACK_IMPORTED_MODULE_14__.MatSelectModule, _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_15__.MatCheckboxModule, _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_15__.MatCheckbox, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgModel, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_9__.MatDialogModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_16__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_16__.MatInput, _df_ace_editor_df_ace_editor_component__WEBPACK_IMPORTED_MODULE_3__.DfAceEditorComponent, _angular_common__WEBPACK_IMPORTED_MODULE_12__.AsyncPipe, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormControlDirective],
      styles: [".actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 16px;\n}\n\n.content[_ngcontent-%COMP%] {\n  margin-top: 8px;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  width: 100%;\n}\n.content[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  font-size: 20px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtc2NyaXB0LWVkaXRvci9kZi1zY3JpcHQtZWRpdG9yLmNvbXBvbmVudC5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsYUFBQTtFQUNBLFNBQUE7QUFDRjs7QUFDQTtFQUNFLGVBQUE7RUFDQSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSxRQUFBO0VBQ0EsV0FBQTtBQUVGO0FBREU7RUFDRSxlQUFBO0FBR0oiLCJzb3VyY2VzQ29udGVudCI6WyIuYWN0aW9ucyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogMTZweDtcbn1cbi5jb250ZW50IHtcbiAgbWFyZ2luLXRvcDogOHB4O1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDZweDtcbiAgd2lkdGg6IDEwMCU7XG4gIHNwYW4ge1xuICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfScriptEditorComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_17__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_18__.UntilDestroy)({
  checkProperties: true
})], DfScriptEditorComponent);

/***/ }),

/***/ 48391:
/*!**************************************************************************************************!*\
  !*** ./src/app/shared/components/df-scripts-github-dialog/df-scripts-github-dialog.component.ts ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfScriptsGithubDialogComponent: () => (/* binding */ DfScriptsGithubDialogComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/dialog */ 12587);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _utilities_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utilities/url */ 94884);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);



















function DfScriptsGithubDialogComponent_mat_error_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](2, 1, "scripts.errors.githubImport"), " ");
  }
}
function DfScriptsGithubDialogComponent_mat_form_field_9_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-form-field")(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "GitHub Username");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](3, "input", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function DfScriptsGithubDialogComponent_mat_form_field_10_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-form-field")(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "GitHub Token");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](3, "input", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
let DfScriptsGithubDialogComponent = class DfScriptsGithubDialogComponent {
  constructor(githubService, formBuilder, dialogRef) {
    this.githubService = githubService;
    this.formBuilder = formBuilder;
    this.dialogRef = dialogRef;
    this.isGitRepoPrivate = false;
    this.formGroup = formBuilder.group({
      url: ['', [_angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required, this.urlValidator]]
    });
  }
  ngOnInit() {
    this.formGroup.controls['url'].valueChanges.subscribe(url => {
      if ((0,_utilities_url__WEBPACK_IMPORTED_MODULE_1__.isValidHttpUrl)(url)) {
        if ((url.indexOf('.js') > 0 || url.indexOf('.py') > 0 || url.indexOf('.php') > 0 || url.indexOf('.txt') > 0) && url.includes('github')) {
          const urlParams = url.substring(url.indexOf('.com/') + 5);
          const urlArray = urlParams.split('/');
          this.repoOwner = urlArray[0];
          this.repoName = urlArray[1];
          this.fileName = urlArray.slice(4).join('/');
          const githubApiEndpoint = `${this.repoOwner}/${this.repoName}`;
          this.githubService.get(githubApiEndpoint, {
            snackbarError: 'server',
            snackbarSuccess: 'getScriptSuccessMsg',
            includeCacheControl: false
          }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_5__.catchError)(err => {
            // repo can't be found therefore it is private hence enabling the username and password fields
            this.isGitRepoPrivate = true;
            this.formGroup.addControl('username', this.formBuilder.control('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required));
            this.formGroup.addControl('password', this.formBuilder.control('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required));
            return (0,rxjs__WEBPACK_IMPORTED_MODULE_6__.throwError)(() => new Error(err));
          })).subscribe(data => {
            this.isGitRepoPrivate = data['private'];
          });
        } else {
          // display error message stating that file needs to have certain extension
        }
      }
    });
  }
  urlValidator(control) {
    const url = control.value;
    if ((url.indexOf('.js') > 0 || url.indexOf('.py') > 0 || url.indexOf('.php') > 0 || url.indexOf('.txt') > 0) && url.includes('github')) {
      return null;
    } else {
      return {
        invalidUrl: true
      };
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onFileUrlChange(value) {}
  onUpload() {
    if (this.formGroup.invalid) return;
    const githubApiEndpoint = `${this.repoOwner}/${this.repoName}/contents/${this.fileName}`;
    this.githubService.getFileContent(githubApiEndpoint, this.formGroup.value.username, this.formGroup.value.password).subscribe(data => {
      this.dialogRef.close({
        data: data
      });
    });
  }
  static {
    this.ɵfac = function DfScriptsGithubDialogComponent_Factory(t) {
      return new (t || DfScriptsGithubDialogComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__.GITHUB_REPO_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__.MatDialogRef));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdefineComponent"]({
      type: DfScriptsGithubDialogComponent,
      selectors: [["df-scripts-github-dialog"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵStandaloneFeature"]],
      decls: 18,
      vars: 10,
      consts: [["mat-dialog-title", ""], ["mat-dialog-content", ""], [1, "details-section", 3, "formGroup"], ["subscriptSizing", "dynamic"], ["matInput", "", "formControlName", "url", "placeholder", "https://github.com/user/repo/blob/file.json"], [4, "ngIf"], ["mat-dialog-actions", ""], ["mat-flat-button", "", "mat-dialog-close", ""], ["mat-flat-button", "", "color", "primary", 3, "click"], ["matInput", "", "formControlName", "username", "placeholder", "Username", "type", "text"], ["matInput", "", "formControlName", "password", "placeholder", "Personal Access Token", "type", "text"]],
      template: function DfScriptsGithubDialogComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "h1", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, "Import a script file from GitHub");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](2, "div", 1)(3, "form", 2)(4, "mat-form-field", 3)(5, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6, "GitHub File URL");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](7, "input", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](8, DfScriptsGithubDialogComponent_mat_error_8_Template, 3, 3, "mat-error", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](9, DfScriptsGithubDialogComponent_mat_form_field_9_Template, 4, 0, "mat-form-field", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](10, DfScriptsGithubDialogComponent_mat_form_field_10_Template, 4, 0, "mat-form-field", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "div", 6)(12, "button", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](13);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](14, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "button", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfScriptsGithubDialogComponent_Template_button_click_15_listener() {
            return ctx.onUpload();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](16);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipe"](17, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("formGroup", ctx.formGroup);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.formGroup.controls["url"].errors == null ? null : ctx.formGroup.controls["url"].errors["invalidUrl"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.formGroup.contains("username"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx.formGroup.contains("password"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](14, 6, "close"));
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpipeBind1"](17, 8, "upload"), " ");
        }
      },
      dependencies: [_angular_material_button__WEBPACK_IMPORTED_MODULE_8__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_8__.MatButton, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__.MatDialogModule, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__.MatDialogClose, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__.MatDialogTitle, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__.MatDialogContent, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_7__.MatDialogActions, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_9__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_9__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_9__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_9__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_10__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_10__.MatInput, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_4__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_4__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControlName, _angular_common__WEBPACK_IMPORTED_MODULE_11__.NgIf, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__.TranslocoPipe],
      styles: ["/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfScriptsGithubDialogComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_13__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_14__.UntilDestroy)({
  checkProperties: true
})], DfScriptsGithubDialogComponent);

/***/ }),

/***/ 59757:
/*!**************************************************!*\
  !*** ./src/app/shared/utilities/eventScripts.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addGroupEntries: () => (/* binding */ addGroupEntries),
/* harmony export */   groupEvents: () => (/* binding */ groupEvents)
/* harmony export */ });
/* harmony import */ var _case__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./case */ 60169);

function groupEvents(data) {
  return Object.values((0,_case__WEBPACK_IMPORTED_MODULE_0__.mapCamelToSnake)(data)).flatMap(group => {
    return Object.entries(group).map(([subKey, item]) => {
      let endpoints = [];
      if (item.parameter) {
        endpoints = item.endpoints.flatMap(endpoint => {
          const matches = endpoint.match(/{(.*?)}/);
          if (matches) {
            const paramKey = matches[1];
            const paramValues = item.parameter?.[paramKey] || [];
            return [endpoint, ...paramValues.map(value => endpoint.replace(`{${paramKey}}`, value))];
          }
          return endpoint;
        });
      } else {
        endpoints = item.endpoints;
      }
      return {
        name: subKey,
        endpoints: [...new Set(endpoints)]
      };
    });
  });
}
function addGroupEntries(input) {
  const output = [];
  const seenPrefixes = new Set();
  for (const item of input) {
    const prefix = item.split('.')[0];
    if (!seenPrefixes.has(prefix)) {
      seenPrefixes.add(prefix);
      output.push(`${prefix}.*`);
    }
    output.push(item);
  }
  return output;
}

/***/ })

}]);
//# sourceMappingURL=default-src_app_shared_components_df-script-editor_df-script-editor_component_ts-src_app_shar-8b9ea7.js.map