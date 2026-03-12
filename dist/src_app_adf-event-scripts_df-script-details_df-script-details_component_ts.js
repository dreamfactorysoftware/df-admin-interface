"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-event-scripts_df-script-details_df-script-details_component_ts"],{

/***/ 93366:
/*!************************************************************************************!*\
  !*** ./src/app/adf-event-scripts/df-script-details/df-script-details.component.ts ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfScriptDetailsComponent: () => (/* binding */ DfScriptDetailsComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var src_app_shared_constants_scripts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/constants/scripts */ 52444);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var src_app_shared_components_df_script_editor_df_script_editor_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/components/df-script-editor/df-script-editor.component */ 47787);
/* harmony import */ var _angular_material_autocomplete__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @angular/material/autocomplete */ 79771);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! rxjs */ 63037);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! rxjs */ 70271);
/* harmony import */ var src_app_shared_utilities_eventScripts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/utilities/eventScripts */ 59757);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var src_app_shared_components_df_link_service_df_link_service_component__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/app/shared/components/df-link-service/df-link-service.component */ 25677);
/* harmony import */ var src_app_shared_utilities_case__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/app/shared/utilities/case */ 60169);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);































function DfScriptDetailsComponent_ng_container_2_mat_option_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](0, "mat-option", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const service_r9 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", service_r9);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", service_r9, " ");
  }
}
function DfScriptDetailsComponent_ng_container_2_mat_option_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](0, "mat-option", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const item_r10 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", item_r10);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", item_r10, " ");
  }
}
function DfScriptDetailsComponent_ng_container_2_mat_option_18_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](0, "mat-option", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const item_r11 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", item_r11);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", item_r11, " ");
  }
}
function DfScriptDetailsComponent_ng_container_2_ng_container_19_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](1, "Table Name");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementContainerEnd"]();
  }
}
function DfScriptDetailsComponent_ng_container_2_ng_container_19_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](0, "Name");
  }
}
function DfScriptDetailsComponent_ng_container_2_ng_container_19_mat_option_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](0, "mat-option", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const item_r16 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", item_r16);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", item_r16, " ");
  }
}
function DfScriptDetailsComponent_ng_container_2_ng_container_19_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](1, "mat-form-field", 3)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](3, DfScriptDetailsComponent_ng_container_2_ng_container_19_ng_container_3_Template, 2, 0, "ng-container", 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](4, DfScriptDetailsComponent_ng_container_2_ng_container_19_ng_template_4_Template, 1, 0, "ng-template", null, 18, _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplateRefExtractor"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](6, "mat-select", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("valueChange", function DfScriptDetailsComponent_ng_container_2_ng_container_19_Template_mat_select_valueChange_6_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵrestoreView"](_r18);
      const ctx_r17 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵresetView"](ctx_r17.selectTable = $event);
    })("selectionChange", function DfScriptDetailsComponent_ng_container_2_ng_container_19_Template_mat_select_selectionChange_6_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵrestoreView"](_r18);
      const ctx_r19 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵresetView"](ctx_r19.selectedTable());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](7, DfScriptDetailsComponent_ng_container_2_ng_container_19_mat_option_7_Template, 2, 2, "mat-option", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const _r13 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵreference"](5);
    const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngIf", ctx_r7.tableProcedureFlag === "table")("ngIfElse", _r13);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", ctx_r7.selectTable);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngForOf", ctx_r7.tableOptions);
  }
}
function DfScriptDetailsComponent_ng_container_2_ng_container_20_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](1, "mat-form-field", 19)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](5, "input", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](4, 2, "scripts.scriptName"));
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", ctx_r8.completeScriptName);
  }
}
function DfScriptDetailsComponent_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](1, "mat-form-field", 3)(2, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](4, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](5, "mat-select", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("valueChange", function DfScriptDetailsComponent_ng_container_2_Template_mat_select_valueChange_5_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵrestoreView"](_r21);
      const ctx_r20 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵresetView"](ctx_r20.selectedServiceItem = $event);
    })("selectionChange", function DfScriptDetailsComponent_ng_container_2_Template_mat_select_selectionChange_5_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵrestoreView"](_r21);
      const ctx_r22 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵresetView"](ctx_r22.selectedServiceItemEvent());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](6, DfScriptDetailsComponent_ng_container_2_mat_option_6_Template, 2, 2, "mat-option", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](7, "mat-form-field", 14)(8, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](10, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](11, "mat-select", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("valueChange", function DfScriptDetailsComponent_ng_container_2_Template_mat_select_valueChange_11_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵrestoreView"](_r21);
      const ctx_r23 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵresetView"](ctx_r23.selectedEventItem = $event);
    })("selectionChange", function DfScriptDetailsComponent_ng_container_2_Template_mat_select_selectionChange_11_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵrestoreView"](_r21);
      const ctx_r24 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵresetView"](ctx_r24.selectedEventItemEvent());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](12, DfScriptDetailsComponent_ng_container_2_mat_option_12_Template, 2, 2, "mat-option", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](13, "mat-form-field", 14)(14, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](15);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](16, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](17, "mat-select", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("valueChange", function DfScriptDetailsComponent_ng_container_2_Template_mat_select_valueChange_17_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵrestoreView"](_r21);
      const ctx_r25 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵresetView"](ctx_r25.selectedRouteItem = $event);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](18, DfScriptDetailsComponent_ng_container_2_mat_option_18_Template, 2, 2, "mat-option", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](19, DfScriptDetailsComponent_ng_container_2_ng_container_19_Template, 8, 4, "ng-container", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](20, DfScriptDetailsComponent_ng_container_2_ng_container_20_Template, 6, 4, "ng-container", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](4, 11, "service"));
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", ctx_r0.selectedServiceItem);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngForOf", ctx_r0.storeServiceArray);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](10, 13, "scripts.scriptType"));
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", ctx_r0.selectedEventItem);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngForOf", ctx_r0.ungroupedEventItems);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](16, 15, "scripts.scriptMethod"));
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", ctx_r0.selectedRouteItem);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngForOf", ctx_r0.ungroupedRouteOptions);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngIf", ctx_r0.tableOptions);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngIf", ctx_r0.completeScriptName);
  }
}
function DfScriptDetailsComponent_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](0, "mat-form-field", 19)(1, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](3, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](4, "input", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](3, 2, "scripts.tableName"));
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", ctx_r2.completeScriptName);
  }
}
function DfScriptDetailsComponent_mat_option_10_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](0, "mat-option", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const type_r26 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("value", type_r26.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", type_r26.label, " ");
  }
}
let DfScriptDetailsComponent = class DfScriptDetailsComponent {
  constructor(activatedRoute, fb, router, eventScriptService, themeService) {
    this.activatedRoute = activatedRoute;
    this.fb = fb;
    this.router = router;
    this.eventScriptService = eventScriptService;
    this.themeService = themeService;
    this.types = src_app_shared_constants_scripts__WEBPACK_IMPORTED_MODULE_0__.SCRIPT_TYPES;
    this.type = 'create';
    this.loaded = false;
    this.isDarkMode = this.themeService.darkMode$;
    this.storeServiceArray = [];
    this.ungroupedEventItems = [];
    this.scriptForm = this.fb.group({
      name: [''],
      type: ['nodejs', [_angular_forms__WEBPACK_IMPORTED_MODULE_9__.Validators.required]],
      content: [''],
      storageServiceId: [],
      storagePath: [''],
      isActive: [false],
      allow_event_modification: [false]
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(({
      data,
      type
    }) => {
      this.type = type;
      if (type === 'edit') {
        this.scriptDetails = data;
        let editData = Object.keys(data).reduce((acc, cur) => acc = {
          ...acc,
          [(0,src_app_shared_utilities_case__WEBPACK_IMPORTED_MODULE_5__.camelToSnakeString)(cur)]: data[cur]
        }, {});
        editData = {
          ...editData,
          isActive: data.isActive
        };
        this.scriptForm.patchValue(editData);
        this.scriptForm.controls['name'].disable();
        this.completeScriptName = data.name;
      } else {
        this.scriptEvents = (0,src_app_shared_utilities_eventScripts__WEBPACK_IMPORTED_MODULE_2__.groupEvents)(data);
        this.unGroupedEvents = data;
        this.storageServices = data;
        this.storeServiceArray = Object.keys(this.storageServices);
      }
    });
    this.scriptEventsOptions = this.scriptForm.controls['name'].valueChanges.pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_10__.startWith)(''), (0,rxjs__WEBPACK_IMPORTED_MODULE_11__.map)(value => this.filterGroup(value)));
    this.loaded = true;
  }
  getControl(name) {
    return this.scriptForm.controls[name];
  }
  goBack() {
    this.router.navigate(['../'], {
      relativeTo: this.activatedRoute
    });
  }
  submit() {
    if (!this.scriptForm.valid) {
      return;
    }
    const script = this.scriptForm.getRawValue();
    const scriptItem = {
      ...script,
      storageServiceId: script.storageServiceId?.type === 'local_file' ? script.storageServiceId?.id : null,
      storage_path: script.storageServiceId?.type === 'local_file' ? script.storagePath : null,
      name: this.completeScriptName ?? this.selectedRouteItem
    };
    if (this.type === 'edit') {
      this.scriptDetails = {
        ...this.scriptDetails,
        ...scriptItem
      };
      this.eventScriptService.update(script.name, script).subscribe(() => this.goBack());
    } else {
      this.scriptDetails = script;
      this.eventScriptService.create(scriptItem, undefined, scriptItem.name).subscribe(() => this.goBack());
    }
  }
  filterGroup(value) {
    if (value) {
      return this.scriptEvents.map(group => ({
        name: group.name,
        endpoints: group.endpoints.filter(option => option.toLowerCase().includes(value.toLowerCase()))
      })).filter(group => group.endpoints.length > 0);
    }
    return this.scriptEvents;
  }
  selectedServiceItemEvent() {
    this.ungroupedEventItems = [];
    this.ungroupedRouteOptions = [];
    this.selectedRouteItem = '';
    let serviceType = this.selectedServiceItem;
    if (serviceType === 'api_docs') {
      serviceType = 'apiDocs';
    }
    this.ungroupedEventOptions = this.unGroupedEvents[serviceType];
    this.ungroupedEventItems = this.ungroupedEventItems || [];
    Object.keys(this.ungroupedEventOptions).forEach(key => {
      this.ungroupedEventItems.push(key);
    });
  }
  selectedEventItemEvent() {
    this.ungroupedRouteOptions = [...this.ungroupedEventOptions[this.selectedEventItem].endpoints];
    const data = this.ungroupedEventOptions[this.selectedEventItem].parameter;
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      if (Object.keys(data)[0] === 'tableName') {
        this.tableProcedureFlag = 'table';
        this.tableOptions = [...this.ungroupedEventOptions[this.selectedEventItem].parameter.tableName];
      } else if (Object.keys(data)[0] === 'procedureName') {
        this.tableProcedureFlag = 'procedure';
        this.tableOptions = [...this.ungroupedEventOptions[this.selectedEventItem].parameter.procedureName];
      } else if (Object.keys(data)[0] === 'functionName') {
        this.tableProcedureFlag = 'function';
        this.tableOptions = [...this.ungroupedEventOptions[this.selectedEventItem].parameter.functionName];
      }
    }
  }
  selectedTable() {
    if (this.tableProcedureFlag === 'table') {
      this.completeScriptName = this.selectedRouteItem.replace('{table_name}', this.selectTable);
    } else if (this.tableProcedureFlag === 'procedure') {
      this.completeScriptName = this.selectedRouteItem.replace('{procedure_name}', this.selectTable);
    } else if (this.tableProcedureFlag === 'function') {
      this.completeScriptName = this.selectedRouteItem.replace('{function_name}', this.selectTable);
    }
  }
  selectedRoute() {
    this.completeScriptName = this.selectedRouteItem;
    if (this.selectTable) {
      if (this.tableProcedureFlag === 'table') {
        this.completeScriptName = this.completeScriptName.replace('{table_name}', this.selectTable);
      } else if (this.tableProcedureFlag === 'procedure') {
        this.completeScriptName = this.completeScriptName.replace('{procedure_name}', this.selectTable);
      } else if (this.tableProcedureFlag === 'function') {
        this.completeScriptName = this.completeScriptName.replace('{function_name}', this.selectTable);
      }
    }
  }
  static {
    this.ɵfac = function DfScriptDetailsComponent_Factory(t) {
      return new (t || DfScriptDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_12__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_9__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_12__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_3__.EVENT_SCRIPT_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_6__.DfThemeService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵdefineComponent"]({
      type: DfScriptDetailsComponent,
      selectors: [["df-script-details"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵStandaloneFeature"]],
      decls: 26,
      vars: 32,
      consts: [[1, "details-section", 3, "formGroup", "ngSubmit"], [4, "ngIf", "ngIfElse"], ["editing", ""], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "full-width"], ["formControlName", "type"], [3, "value", 4, "ngFor", "ngForOf"], ["formControlName", "isActive", 1, "dynamic-width"], ["formControlName", "allow_event_modification", 1, "dynamic-width"], [3, "cache", "storageServiceId", "storagePath", "content"], [1, "full-width", 3, "cache", "type", "storageServiceId", "storagePath", "content"], [1, "full-width", "action-bar"], ["mat-flat-button", "", "type", "button", 1, "cancel-btn", 3, "click"], ["mat-flat-button", "", "color", "primary", 1, "save-btn"], [3, "value", "valueChange", "selectionChange"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "half-width"], [3, "value", "valueChange"], [4, "ngIf"], [3, "value"], ["procedure", ""], ["appearance", "outline", 1, "full-width"], ["matInput", "", 3, "value"], ["matInput", "", "disabled", "", 3, "value"]],
      template: function DfScriptDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](0, "form", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("ngSubmit", function DfScriptDetailsComponent_Template_form_ngSubmit_0_listener() {
            return ctx.submit();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](1, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](2, DfScriptDetailsComponent_ng_container_2_Template, 21, 17, "ng-container", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](3, DfScriptDetailsComponent_ng_template_3_Template, 5, 4, "ng-template", null, 2, _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplateRefExtractor"]);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](5, "mat-form-field", 3)(6, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](7);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](8, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](9, "mat-select", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtemplate"](10, DfScriptDetailsComponent_mat_option_10_Template, 2, 2, "mat-option", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](11, "mat-slide-toggle", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](12);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](13, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](14, "mat-slide-toggle", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](15);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](16, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelement"](17, "df-link-service", 8)(18, "df-script-editor", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](19, "div", 10)(20, "button", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵlistener"]("click", function DfScriptDetailsComponent_Template_button_click_20_listener() {
            return ctx.goBack();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](21);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](22, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementStart"](23, "button", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtext"](24);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipe"](25, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          const _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵreference"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](1, 20, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("formGroup", ctx.scriptForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngIf", ctx.type !== "edit")("ngIfElse", _r1);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](8, 22, "scriptType"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("ngForOf", ctx.types);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](13, 24, "active"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](16, 26, "eventModification"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("cache", ctx.scriptForm.getRawValue().name)("storageServiceId", ctx.selectedServiceItem)("storagePath", ctx.getControl("storagePath"))("content", ctx.getControl("content"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵproperty"]("cache", ctx.scriptForm.getRawValue().name)("type", ctx.getControl("type"))("storageServiceId", ctx.getControl("storageServiceId"))("storagePath", ctx.getControl("storagePath"))("content", ctx.getControl("content"));
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](22, 28, "cancel"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_8__["ɵɵpipeBind1"](25, 30, "save"), " ");
        }
      },
      dependencies: [_angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_13__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_13__.MatSlideToggle, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_14__.TranslocoPipe, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_15__.MatLabel, _angular_material_select__WEBPACK_IMPORTED_MODULE_16__.MatSelectModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_16__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_17__.MatOption, _angular_common__WEBPACK_IMPORTED_MODULE_18__.NgFor, _angular_forms__WEBPACK_IMPORTED_MODULE_9__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_9__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_9__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_9__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_9__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_9__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_9__.FormControlName, _angular_material_button__WEBPACK_IMPORTED_MODULE_19__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_19__.MatButton, src_app_shared_components_df_script_editor_df_script_editor_component__WEBPACK_IMPORTED_MODULE_1__.DfScriptEditorComponent, _angular_material_autocomplete__WEBPACK_IMPORTED_MODULE_20__.MatAutocompleteModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_21__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_21__.MatInput, _angular_common__WEBPACK_IMPORTED_MODULE_18__.AsyncPipe, _angular_common__WEBPACK_IMPORTED_MODULE_18__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_18__.NgIf, src_app_shared_components_df_link_service_df_link_service_component__WEBPACK_IMPORTED_MODULE_4__.DfLinkServiceComponent],
      encapsulation: 2
    });
  }
};
DfScriptDetailsComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_22__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_23__.UntilDestroy)({
  checkProperties: true
})], DfScriptDetailsComponent);

