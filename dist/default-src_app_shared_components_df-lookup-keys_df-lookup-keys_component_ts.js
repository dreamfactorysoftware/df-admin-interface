"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["default-src_app_shared_components_df-lookup-keys_df-lookup-keys_component_ts"],{

/***/ 58751:
/*!******************************************************************************!*\
  !*** ./src/app/shared/components/df-lookup-keys/df-lookup-keys.component.ts ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfLookupKeysComponent: () => (/* binding */ DfLookupKeysComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_table__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/material/table */ 77697);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _angular_material_expansion__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/expansion */ 19322);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);

























function DfLookupKeysComponent_mat_accordion_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-accordion")(1, "mat-expansion-panel")(2, "mat-expansion-panel-header")(3, "mat-panel-title");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](5, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](6, "mat-panel-description");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](8, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainer"](9, 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    const _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵreference"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](5, 3, "lookupKeys.label"), "");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](8, 5, "lookupKeys.desc"));
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngTemplateOutlet", _r1);
  }
}
function DfLookupKeysComponent_ng_template_3_mat_header_cell_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-header-cell");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "name"), " ");
  }
}
function DfLookupKeysComponent_ng_template_3_mat_cell_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-cell", 16)(1, "mat-form-field", 17)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](5, "input", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r15 = ctx.index;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("formGroupName", i_r15);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](4, 2, "name"));
  }
}
function DfLookupKeysComponent_ng_template_3_mat_header_cell_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-header-cell");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "value"), " ");
  }
}
function DfLookupKeysComponent_ng_template_3_mat_cell_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-cell", 16)(1, "mat-form-field", 17)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](5, "input", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r17 = ctx.index;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("formGroupName", i_r17);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](4, 2, "value"));
  }
}
function DfLookupKeysComponent_ng_template_3_mat_header_cell_10_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-header-cell");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 1, "private"), " ");
  }
}
function DfLookupKeysComponent_ng_template_3_mat_cell_11_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-cell", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](1, "mat-slide-toggle", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const i_r19 = ctx.index;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("formGroupName", i_r19);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵattribute"]("aria-label", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 2, "name"));
  }
}
function DfLookupKeysComponent_ng_template_3_mat_header_cell_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-header-cell")(1, "button", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DfLookupKeysComponent_ng_template_3_mat_header_cell_13_Template_button_click_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵrestoreView"](_r21);
      const ctx_r20 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵresetView"](ctx_r20.add());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](3, "fa-icon", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r9 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵattribute"]("aria-label", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](2, 2, "newEntry"));
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("icon", ctx_r9.faPlus);
  }
}
function DfLookupKeysComponent_ng_template_3_mat_cell_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r25 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-cell", 16)(1, "button", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DfLookupKeysComponent_ng_template_3_mat_cell_14_Template_button_click_1_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵrestoreView"](_r25);
      const i_r23 = restoredCtx.index;
      const ctx_r24 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵresetView"](ctx_r24.remove(i_r23));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](2, "fa-icon", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r23 = ctx.index;
    const ctx_r10 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("formGroupName", i_r23);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("icon", ctx_r10.faTrashCan);
  }
}
function DfLookupKeysComponent_ng_template_3_mat_header_row_15_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "mat-header-row");
  }
}
function DfLookupKeysComponent_ng_template_3_mat_row_16_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "mat-row");
  }
}
function DfLookupKeysComponent_ng_template_3_tr_17_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "tr", 25)(1, "td", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](3, 1, "lookupKeys.noKeys"), " ");
  }
}
function DfLookupKeysComponent_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](0, 4)(1, 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](2, "mat-table", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](3, 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](4, DfLookupKeysComponent_ng_template_3_mat_header_cell_4_Template, 3, 3, "mat-header-cell", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](5, DfLookupKeysComponent_ng_template_3_mat_cell_5_Template, 6, 4, "mat-cell", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](6, 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](7, DfLookupKeysComponent_ng_template_3_mat_header_cell_7_Template, 3, 3, "mat-header-cell", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](8, DfLookupKeysComponent_ng_template_3_mat_cell_8_Template, 6, 4, "mat-cell", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](9, 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](10, DfLookupKeysComponent_ng_template_3_mat_header_cell_10_Template, 3, 3, "mat-header-cell", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](11, DfLookupKeysComponent_ng_template_3_mat_cell_11_Template, 3, 4, "mat-cell", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerStart"](12, 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](13, DfLookupKeysComponent_ng_template_3_mat_header_cell_13_Template, 4, 4, "mat-header-cell", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](14, DfLookupKeysComponent_ng_template_3_mat_cell_14_Template, 3, 2, "mat-cell", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](15, DfLookupKeysComponent_ng_template_3_mat_header_row_15_Template, 1, 0, "mat-header-row", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](16, DfLookupKeysComponent_ng_template_3_mat_row_16_Template, 1, 0, "mat-row", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](17, DfLookupKeysComponent_ng_template_3_tr_17_Template, 4, 3, "tr", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementContainerEnd"]()();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("formGroup", ctx_r2.rootForm);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("dataSource", ctx_r2.dataSource);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](13);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matHeaderRowDef", ctx_r2.displayedColumns);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matRowDefColumns", ctx_r2.displayedColumns);
  }
}
let DfLookupKeysComponent = class DfLookupKeysComponent {
  constructor(rootFormGroup, themeService) {
    this.rootFormGroup = rootFormGroup;
    this.themeService = themeService;
    this.displayedColumns = ['name', 'value', 'private', 'actions'];
    this.faTrashCan = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_2__.faTrashCan;
    this.faPlus = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_2__.faPlus;
    this.showAccordion = true;
    this.lookupDeleted = new _angular_core__WEBPACK_IMPORTED_MODULE_1__.EventEmitter(); // Emit deleted lookup keys
    this.isDarkMode = this.themeService.darkMode$;
  }
  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit.subscribe(() => {
      this.lookupKeys.markAllAsTouched();
    });
    this.lookupKeys = this.rootForm.get('lookupKeys');
    this.updateDataSource();
  }
  updateDataSource() {
    this.lookupKeys.controls.forEach(control => {
      if (control.get('id')?.value) {
        control.get('name')?.disable();
      }
    });
    this.dataSource = new _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatTableDataSource(this.lookupKeys.controls);
  }
  add() {
    this.lookupKeys.push(new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroup({
      name: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required),
      value: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl(''),
      private: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl(false)
    }));
    this.updateDataSource();
  }
  remove(index) {
    const deletedItem = this.lookupKeys.at(index).value;
    // Emit the deleted item if it has an id (existing record)
    if (deletedItem.id) {
      this.lookupDeleted.emit(deletedItem);
    }
    this.lookupKeys.removeAt(index);
    this.updateDataSource();
  }
  static {
    this.ɵfac = function DfLookupKeysComponent_Factory(t) {
      return new (t || DfLookupKeysComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroupDirective), _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_0__.DfThemeService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: DfLookupKeysComponent,
      selectors: [["df-lookup-keys"]],
      inputs: {
        showAccordion: "showAccordion"
      },
      outputs: {
        lookupDeleted: "lookupDeleted"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵStandaloneFeature"]],
      decls: 5,
      vars: 6,
      consts: [[1, "lookup-keys-accordion"], [4, "ngIf", "ngIfElse"], ["lookupKeys", ""], [3, "ngTemplateOutlet"], [3, "formGroup"], ["formArrayName", "lookupKeys"], [3, "dataSource"], ["matColumnDef", "name"], [4, "matHeaderCellDef"], [3, "formGroupName", 4, "matCellDef"], ["matColumnDef", "value"], ["matColumnDef", "private"], ["matColumnDef", "actions", "stickyEnd", ""], [4, "matHeaderRowDef"], [4, "matRowDef", "matRowDefColumns"], ["class", "mat-row no-data-row", 4, "matNoDataRow"], [3, "formGroupName"], ["appearance", "outline", "subscriptSizing", "dynamic"], ["matInput", "", "formControlName", "name"], ["matInput", "", "formControlName", "value"], ["color", "primary", "formControlName", "private"], ["mat-mini-fab", "", "type", "button", 1, "save-btn", 3, "click"], ["size", "xl", 3, "icon"], ["mat-icon-button", "", "type", "button", 1, "remove-btn", 3, "click"], ["size", "xs", 3, "icon"], [1, "mat-row", "no-data-row"], ["colspan", "4", 1, "mat-cell"]],
      template: function DfLookupKeysComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipe"](1, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](2, DfLookupKeysComponent_mat_accordion_2_Template, 10, 7, "mat-accordion", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](3, DfLookupKeysComponent_ng_template_3_Template, 18, 4, "ng-template", null, 2, _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplateRefExtractor"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
        }
        if (rf & 2) {
          const _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵreference"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpipeBind1"](1, 4, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.showAccordion)("ngIfElse", _r1);
        }
      },
      dependencies: [_angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroupName, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormArrayName, _angular_common__WEBPACK_IMPORTED_MODULE_5__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_5__.NgTemplateOutlet, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_6__.MatLabel, _angular_material_button__WEBPACK_IMPORTED_MODULE_7__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_7__.MatIconButton, _angular_material_button__WEBPACK_IMPORTED_MODULE_7__.MatMiniFabButton, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatTableModule, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatTable, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatHeaderCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatHeaderRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatColumnDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatHeaderCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatHeaderRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_3__.MatNoDataRow, _angular_material_input__WEBPACK_IMPORTED_MODULE_8__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_8__.MatInput, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_9__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_9__.MatSlideToggle, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_10__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_10__.FaIconComponent, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_11__.MatExpansionModule, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_11__.MatAccordion, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_11__.MatExpansionPanel, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_11__.MatExpansionPanelHeader, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_11__.MatExpansionPanelTitle, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_11__.MatExpansionPanelDescription, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_12__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_5__.AsyncPipe],
      styles: [".lookup-keys-accordion[_ngcontent-%COMP%] {\n  padding: 16px 0;\n}\n\n.mat-column-actions[_ngcontent-%COMP%] {\n  max-width: 10%;\n}\n\n.mat-column-private[_ngcontent-%COMP%] {\n  max-width: 10%;\n}\n\n.mat-mdc-cell[_ngcontent-%COMP%] {\n  padding: 8px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtbG9va3VwLWtleXMvZGYtbG9va3VwLWtleXMuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxlQUFBO0FBQ0Y7O0FBRUE7RUFDRSxjQUFBO0FBQ0Y7O0FBQ0E7RUFDRSxjQUFBO0FBRUY7O0FBQUE7RUFDRSxZQUFBO0FBR0YiLCJzb3VyY2VzQ29udGVudCI6WyIubG9va3VwLWtleXMtYWNjb3JkaW9uIHtcbiAgcGFkZGluZzogMTZweCAwO1xufVxuXG4ubWF0LWNvbHVtbi1hY3Rpb25zIHtcbiAgbWF4LXdpZHRoOiAxMCU7XG59XG4ubWF0LWNvbHVtbi1wcml2YXRlIHtcbiAgbWF4LXdpZHRoOiAxMCU7XG59XG4ubWF0LW1kYy1jZWxsIHtcbiAgcGFkZGluZzogOHB4O1xufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfLookupKeysComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_13__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_14__.UntilDestroy)({
  checkProperties: true
})], DfLookupKeysComponent);

/***/ })

}]);
//# sourceMappingURL=default-src_app_shared_components_df-lookup-keys_df-lookup-keys_component_ts.js.map