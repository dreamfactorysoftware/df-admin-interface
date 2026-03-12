"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-config_df-email-template-details_df-email-template-details_component_ts"],{

/***/ 42991:
/*!*********************************************************************************************!*\
  !*** ./src/app/adf-config/df-email-template-details/df-email-template-details.component.ts ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfEmailTemplateDetailsComponent: () => (/* binding */ DfEmailTemplateDetailsComponent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/constants/tokens */ 24784);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var src_app_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! src/app/shared/components/df-alert/df-alert.component */ 51425);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs */ 61318);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! rxjs */ 77919);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/services/df-breakpoint.service */ 52608);
/* harmony import */ var _shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/services/df-theme.service */ 52868);
/* harmony import */ var src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! src/app/shared/services/df-snackbar.service */ 75680);
/* harmony import */ var src_app_shared_services_df_base_crud_service__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! src/app/shared/services/df-base-crud.service */ 36225);























function DfEmailTemplateDetailsComponent_mat_error_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "mat-error");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "emailTemplates.templateName.error"), " ");
  }
}
function DfEmailTemplateDetailsComponent_span_80_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "update"));
  }
}
function DfEmailTemplateDetailsComponent_span_81_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](2, "transloco");
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](2, 1, "save"));
  }
}
let DfEmailTemplateDetailsComponent = class DfEmailTemplateDetailsComponent {
  constructor(crudService, fb, router, breakpointService, activatedRoute, themeService, snackbarService) {
    this.crudService = crudService;
    this.fb = fb;
    this.router = router;
    this.breakpointService = breakpointService;
    this.activatedRoute = activatedRoute;
    this.themeService = themeService;
    this.snackbarService = snackbarService;
    this.alertMsg = '';
    this.showAlert = false;
    this.alertType = 'error';
    this.isDarkMode = this.themeService.darkMode$;
    this.emailTemplateForm = this.fb.group({
      name: ['', _angular_forms__WEBPACK_IMPORTED_MODULE_7__.Validators.required],
      description: [''],
      to: [''],
      cc: [''],
      bcc: [''],
      subject: [''],
      attachment: [''],
      body: [''],
      senderName: [''],
      senderEmail: [''],
      replyToName: [''],
      replyToEmail: [''],
      id: [null]
    });
  }
  ngOnInit() {
    this.activatedRoute.data.subscribe(({
      data
    }) => {
      this.editApp = data;
    });
    this.snackbarService.setSnackbarLastEle(this.editApp.name, true);
    if (this.editApp) {
      this.emailTemplateForm.patchValue({
        name: this.editApp.name,
        description: this.editApp.description,
        to: this.editApp.to,
        cc: this.editApp.cc,
        bcc: this.editApp.bcc,
        subject: this.editApp.subject,
        attachment: this.editApp.attachment,
        body: this.editApp.bodyHtml,
        senderName: this.editApp.fromName,
        senderEmail: this.editApp.fromEmail,
        replyToName: this.editApp.replyToName,
        replyToEmail: this.editApp.replyToEmail,
        id: this.editApp.id
      });
    }
  }
  triggerAlert(type, msg) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }
  goBack() {
    this.router.navigate(['../'], {
      relativeTo: this.activatedRoute
    });
  }
  onSubmit() {
    if (this.emailTemplateForm.invalid) {
      return;
    }
    const payload = {
      name: this.emailTemplateForm.value.name,
      description: this.emailTemplateForm.value.description,
      to: this.emailTemplateForm.value.to,
      cc: this.emailTemplateForm.value.cc,
      bcc: this.emailTemplateForm.value.bcc,
      subject: this.emailTemplateForm.value.subject,
      attachment: this.emailTemplateForm.value.attachment,
      bodyHtml: this.emailTemplateForm.value.body,
      fromName: this.emailTemplateForm.value.senderName,
      fromEmail: this.emailTemplateForm.value.senderEmail,
      replyToName: this.emailTemplateForm.value.replyToName,
      replyToEmail: this.emailTemplateForm.value.replyToEmail
    };
    if (this.emailTemplateForm.value.id) {
      this.crudService.update(this.emailTemplateForm.value.id, payload, {
        snackbarSuccess: 'emailTemplates.alerts.updateSuccess'
      }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_8__.catchError)(err => {
        this.triggerAlert('error', err.error.error.message);
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_9__.throwError)(() => new Error(err));
      })).subscribe(() => {
        this.goBack();
      });
    } else {
      this.crudService.create({
        resource: [payload]
      }, {
        snackbarSuccess: 'emailTemplates.alerts.createSuccess'
      }).pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_8__.catchError)(err => {
        this.triggerAlert('error', err.error.error.context.resource[0].message);
        return (0,rxjs__WEBPACK_IMPORTED_MODULE_9__.throwError)(() => new Error(err));
      })).subscribe(() => {
        this.goBack();
      });
    }
  }
  static {
    this.ɵfac = function DfEmailTemplateDetailsComponent_Factory(t) {
      return new (t || DfEmailTemplateDetailsComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](src_app_shared_constants_tokens__WEBPACK_IMPORTED_MODULE_0__.EMAIL_TEMPLATES_SERVICE_TOKEN), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormBuilder), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_10__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_shared_services_df_breakpoint_service__WEBPACK_IMPORTED_MODULE_2__.DfBreakpointService), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_10__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_3__.DfThemeService), _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdirectiveInject"](src_app_shared_services_df_snackbar_service__WEBPACK_IMPORTED_MODULE_4__.DfSnackbarService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵdefineComponent"]({
      type: DfEmailTemplateDetailsComponent,
      selectors: [["df-email-template-details"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵStandaloneFeature"]],
      decls: 82,
      vars: 78,
      consts: [[3, "showAlert", "alertType", "alertClosed"], [1, "email-template-details-container"], [1, "details-section", 3, "formGroup", "ngSubmit"], ["appearance", "outline", 1, "dynamic-width"], ["matInput", "", "formControlName", "name", "required", "", 3, "placeholder"], [4, "ngIf"], ["matInput", "", "formControlName", "description", 3, "placeholder"], ["appearance", "outline", 1, "third-width"], ["matInput", "", "formControlName", "to"], ["matInput", "", "formControlName", "cc"], ["matInput", "", "formControlName", "bcc"], ["appearance", "outline", "subscriptSizing", "dynamic"], ["matInput", "", "formControlName", "subject", 3, "placeholder"], ["matInput", "", "formControlName", "attachment", 3, "placeholder"], ["rows", "1", "matInput", "", "formControlName", "body", 1, "email-template-body"], ["matInput", "", "formControlName", "senderName", 3, "placeholder"], ["matInput", "", "formControlName", "senderEmail", 3, "placeholder"], ["matInput", "", "formControlName", "replyToName", 3, "placeholder"], ["matInput", "", "formControlName", "replyToEmail", 3, "placeholder"], [1, "full-width", "action-bar"], ["mat-flat-button", "", "type", "button", 1, "cancel-btn", 3, "click"], ["mat-flat-button", "", "color", "primary", 1, "save-btn"]],
      template: function DfEmailTemplateDetailsComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](0, "df-alert", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("alertClosed", function DfEmailTemplateDetailsComponent_Template_df_alert_alertClosed_0_listener() {
            return ctx.showAlert = false;
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](2, "div", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](3, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](4, "async");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](5, "form", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("ngSubmit", function DfEmailTemplateDetailsComponent_Template_form_ngSubmit_5_listener() {
            return ctx.onSubmit();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](6, "mat-form-field", 3)(7, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](8);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](9, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](10, "input", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](11, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](12, DfEmailTemplateDetailsComponent_mat_error_12_Template, 3, 3, "mat-error", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](13, "mat-form-field", 3)(14, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](15);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](16, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](17, "input", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](18, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](19, "mat-form-field", 7)(20, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](21);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](22, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](23, "input", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](24, "mat-form-field", 7)(25, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](26);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](27, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](28, "input", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](29, "mat-form-field", 7)(30, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](31);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](32, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](33, "input", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](34, "mat-form-field", 11)(35, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](36);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](37, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](38, "input", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](39, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](40, "mat-form-field", 11)(41, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](42);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](43, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](44, "input", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](45, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](46, "mat-form-field", 11)(47, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](48);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](49, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](50, "textarea", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](51, "mat-form-field", 3)(52, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](53);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](54, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](55, "input", 15);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](56, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](57, "mat-form-field", 3)(58, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](59);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](60, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](61, "input", 16);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](62, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](63, "mat-form-field", 3)(64, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](65);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](66, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](67, "input", 17);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](68, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](69, "mat-form-field", 3)(70, "mat-label");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](71);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](72, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelement"](73, "input", 18);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](74, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](75, "div", 19)(76, "button", 20);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵlistener"]("click", function DfEmailTemplateDetailsComponent_Template_button_click_76_listener() {
            return ctx.goBack();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtext"](77);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipe"](78, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementStart"](79, "button", 21);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](80, DfEmailTemplateDetailsComponent_span_80_Template, 3, 3, "span", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtemplate"](81, DfEmailTemplateDetailsComponent_span_81_Template, 3, 3, "span", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵelementEnd"]()()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("showAlert", ctx.showAlert)("alertType", ctx.alertType);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", ctx.alertMsg, "\n");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵclassMap"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](3, 32, ctx.isDarkMode) ? "dark-theme" : "");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵclassProp"]("x-small", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](4, 34, ctx.breakpointService.isXSmallScreen));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("formGroup", ctx.emailTemplateForm);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](9, 36, "emailTemplates.templateName.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](11, 38, "emailTemplates.templateName.placeholder"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.emailTemplateForm.controls["name"].hasError("required"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](16, 40, "emailTemplates.templateDescription.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](18, 42, "emailTemplates.templateDescription.placeholder"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](22, 44, "emailTemplates.recipient.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](27, 46, "emailTemplates.cc.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](32, 48, "emailTemplates.bcc.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](37, 50, "emailTemplates.subject.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](39, 52, "emailTemplates.subject.placeholder"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](43, 54, "emailTemplates.attachment.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](45, 56, "emailTemplates.attachment.placeholder"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](49, 58, "emailTemplates.body"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](54, 60, "emailTemplates.senderName.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](56, 62, "emailTemplates.senderName.placeholder"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](60, 64, "emailTemplates.senderEmail.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](62, 66, "emailTemplates.senderEmail.placeholder"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](66, 68, "emailTemplates.replyToName.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](68, 70, "emailTemplates.replyToName.placeholder"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](72, 72, "emailTemplates.replyToEmail.label"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpropertyInterpolate"]("placeholder", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](74, 74, "emailTemplates.replyToEmail.placeholder"));
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵpipeBind1"](78, 76, "cancel"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", ctx.editApp);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_6__["ɵɵproperty"]("ngIf", !ctx.editApp);
        }
      },
      dependencies: [_angular_material_button__WEBPACK_IMPORTED_MODULE_11__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_11__.MatButton, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.ReactiveFormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_7__["ɵNgNoValidate"], _angular_forms__WEBPACK_IMPORTED_MODULE_7__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.NgControlStatusGroup, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.RequiredValidator, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormGroupDirective, _angular_forms__WEBPACK_IMPORTED_MODULE_7__.FormControlName, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__.MatLabel, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_12__.MatError, _angular_material_input__WEBPACK_IMPORTED_MODULE_13__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_13__.MatInput, _angular_common__WEBPACK_IMPORTED_MODULE_14__.NgIf, _angular_material_select__WEBPACK_IMPORTED_MODULE_15__.MatSelectModule, _angular_material_core__WEBPACK_IMPORTED_MODULE_16__.MatOptionModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_17__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_14__.AsyncPipe, src_app_shared_components_df_alert_df_alert_component__WEBPACK_IMPORTED_MODULE_1__.DfAlertComponent],
      styles: [".email-template-details-container[_ngcontent-%COMP%]   .email-template-body[_ngcontent-%COMP%] {\n  min-height: 300px;\n}\n.email-template-details-container.x-small[_ngcontent-%COMP%]   .email-template-body[_ngcontent-%COMP%] {\n  min-height: 200px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWNvbmZpZy9kZi1lbWFpbC10ZW1wbGF0ZS1kZXRhaWxzL2RmLWVtYWlsLXRlbXBsYXRlLWRldGFpbHMuY29tcG9uZW50LnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0U7RUFDRSxpQkFBQTtBQUFKO0FBSUk7RUFDRSxpQkFBQTtBQUZOIiwic291cmNlc0NvbnRlbnQiOlsiLmVtYWlsLXRlbXBsYXRlLWRldGFpbHMtY29udGFpbmVyIHtcbiAgLmVtYWlsLXRlbXBsYXRlLWJvZHkge1xuICAgIG1pbi1oZWlnaHQ6IDMwMHB4O1xuICB9XG5cbiAgJi54LXNtYWxsIHtcbiAgICAuZW1haWwtdGVtcGxhdGUtYm9keSB7XG4gICAgICBtaW4taGVpZ2h0OiAyMDBweDtcbiAgICB9XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
};
DfEmailTemplateDetailsComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_18__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_19__.UntilDestroy)({
  checkProperties: true
})], DfEmailTemplateDetailsComponent);

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
//# sourceMappingURL=src_app_adf-config_df-email-template-details_df-email-template-details_component_ts.js.map