/***/ }),

/***/ 25677:
/*!********************************************************************************!*\
  !*** ./src/app/shared/components/df-link-service/df-link-service.component.ts ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfLinkServiceComponent: () => (/* binding */ DfLinkServiceComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_table__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/table */ 77697);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _angular_material_expansion__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/expansion */ 19322);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../services/df-base-crud.service */ 36225);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs */ 36647);
/* harmony import */ var _utilities_file__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utilities/file */ 63035);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);




























function DfLinkServiceComponent_ng_container_0_mat_option_13_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const service_r2 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", service_r2.label);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", service_r2.label, " ");
  }
}
function DfLinkServiceComponent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](1, "form", 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "async");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](3, "mat-accordion")(4, "mat-expansion-panel", 2)(5, "mat-expansion-panel-header")(6, "mat-panel-title");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](7, " Link to Service ");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](8, "mat-panel-description");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](9, "mat-form-field", 3)(10, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](11, "Select Service");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](12, "mat-select", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](13, DfLinkServiceComponent_ng_container_0_mat_option_13_Template, 2, 2, "mat-option", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](14, "mat-form-field", 3)(15, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](16, "Repository: ");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](17, "input", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](18, "mat-form-field", 3)(19, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](20, "Branch/Tag: ");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](21, "input", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](22, "mat-form-field", 3)(23, "mat-label");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](24, "Path");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](25, "input", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](26, "div", 9)(27, "button", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵlistener"]("click", function DfLinkServiceComponent_ng_container_0_Template_button_click_27_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵrestoreView"](_r4);
      const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵresetView"](ctx_r3.onViewLatest());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](28, "i", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](29, " View Latest ");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](30, "button", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵlistener"]("click", function DfLinkServiceComponent_ng_container_0_Template_button_click_30_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵrestoreView"](_r4);
      const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵresetView"](ctx_r5.onDeleteCache());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](31, "i", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](32, " Delete Cache ");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]()()()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 5, ctx_r0.isDarkMode) ? "dark-theme" : "");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("formGroup", ctx_r0.roleForm);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("expanded", false);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx_r0.storageServices);
  }
}
let DfLinkServiceComponent = class DfLinkServiceComponent {
  constructor(themeService, cacheService, baseService, crudService) {
    this.themeService = themeService;
    this.cacheService = cacheService;
    this.baseService = baseService;
    this.crudService = crudService;
    this.storageServices = [];
    this.selectType = false;
    this.isDarkMode = this.themeService.darkMode$;
    this.roleForm = new _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormGroup({
      serviceList: new _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormControl(''),
      repoInput: new _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormControl(''),
      branchInput: new _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormControl(''),
      pathInput: new _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormControl('')
    });
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
    this.updateDataSource();
  }
  ngOnChanges(changes) {
    if (changes['storageServiceId']) {
      this.findServiceById();
    }
  }
  findServiceById() {
    // Show GitHub UI if there are any GitHub services available for script storage
    // This allows scripts to be loaded from GitHub regardless of which service
    // the event script is being attached to
    const hasGithubService = this.storageServices.some(service => service.type === 'github');
    this.selectType = hasGithubService;
  }
  updateDataSource() {
    //
  }
  onViewLatest() {
    const formValues = this.roleForm.getRawValue();
    const service = formValues.serviceList ?? '';
    const repo = formValues.repoInput ?? '';
    const branch = formValues.branchInput ?? '';
    const path = formValues.pathInput ?? '';
    const filePath = `${service}/_repo/${repo}?branch=${branch}&content=1&path=${path}`;
    if (filePath.endsWith('.json')) {
      this.baseService.downloadJson(filePath).subscribe(text => this.content.setValue(text));
      return;
    } else {
      this.baseService.downloadFile(filePath).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_6__.switchMap)(res => (0,_utilities_file__WEBPACK_IMPORTED_MODULE_2__.readAsText)(res))).subscribe(text => this.content.setValue(text));
    }
  }
  onDeleteCache() {
    if (!this.cache) return;
    this.cacheService.delete(`_event/${this.cache}`, {
      snackbarSuccess: 'scripts.deleteCacheSuccessMsg'
    }).subscribe();
  }
  static {
    this.ɵfac = function DfLinkServiceComponent_Factory(t) {
      return new (t || DfLinkServiceComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__.DfThemeService), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__.CACHE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__.BASE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_1__.EVENT_SCRIPT_SERVICE_TOKEN));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdefineComponent"]({
      type: DfLinkServiceComponent,
      selectors: [["df-link-service"]],
      inputs: {
        cache: "cache",
        storageServiceId: "storageServiceId",
        storagePath: "storagePath",
        content: "content"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵProvidersFeature"]([_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_0__.DfBaseCrudService]), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵNgOnChangesFeature"], _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵStandaloneFeature"]],
      decls: 1,
      vars: 1,
      consts: [[4, "ngIf"], [1, "details-section", 3, "formGroup"], [3, "expanded"], ["appearance", "outline", "subscriptSizing", "dynamic", 1, "full-width", "form-field-gap"], ["formControlName", "serviceList"], [3, "value", 4, "ngFor", "ngForOf"], ["matInput", "", "type", "text", "placeholder", "path", "formControlName", "repoInput"], ["matInput", "", "type", "text", "placeholder", "path", "formControlName", "branchInput"], ["matInput", "", "type", "text", "placeholder", "path", "formControlName", "pathInput"], [1, "full-width", "action-bar"], ["mat-flat-button", "", "type", "button", "color", "primary", 1, "save-btn", 3, "click"], [1, "fa", "fa-refresh"], [3, "value"]],
      template: function DfLinkServiceComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](0, DfLinkServiceComponent_ng_container_0_Template, 33, 7, "ng-container", 0);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.selectType);
        }
      },
      dependencies: [_angular_material_form_field__WEBPACK_IMPORTED_MODULE_7__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_7__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_7__.MatLabel, _angular_material_button__WEBPACK_IMPORTED_MODULE_8__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_8__.MatButton, _angular_material_table__WEBPACK_IMPORTED_MODULE_9__.MatTableModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_10__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_10__.MatInput, _angular_material_select__WEBPACK_IMPORTED_MODULE_11__.MatSelectModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_11__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_12__.MatOption, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_13__.MatSlideToggleModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_14__.FontAwesomeModule, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_15__.MatExpansionModule, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_15__.MatAccordion, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_15__.MatExpansionPanel, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_15__.MatExpansionPanelHeader, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_15__.MatExpansionPanelTitle, _angular_material_expansion__WEBPACK_IMPORTED_MODULE_15__.MatExpansionPanelDescription, _angular_common__WEBPACK_IMPORTED_MODULE_16__.AsyncPipe, _angular_material_core__WEBPACK_IMPORTED_MODULE_12__.MatOptionModule, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_5__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_5__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormControlName, _angular_common__WEBPACK_IMPORTED_MODULE_16__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgForOf, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgIf],
      styles: [".lnik-service-accordion[_ngcontent-%COMP%] {\n  padding: 16px 0;\n}\n\n.mat-column-actions[_ngcontent-%COMP%] {\n  max-width: 10%;\n}\n\n.mat-column-private[_ngcontent-%COMP%] {\n  max-width: 10%;\n}\n\n.mat-mdc-cell[_ngcontent-%COMP%] {\n  padding: 8px;\n}\n\n.form-field-gap[_ngcontent-%COMP%] {\n  margin-top: 10px;\n  margin-bottom: 10px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvc2hhcmVkL2NvbXBvbmVudHMvZGYtbGluay1zZXJ2aWNlL2RmLWxpbmstc2VydmljZS5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGVBQUE7QUFDRjs7QUFFQTtFQUNFLGNBQUE7QUFDRjs7QUFDQTtFQUNFLGNBQUE7QUFFRjs7QUFBQTtFQUNFLFlBQUE7QUFHRjs7QUFBQTtFQUNFLGdCQUFBO0VBQ0EsbUJBQUE7QUFHRiIsInNvdXJjZXNDb250ZW50IjpbIi5sbmlrLXNlcnZpY2UtYWNjb3JkaW9uIHtcbiAgcGFkZGluZzogMTZweCAwO1xufVxuXG4ubWF0LWNvbHVtbi1hY3Rpb25zIHtcbiAgbWF4LXdpZHRoOiAxMCU7XG59XG4ubWF0LWNvbHVtbi1wcml2YXRlIHtcbiAgbWF4LXdpZHRoOiAxMCU7XG59XG4ubWF0LW1kYy1jZWxsIHtcbiAgcGFkZGluZzogOHB4O1xufVxuXG4uZm9ybS1maWVsZC1nYXAge1xuICBtYXJnaW4tdG9wOiAxMHB4O1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfLinkServiceComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_17__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_18__.UntilDestroy)({
  checkProperties: true
})], DfLinkServiceComponent);

