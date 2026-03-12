"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["default-src_app_shared_components_df-user-app-roles_df-user-app-roles_component_ts-src_app_sh-09e173"],{

/***/ 30877:
/*!************************************************************************************!*\
  !*** ./src/app/shared/components/df-user-app-roles/df-user-app-roles.component.ts ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfUserAppRolesComponent: () => (/* binding */ DfUserAppRolesComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_table__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/material/table */ 77697);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _angular_material_expansion__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/expansion */ 19322);
/* harmony import */ var _angular_material_autocomplete__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/material/autocomplete */ 79771);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/form-field */ 24950);






















function DfUserAppRolesComponent_mat_header_cell_14_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-header-cell");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 1, "roles.app"), " ");
  }
}
function DfUserAppRolesComponent_mat_cell_15_mat_option_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-option", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const app_r13 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("value", app_r13.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", app_r13.name, " ");
  }
}
function DfUserAppRolesComponent_mat_cell_15_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-cell", 12)(1, "mat-form-field", 13)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](5, "input", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "mat-autocomplete", 15, 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](8, DfUserAppRolesComponent_mat_cell_15_mat_option_8_Template, 2, 2, "mat-option", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const i_r10 = ctx.index;
    const _r11 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵreference"](7);
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("formGroupName", i_r10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](4, 4, "roles.app"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matAutocomplete", _r11);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx_r1.availableApps);
  }
}
function DfUserAppRolesComponent_mat_header_cell_17_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-header-cell");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 1, "roles.role"), " ");
  }
}
function DfUserAppRolesComponent_mat_cell_18_mat_option_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-option", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const role_r18 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("value", role_r18.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", role_r18.name, " ");
  }
}
function DfUserAppRolesComponent_mat_cell_18_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-cell", 12)(1, "mat-form-field", 13)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](5, "input", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "mat-autocomplete", 15, 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](8, DfUserAppRolesComponent_mat_cell_18_mat_option_8_Template, 2, 2, "mat-option", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const i_r15 = ctx.index;
    const _r16 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵreference"](7);
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("formGroupName", i_r15);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](4, 4, "roles.role"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matAutocomplete", _r16);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx_r3.roles);
  }
}
function DfUserAppRolesComponent_mat_header_cell_20_button_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "button", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfUserAppRolesComponent_mat_header_cell_20_button_1_Template_button_click_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r21);
      const ctx_r20 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r20.add());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](1, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "fa-icon", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r19 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("aria-label", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](1, 2, "newEntry"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r19.faPlus);
  }
}
function DfUserAppRolesComponent_mat_header_cell_20_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-header-cell");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, DfUserAppRolesComponent_mat_header_cell_20_button_1_Template, 3, 4, "button", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r4.showAddButton);
  }
}
function DfUserAppRolesComponent_mat_cell_21_Template(rf, ctx) {
  if (rf & 1) {
    const _r25 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-cell", 12)(1, "button", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfUserAppRolesComponent_mat_cell_21_Template_button_click_1_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r25);
      const i_r23 = restoredCtx.index;
      const ctx_r24 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r24.remove(i_r23));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](2, "fa-icon", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const i_r23 = ctx.index;
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("formGroupName", i_r23);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r5.faTrashCan);
  }
}
function DfUserAppRolesComponent_mat_header_row_22_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "mat-header-row");
  }
}
function DfUserAppRolesComponent_mat_row_23_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "mat-row");
  }
}
function DfUserAppRolesComponent_tr_24_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "tr", 25)(1, "td", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](3, 1, "roles.noRoles"), " ");
  }
}
const _c0 = function (a0, a1) {
  return {
    assigned: a0,
    total: a1
  };
};
let DfUserAppRolesComponent = class DfUserAppRolesComponent {
  constructor(rootFormGroup) {
    this.rootFormGroup = rootFormGroup;
    this.apps = [];
    this.roles = [];
    this.displayedColumns = ['app', 'role', 'actions'];
    this.faTrashCan = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faTrashCan;
    this.faPlus = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faPlus;
  }
  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.rootFormGroup.ngSubmit.subscribe(() => {
      this.rootForm.markAllAsTouched();
    });
    this.appRoles = this.rootForm.get('appRoles');
    this.updateDataSource();
  }
  updateDataSource() {
    this.dataSource = new _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatTableDataSource(this.appRoles.controls);
  }
  get availableApps() {
    return this.apps.filter(app => !this.appRoles.value.find(appRole => appRole.app === app.name));
  }
  get showAddButton() {
    return this.appRoles.length < this.apps.length;
  }
  get assignedApps() {
    return this.apps.length - this.appRoles.length;
  }
  add() {
    this.appRoles.push(new _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormGroup({
      app: new _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_3__.Validators.required),
      role: new _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControl('', _angular_forms__WEBPACK_IMPORTED_MODULE_3__.Validators.required)
    }));
    this.updateDataSource();
  }
  remove(index) {
    this.appRoles.removeAt(index);
    this.updateDataSource();
  }
  static {
    this.ɵfac = function DfUserAppRolesComponent_Factory(t) {
      return new (t || DfUserAppRolesComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormGroupDirective));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DfUserAppRolesComponent,
      selectors: [["df-user-app-roles"]],
      inputs: {
        apps: "apps",
        roles: "roles"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      decls: 25,
      vars: 14,
      consts: [[1, "app-roles-keys-accordion"], [3, "formGroup"], ["formArrayName", "appRoles"], [3, "dataSource"], ["matColumnDef", "app"], [4, "matHeaderCellDef"], [3, "formGroupName", 4, "matCellDef"], ["matColumnDef", "role"], ["matColumnDef", "actions"], [4, "matHeaderRowDef"], [4, "matRowDef", "matRowDefColumns"], ["class", "mat-row", 4, "matNoDataRow"], [3, "formGroupName"], ["subscriptSizing", "dynamic"], ["matInput", "", "formControlName", "app", 3, "matAutocomplete"], ["requireSelection", ""], ["auto", "matAutocomplete"], [3, "value", 4, "ngFor", "ngForOf"], [3, "value"], ["matInput", "", "formControlName", "role", 3, "matAutocomplete"], ["mat-mini-fab", "", "color", "primary", "type", "button", 3, "click", 4, "ngIf"], ["mat-mini-fab", "", "color", "primary", "type", "button", 3, "click"], ["size", "xl", 3, "icon"], ["mat-icon-button", "", "type", "button", 3, "click"], ["size", "xs", 3, "icon"], [1, "mat-row"], ["colspan", "4", 1, "mat-cell"]],
      template: function DfUserAppRolesComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0)(1, "mat-accordion")(2, "mat-expansion-panel")(3, "mat-expansion-panel-header")(4, "mat-panel-title");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](6, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "mat-panel-description");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](9, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](10, 1)(11, 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](12, "mat-table", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](13, 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](14, DfUserAppRolesComponent_mat_header_cell_14_Template, 3, 3, "mat-header-cell", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](15, DfUserAppRolesComponent_mat_cell_15_Template, 9, 6, "mat-cell", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](16, 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](17, DfUserAppRolesComponent_mat_header_cell_17_Template, 3, 3, "mat-header-cell", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](18, DfUserAppRolesComponent_mat_cell_18_Template, 9, 6, "mat-cell", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](19, 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](20, DfUserAppRolesComponent_mat_header_cell_20_Template, 2, 1, "mat-header-cell", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](21, DfUserAppRolesComponent_mat_cell_21_Template, 3, 2, "mat-cell", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](22, DfUserAppRolesComponent_mat_header_row_22_Template, 1, 0, "mat-header-row", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](23, DfUserAppRolesComponent_mat_row_23_Template, 1, 0, "mat-row", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](24, DfUserAppRolesComponent_tr_24_Template, 4, 3, "tr", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](6, 6, "roles.label"), "");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind2"](9, 8, "roles.appRoleAssigned", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpureFunction2"](11, _c0, ctx.apps.length - ctx.availableApps.length, ctx.apps.length)));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("formGroup", ctx.rootForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("dataSource", ctx.dataSource);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](10);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matHeaderRowDef", ctx.displayedColumns);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matRowDefColumns", ctx.displayedColumns);
        }
      },
      dependencies: [_angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormControlName, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormGroupName, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormArrayName, _angular_material_autocomplete__WEBPACK_IMPORTED_MODULE_4__.MatAutocompleteModule, _angular_material_autocomplete__WEBPACK_IMPORTED_MODULE_4__.MatAutocomplete, _angular_material_core__WEBPACK_IMPORTED_MODULE_5__.MatOption, _angular_material_autocomplete__WEBPACK_IMPORTED_MODULE_4__.MatAutocompleteTrigger, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatIconButton, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatMiniFabButton, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatTableModule, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatTable, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatHeaderCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatHeaderRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatColumnDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatHeaderCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatHeaderRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_2__.MatNoDataRow, _angular_material_input__WEBPACK_IMPORTED_MODULE_7__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_7__.MatInput, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_8__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_8__.MatLabel, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_9__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_9__.FaIconComponent, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_10__.MatExpansionModule, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_10__.MatAccordion, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_10__.MatExpansionPanel, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_10__.MatExpansionPanelHeader, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_10__.MatExpansionPanelTitle, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_10__.MatExpansionPanelDescription, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_12__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_12__.NgFor],
      styles: [".app-roles-accordion[_ngcontent-%COMP%] {\n  padding: 16px 0;\n}\n\n.mat-column-actions[_ngcontent-%COMP%] {\n  max-width: 10%;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtdXNlci1hcHAtcm9sZXMvZGYtdXNlci1hcHAtcm9sZXMuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxlQUFBO0FBQ0Y7O0FBQ0E7RUFDRSxjQUFBO0FBRUYiLCJzb3VyY2VzQ29udGVudCI6WyIuYXBwLXJvbGVzLWFjY29yZGlvbiB7XG4gIHBhZGRpbmc6IDE2cHggMDtcbn1cbi5tYXQtY29sdW1uLWFjdGlvbnMge1xuICBtYXgtd2lkdGg6IDEwJTtcbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
};
DfUserAppRolesComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_13__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_14__.UntilDestroy)({
  checkProperties: true
})], DfUserAppRolesComponent);

