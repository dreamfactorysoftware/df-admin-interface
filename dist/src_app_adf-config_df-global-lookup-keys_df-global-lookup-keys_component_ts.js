"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-config_df-global-lookup-keys_df-global-lookup-keys_component_ts"],{

/***/ 68019:
/*!*************************************************************************************!*\
  !*** ./src/app/adf-config/df-global-lookup-keys/df-global-lookup-keys.component.ts ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfGlobalLookupKeysComponent: () => (/* binding */ DfGlobalLookupKeysComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var src_app_shared_components_df_lookup_keys_df_lookup_keys_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/components/df-lookup-keys/df-lookup-keys.component */ 58751);
/* harmony import */ var src_app_shared_validators_unique_name_validator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/validators/unique-name.validator */ 80345);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);













let DfGlobalLookupKeysComponent = class DfGlobalLookupKeysComponent {
  constructor(crudService, fb, activatedRoute) {
    this.crudService = crudService;
    this.fb = fb;
    this.activatedRoute = activatedRoute;
    this.lookupKeysForm = this.fb.group({
      lookupKeys: this.fb.array([], [src_app_shared_validators_unique_name_validator__WEBPACK_IMPORTED_MODULE_1__.uniqueNameValidator])
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(({
      data
    }) => {
      if (data.resource.length > 0) {
        data.resource.forEach(item => {
          this.lookupKeysForm.controls['lookupKeys'].push(new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroup({
            name: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl(item.name, [_angular_forms__WEBPACK_IMPORTED_MODULE_4__.Validators.required]),
            value: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl(item.value),
            private: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl(item.private),
            id: new _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormControl(item.id)
          }));
        });
      }
    });
  }
  save() {
    if (this.lookupKeysForm.invalid || this.lookupKeysForm.pristine) {
      return;
    }
    const createKeys = [];
    const updateKeys = [];
    const lookupKeysArray = this.lookupKeysForm.get('lookupKeys');
    lookupKeysArray.controls.forEach(control => {
      if (!control.pristine) {
        if (control.value.id) {
          updateKeys.push(control.value);
        } else {
          createKeys.push({
            ...control.value,
            id: null
          });
        }
      }
    });
    if (createKeys.length > 0) {
      this.crudService.create({
        resource: createKeys
      }, {
        fields: '*',
        snackbarSuccess: 'lookupKeys.alerts.createSuccess'
      }).subscribe();
    }
    if (updateKeys.length > 0) {
      updateKeys.forEach(item => {
        if (item.id) {
          this.crudService.update(item.id, item, {
            snackbarSuccess: 'lookupKeys.alerts.updateSuccess'
          }).subscribe();
        }
      });
    }
  }
  static {
    this.ɵfac = function DfGlobalLookupKeysComponent_Factory(t) {
      return new (t || DfGlobalLookupKeysComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_2__.LOOKUP_KEYS_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_6__.ActivatedRoute));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdefineComponent"]({
      type: DfGlobalLookupKeysComponent,
      selectors: [["df-global-lookup-keys"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵStandaloneFeature"]],
      decls: 8,
      vars: 8,
      consts: [[3, "formGroup", "ngSubmit"], ["formArrayName", "lookupKeys", 3, "showAccordion"], ["mat-flat-button", "", "type", "submit", 1, "save-btn"]],
      template: function DfGlobalLookupKeysComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "p");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](2, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](3, "form", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("ngSubmit", function DfGlobalLookupKeysComponent_Template_form_ngSubmit_3_listener() {
            return ctx.save();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelement"](4, "df-lookup-keys", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](5, "button", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](6);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](7, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](2, 4, "lookupKeys.fullDesc"));
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("formGroup", ctx.lookupKeysForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("showAccordion", false);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](7, 6, "save"), " ");
        }
      },
      dependencies: [src_app_shared_components_df_lookup_keys_df_lookup_keys_component__WEBPACK_IMPORTED_MODULE_0__.DfLookupKeysComponent, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_4__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_4__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_4__.FormArrayName, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_7__.TranslocoPipe, _angular_material_button__WEBPACK_IMPORTED_MODULE_8__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_8__.MatButton],
      styles: ["/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
};
DfGlobalLookupKeysComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_9__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_10__.UntilDestroy)({
  checkProperties: true
})], DfGlobalLookupKeysComponent);

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
//# sourceMappingURL=src_app_adf-config_df-global-lookup-keys_df-global-lookup-keys_component_ts.js.map