/***/ }),

/***/ 52444:
/*!*********************************************!*\
  !*** ./src/app/shared/constants/scripts.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SCRIPT_TYPES: () => (/* binding */ SCRIPT_TYPES)
/* harmony export */ });
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _types_scripts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../types/scripts */ 19468);


const SCRIPT_TYPES = [{
  label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_1__.translate)('scriptTypes.nodejs'),
  value: _types_scripts__WEBPACK_IMPORTED_MODULE_0__.AceEditorMode.NODEJS,
  extension: 'js'
}, {
  label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_1__.translate)('scriptTypes.php'),
  value: _types_scripts__WEBPACK_IMPORTED_MODULE_0__.AceEditorMode.PHP,
  extension: 'php'
}, {
  label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_1__.translate)('scriptTypes.python'),
  value: _types_scripts__WEBPACK_IMPORTED_MODULE_0__.AceEditorMode.PYTHON,
  extension: 'py'
}, {
  label: (0,_ngneat_transloco__WEBPACK_IMPORTED_MODULE_1__.translate)('scriptTypes.python3'),
  value: _types_scripts__WEBPACK_IMPORTED_MODULE_0__.AceEditorMode.PYTHON3,
  extension: 'py'
}];

/***/ })

}]);
//# sourceMappingURL=src_app_adf-event-scripts_df-script-details_df-script-details_component_ts.js.map