/***/ }),

/***/ 76765:
/*!*************************************************************************************!*\
  !*** ./src/app/shared/components/df-user-details/df-user-details-base.component.ts ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfUserDetailsBaseComponent: () => (/* binding */ DfUserDetailsBaseComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _validators_match_validator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../validators/match.validator */ 69465);
/* harmony import */ var src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/types/routes */ 23472);
/* harmony import */ var _validators_unique_name_validator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../validators/unique-name.validator */ 80345);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! rxjs */ 36647);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! rxjs */ 59452);
/* harmony import */ var _services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../services/df-theme.service */ 52868);
/* harmony import */ var src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/app/shared/services/df-snackbar.service */ 75680);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/app/shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var src_app_shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! src/app/shared/services/df-breakpoint.service */ 52608);
/* harmony import */ var _services_df_paywall_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../services/df-paywall.service */ 95351);

















let DfUserDetailsBaseComponent = class DfUserDetailsBaseComponent {
  constructor(fb, activatedRoute, systemConfigDataService, breakpointService, paywallService) {
    this.fb = fb;
    this.activatedRoute = activatedRoute;
    this.systemConfigDataService = systemConfigDataService;
    this.breakpointService = breakpointService;
    this.paywallService = paywallService;
    this.loginAttribute = 'email';
    this.faEnvelope = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_8__.faEnvelope;
    this.type = 'create';
    this.isSmallScreen = this.breakpointService.isSmallScreen;
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.accessByTabs = [{
      control: 'apps'
    }, {
      control: 'users'
    }, {
      control: 'services'
    }, {
      control: 'apidocs',
      label: 'api-docs'
    }, {
      control: 'schema/data',
      label: 'schema'
    }, {
      control: 'files'
    }, {
      control: 'scripts'
    }, {
      control: 'config'
    }, {
      control: 'packages',
      label: 'package-manager'
    }, {
      control: 'limits'
    }, {
      control: 'scheduler'
    }];
    this.themeService = (0,_angular_core__WEBPACK_IMPORTED_MODULE_9__.inject)(_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__.DfThemeService);
    this.snackbarService = (0,_angular_core__WEBPACK_IMPORTED_MODULE_9__.inject)(src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_4__.DfSnackbarService);
    this.isDarkMode = this.themeService.darkMode$;
    this.userForm = this.fb.group({
      profileDetailsGroup: this.fb.group({
        username: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.minLength(6)],
        email: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.email],
        firstName: [''],
        lastName: [''],
        name: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required],
        phone: ['']
      }),
      isActive: [true],
      tabs: this.buildTabs(),
      lookupKeys: this.fb.array([], [_validators_unique_name_validator__WEBPACK_IMPORTED_MODULE_2__.uniqueNameValidator]),
      appRoles: this.fb.array([])
    });
  }
  get cancelRoute() {
    let route = `/${src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_1__.ROUTES.ADMIN_SETTINGS}/`;
    if (this.userType === 'admins') {
      route += src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_1__.ROUTES.ADMINS;
    }
    if (this.userType === 'users') {
      route += src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_1__.ROUTES.USERS;
    }
    return route;
  }
  ngOnInit() {
    this.paywallService.activatePaywall('limit').pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_11__.switchMap)(activate => {
      if (activate) {
        return this.paywallService.activatePaywall('service_report');
      }
      return (0,rxjs__WEBPACK_IMPORTED_MODULE_12__.of)(false);
    })).subscribe(activate => {
      if (activate) {
        this.accessByTabs = [];
      }
    });
    this.activatedRoute.data.subscribe(({
      type,
      data,
      apps,
      roles
    }) => {
      if (data) {
        this.snackbarService.setSnackbarLastEle(data.name, true);
      }
      this.type = type;
      if (this.userType === 'users') {
        this.apps = apps.resource;
        this.roles = roles.resource;
      }
      if (type === 'edit') {
        this.currentProfile = data;
        this.userForm.patchValue({
          profileDetailsGroup: {
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            name: data.name,
            phone: data.phone
          },
          isActive: data.isActive
        });
        this.userForm.addControl('setPassword', new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl(false));
        this.userForm.controls['setPassword'].valueChanges.subscribe(value => {
          if (value) {
            this.addPasswordControls();
          } else {
            this.removePasswordControls();
          }
        });
        if (this.userType === 'admins') {
          if (data.isRootAdmin) {
            this.userForm.removeControl('tabs');
          }
          if (data.userToAppToRoleByUserId.length > 0) {
            this.changeAllTabs(false);
            data.role.accessibleTabs.forEach(tab => {
              const control = this.tabs.controls.find(c => c.value.name === tab);
              if (control) {
                control.patchValue({
                  checked: true
                });
              }
            });
          }
        }
        if (this.userType === 'users') {
          if (data.userToAppToRoleByUserId.length > 0) {
            data.userToAppToRoleByUserId.forEach(item => {
              this.userForm.controls['appRoles'].push(new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormGroup({
                app: new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl(this.apps.find(app => app.id === item.appId)?.name, [_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required]),
                role: new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl(this.roles.find(role => role.id === item.roleId)?.name, [_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required])
              }));
            });
          }
        }
        if (data.lookupByUserId.length > 0) {
          data.lookupByUserId.forEach(item => {
            this.userForm.controls['lookupKeys'].push(new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormGroup({
              name: new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl(item.name, [_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required]),
              value: new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl(item.value),
              private: new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl(item.private),
              id: new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl(item.id)
            }));
          });
        }
      } else {
        this.currentProfile = {
          id: 0
        };
        this.userForm.addControl('pass-invite', new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl('', [_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required]));
        this.userForm.controls['pass-invite'].valueChanges.subscribe(value => {
          if (value === 'password') {
            this.addPasswordControls();
          } else {
            this.removePasswordControls();
          }
        });
      }
    });
    this.systemConfigDataService.environment$.subscribe(env => {
      this.loginAttribute = env.authentication.loginAttribute;
      if (this.loginAttribute === 'username') {
        this.userForm.get('profileDetailsGroup.username')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required]);
      } else {
        this.userForm.get('profileDetailsGroup.email')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required]);
      }
    });
  }
  addPasswordControls() {
    this.userForm.addControl('password', new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl('', [_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required, _angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.minLength(16)]));
    this.userForm.addControl('confirmPassword', new _angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormControl('', [_angular_forms__WEBPACK_IMPORTED_MODULE_10__.Validators.required, (0,_validators_match_validator__WEBPACK_IMPORTED_MODULE_0__.matchValidator)('password')]));
  }
  removePasswordControls() {
    this.userForm.removeControl('password');
    this.userForm.removeControl('confirmPassword');
  }
  get tabs() {
    return this.userForm.controls['tabs'];
  }
  selectAllTabs(event) {
    this.changeAllTabs(event.checked);
  }
  changeAllTabs(checked) {
    this.tabs.controls.forEach(control => {
      control.patchValue({
        checked
      });
    });
  }
  get allTabsSelected() {
    return this.tabs.controls.every(control => control.value.checked);
  }
  buildTabs() {
    const arr = this.accessByTabs.map(tab => {
      return this.fb.group({
        name: tab.control,
        title: tab.label || tab.control,
        checked: true
      });
    });
    return this.fb.array(arr);
  }
  triggerAlert(type, msg) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }
  static {
    this.ɵfac = function DfUserDetailsBaseComponent_Factory(t) {
      return new (t || DfUserDetailsBaseComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_10__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_13__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_5__.DfSystemConfigDataService), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](src_app_shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_6__.DfBreakpointService), _angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdirectiveInject"](_services_df_paywall_service__WEBPACK_IMPORTED_MODULE_7__.DfPaywallService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_9__["ɵɵdefineComponent"]({
      type: DfUserDetailsBaseComponent,
      selectors: [["df-user-details"]],
      decls: 0,
      vars: 0,
      template: function DfUserDetailsBaseComponent_Template(rf, ctx) {},
      encapsulation: 2
    });
  }
};
DfUserDetailsBaseComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_14__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_15__.UntilDestroy)({
  checkProperties: true
})], DfUserDetailsBaseComponent);

