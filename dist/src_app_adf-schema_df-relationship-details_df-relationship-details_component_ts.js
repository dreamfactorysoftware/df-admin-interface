"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-schema_df-relationship-details_df-relationship-details_component_ts"],{

/***/ 31830:
/*!*****************************************************************************************!*\
  !*** ./src/app/adf-schema/df-relationship-details/df-relationship-details.component.ts ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfRelationshipDetailsComponent: () => (/* binding */ DfRelationshipDetailsComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/slide-toggle */ 8827);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var src_app_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/services/df-breakpoint.service */ 52608);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);
























function DfRelationshipDetailsComponent_mat_option_34_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r20 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r20.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r20.label, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_35_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_mat_option_44_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r21 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r21.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r21.label, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_45_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_mat_option_51_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r22 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r22.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r22.name, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_52_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_mat_option_61_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r23 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r23.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r23.label, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_62_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_mat_option_71_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r24 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r24.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r24.label, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_72_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_mat_option_78_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r25 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r25.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r25.label, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_79_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_mat_option_88_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r26 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r26.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r26.label, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_89_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_mat_option_98_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r27 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r27.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r27.label, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_99_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_mat_option_108_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-option", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const option_r28 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("value", option_r28.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", option_r28.label, " ");
  }
}
function DfRelationshipDetailsComponent_mat_error_109_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "schema.alerts.tableNameError"), " ");
  }
}
function DfRelationshipDetailsComponent_span_115_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "update"));
  }
}
function DfRelationshipDetailsComponent_span_116_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](2, 1, "save"));
  }
}
let DfRelationshipDetailsComponent = class DfRelationshipDetailsComponent {
  constructor(crudService, fb, activatedRoute, router, breakpointService) {
    this.crudService = crudService;
    this.fb = fb;
    this.activatedRoute = activatedRoute;
    this.router = router;
    this.breakpointService = breakpointService;
    this.typeOptions = [{
      label: 'Belongs To',
      value: 'belongs_to'
    }, {
      label: 'Has Many',
      value: 'has_many'
    }, {
      label: 'Has One',
      value: 'has_one'
    }, {
      label: 'Many To Many',
      value: 'many_many'
    }];
    this.isXSmallScreen = this.breakpointService.isXSmallScreen;
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.relationshipForm = this.fb.group({
      name: [{
        value: null,
        disabled: true
      }],
      alias: [null],
      label: [null],
      description: [null],
      alwaysFetch: [false],
      type: [null, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      isVirtual: [{
        value: true,
        disabled: true
      }],
      field: [null, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      refServiceId: [null, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      refTable: [null, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      refField: [null, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required],
      junctionServiceId: [{
        value: null,
        disabled: true
      }],
      junctionTable: [{
        value: null,
        disabled: true
      }],
      junctionField: [{
        value: null,
        disabled: true
      }],
      junctionRefField: [{
        value: null,
        disabled: true
      }]
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(data => {
      this.type = data['type'];
      this.dbName = this.activatedRoute.snapshot.params['name'];
      this.tableName = this.activatedRoute.snapshot.params['id'];
      this.fieldOptions = data['fields'].resource.map(field => {
        return {
          label: field.label,
          value: field.name
        };
      });
      this.serviceOptions = data['services'].resource.map(item => {
        return {
          label: this.type === 'edit' ? item.type : item.label,
          value: item.id,
          name: item.name
        };
      });
      if (this.type === 'edit') {
        this.relationshipForm.patchValue({
          name: data['data'].name,
          alias: data['data'].alias,
          label: data['data'].label,
          description: data['data'].description,
          alwaysFetch: data['data'].alwaysFetch,
          type: data['data'].type,
          isVirtual: data['data'].isVirtual,
          field: data['data'].field,
          refServiceId: data['data'].refServiceId,
          refTable: data['data'].refTable,
          refField: data['data'].refField,
          junctionServiceId: data['data'].junctionServiceId,
          junctionTable: data['data'].junctionTable,
          junctionField: data['data'].junctionField,
          junctionRefField: data['data'].junctionRefField
        });
        if (data['data'].refServiceId) {
          this.getTables('reference', data['data'].refServiceId);
          this.getFields('reference', data['data'].refTable, data['data'].refServiceId);
        }
        if (data['data'].junctionServiceId) {
          this.getTables('junction', data['data'].junctionServiceId);
          this.getFields('junction', data['data'].junctionTable, data['data'].junctionServiceId);
        }
        if (data['data'].type === 'many_many') {
          this.relationshipForm.get('junctionServiceId')?.enable();
          this.relationshipForm.get('junctionServiceId')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required]);
          this.relationshipForm.get('junctionTable')?.enable();
          this.relationshipForm.get('junctionTable')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required]);
          this.relationshipForm.get('junctionField')?.enable();
          this.relationshipForm.get('junctionField')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required]);
          this.relationshipForm.get('junctionRefField')?.enable();
          this.relationshipForm.get('junctionRefField')?.addValidators([_angular_forms__WEBPACK_IMPORTED_MODULE_5__.Validators.required]);
        }
      }
    });
    // form changes
    this.relationshipForm.get('type')?.valueChanges.subscribe(value => {
      if (value === 'many_many') {
        this.relationshipForm.get('junctionServiceId')?.enable();
      } else {
        this.relationshipForm.get('junctionServiceId')?.disable();
        this.relationshipForm.get('junctionTable')?.disable();
        this.relationshipForm.get('junctionField')?.disable();
        this.relationshipForm.get('junctionRefField')?.disable();
      }
    });
    this.relationshipForm.get('refServiceId')?.valueChanges.subscribe(value => {
      if (!value) return;
      this.relationshipForm.get('refTable')?.reset();
      this.relationshipForm.get('refField')?.reset();
      this.getTables('reference', value);
    });
    this.relationshipForm.get('refTable')?.valueChanges.subscribe(value => {
      if (!value) return;
      this.relationshipForm.get('refField')?.reset();
      this.getFields('reference', value, this.relationshipForm.get('refServiceId')?.value);
    });
    this.relationshipForm.get('junctionServiceId')?.valueChanges.subscribe(value => {
      if (!value) return;
      this.relationshipForm.get('junctionTable')?.reset();
      this.relationshipForm.get('junctionTable')?.enable();
      this.getTables('junction', value);
    });
    this.relationshipForm.get('junctionTable')?.valueChanges.subscribe(value => {
      if (!value) return;
      this.relationshipForm.get('junctionField')?.reset();
      this.relationshipForm.get('junctionField')?.enable();
      this.relationshipForm.get('junctionRefField')?.reset();
      this.relationshipForm.get('junctionRefField')?.enable();
      this.getFields('junction', value, this.relationshipForm.get('junctionServiceId')?.value);
    });
  }
  getServiceName(serviceId) {
    const serviceName = this.serviceOptions.find(item => {
      if (item.value === serviceId) {
        return item.name;
      }
      return null;
    });
    return serviceName?.name;
  }
  getTables(source, serviceId) {
    if (source === 'reference') {
      const serviceName = this.getServiceName(serviceId);
      this.crudService.get(`${serviceName}/_schema`).subscribe(data => {
        this.referenceTableOptions = data.resource.map(table => {
          return {
            label: table.name,
            value: table.name
          };
        });
      });
    } else if (source === 'junction') {
      const serviceName = this.getServiceName(serviceId);
      this.crudService.get(`${serviceName}/_schema`).subscribe(data => {
        this.junctionTableOptions = data.resource.map(table => {
          return {
            label: table.name,
            value: table.name
          };
        });
      });
    }
  }
  getFields(source, tableName, serviceId) {
    if (source === 'reference') {
      const serviceName = this.getServiceName(serviceId);
      this.crudService.get(`${serviceName}/_schema/${tableName}`).subscribe(data => {
        this.referenceFieldOptions = data.field.map(field => {
          return {
            label: field.label,
            value: field.name
          };
        });
      });
    } else if (source === 'junction') {
      const serviceName = this.getServiceName(serviceId);
      this.crudService.get(`${serviceName}/_schema/${tableName}`).subscribe(data => {
        this.junctionFieldOptions = data.field.map(field => {
          return {
            label: field.label,
            value: field.name
          };
        });
      });
    }
  }
  triggerAlert(type, msg) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }
  goBack() {
    if (this.type === 'create') {
      this.router.navigate(['../../'], {
        relativeTo: this.activatedRoute
      });
    } else if (this.type === 'edit') {
      this.router.navigate(['../../'], {
        relativeTo: this.activatedRoute
      });
    }
  }
  save() {
    if (this.relationshipForm.invalid) {
      return;
    }
    const payload = {
      resource: [{
        ...this.relationshipForm.getRawValue()
      }]
    };
    if (this.type === 'create') {
      this.crudService.create(payload, {
        snackbarSuccess: 'schema.relationships.alerts.createSuccess'
      }, `${this.dbName}/_schema/${this.tableName}/_related`).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_6__.catchError)(err => {
        this.triggerAlert('error', err.error.error.context.resource[0].message);
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_7__.throwError)(() => new Error(err));
      })).subscribe(() => {
        this.goBack();
      });
    } else if (this.type === 'edit') {
      this.crudService.patch(`${this.dbName}/_schema/${this.tableName}/_related`, payload, {
        snackbarSuccess: 'schema.relationships.alerts.updateSuccess'
      }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_6__.catchError)(err => {
        this.triggerAlert('error', err.error.error.message);
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_7__.throwError)(() => new Error(err));
      })).subscribe(() => {
        this.goBack();
      });
    }
  }
  static {
    this.ɵfac = function DfRelationshipDetailsComponent_Factory(t) {
      return new (t || DfRelationshipDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__.BASE_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_8__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_8__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdirectiveInject"](_shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_2__.DfBreakpointService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵdefineComponent"]({
      type: DfRelationshipDetailsComponent,
      selectors: [["df-relationship-details"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵStandaloneFeature"]],
      decls: 117,
      vars: 97,
      consts: [[3, "showAlert", "alertType", "alertClosed"], [1, "details-section", 3, "formGroup", "ngSubmit"], ["subscriptSizing", "dynamic", 1, "dynamic-width"], ["matInput", "", "formControlName", "name", 3, "placeholder"], ["matInput", "", "formControlName", "alias"], ["matInput", "", "formControlName", "label"], ["matInput", "", "formControlName", "description"], ["formControlName", "alwaysFetch", 1, "dynamic-width"], ["formControlName", "type"], [3, "value", 4, "ngFor", "ngForOf"], [4, "ngIf"], ["formControlName", "isVirtual", 1, "dynamic-width"], ["formControlName", "field"], ["formControlName", "refServiceId"], ["formControlName", "refTable"], ["formControlName", "refField"], ["formControlName", "junctionServiceId"], ["formControlName", "junctionTable"], ["formControlName", "junctionField"], ["formControlName", "junctionRefField"], [1, "full-width", "action-bar"], ["mat-flat-button", "", "type", "button", 3, "click"], ["mat-flat-button", "", "color", "primary"], [3, "value"]],
      template: function DfRelationshipDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](0, "df-alert", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵlistener"]("alertClosed", function DfRelationshipDetailsComponent_Template_df_alert_alertClosed_0_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](2, "form", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵlistener"]("ngSubmit", function DfRelationshipDetailsComponent_Template_form_ngSubmit_2_listener() {
            return ctx.save();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](3, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](4, "mat-form-field", 2)(5, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](7, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](8, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](9, "input", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](10, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](11, "mat-form-field", 2)(12, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](13);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](14, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](15, "input", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](16, "mat-form-field", 2)(17, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](18);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](19, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](20, "input", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](21, "mat-form-field", 2)(22, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](23);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](24, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelement"](25, "input", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](26, "mat-slide-toggle", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](27);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](28, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](29, "mat-form-field", 2)(30, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](31);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](32, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](33, "mat-select", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](34, DfRelationshipDetailsComponent_mat_option_34_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](35, DfRelationshipDetailsComponent_mat_error_35_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](36, "mat-slide-toggle", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](37);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](38, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](39, "mat-form-field", 2)(40, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](41);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](42, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](43, "mat-select", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](44, DfRelationshipDetailsComponent_mat_option_44_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](45, DfRelationshipDetailsComponent_mat_error_45_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](46, "mat-form-field", 2)(47, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](48);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](49, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](50, "mat-select", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](51, DfRelationshipDetailsComponent_mat_option_51_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](52, DfRelationshipDetailsComponent_mat_error_52_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](53, "mat-form-field", 2)(54, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](55);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](56, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](57, "mat-select", 14)(58, "mat-option");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](59);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](60, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](61, DfRelationshipDetailsComponent_mat_option_61_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](62, DfRelationshipDetailsComponent_mat_error_62_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](63, "mat-form-field", 2)(64, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](65);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](66, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](67, "mat-select", 15)(68, "mat-option");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](69);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](70, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](71, DfRelationshipDetailsComponent_mat_option_71_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](72, DfRelationshipDetailsComponent_mat_error_72_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](73, "mat-form-field", 2)(74, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](75);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](76, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](77, "mat-select", 16);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](78, DfRelationshipDetailsComponent_mat_option_78_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](79, DfRelationshipDetailsComponent_mat_error_79_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](80, "mat-form-field", 2)(81, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](82);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](83, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](84, "mat-select", 17)(85, "mat-option");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](86);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](87, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](88, DfRelationshipDetailsComponent_mat_option_88_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](89, DfRelationshipDetailsComponent_mat_error_89_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](90, "mat-form-field", 2)(91, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](92);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](93, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](94, "mat-select", 18)(95, "mat-option");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](96);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](97, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](98, DfRelationshipDetailsComponent_mat_option_98_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](99, DfRelationshipDetailsComponent_mat_error_99_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](100, "mat-form-field", 2)(101, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](102);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](103, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](104, "mat-select", 19)(105, "mat-option");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](106);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](107, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](108, DfRelationshipDetailsComponent_mat_option_108_Template, 2, 2, "mat-option", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](109, DfRelationshipDetailsComponent_mat_error_109_Template, 3, 3, "mat-error", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](110, "div", 20)(111, "button", 21);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵlistener"]("click", function DfRelationshipDetailsComponent_Template_button_click_111_listener() {
            return ctx.goBack();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtext"](112);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipe"](113, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementStart"](114, "button", 22);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](115, DfRelationshipDetailsComponent_span_115_Template, 3, 3, "span", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtemplate"](116, DfRelationshipDetailsComponent_span_116_Template, 3, 3, "span", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", ctx.alertMsg, "\n");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵclassProp"]("x-small", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](3, 49, ctx.isXSmallScreen));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("formGroup", ctx.relationshipForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate2"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](7, 51, "name"), " - ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](8, 53, "schema.relationships.name.tooltip"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](10, 55, "name"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](14, 57, "schema.alias"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](19, 59, "label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](24, 61, "description"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](28, 63, "schema.relationships.fetch"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](32, 65, "schema.relationships.type"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.typeOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["type"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](38, 67, "schema.relationships.virtualRelationship"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](42, 69, "schema.relationships.field.label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.fieldOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["field"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](49, 71, "schema.relationships.referenceService.label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.serviceOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["refServiceId"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](56, 73, "schema.relationships.referenceTable.label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" - ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](60, 75, "schema.relationships.referenceTable.default"), " - ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.referenceTableOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["refTable"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](66, 77, "schema.relationships.referenceField.label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" - ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](70, 79, "schema.relationships.referenceField.default"), " - ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.referenceFieldOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["refField"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](76, 81, "schema.relationships.junctionService.label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.serviceOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["junctionServiceId"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](83, 83, "schema.relationships.junctionTable.label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" - ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](87, 85, "schema.relationships.junctionTable.default"), " - ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.junctionTableOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["junctionTable"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](93, 87, "schema.relationships.junctionField.label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" - ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](97, 89, "schema.relationships.junctionField.default"), " - ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.junctionFieldOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["junctionField"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](103, 91, "schema.relationships.junctionReferenceField.label"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" - ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](107, 93, "schema.relationships.junctionReferenceField.default"), " - ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngForOf", ctx.junctionFieldOptions);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.relationshipForm.controls["junctionRefField"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵpipeBind1"](113, 95, "cancel"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.type === "edit");
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_4__["ɵɵproperty"]("ngIf", ctx.type === "create");
        }
      },
      dependencies: [_angular_forms__WEBPACK_IMPORTED_MODULE_5__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_5__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_5__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_5__.FormControlName, _angular_material_button__WEBPACK_IMPORTED_MODULE_9__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_9__.MatButton, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_10__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_11__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_11__.MatInput, _angular_material_select__WEBPACK_IMPORTED_MODULE_12__.MatSelectModule, _angular_material_select__WEBPACK_IMPORTED_MODULE_12__.MatSelect, _angular_material_core__WEBPACK_IMPORTED_MODULE_13__.MatOption, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_14__.MatSlideToggleModule, _angular_material_slide_toggle__WEBPACK_IMPORTED_MODULE_14__.MatSlideToggle, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_15__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_16__.AsyncPipe, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgFor, _angular_common__WEBPACK_IMPORTED_MODULE_16__.NgIf, src_app_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_1__.DfAlertComponent],
      encapsulation: 2
    });
  }
};
DfRelationshipDetailsComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_17__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_18__.UntilDestroy)({
  checkProperties: true
})], DfRelationshipDetailsComponent);

/***/ }),

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

/***/ })

}]);
//# sourceMappingURL=src_app_adf-schema_df-relationship-details_df-relationship-details_component_ts.js.map