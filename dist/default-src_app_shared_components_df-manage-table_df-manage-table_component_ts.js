"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["default-src_app_shared_components_df-manage-table_df-manage-table_component_ts"],{

/***/ 12513:
/*!************************************************************************************!*\
  !*** ./src/app/shared/components/df-confirm-dialog/df-confirm-dialog.component.ts ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfConfirmDialogComponent: () => (/* binding */ DfConfirmDialogComponent)
/* harmony export */ });
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/material/dialog */ 12587);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);






class DfConfirmDialogComponent {
  constructor(dialogRef, data) {
    this.dialogRef = dialogRef;
    this.data = data;
  }
  onClose() {
    this.dialogRef.close(true);
  }
  static {
    this.ɵfac = function DfConfirmDialogComponent_Factory(t) {
      return new (t || DfConfirmDialogComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__.MatDialogRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__.MAT_DIALOG_DATA));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DfConfirmDialogComponent,
      selectors: [["df-confirm-dialog"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      decls: 13,
      vars: 12,
      consts: [["mat-dialog-title", ""], ["mat-dialog-content", ""], ["mat-dialog-actions", ""], ["mat-flat-button", "", "mat-dialog-close", "", "type", "button"], ["mat-flat-button", "", "cdkFocusInitial", "", "type", "button", "color", "primary", 3, "click"]],
      template: function DfConfirmDialogComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "h1", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "div", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](5, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "div", 2)(7, "button", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](9, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](10, "button", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfConfirmDialogComponent_Template_button_click_10_listener() {
            return ctx.onClose();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](11);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](12, "transloco");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 4, ctx.data.title));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](5, 6, ctx.data.message));
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](9, 8, "no"), " ");
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](12, 10, "yes"), " ");
        }
      },
      dependencies: [_angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__.MatDialogModule, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__.MatDialogClose, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__.MatDialogTitle, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__.MatDialogContent, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_1__.MatDialogActions, _angular_material_button__WEBPACK_IMPORTED_MODULE_2__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_2__.MatButton, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_3__.TranslocoPipe],
      encapsulation: 2
    });
  }
}

/***/ }),

/***/ 3709:
/*!********************************************************************************!*\
  !*** ./src/app/shared/components/df-manage-table/df-manage-table.component.ts ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfManageTableComponent: () => (/* binding */ DfManageTableComponent),
/* harmony export */   DfManageTableModules: () => (/* binding */ DfManageTableModules)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! tslib */ 24398);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_material_paginator__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/paginator */ 24624);
/* harmony import */ var _angular_material_sort__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/sort */ 22047);
/* harmony import */ var _angular_material_table__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/table */ 77697);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! rxjs */ 52575);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! rxjs */ 91817);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! rxjs */ 36647);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! rxjs */ 70271);
/* harmony import */ var src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! src/app/shared/types/routes */ 23472);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _angular_material_dialog__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/dialog */ 12587);
/* harmony import */ var _df_confirm_dialog_df_confirm_dialog_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../df-confirm-dialog/df-confirm-dialog.component */ 12513);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _angular_material_menu__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/menu */ 31034);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! @ngneat/until-destroy */ 56127);
/* harmony import */ var src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! src/app/shared/services/df-theme.service */ 52868);
/* harmony import */ var src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! src/app/shared/services/df-system-config-data.service */ 82298);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! @angular/router */ 95072);
/* harmony import */ var _angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! @angular/cdk/a11y */ 72102);


