/***/ }),

/***/ 53012:
/*!**************************************************!*\
  !*** ./src/app/shared/utilities/parse-errors.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   parseError: () => (/* binding */ parseError)
/* harmony export */ });
const errors = [{
  regex: /Duplicate entry '([^']+)' for key 'user_email_unique'/,
  message: 'alerts.duplicateEmail'
}];
function parseError(errorString) {
  if (!errorString) {
    return 'alert.genericError';
  }
  const error = errors.find(err => err.regex.test(errorString));
  if (error) {
    return error.message;
  }
  return errorString;
}

/***/ }),

/***/ 69465:
/*!******************************************************!*\
  !*** ./src/app/shared/validators/match.validator.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   matchValidator: () => (/* binding */ matchValidator)
/* harmony export */ });
function matchValidator(fieldToMatch) {
  return control => {
    const parent = control.parent;
    if (parent) {
      const matchingField = parent.get(fieldToMatch);
      if (matchingField && control.value !== matchingField.value) {
        return {
          doesNotMatch: true
        };
      }
    }
    return null;
  };
}

/***/ }),

/***/ 80345:
/*!************************************************************!*\
  !*** ./src/app/shared/validators/unique-name.validator.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   uniqueNameValidator: () => (/* binding */ uniqueNameValidator)
/* harmony export */ });
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/forms */ 34456);

const uniqueNameValidator = control => {
  const nameMap = new Map();
  const formArray = control;
  formArray.controls.forEach((control, index) => {
    if (!(control instanceof _angular_forms__WEBPACK_IMPORTED_MODULE_0__.FormGroup)) {
      return;
    }
    const nameControl = control.get('name');
    if (!nameControl) {
      return;
    }
    const name = nameControl.value;
    if (!name) {
      return;
    }
    if (nameMap.has(name)) {
      const firstIndex = nameMap.get(name);
      setErrors(firstIndex ?? 0);
      setErrors(index);
    } else {
      nameMap.set(name, index);
      clearErrors(index);
    }
  });
  function setErrors(index) {
    const group = formArray.at(index);
    const nameControl = group.get('name');
    nameControl?.setErrors({
      notUnique: true
    });
  }
  function clearErrors(index) {
    const group = formArray.at(index);
    const nameControl = group.get('name');
    const errors = nameControl?.errors;
    if (errors) {
      delete errors['notUnique'];
      nameControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }
  return null;
};

/***/ })

}]);
//# sourceMappingURL=default-src_app_shared_components_df-user-app-roles_df-user-app-roles_component_ts-src_app_sh-09e173.js.map