const DfManageTableModules = [_angular_common__WEBPACK_IMPORTED_MODULE_4__.NgIf, _angular_material_button__WEBPACK_IMPORTED_MODULE_5__.MatButtonModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_6__.FontAwesomeModule, _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatTableModule, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgFor, _angular_material_menu__WEBPACK_IMPORTED_MODULE_8__.MatMenuModule, _angular_forms__WEBPACK_IMPORTED_MODULE_9__.ReactiveFormsModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_10__.TranslocoPipe, _angular_common__WEBPACK_IMPORTED_MODULE_4__.AsyncPipe, _angular_material_dialog__WEBPACK_IMPORTED_MODULE_11__.MatDialogModule, _angular_material_paginator__WEBPACK_IMPORTED_MODULE_12__.MatPaginatorModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_13__.MatFormFieldModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_14__.MatInputModule, _angular_material_sort__WEBPACK_IMPORTED_MODULE_15__.MatSortModule];
let DfManageTableComponent = class DfManageTableComponent {
  constructor(router, activatedRoute, liveAnnouncer, translateService, dialog) {
    this.router = router;
    this.activatedRoute = activatedRoute;
    this.liveAnnouncer = liveAnnouncer;
    this.translateService = translateService;
    this.dialog = dialog;
    this.dataSource = new _angular_material_table__WEBPACK_IMPORTED_MODULE_7__.MatTableDataSource();
    this.tableLength = 0;
    this.pageSizes = [10, 50, 100];
    this.faTrashCan = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faTrashCan;
    this.faPenToSquare = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faPenToSquare;
    this.faPlus = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faPlus;
    this.faEllipsisV = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faEllipsisV;
    this.faTriangleExclamation = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faTriangleExclamation;
    this.faRefresh = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faRefresh;
    this.allowCreate = true;
    this.allowFilter = true;
    this.currentFilter = new _angular_forms__WEBPACK_IMPORTED_MODULE_9__.FormControl('');
    this.schema = false;
    this._activatedRoute = this.activatedRoute;
    this._translateService = this.translateService;
    this.actions = {
      default: {
        label: 'view',
        function: row => this.viewRow(row),
        ariaLabel: {
          key: 'viewRow',
          param: 'id'
        }
      },
      additional: [{
        label: 'delete',
        function: row => this.confirmDelete(row),
        ariaLabel: {
          key: 'deleteRow',
          param: 'id'
        },
        icon: _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faTrashCan
      }]
    };
    this.themeService = (0,_angular_core__WEBPACK_IMPORTED_MODULE_17__.inject)(src_app_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_2__.DfThemeService);
    this.systemConfigDataService = (0,_angular_core__WEBPACK_IMPORTED_MODULE_17__.inject)(src_app_shared_services_df_system_config_data_service__WEBPACK_IMPORTED_MODULE_3__.DfSystemConfigDataService);
    this.isDarkMode = this.themeService.darkMode$;
    this.isDatabase = false;
    this.currentPageSize$ = this.themeService.currentTableRowNum$;
  }
  ngOnInit() {
    if (!this.tableData) {
      this.activatedRoute.data.subscribe(({
        data
      }) => {
        this.schema = this.router.url.includes('schema');
        if (data && data.resource) {
          this.dataSource.data = this.mapDataToTable(data.resource);
          this.dataSource.paginator = this.paginator;
        }
        if (data && data.meta) {
          this.tableLength = data.meta.count;
        }
      });
    } else {
      this.allowFilter = false;
      this.dataSource.data = this.mapDataToTable(this.tableData);
    }
    this.currentPageSize$.subscribe(currentPageSize => {
      this.currentFilter.valueChanges.pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_18__.debounceTime)(1000), (0,rxjs__WEBPACK_IMPORTED_MODULE_19__.distinctUntilChanged)()).subscribe(filter => {
        filter ? this.refreshTable(currentPageSize, 0, this.filterQuery(filter)) : this.refreshTable();
      });
    });
    this.systemConfigDataService.environment$.pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_20__.switchMap)(env => this.activatedRoute.data.pipe((0,rxjs__WEBPACK_IMPORTED_MODULE_21__.map)(route => ({
      env,
      route
    }))))).subscribe(({
      env,
      route
    }) => {
      if (route['groups'] && route['groups'][0] === 'Database') {
        this.isDatabase = true;
      }
    });
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
  activeIcon(active) {
    return active ? _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faCheckCircle : _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_16__.faXmarkCircle;
  }
  isCellActive(cellValue) {
    if (typeof cellValue === 'boolean') {
      return cellValue;
    }
    if (typeof cellValue === 'string') {
      return cellValue.toLowerCase() === 'true';
    }
    return !!cellValue;
  }
  get displayedColumns() {
    return this.columns.map(c => c.columnDef);
  }
  // get defaultPageSize() {
  //   let currentPageSize = 10;
  //   this.storageService.setCurrentPage$.subscribe(num => {
  //     currentPageSize = num;
  //   });
  //   return currentPageSize;
  //   // return this.pageSizes[0];
  // }
  goEventScriptsPage(url) {
    if (url !== 'not') {
      this.router.navigate([src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_0__.ROUTES.API_CONNECTIONS + '/' + src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_0__.ROUTES.EVENT_SCRIPTS + '/' + url]);
    }
  }
  isActionDisabled(action, row) {
    if (!action.disabled) {
      return false;
    }
    return typeof action.disabled === 'function' ? action.disabled(row) : action.disabled;
  }
  handleKeyDown(event, row) {
    if (event.key === 'Enter') {
      this.callDefaultAction(row);
    }
  }
  callDefaultAction(row) {
    if (this.actions.default && (!this.actions.default.disabled || this.actions.default.disabled && !this.actions.default.disabled(row))) {
      this.actions.default.function(row);
    }
  }
  confirmDelete(row) {
    const dialogRef = this.dialog.open(_df_confirm_dialog_df_confirm_dialog_component__WEBPACK_IMPORTED_MODULE_1__.DfConfirmDialogComponent, {
      data: {
        title: 'confirm',
        message: 'confirmDelete'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteRow(row);
      }
    });
  }
  deleteRow(row) {
    //intentionally left blank
  }
  changePage(event) {
    this.themeService.setCurrentTableRowNum(event.pageSize);
    // if (event.previousPageIndex !== event.pageIndex) {
    //   this.refreshTable(undefined, event.pageIndex * event.pageSize);
    // } else {
    //   this.currentPageSize = event.pageSize;
    //   this.refreshTable(event.pageSize);
    // }
  }

  createRow() {
    this.router.navigate([src_app_shared_types_routes__WEBPACK_IMPORTED_MODULE_0__.ROUTES.CREATE], {
      relativeTo: this._activatedRoute
    });
  }
  viewRow(row) {
    this.router.navigate([row.id], {
      relativeTo: this._activatedRoute
    });
  }
  announceSortChange(sortState) {
    if (sortState.direction) {
      this.liveAnnouncer.announce(this.translateService.translate(`${sortState.direction === 'asc' ? 'sortAsc' : 'sortDesc'}`));
    } else {
      this.liveAnnouncer.announce(this.translateService.translate('sortCleared'));
    }
  }
  sortDescription(header) {
    return this.translateService.selectTranslate('sortDescription', {
      header
    });
  }
  isClickable(row) {
    return this.actions.default && (this.actions.default.disabled && !this.actions.default.disabled(row) || !this.actions.default.disabled);
  }
  refreshSchema() {
    this.refreshTable(undefined, undefined, undefined, true);
  }
  static {
    this.ɵfac = function DfManageTableComponent_Factory(t) {
      return new (t || DfManageTableComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_22__.Router), _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵdirectiveInject"](_angular_router__WEBPACK_IMPORTED_MODULE_22__.ActivatedRoute), _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵdirectiveInject"](_angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_23__.LiveAnnouncer), _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵdirectiveInject"](_ngneat_transloco__WEBPACK_IMPORTED_MODULE_10__.TranslocoService), _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵdirectiveInject"](_angular_material_dialog__WEBPACK_IMPORTED_MODULE_11__.MatDialog));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵdefineComponent"]({
      type: DfManageTableComponent,
      selectors: [["df-manage-table"]],
      viewQuery: function DfManageTableComponent_Query(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵviewQuery"](_angular_material_sort__WEBPACK_IMPORTED_MODULE_15__.MatSort, 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵviewQuery"](_angular_material_paginator__WEBPACK_IMPORTED_MODULE_12__.MatPaginator, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵloadQuery"]()) && (ctx.sort = _t.first);
          _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_17__["ɵɵloadQuery"]()) && (ctx.paginator = _t.first);
        }
      },
      inputs: {
        tableData: "tableData"
      },
      decls: 0,
      vars: 0,
      template: function DfManageTableComponent_Template(rf, ctx) {},
      encapsulation: 2
    });
  }
};
DfManageTableComponent = (0,tslib__WEBPACK_IMPORTED_MODULE_24__.__decorate)([(0,_ngneat_until_destroy__WEBPACK_IMPORTED_MODULE_25__.UntilDestroy)({
  checkProperties: true
})], DfManageTableComponent);

/***/ })

}]);
//# sourceMappingURL=default-src_app_shared_components_df-manage-table_df-manage-table_component_ts.js.map