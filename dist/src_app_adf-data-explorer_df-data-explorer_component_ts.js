"use strict";
(self["webpackChunkdf_admin_interface"] = self["webpackChunkdf_admin_interface"] || []).push([["src_app_adf-data-explorer_df-data-explorer_component_ts"],{

/***/ 41995:
/*!*****************************************************************!*\
  !*** ./src/app/adf-data-explorer/df-data-explorer.component.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfDataExplorerComponent: () => (/* binding */ DfDataExplorerComponent)
/* harmony export */ });
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/sidenav */ 17049);
/* harmony import */ var _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/toolbar */ 39552);
/* harmony import */ var _angular_material_icon__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material/icon */ 93840);
/* harmony import */ var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/material/progress-spinner */ 41134);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs */ 10819);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/operators */ 33900);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _df_db_selector_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./df-db-selector.component */ 45211);
/* harmony import */ var _df_schema_tree_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./df-schema-tree.component */ 27885);
/* harmony import */ var _df_data_grid_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./df-data-grid.component */ 23148);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _services_data_explorer_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./services/data-explorer.service */ 40903);
/* harmony import */ var _shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/services/df-theme.service */ 52868);


















function DfDataExplorerComponent_div_0_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](1, "df-db-selector", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("databaseSelected", function DfDataExplorerComponent_div_0_ng_container_5_Template_df_db_selector_databaseSelected_1_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r7);
      const ctx_r6 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵresetView"](ctx_r6.onDatabaseSelected($event));
    })("retry", function DfDataExplorerComponent_div_0_ng_container_5_Template_df_db_selector_retry_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r7);
      const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵresetView"](ctx_r8.loadDatabases());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("databases", ctx_r2.databases)("loading", ctx_r2.loadingDbs)("error", ctx_r2.errorDbs);
  }
}
function DfDataExplorerComponent_div_0_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](1, "df-schema-tree", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("tableSelected", function DfDataExplorerComponent_div_0_ng_container_6_Template_df_schema_tree_tableSelected_1_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r10);
      const ctx_r9 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵresetView"](ctx_r9.onTableSelected($event));
    })("backClicked", function DfDataExplorerComponent_div_0_ng_container_6_Template_df_schema_tree_backClicked_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r10);
      const ctx_r11 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵresetView"](ctx_r11.onBackToDatabases());
    })("retry", function DfDataExplorerComponent_div_0_ng_container_6_Template_df_schema_tree_retry_1_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r10);
      const ctx_r12 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵresetView"](ctx_r12.loadSchema(ctx_r12.selectedDb.name));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("serviceName", ctx_r3.selectedDb.name)("serviceLabel", ctx_r3.selectedDb.label || ctx_r3.selectedDb.name)("tables", ctx_r3.tables)("loading", ctx_r3.loadingSchema)("error", ctx_r3.errorSchema)("selectedTable", ctx_r3.selectedTable);
  }
}
function DfDataExplorerComponent_div_0_ng_container_8_p_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "p");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2).$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](t_r1("dataExplorer.selectDatabase"));
  }
}
function DfDataExplorerComponent_div_0_ng_container_8_p_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "p");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2).$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](t_r1("dataExplorer.selectTable"));
  }
}
function DfDataExplorerComponent_div_0_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](1, "div", 9)(2, "mat-icon", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](3, "storage");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](4, "h2");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtext"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](6, DfDataExplorerComponent_div_0_ng_container_8_p_6_Template, 2, 1, "p", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](7, DfDataExplorerComponent_div_0_ng_container_8_p_7_Template, 2, 1, "p", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]().$implicit;
    const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtextInterpolate"](t_r1("dataExplorer.title"));
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", !ctx_r4.selectedDb);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx_r4.selectedDb);
  }
}
function DfDataExplorerComponent_div_0_ng_container_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r19 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](1, "df-data-grid", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵlistener"]("tableNavigated", function DfDataExplorerComponent_div_0_ng_container_9_Template_df_data_grid_tableNavigated_1_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵrestoreView"](_r19);
      const ctx_r18 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵresetView"](ctx_r18.onTableNavigated($event));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("serviceName", ctx_r5.selectedDb.name)("tableName", ctx_r5.selectedTable.name)("initialFilter", ctx_r5.pendingFilter);
  }
}
function DfDataExplorerComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](0, "div", 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipe"](1, "async");
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](2, "mat-sidenav-container", 2)(3, "mat-sidenav", 3)(4, "div", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](5, DfDataExplorerComponent_div_0_ng_container_5_Template, 2, 3, "ng-container", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](6, DfDataExplorerComponent_div_0_ng_container_6_Template, 2, 6, "ng-container", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementStart"](7, "mat-sidenav-content", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](8, DfDataExplorerComponent_div_0_ng_container_8_Template, 8, 3, "ng-container", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](9, DfDataExplorerComponent_div_0_ng_container_9_Template, 2, 3, "ng-container", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵclassProp"]("dark-theme", _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵpipeBind1"](1, 7, ctx_r0.isDarkMode$));
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("fixedInViewport", false);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", !ctx_r0.selectedDb);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx_r0.selectedDb);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", !ctx_r0.selectedTable);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("ngIf", ctx_r0.selectedTable && ctx_r0.selectedDb);
  }
}
class DfDataExplorerComponent {
  constructor(dataExplorerService, themeService, elementRef, ngZone) {
    this.dataExplorerService = dataExplorerService;
    this.themeService = themeService;
    this.elementRef = elementRef;
    this.ngZone = ngZone;
    this.hostHeight = null;
    this.databases = [];
    this.tables = [];
    this.selectedDb = null;
    this.selectedTable = null;
    this.loadingDbs = false;
    this.loadingSchema = false;
    this.errorDbs = null;
    this.errorSchema = null;
    this.isDarkMode$ = this.themeService.darkMode$;
    this.destroy$ = new rxjs__WEBPACK_IMPORTED_MODULE_6__.Subject();
    this.resizeObserver = null;
    this.resizeListener = () => this.calculateHeight();
  }
  ngOnInit() {
    this.loadDatabases();
  }
  ngAfterViewInit() {
    // Measure actual available height from element position in viewport
    this.calculateHeight();
    window.addEventListener('resize', this.resizeListener);
    // Watch for parent layout changes (e.g. sidebar collapse)
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        this.ngZone.run(() => this.calculateHeight());
      });
      const parent = this.elementRef.nativeElement.parentElement;
      if (parent) {
        this.resizeObserver.observe(parent);
      }
    });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.resizeListener);
    this.resizeObserver?.disconnect();
  }
  calculateHeight() {
    const el = this.elementRef.nativeElement;
    const rect = el.getBoundingClientRect();
    // Available height = viewport bottom - element top - small margin for safety
    this.hostHeight = Math.floor(window.innerHeight - rect.top);
  }
  loadDatabases() {
    this.loadingDbs = true;
    this.errorDbs = null;
    this.dataExplorerService.getDatabaseServices().pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_7__.takeUntil)(this.destroy$)).subscribe({
      next: dbs => {
        this.databases = dbs;
        this.loadingDbs = false;
      },
      error: err => {
        this.errorDbs = err?.error?.error?.message || 'Failed to load databases';
        this.loadingDbs = false;
      }
    });
  }
  onDatabaseSelected(db) {
    this.selectedDb = db;
    this.selectedTable = null;
    this.tables = [];
    this.loadSchema(db.name);
  }
  loadSchema(serviceName) {
    this.loadingSchema = true;
    this.errorSchema = null;
    this.dataExplorerService.getSchema(serviceName).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_7__.takeUntil)(this.destroy$)).subscribe({
      next: tables => {
        this.tables = tables;
        this.loadingSchema = false;
      },
      error: err => {
        this.errorSchema = err?.error?.error?.message || 'Failed to load schema';
        this.loadingSchema = false;
      }
    });
  }
  onTableSelected(table) {
    this.pendingFilter = undefined;
    this.selectedTable = table;
  }
  onTableNavigated(event) {
    // Find the table in the current schema list
    const table = this.tables.find(t => t.name === event.tableName);
    if (table) {
      this.pendingFilter = event.filter;
      // If navigating to the same table, briefly null to force ngOnChanges
      if (this.selectedTable?.name === table.name) {
        this.selectedTable = null;
        setTimeout(() => this.selectedTable = table);
      } else {
        this.selectedTable = table;
      }
    }
  }
  onBackToDatabases() {
    this.selectedDb = null;
    this.selectedTable = null;
    this.pendingFilter = undefined;
    this.tables = [];
  }
  static {
    this.ɵfac = function DfDataExplorerComponent_Factory(t) {
      return new (t || DfDataExplorerComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_services_data_explorer_service__WEBPACK_IMPORTED_MODULE_3__.DataExplorerService), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_shared_services_df_theme_service__WEBPACK_IMPORTED_MODULE_4__.DfThemeService), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_5__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_5__.NgZone));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵdefineComponent"]({
      type: DfDataExplorerComponent,
      selectors: [["df-data-explorer"]],
      hostVars: 2,
      hostBindings: function DfDataExplorerComponent_HostBindings(rf, ctx) {
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵstyleProp"]("height", ctx.hostHeight, "px");
        }
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵStandaloneFeature"]],
      decls: 1,
      vars: 1,
      consts: [["class", "data-explorer-container", 3, "dark-theme", 4, "transloco", "translocoScope"], [1, "data-explorer-container"], [1, "explorer-sidenav-container"], ["mode", "side", "opened", "", 1, "explorer-sidenav", 3, "fixedInViewport"], [1, "sidenav-content"], [4, "ngIf"], [1, "explorer-content"], [3, "databases", "loading", "error", "databaseSelected", "retry"], [3, "serviceName", "serviceLabel", "tables", "loading", "error", "selectedTable", "tableSelected", "backClicked", "retry"], [1, "empty-state"], [1, "empty-icon"], [3, "serviceName", "tableName", "initialFilter", "tableNavigated"]],
      template: function DfDataExplorerComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵtemplate"](0, DfDataExplorerComponent_div_0_Template, 10, 9, "div", 0);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_5__["ɵɵproperty"]("translocoScope", "dataExplorer");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_8__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_8__.AsyncPipe, _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_9__.MatSidenavModule, _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_9__.MatSidenav, _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_9__.MatSidenavContainer, _angular_material_sidenav__WEBPACK_IMPORTED_MODULE_9__.MatSidenavContent, _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_10__.MatToolbarModule, _angular_material_icon__WEBPACK_IMPORTED_MODULE_11__.MatIconModule, _angular_material_icon__WEBPACK_IMPORTED_MODULE_11__.MatIcon, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_12__.MatProgressSpinnerModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_13__.TranslocoModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_13__.TranslocoDirective, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_14__.FontAwesomeModule, _df_db_selector_component__WEBPACK_IMPORTED_MODULE_0__.DfDbSelectorComponent, _df_schema_tree_component__WEBPACK_IMPORTED_MODULE_1__.DfSchemaTreeComponent, _df_data_grid_component__WEBPACK_IMPORTED_MODULE_2__.DfDataGridComponent],
      styles: ["[_nghost-%COMP%] {\n  display: block;\n  overflow: hidden;\n}\n\n.data-explorer-container[_ngcontent-%COMP%] {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n\n.explorer-sidenav-container[_ngcontent-%COMP%] {\n  height: 100% !important;\n  min-height: 0 !important;\n  max-height: 100% !important;\n  overflow: hidden !important;\n}\n\n  mat-sidenav-container.explorer-sidenav-container {\n  height: 100% !important;\n  min-height: 0 !important;\n  max-height: 100% !important;\n}\n\n.explorer-sidenav[_ngcontent-%COMP%] {\n  width: 280px;\n  border-right: 1px solid #e0e0e0;\n  background: #fafafa;\n}\n.dark-theme[_ngcontent-%COMP%]   .explorer-sidenav[_ngcontent-%COMP%] {\n  border-right-color: #424242;\n  background: #303030;\n}\n\n.sidenav-content[_ngcontent-%COMP%] {\n  height: 100%;\n  overflow-y: auto;\n}\n\n.explorer-content[_ngcontent-%COMP%] {\n  background: #fff;\n}\n.dark-theme[_ngcontent-%COMP%]   .explorer-content[_ngcontent-%COMP%] {\n  background: #424242;\n}\n\n  .mat-sidenav-content,   .mat-drawer-content {\n  height: 100% !important;\n  overflow: hidden !important;\n  position: relative !important;\n}\n\n.empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100%;\n  color: #757575;\n  text-align: center;\n  padding: 24px;\n}\n.dark-theme[_ngcontent-%COMP%]   .empty-state[_ngcontent-%COMP%] {\n  color: #bdbdbd;\n}\n.empty-state[_ngcontent-%COMP%]   .empty-icon[_ngcontent-%COMP%] {\n  font-size: 64px;\n  width: 64px;\n  height: 64px;\n  color: #bdbdbd;\n  margin-bottom: 16px;\n}\n.dark-theme[_ngcontent-%COMP%]   .empty-state[_ngcontent-%COMP%]   .empty-icon[_ngcontent-%COMP%] {\n  color: #616161;\n}\n.empty-state[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0 0 8px 0;\n  font-size: 20px;\n  font-weight: 500;\n  color: #424242;\n}\n.dark-theme[_ngcontent-%COMP%]   .empty-state[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  color: #e0e0e0;\n}\n.empty-state[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 14px;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWRhdGEtZXhwbG9yZXIvZGYtZGF0YS1leHBsb3Jlci5jb21wb25lbnQuc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGNBQUE7RUFDQSxnQkFBQTtBQUNGOztBQUdBO0VBQ0UsWUFBQTtFQUNBLGFBQUE7RUFDQSxzQkFBQTtFQUNBLGdCQUFBO0FBQUY7O0FBS0E7RUFDRSx1QkFBQTtFQUNBLHdCQUFBO0VBQ0EsMkJBQUE7RUFDQSwyQkFBQTtBQUZGOztBQU1BO0VBQ0UsdUJBQUE7RUFDQSx3QkFBQTtFQUNBLDJCQUFBO0FBSEY7O0FBTUE7RUFDRSxZQUFBO0VBQ0EsK0JBQUE7RUFDQSxtQkFBQTtBQUhGO0FBS0U7RUFDRSwyQkFBQTtFQUNBLG1CQUFBO0FBSEo7O0FBT0E7RUFDRSxZQUFBO0VBQ0EsZ0JBQUE7QUFKRjs7QUFPQTtFQUNFLGdCQUFBO0FBSkY7QUFNRTtFQUNFLG1CQUFBO0FBSko7O0FBU0E7O0VBRUUsdUJBQUE7RUFDQSwyQkFBQTtFQUNBLDZCQUFBO0FBTkY7O0FBU0E7RUFDRSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSxtQkFBQTtFQUNBLHVCQUFBO0VBQ0EsWUFBQTtFQUNBLGNBQUE7RUFDQSxrQkFBQTtFQUNBLGFBQUE7QUFORjtBQVFFO0VBQ0UsY0FBQTtBQU5KO0FBU0U7RUFDRSxlQUFBO0VBQ0EsV0FBQTtFQUNBLFlBQUE7RUFDQSxjQUFBO0VBQ0EsbUJBQUE7QUFQSjtBQVNJO0VBQ0UsY0FBQTtBQVBOO0FBV0U7RUFDRSxpQkFBQTtFQUNBLGVBQUE7RUFDQSxnQkFBQTtFQUNBLGNBQUE7QUFUSjtBQVdJO0VBQ0UsY0FBQTtBQVROO0FBYUU7RUFDRSxTQUFBO0VBQ0EsZUFBQTtBQVhKIiwic291cmNlc0NvbnRlbnQiOlsiOmhvc3Qge1xuICBkaXNwbGF5OiBibG9jaztcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgLy8gaGVpZ2h0IGlzIHNldCBkeW5hbWljYWxseSB2aWEgSG9zdEJpbmRpbmcgYmFzZWQgb24gYWN0dWFsIHZpZXdwb3J0IHBvc2l0aW9uXG59XG5cbi5kYXRhLWV4cGxvcmVyLWNvbnRhaW5lciB7XG4gIGhlaWdodDogMTAwJTtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbn1cblxuLy8gVXNlIGV4cGxpY2l0IGhlaWdodDogMTAwJSBjaGFpbiBpbnN0ZWFkIG9mIGZsZXgsIHNvIG1hdC1zaWRlbmF2LWNvbnRhaW5lclxuLy8gcHJvcGFnYXRlcyBpdHMgaGVpZ2h0IHByb3Blcmx5IHRvIGNoaWxkcmVuIHVzaW5nIGhlaWdodDogMTAwJVxuLmV4cGxvcmVyLXNpZGVuYXYtY29udGFpbmVyIHtcbiAgaGVpZ2h0OiAxMDAlICFpbXBvcnRhbnQ7XG4gIG1pbi1oZWlnaHQ6IDAgIWltcG9ydGFudDtcbiAgbWF4LWhlaWdodDogMTAwJSAhaW1wb3J0YW50O1xuICBvdmVyZmxvdzogaGlkZGVuICFpbXBvcnRhbnQ7XG59XG5cbi8vIEFsc28gdGFyZ2V0IHZpYSA6Om5nLWRlZXAgdG8gb3ZlcnJpZGUgQW5ndWxhciBNYXRlcmlhbCdzIG93biBob3N0IHN0eWxlc1xuOjpuZy1kZWVwIG1hdC1zaWRlbmF2LWNvbnRhaW5lci5leHBsb3Jlci1zaWRlbmF2LWNvbnRhaW5lciB7XG4gIGhlaWdodDogMTAwJSAhaW1wb3J0YW50O1xuICBtaW4taGVpZ2h0OiAwICFpbXBvcnRhbnQ7XG4gIG1heC1oZWlnaHQ6IDEwMCUgIWltcG9ydGFudDtcbn1cblxuLmV4cGxvcmVyLXNpZGVuYXYge1xuICB3aWR0aDogMjgwcHg7XG4gIGJvcmRlci1yaWdodDogMXB4IHNvbGlkICNlMGUwZTA7XG4gIGJhY2tncm91bmQ6ICNmYWZhZmE7XG5cbiAgLmRhcmstdGhlbWUgJiB7XG4gICAgYm9yZGVyLXJpZ2h0LWNvbG9yOiAjNDI0MjQyO1xuICAgIGJhY2tncm91bmQ6ICMzMDMwMzA7XG4gIH1cbn1cblxuLnNpZGVuYXYtY29udGVudCB7XG4gIGhlaWdodDogMTAwJTtcbiAgb3ZlcmZsb3cteTogYXV0bztcbn1cblxuLmV4cGxvcmVyLWNvbnRlbnQge1xuICBiYWNrZ3JvdW5kOiAjZmZmO1xuXG4gIC5kYXJrLXRoZW1lICYge1xuICAgIGJhY2tncm91bmQ6ICM0MjQyNDI7XG4gIH1cbn1cblxuLy8gRm9yY2UgbWF0LXNpZGVuYXYtY29udGVudCB0byBoYXZlIGJvdW5kZWQgaGVpZ2h0IGFuZCBhY3QgYXMgcG9zaXRpb25lZCBwYXJlbnRcbjo6bmctZGVlcCAubWF0LXNpZGVuYXYtY29udGVudCxcbjo6bmctZGVlcCAubWF0LWRyYXdlci1jb250ZW50IHtcbiAgaGVpZ2h0OiAxMDAlICFpbXBvcnRhbnQ7XG4gIG92ZXJmbG93OiBoaWRkZW4gIWltcG9ydGFudDtcbiAgcG9zaXRpb246IHJlbGF0aXZlICFpbXBvcnRhbnQ7XG59XG5cbi5lbXB0eS1zdGF0ZSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBoZWlnaHQ6IDEwMCU7XG4gIGNvbG9yOiAjNzU3NTc1O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDI0cHg7XG5cbiAgLmRhcmstdGhlbWUgJiB7XG4gICAgY29sb3I6ICNiZGJkYmQ7XG4gIH1cblxuICAuZW1wdHktaWNvbiB7XG4gICAgZm9udC1zaXplOiA2NHB4O1xuICAgIHdpZHRoOiA2NHB4O1xuICAgIGhlaWdodDogNjRweDtcbiAgICBjb2xvcjogI2JkYmRiZDtcbiAgICBtYXJnaW4tYm90dG9tOiAxNnB4O1xuXG4gICAgLmRhcmstdGhlbWUgJiB7XG4gICAgICBjb2xvcjogIzYxNjE2MTtcbiAgICB9XG4gIH1cblxuICBoMiB7XG4gICAgbWFyZ2luOiAwIDAgOHB4IDA7XG4gICAgZm9udC1zaXplOiAyMHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgY29sb3I6ICM0MjQyNDI7XG5cbiAgICAuZGFyay10aGVtZSAmIHtcbiAgICAgIGNvbG9yOiAjZTBlMGUwO1xuICAgIH1cbiAgfVxuXG4gIHAge1xuICAgIG1hcmdpbjogMDtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
}

/***/ }),

/***/ 23148:
/*!*************************************************************!*\
  !*** ./src/app/adf-data-explorer/df-data-grid.component.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfDataGridComponent: () => (/* binding */ DfDataGridComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_table__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/material/table */ 77697);
/* harmony import */ var _angular_material_paginator__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/paginator */ 24624);
/* harmony import */ var _angular_material_sort__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/sort */ 22047);
/* harmony import */ var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/material/progress-spinner */ 41134);
/* harmony import */ var _angular_material_icon__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/icon */ 93840);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @angular/material/toolbar */ 39552);
/* harmony import */ var _angular_material_chips__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @angular/material/chips */ 12772);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @angular/material/tooltip */ 80640);
/* harmony import */ var _angular_material_badge__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @angular/material/badge */ 16256);
/* harmony import */ var _angular_material_menu__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! @angular/material/menu */ 31034);
/* harmony import */ var _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! @angular/material/checkbox */ 97024);
/* harmony import */ var _angular_material_select__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! @angular/material/select */ 25175);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rxjs */ 10819);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! rxjs/operators */ 52575);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! rxjs/operators */ 33900);
/* harmony import */ var _df_schema_info_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./df-schema-info.component */ 54589);
/* harmony import */ var _df_row_detail_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./df-row-detail.component */ 97543);
/* harmony import */ var _services_data_explorer_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./services/data-explorer.service */ 40903);








































function DfDataGridComponent_div_0_div_12_button_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r18 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "button", 33);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_12_button_4_Template_button_click_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r18);
      const ctx_r17 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r17.clearQuickSearch());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](1, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "close");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
}
function DfDataGridComponent_div_0_div_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r20 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 29)(1, "mat-icon", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "search");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "input", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("input", function DfDataGridComponent_div_0_div_12_Template_input_input_3_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r20);
      const ctx_r19 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r19.onQuickSearch($event));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](4, DfDataGridComponent_div_0_div_12_button_4_Template, 3, 0, "button", 32);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("placeholder", t_r1("dataExplorer.quickSearch"))("value", ctx_r2.quickSearchTerm);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r2.quickSearchTerm);
  }
}
function DfDataGridComponent_div_0_button_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "button", 34);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_button_13_Template_button_click_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r23);
      const ctx_r22 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r22.clearAllFilters());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](1, "mat-icon", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "filter_list_off");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matTooltip", t_r1("dataExplorer.clearFilters"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matBadge", ctx_r3.activeFilterCount);
  }
}
function DfDataGridComponent_div_0_div_22_Template(rf, ctx) {
  if (rf & 1) {
    const _r28 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 36);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_22_Template_div_click_0_listener($event) {
      return $event.stopPropagation();
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](1, "mat-checkbox", 37);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("change", function DfDataGridComponent_div_0_div_22_Template_mat_checkbox_change_1_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r28);
      const col_r25 = restoredCtx.$implicit;
      const ctx_r27 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r27.toggleColumn(col_r25));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const col_r25 = ctx.$implicit;
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("checked", !ctx_r5.hiddenColumns.has(col_r25));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", col_r25, " ");
  }
}
function DfDataGridComponent_div_0_div_26_Template(rf, ctx) {
  if (rf & 1) {
    const _r30 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 38)(1, "mat-icon", 39);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "link");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "span", 40);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4, "Filtered via foreign key: ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "code");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "button", 41);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_26_Template_button_click_7_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r30);
      const ctx_r29 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r29.clearNavigationFilter());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](9, "close");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const ctx_r6 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](ctx_r6.navigationFilter);
  }
}
function DfDataGridComponent_div_0_div_27_span_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "span", 55);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r31 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpropertyInterpolate3"]("matTooltip", "Records ", ctx_r31.currentOffset + 1, " through ", ctx_r31.currentOffset + ctx_r31.dataSource.data.length, " out of ", ctx_r31.totalRecords, " total. Use the per-column filters below the headers for server-side filtering.");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate3"](" ", ctx_r31.currentOffset + 1, "\u2013", ctx_r31.currentOffset + ctx_r31.dataSource.data.length, " of ", ctx_r31.totalRecords, " records ");
  }
}
function DfDataGridComponent_div_0_div_27_option_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "option", 56);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const size_r33 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", size_r33);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", size_r33, " ");
  }
}
function DfDataGridComponent_div_0_div_27_Template(rf, ctx) {
  if (rf & 1) {
    const _r35 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 42)(1, "div", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](2, DfDataGridComponent_div_0_div_27_span_2_Template, 2, 6, "span", 44);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 45)(4, "label", 46);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](5, "Rows: ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](6, "select", 47);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("change", function DfDataGridComponent_div_0_div_27_Template_select_change_6_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r35);
      const ctx_r34 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r34.onPageSizeChange($event));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](7, DfDataGridComponent_div_0_div_27_option_7_Template, 2, 2, "option", 48);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "div", 49)(9, "button", 50);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_27_Template_button_click_9_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r35);
      const ctx_r36 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r36.goToFirstPage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](10, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](11, "first_page");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](12, "button", 51);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_27_Template_button_click_12_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r35);
      const ctx_r37 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r37.goToPrevPage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](13, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](14, "chevron_left");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "span", 52);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](16);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](17, "button", 53);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_27_Template_button_click_17_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r35);
      const ctx_r38 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r38.goToNextPage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](18, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](19, "chevron_right");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](20, "button", 54);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_27_Template_button_click_20_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r35);
      const ctx_r39 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r39.goToLastPage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](21, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](22, "last_page");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()()();
  }
  if (rf & 2) {
    const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r7.totalRecords > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", ctx_r7.pageSize);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r7.pageSizeOptions);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("disabled", ctx_r7.pageIndex === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("disabled", ctx_r7.pageIndex === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"]("", ctx_r7.pageIndex + 1, " / ", ctx_r7.totalPages, "");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("disabled", ctx_r7.isLastPage());
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("disabled", ctx_r7.isLastPage());
  }
}
function DfDataGridComponent_div_0_div_28_div_23_label_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r44 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "label", 65)(1, "input", 66);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("change", function DfDataGridComponent_div_0_div_28_div_23_label_3_Template_input_change_1_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r44);
      const rel_r42 = restoredCtx.$implicit;
      const ctx_r43 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](4);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r43.apiSelectedRelated[rel_r42.name] = !ctx_r43.apiSelectedRelated[rel_r42.name]);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const rel_r42 = ctx.$implicit;
    const ctx_r41 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matTooltip", rel_r42.type + " \u2014 Include " + rel_r42.refTable + " records linked via " + rel_r42.field + " \u2192 " + rel_r42.refField);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("checked", ctx_r41.apiSelectedRelated[rel_r42.name]);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", rel_r42.name, " ");
  }
}
function DfDataGridComponent_div_0_div_28_div_23_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 69)(1, "span", 64);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "Related:");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](3, DfDataGridComponent_div_0_div_28_div_23_label_3_Template, 3, 3, "label", 70);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r40 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r40.cachedSchema.related);
  }
}
function DfDataGridComponent_div_0_div_28_Template(rf, ctx) {
  if (rf & 1) {
    const _r46 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 57)(1, "div", 58);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, " This is the DreamFactory REST API call equivalent to your current view. Any sorting or column filters you apply will update the URL in real time. Click the URL or the copy button to copy it to your clipboard. ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "div", 59)(4, "span", 60);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](5, "GET");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](6, "code", 61);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_28_Template_code_click_6_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r46);
      const ctx_r45 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r45.copyApiUrl());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "button", 62);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_28_Template_button_click_8_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r46);
      const ctx_r47 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r47.copyApiUrl());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](9, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](10);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "div", 63)(12, "span", 64);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](13, "Include:");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](14, "label", 65)(15, "input", 66);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("change", function DfDataGridComponent_div_0_div_28_Template_input_change_15_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r46);
      const ctx_r48 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r48.apiIncludeLimit = !ctx_r48.apiIncludeLimit);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](16, " limit ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](17, "label", 65)(18, "input", 66);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("change", function DfDataGridComponent_div_0_div_28_Template_input_change_18_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r46);
      const ctx_r49 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r49.apiIncludeOffset = !ctx_r49.apiIncludeOffset);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](19, " offset ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](20, "label", 67)(21, "input", 66);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("change", function DfDataGridComponent_div_0_div_28_Template_input_change_21_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r46);
      const ctx_r50 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r50.apiIncludeCount = !ctx_r50.apiIncludeCount);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](22, " include_count ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](23, DfDataGridComponent_div_0_div_28_div_23_Template, 4, 1, "div", 68);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](ctx_r8.buildApiUrl());
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](ctx_r8.apiCopied ? "check" : "content_copy");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpropertyInterpolate1"]("matTooltip", "limit \u2014 Maximum number of records to return per request (currently ", ctx_r8.pageSize, ")");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("checked", ctx_r8.apiIncludeLimit);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵpropertyInterpolate1"]("matTooltip", "offset \u2014 Number of records to skip, used for pagination (currently ", ctx_r8.currentOffset, ")");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("checked", ctx_r8.apiIncludeOffset);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("checked", ctx_r8.apiIncludeCount);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r8.cachedSchema == null ? null : ctx_r8.cachedSchema.related == null ? null : ctx_r8.cachedSchema.related.length);
  }
}
function DfDataGridComponent_div_0_div_29_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 71);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](1, "mat-spinner", 72);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](2, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](t_r1("dataExplorer.loadingData"));
  }
}
function DfDataGridComponent_div_0_div_30_Template(rf, ctx) {
  if (rf & 1) {
    const _r53 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 73)(1, "mat-icon", 74);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "error_outline");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "button", 75);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_30_Template_button_click_5_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r53);
      const ctx_r52 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r52.loadData());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r10 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](ctx_r10.error);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", t_r1("dataExplorer.retry"), " ");
  }
}
function DfDataGridComponent_div_0_div_31_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 76)(1, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2, "inbox");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "small");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](t_r1("dataExplorer.noData"));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](t_r1("dataExplorer.noDataHint"));
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_3_th_1_mat_icon_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "mat-icon", 90);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, "vpn_key");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_3_th_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r67 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "th", 87);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](1, DfDataGridComponent_div_0_div_32_ng_container_3_th_1_mat_icon_1_Template, 2, 0, "mat-icon", 88);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](3, "span", 89);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("mousedown", function DfDataGridComponent_div_0_div_32_ng_container_3_th_1_Template_span_mousedown_3_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r67);
      const col_r61 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
      const ctx_r65 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r65.onResizeStart($event, col_r61));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const col_r61 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r62 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵstyleProp"]("width", ctx_r62.columnWidths[col_r61], "px")("min-width", ctx_r62.columnWidths[col_r61], "px")("max-width", ctx_r62.columnWidths[col_r61], "px");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r62.isPrimaryKey(col_r61));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", col_r61, " ");
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_3_td_2_span_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r74 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "span", 94);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_32_ng_container_3_td_2_span_1_Template_span_click_0_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r74);
      const row_r69 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
      const col_r61 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
      const ctx_r72 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r72.onFkClick($event, col_r61, row_r69[col_r61]));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](2, "mat-icon", 95);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](3, "open_in_new");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const row_r69 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const col_r61 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r70 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matTooltip", "Go to " + ctx_r70.getFkRefTable(col_r61));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", ctx_r70.formatCellValue(row_r69[col_r61]), " ");
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_3_td_2_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const row_r69 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const col_r61 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r71 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", ctx_r71.formatCellValue(row_r69[col_r61]), " ");
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_3_td_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "td", 91);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](1, DfDataGridComponent_div_0_div_32_ng_container_3_td_2_span_1_Template, 4, 2, "span", 92);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](2, DfDataGridComponent_div_0_div_32_ng_container_3_td_2_ng_container_2_Template, 2, 1, "ng-container", 93);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const row_r69 = ctx.$implicit;
    const col_r61 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r63 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵstyleProp"]("width", ctx_r63.columnWidths[col_r61], "px")("min-width", ctx_r63.columnWidths[col_r61], "px")("max-width", ctx_r63.columnWidths[col_r61], "px");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵclassProp"]("null-cell", row_r69[col_r61] === null || row_r69[col_r61] === undefined)("fk-cell", ctx_r63.isForeignKey(col_r61) && row_r69[col_r61] != null);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r63.isForeignKey(col_r61) && row_r69[col_r61] != null);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", !(ctx_r63.isForeignKey(col_r61) && row_r69[col_r61] != null));
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](0, 84);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](1, DfDataGridComponent_div_0_div_32_ng_container_3_th_1_Template, 4, 8, "th", 85);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](2, DfDataGridComponent_div_0_div_32_ng_container_3_td_2_Template, 3, 12, "td", 86);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const col_r61 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matColumnDef", col_r61);
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_4_th_1_option_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "option", 56);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const op_r85 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", op_r85.value);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", op_r85.label, " ");
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_4_th_1_input_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r88 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "input", 101);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("input", function DfDataGridComponent_div_0_div_32_ng_container_4_th_1_input_4_Template_input_input_0_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r88);
      const col_r81 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2).$implicit;
      const ctx_r86 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r86.onFilterInput(col_r81, $event));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const col_r81 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2).$implicit;
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2).$implicit;
    const ctx_r84 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("placeholder", t_r1("dataExplorer.filterPlaceholder"))("value", ctx_r84.getFilterValue(col_r81));
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_4_th_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r93 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "th", 97)(1, "div", 98)(2, "select", 99);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("change", function DfDataGridComponent_div_0_div_32_ng_container_4_th_1_Template_select_change_2_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r93);
      const col_r81 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
      const ctx_r91 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r91.onFilterOpChange(col_r81, $event));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](3, DfDataGridComponent_div_0_div_32_ng_container_4_th_1_option_3_Template, 2, 2, "option", 48);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](4, DfDataGridComponent_div_0_div_32_ng_container_4_th_1_input_4_Template, 1, 2, "input", 100);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const col_r81 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]().$implicit;
    const ctx_r82 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵstyleProp"]("width", ctx_r82.columnWidths[col_r81], "px")("min-width", ctx_r82.columnWidths[col_r81], "px")("max-width", ctx_r82.columnWidths[col_r81], "px");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("value", ctx_r82.getFilterOp(col_r81));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r82.getOperatorsForColumn(col_r81));
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", !ctx_r82.isNullOp(ctx_r82.getFilterOp(col_r81)));
  }
}
function DfDataGridComponent_div_0_div_32_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](0, 84);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](1, DfDataGridComponent_div_0_div_32_ng_container_4_th_1_Template, 5, 9, "th", 96);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const col_r81 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matColumnDef", "filter_" + col_r81);
  }
}
function DfDataGridComponent_div_0_div_32_tr_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](0, "tr", 102);
  }
}
function DfDataGridComponent_div_0_div_32_tr_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](0, "tr", 103);
  }
}
function DfDataGridComponent_div_0_div_32_tr_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r97 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "tr", 104);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_32_tr_7_Template_tr_click_0_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r97);
      const row_r95 = restoredCtx.$implicit;
      const ctx_r96 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r96.onRowClick(row_r95));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const row_r95 = ctx.$implicit;
    const ctx_r60 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵclassProp"]("selected-row", row_r95 === ctx_r60.selectedRow);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matTooltipShowDelay", 800);
  }
}
function DfDataGridComponent_div_0_div_32_Template(rf, ctx) {
  if (rf & 1) {
    const _r99 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 77)(1, "div", 78)(2, "table", 79);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("matSortChange", function DfDataGridComponent_div_0_div_32_Template_table_matSortChange_2_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r99);
      const ctx_r98 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r98.onSortChange($event));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](3, DfDataGridComponent_div_0_div_32_ng_container_3_Template, 3, 1, "ng-container", 80);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](4, DfDataGridComponent_div_0_div_32_ng_container_4_Template, 2, 1, "ng-container", 80);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](5, DfDataGridComponent_div_0_div_32_tr_5_Template, 1, 0, "tr", 81);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](6, DfDataGridComponent_div_0_div_32_tr_6_Template, 1, 0, "tr", 82);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](7, DfDataGridComponent_div_0_div_32_tr_7_Template, 1, 3, "tr", 83);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const ctx_r12 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵclassProp"]("is-loading", ctx_r12.loading);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("dataSource", ctx_r12.dataSource);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r12.columns);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r12.columns);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matHeaderRowDef", ctx_r12.columns)("matHeaderRowDefSticky", true);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matHeaderRowDef", ctx_r12.filterColumns)("matHeaderRowDefSticky", true);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matRowDefColumns", ctx_r12.columns);
  }
}
function DfDataGridComponent_div_0_div_33_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1, " (filtered)");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementContainerEnd"]();
  }
}
function DfDataGridComponent_div_0_div_33_span_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "span", 112);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r101 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"](" Page ", ctx_r101.pageIndex + 1, " of ", ctx_r101.totalPages, " ");
  }
}
function DfDataGridComponent_div_0_div_33_Template(rf, ctx) {
  if (rf & 1) {
    const _r103 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 105)(1, "span", 106);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](3, DfDataGridComponent_div_0_div_33_ng_container_3_Template, 2, 0, "ng-container", 93);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](4, "span", 107);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](6, "div", 108);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](7, DfDataGridComponent_div_0_div_33_span_7_Template, 2, 2, "span", 109);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](8, "div", 110)(9, "button", 111);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_33_Template_button_click_9_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r103);
      const ctx_r102 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r102.goToFirstPage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](10, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](11, "first_page");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](12, "button", 111);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_33_Template_button_click_12_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r103);
      const ctx_r104 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r104.goToPrevPage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](13, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](14, "chevron_left");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "button", 111);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_33_Template_button_click_15_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r103);
      const ctx_r105 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r105.goToNextPage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](16, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](17, "chevron_right");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](18, "button", 111);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_div_33_Template_button_click_18_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r103);
      const ctx_r106 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r106.goToLastPage());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](19, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](20, "last_page");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()()();
  }
  if (rf & 2) {
    const ctx_r13 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", ctx_r13.totalRecords, " records ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r13.activeFilterCount > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate2"]("", ctx_r13.columns.length, " of ", ctx_r13.allColumns.length, " columns");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r13.totalRecords > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("disabled", ctx_r13.pageIndex === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("disabled", ctx_r13.pageIndex === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("disabled", ctx_r13.isLastPage());
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("disabled", ctx_r13.isLastPage());
  }
}
function DfDataGridComponent_div_0_df_schema_info_34_Template(rf, ctx) {
  if (rf & 1) {
    const _r108 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "df-schema-info", 113);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("closeClicked", function DfDataGridComponent_div_0_df_schema_info_34_Template_df_schema_info_closeClicked_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r108);
      const ctx_r107 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r107.showSchemaPanel = false);
    })("navigateToTable", function DfDataGridComponent_div_0_df_schema_info_34_Template_df_schema_info_navigateToTable_0_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r108);
      const ctx_r109 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r109.tableNavigated.emit({
        tableName: $event
      }));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r14 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("serviceName", ctx_r14.serviceName)("tableName", ctx_r14.tableName);
  }
}
function DfDataGridComponent_div_0_df_row_detail_35_Template(rf, ctx) {
  if (rf & 1) {
    const _r111 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "df-row-detail", 114);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("closeClicked", function DfDataGridComponent_div_0_df_row_detail_35_Template_df_row_detail_closeClicked_0_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r111);
      const ctx_r110 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r110.selectedRow = null);
    })("navigateToTable", function DfDataGridComponent_div_0_df_row_detail_35_Template_df_row_detail_navigateToTable_0_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r111);
      const ctx_r112 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r112.tableNavigated.emit({
        tableName: $event
      }));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r15 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("row", ctx_r15.selectedRow)("schema", ctx_r15.cachedSchema);
  }
}
function DfDataGridComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r114 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](0, "div", 1)(1, "div", 2)(2, "div", 3)(3, "div", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](4, "fa-icon", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](5, "span", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](7, "mat-chip-set", 7)(8, "mat-chip", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelement"](9, "fa-icon", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](10);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](11, "div", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](12, DfDataGridComponent_div_0_div_12_Template, 5, 3, "div", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](13, DfDataGridComponent_div_0_button_13_Template, 3, 2, "button", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](14, "button", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_Template_button_click_14_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r114);
      const ctx_r113 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r113.showApiCall = !ctx_r113.showApiCall);
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](15, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](16, "code");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](17, "button", 14)(18, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](19, "view_column");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](20, "mat-menu", 15, 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](22, DfDataGridComponent_div_0_div_22_Template, 3, 2, "div", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](23, "button", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵlistener"]("click", function DfDataGridComponent_div_0_Template_button_click_23_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵrestoreView"](_r114);
      const ctx_r115 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵresetView"](ctx_r115.toggleSchemaPanel());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementStart"](24, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtext"](25, "info_outline");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]()()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](26, DfDataGridComponent_div_0_div_26_Template, 10, 1, "div", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](27, DfDataGridComponent_div_0_div_27_Template, 23, 9, "div", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](28, DfDataGridComponent_div_0_div_28_Template, 24, 8, "div", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](29, DfDataGridComponent_div_0_div_29_Template, 4, 1, "div", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](30, DfDataGridComponent_div_0_div_30_Template, 7, 2, "div", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](31, DfDataGridComponent_div_0_div_31_Template, 7, 2, "div", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](32, DfDataGridComponent_div_0_div_32_Template, 8, 10, "div", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](33, DfDataGridComponent_div_0_div_33_Template, 21, 9, "div", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](34, DfDataGridComponent_div_0_df_schema_info_34_Template, 1, 2, "df-schema-info", 27);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](35, DfDataGridComponent_div_0_df_row_detail_35_Template, 1, 2, "df-row-detail", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r1 = ctx.$implicit;
    const _r4 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵreference"](21);
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("icon", ctx_r0.faTable);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate"](ctx_r0.tableName);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("icon", ctx_r0.faLock);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtextInterpolate1"](" ", t_r1("dataExplorer.readOnly"), " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", !ctx_r0.initialLoading && ctx_r0.columns.length > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r0.activeFilterCount > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵclassProp"]("active", ctx_r0.showApiCall);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("matMenuTriggerFor", _r4);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngForOf", ctx_r0.allColumns);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵclassProp"]("active", ctx_r0.showSchemaPanel);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r0.navigationFilter);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", !ctx_r0.initialLoading && !ctx_r0.error && ctx_r0.columns.length > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r0.showApiCall && !ctx_r0.initialLoading && ctx_r0.columns.length > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r0.initialLoading);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r0.error && !ctx_r0.initialLoading);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", !ctx_r0.initialLoading && !ctx_r0.error && ctx_r0.dataSource.data.length === 0 && ctx_r0.allColumns.length === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", !ctx_r0.initialLoading && !ctx_r0.error && ctx_r0.columns.length > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", !ctx_r0.initialLoading && !ctx_r0.error && ctx_r0.columns.length > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r0.showSchemaPanel);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("ngIf", ctx_r0.selectedRow);
  }
}
class DfDataGridComponent {
  constructor(dataExplorerService, cdr) {
    this.dataExplorerService = dataExplorerService;
    this.cdr = cdr;
    this.serviceName = '';
    this.tableName = '';
    this.tableNavigated = new _angular_core__WEBPACK_IMPORTED_MODULE_3__.EventEmitter();
    this.dataSource = new _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatTableDataSource([]);
    this.allColumns = [];
    this.columns = [];
    this.filterColumns = [];
    this.hiddenColumns = new Set();
    this.totalRecords = 0;
    this.pageSize = 50;
    this.pageSizeOptions = [25, 50, 100, 250, 500];
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loading = false;
    this.initialLoading = false;
    this.error = null;
    // Filter state
    this.columnFilters = {};
    this.activeFilterCount = 0;
    this.filterSubject$ = new rxjs__WEBPACK_IMPORTED_MODULE_5__.Subject();
    // Column resize state
    this.columnWidths = {};
    this.resizeRafId = 0;
    // Panel state
    this.showSchemaPanel = false;
    this.showApiCall = false;
    this.apiCopied = false;
    this.apiIncludeLimit = true;
    this.apiIncludeOffset = true;
    this.apiIncludeCount = true;
    this.apiSelectedRelated = {};
    this.selectedRow = null;
    this.cachedSchema = null;
    // Navigation filter (from FK click)
    this.navigationFilter = null;
    // Quick search
    this.quickSearchTerm = '';
    this.faTable = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_6__.faTable;
    this.faLock = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_6__.faLock;
    this.faFilter = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_6__.faFilter;
    this.faCode = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_6__.faCode;
    this.destroy$ = new rxjs__WEBPACK_IMPORTED_MODULE_5__.Subject();
    // Operator sets by column type
    this.textOperators = [{
      value: 'contains',
      label: 'contains'
    }, {
      value: 'eq',
      label: '='
    }, {
      value: 'neq',
      label: '≠'
    }, {
      value: 'starts',
      label: 'starts with'
    }, {
      value: 'ends',
      label: 'ends with'
    }, {
      value: 'is_null',
      label: 'is null'
    }, {
      value: 'is_not_null',
      label: 'is not null'
    }];
    this.numericOperators = [{
      value: 'eq',
      label: '='
    }, {
      value: 'neq',
      label: '≠'
    }, {
      value: 'gt',
      label: '>'
    }, {
      value: 'lt',
      label: '<'
    }, {
      value: 'gte',
      label: '≥'
    }, {
      value: 'lte',
      label: '≤'
    }, {
      value: 'is_null',
      label: 'is null'
    }, {
      value: 'is_not_null',
      label: 'is not null'
    }];
    this.dateOperators = [{
      value: 'eq',
      label: '='
    }, {
      value: 'neq',
      label: '≠'
    }, {
      value: 'gt',
      label: 'after'
    }, {
      value: 'lt',
      label: 'before'
    }, {
      value: 'gte',
      label: 'on/after'
    }, {
      value: 'lte',
      label: 'on/before'
    }, {
      value: 'is_null',
      label: 'is null'
    }, {
      value: 'is_not_null',
      label: 'is not null'
    }];
    this.booleanOperators = [{
      value: 'eq',
      label: '='
    }, {
      value: 'is_null',
      label: 'is null'
    }, {
      value: 'is_not_null',
      label: 'is not null'
    }];
    this.filterSubject$.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_7__.debounceTime)(500), (0,rxjs_operators__WEBPACK_IMPORTED_MODULE_8__.takeUntil)(this.destroy$)).subscribe(() => {
      this.pageIndex = 0;
      this.currentOffset = 0;
      this.loadData();
    });
  }
  ngAfterViewInit() {
    // Paginator and sort are ready
  }
  ngOnChanges(changes) {
    if (changes['tableName'] || changes['serviceName']) {
      this.resetAndLoad();
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    cancelAnimationFrame(this.resizeRafId);
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }
  resetAndLoad() {
    this.allColumns = [];
    this.columns = [];
    this.filterColumns = [];
    this.hiddenColumns = new Set();
    this.dataSource.data = [];
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.currentSort = undefined;
    this.columnFilters = {};
    this.activeFilterCount = 0;
    this.selectedRow = null;
    this.cachedSchema = null;
    this.columnWidths = {};
    this.navigationFilter = this.initialFilter || null;
    this.initialLoading = true;
    this.loadData();
    this.loadSchemaForTable();
  }
  loadSchemaForTable() {
    if (!this.serviceName || !this.tableName) return;
    this.dataExplorerService.getTableSchema(this.serviceName, this.tableName).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_8__.takeUntil)(this.destroy$)).subscribe({
      next: schema => {
        this.cachedSchema = schema;
        this.apiSelectedRelated = {};
        // Force mat-table to re-render cells so FK/PK indicators and type-aware filters appear
        this.dataSource.data = [...this.dataSource.data];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }
  loadData() {
    if (!this.serviceName || !this.tableName) return;
    this.loading = true;
    this.error = null;
    const colFilter = this.buildFilterString();
    const filterParts = [this.navigationFilter, colFilter].filter(Boolean);
    const combinedFilter = filterParts.join(' AND ') || undefined;
    this.dataExplorerService.getTableData(this.serviceName, this.tableName, this.pageSize, this.currentOffset, this.currentSort, combinedFilter).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_8__.takeUntil)(this.destroy$)).subscribe({
      next: res => {
        const records = res.resource || [];
        if (records.length > 0 && this.allColumns.length === 0) {
          this.allColumns = Object.keys(records[0]);
          this.updateVisibleColumns();
          // Initialize default column widths
          for (const col of this.allColumns) {
            this.columnWidths[col] = 150;
          }
        }
        this.dataSource.data = records;
        this.totalRecords = res.meta?.count ?? records.length;
        this.loading = false;
        this.initialLoading = false;
      },
      error: err => {
        this.error = err?.error?.error?.message || 'Failed to load table data';
        this.loading = false;
        this.initialLoading = false;
      }
    });
  }
  // --- Column visibility ---
  toggleColumn(col) {
    if (this.hiddenColumns.has(col)) {
      this.hiddenColumns.delete(col);
    } else {
      // Don't allow hiding all columns
      if (this.columns.length > 1) {
        this.hiddenColumns.add(col);
      }
    }
    this.updateVisibleColumns();
  }
  updateVisibleColumns() {
    this.columns = this.allColumns.filter(c => !this.hiddenColumns.has(c));
    this.filterColumns = this.columns.map(c => 'filter_' + c);
  }
  // --- Pagination ---
  onPageChange(event) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.currentOffset = event.pageIndex * event.pageSize;
    this.loadData();
  }
  onPageSizeChange(event) {
    this.pageSize = Number(event.target.value);
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }
  goToFirstPage() {
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }
  goToPrevPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.currentOffset = this.pageIndex * this.pageSize;
      this.loadData();
    }
  }
  goToNextPage() {
    if (!this.isLastPage()) {
      this.pageIndex++;
      this.currentOffset = this.pageIndex * this.pageSize;
      this.loadData();
    }
  }
  goToLastPage() {
    this.pageIndex = Math.max(0, Math.ceil(this.totalRecords / this.pageSize) - 1);
    this.currentOffset = this.pageIndex * this.pageSize;
    this.loadData();
  }
  isLastPage() {
    return this.currentOffset + this.pageSize >= this.totalRecords;
  }
  onSortChange(sortState) {
    if (sortState.direction) {
      // The column ID from the JSON response may be camelCased, but the DB
      // needs the real column name. Use schema to map back if available.
      const dbCol = this.getDbColumnName(sortState.active);
      this.currentSort = `${dbCol} ${sortState.direction.toUpperCase()}`;
    } else {
      this.currentSort = undefined;
    }
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }
  /** Find schema FieldInfo for a JSON response key, handling camelCase vs snake_case */
  getFieldInfo(jsonKey) {
    if (!this.cachedSchema?.field) return null;
    // Try exact match first
    const exact = this.cachedSchema.field.find(f => f.name === jsonKey);
    if (exact) return exact;
    // Try case-insensitive match (camelCase vs snake_case)
    const lower = jsonKey.toLowerCase();
    return this.cachedSchema.field.find(f => f.name.toLowerCase().replace(/_/g, '') === lower) || null;
  }
  /** Map a JSON response key back to the actual DB column name via schema */
  getDbColumnName(jsonKey) {
    return this.getFieldInfo(jsonKey)?.name ?? jsonKey;
  }
  // --- Column resize ---
  onResizeStart(event, col) {
    event.stopPropagation();
    event.preventDefault();
    const startX = event.pageX;
    const startWidth = this.columnWidths[col] || 150;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMouseMove = e => {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = requestAnimationFrame(() => {
        const diff = e.pageX - startX;
        this.columnWidths[col] = Math.max(60, startWidth + diff);
        this.cdr.detectChanges();
      });
    };
    const onMouseUp = () => {
      cancelAnimationFrame(this.resizeRafId);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.cdr.detectChanges();
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  // --- Filter operator logic ---
  getOperatorsForColumn(col) {
    const fieldInfo = this.getFieldInfo(col);
    if (!fieldInfo) return this.textOperators;
    const type = (fieldInfo.type || fieldInfo.dbType).toLowerCase();
    if (this.isNumericType(type)) return this.numericOperators;
    if (this.isDateType(type)) return this.dateOperators;
    if (this.isBooleanType(type)) return this.booleanOperators;
    return this.textOperators;
  }
  getFilterOp(col) {
    return this.columnFilters[col]?.op || this.getDefaultOp(col);
  }
  getFilterValue(col) {
    return this.columnFilters[col]?.value || '';
  }
  getDefaultOp(col) {
    const ops = this.getOperatorsForColumn(col);
    return ops[0].value;
  }
  isNullOp(op) {
    return op === 'is_null' || op === 'is_not_null';
  }
  onFilterOpChange(col, event) {
    const op = event.target.value;
    const existingValue = this.columnFilters[col]?.value || '';
    this.columnFilters[col] = {
      op,
      value: existingValue
    };
    if (this.isNullOp(op)) {
      // Null ops are complete filters — trigger immediately
      this.columnFilters[col] = {
        op,
        value: ''
      };
      this.updateActiveFilterCount();
      this.filterSubject$.next();
    } else if (existingValue) {
      // Op changed with existing value — re-filter
      this.updateActiveFilterCount();
      this.filterSubject$.next();
    } else {
      // Op changed but no value yet — keep entry so op persists
      this.updateActiveFilterCount();
    }
  }
  onFilterInput(col, event) {
    const value = event.target.value;
    const currentOp = this.columnFilters[col]?.op || this.getDefaultOp(col);
    if (value) {
      this.columnFilters[col] = {
        op: currentOp,
        value
      };
    } else {
      // Keep the op selection even when value is cleared
      this.columnFilters[col] = {
        op: currentOp,
        value: ''
      };
    }
    this.updateActiveFilterCount();
    this.filterSubject$.next();
  }
  clearAllFilters() {
    this.columnFilters = {};
    this.activeFilterCount = 0;
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }
  updateActiveFilterCount() {
    this.activeFilterCount = Object.keys(this.columnFilters).filter(k => {
      const f = this.columnFilters[k];
      return f.value || this.isNullOp(f.op);
    }).length;
  }
  buildFilterString() {
    const parts = [];
    for (const [col, filter] of Object.entries(this.columnFilters)) {
      const {
        op,
        value
      } = filter;
      // Skip entries that have no value and aren't null-type ops
      if (!value && !this.isNullOp(op)) continue;
      // Use the real DB column name for the API filter
      const dbCol = this.getDbColumnName(col);
      if (op === 'is_null') {
        parts.push(`(${dbCol} IS NULL)`);
        continue;
      }
      if (op === 'is_not_null') {
        parts.push(`(${dbCol} IS NOT NULL)`);
        continue;
      }
      if (!value) continue;
      if (op === 'contains') {
        const escaped = value.replace(/'/g, "''");
        parts.push(`(${dbCol} like '%${escaped}%')`);
      } else if (op === 'starts') {
        const escaped = value.replace(/'/g, "''");
        parts.push(`(${dbCol} like '${escaped}%')`);
      } else if (op === 'ends') {
        const escaped = value.replace(/'/g, "''");
        parts.push(`(${dbCol} like '%${escaped}')`);
      } else {
        const opMap = {
          eq: '=',
          neq: '!=',
          gt: '>',
          lt: '<',
          gte: '>=',
          lte: '<='
        };
        const sqlOp = opMap[op] || '=';
        const fieldInfo = this.getFieldInfo(col);
        const type = (fieldInfo?.type || fieldInfo?.dbType || '').toLowerCase();
        if (this.isNumericType(type) && !isNaN(Number(value))) {
          parts.push(`(${dbCol} ${sqlOp} ${value})`);
        } else {
          const escaped = value.replace(/'/g, "''");
          parts.push(`(${dbCol} ${sqlOp} '${escaped}')`);
        }
      }
    }
    return parts.join(' AND ');
  }
  isNumericType(type) {
    const numericTypes = ['integer', 'int', 'smallint', 'bigint', 'tinyint', 'float', 'double', 'decimal', 'numeric', 'real', 'serial', 'bigserial', 'int2', 'int4', 'int8', 'float4', 'float8', 'money'];
    return numericTypes.some(t => type.toLowerCase().includes(t));
  }
  isDateType(type) {
    const dateTypes = ['date', 'datetime', 'timestamp', 'time', 'timestamptz', 'timetz'];
    return dateTypes.some(t => type.toLowerCase().includes(t));
  }
  isBooleanType(type) {
    const boolTypes = ['boolean', 'bool', 'bit'];
    return boolTypes.some(t => type.toLowerCase().includes(t));
  }
  onRowClick(row) {
    if (this.selectedRow === row) {
      this.selectedRow = null;
    } else {
      this.selectedRow = row;
    }
  }
  toggleSchemaPanel() {
    this.showSchemaPanel = !this.showSchemaPanel;
  }
  // --- Primary key detection ---
  isPrimaryKey(col) {
    const fi = this.getFieldInfo(col);
    return fi?.isPrimaryKey ?? false;
  }
  isForeignKey(col) {
    const fi = this.getFieldInfo(col);
    return fi?.isForeignKey ?? false;
  }
  getFkRefTable(col) {
    const fi = this.getFieldInfo(col);
    return fi?.refTable || '';
  }
  onFkClick(event, col, value) {
    event.stopPropagation(); // Don't trigger row click
    const fi = this.getFieldInfo(col);
    if (!fi?.refTable || !fi?.refField) return;
    const isNumeric = this.isNumericType((fi.type || fi.dbType).toLowerCase());
    const filterValue = isNumeric ? `(${fi.refField} = ${value})` : `(${fi.refField} = '${String(value).replace(/'/g, "''")}')`;
    this.tableNavigated.emit({
      tableName: fi.refTable,
      filter: filterValue
    });
  }
  clearNavigationFilter() {
    this.navigationFilter = null;
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }
  // --- API URL builder ---
  buildApiUrl() {
    const base = `${window.location.origin}/api/v2/${this.serviceName}/_table/${this.tableName}`;
    const params = new URLSearchParams();
    if (this.apiIncludeLimit) {
      params.set('limit', this.pageSize.toString());
    }
    if (this.apiIncludeOffset) {
      params.set('offset', this.currentOffset.toString());
    }
    if (this.apiIncludeCount) {
      params.set('include_count', 'true');
    }
    if (this.currentSort) {
      params.set('order', this.currentSort);
    }
    const colFilter = this.buildFilterString();
    const apiFilterParts = [this.navigationFilter, colFilter].filter(Boolean);
    const apiFilter = apiFilterParts.join(' AND ');
    if (apiFilter) {
      params.set('filter', apiFilter);
    }
    const relatedNames = Object.entries(this.apiSelectedRelated).filter(([_, v]) => v).map(([k]) => k);
    if (relatedNames.length > 0) {
      params.set('related', relatedNames.join(','));
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }
  copyApiUrl() {
    const url = this.buildApiUrl();
    navigator.clipboard.writeText(url).then(() => {
      this.apiCopied = true;
      setTimeout(() => this.apiCopied = false, 2000);
    });
  }
  // --- Quick search (client-side) ---
  onQuickSearch(event) {
    this.quickSearchTerm = event.target.value;
    this.applyQuickSearch();
  }
  clearQuickSearch() {
    this.quickSearchTerm = '';
    this.applyQuickSearch();
  }
  applyQuickSearch() {
    if (!this.quickSearchTerm) {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = this.quickSearchTerm.trim().toLowerCase();
    }
    this.dataSource.filterPredicate = (row, filter) => {
      return this.columns.some(col => {
        const val = row[col];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(filter);
      });
    };
  }
  formatCellValue(value) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    const str = String(value);
    return str.length > 200 ? str.substring(0, 200) + '...' : str;
  }
  static {
    this.ɵfac = function DfDataGridComponent_Factory(t) {
      return new (t || DfDataGridComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_services_data_explorer_service__WEBPACK_IMPORTED_MODULE_2__.DataExplorerService), _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_3__.ChangeDetectorRef));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵdefineComponent"]({
      type: DfDataGridComponent,
      selectors: [["df-data-grid"]],
      viewQuery: function DfDataGridComponent_Query(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵviewQuery"](_angular_material_paginator__WEBPACK_IMPORTED_MODULE_9__.MatPaginator, 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵviewQuery"](_angular_material_sort__WEBPACK_IMPORTED_MODULE_10__.MatSort, 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵviewQuery"](_df_schema_info_component__WEBPACK_IMPORTED_MODULE_0__.DfSchemaInfoComponent, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵloadQuery"]()) && (ctx.paginator = _t.first);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵloadQuery"]()) && (ctx.sort = _t.first);
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵloadQuery"]()) && (ctx.schemaInfoComponent = _t.first);
        }
      },
      inputs: {
        serviceName: "serviceName",
        tableName: "tableName",
        initialFilter: "initialFilter"
      },
      outputs: {
        tableNavigated: "tableNavigated"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵNgOnChangesFeature"], _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵStandaloneFeature"]],
      decls: 1,
      vars: 1,
      consts: [["class", "data-grid-container", 4, "transloco", "translocoScope"], [1, "data-grid-container"], [1, "grid-main"], [1, "grid-toolbar"], [1, "toolbar-left"], [1, "toolbar-icon", 3, "icon"], [1, "table-title"], [1, "readonly-chip"], ["disabled", "", "matTooltip", "Data Explorer is currently read-only. Use the API call to build write operations."], [1, "lock-icon", 3, "icon"], [1, "toolbar-right"], ["class", "quick-search", "matTooltip", "Search within the current page of results. Filters rows client-side across all visible columns.", 4, "ngIf"], ["mat-icon-button", "", "class", "clear-filters-btn", 3, "matTooltip", "click", 4, "ngIf"], ["mat-icon-button", "", "matTooltip", "Show the DreamFactory REST API call that matches your current view. Copy it to use in your own apps.", 3, "click"], ["mat-icon-button", "", "matTooltip", "Show or hide columns in the grid", 3, "matMenuTriggerFor"], [1, "column-menu"], ["columnMenu", "matMenu"], ["class", "column-menu-item", 3, "click", 4, "ngFor", "ngForOf"], ["mat-icon-button", "", "matTooltip", "View column types, primary keys, foreign keys, and table relationships", 3, "click"], ["class", "nav-filter-bar", 4, "ngIf"], ["class", "top-pagination", 4, "ngIf"], ["class", "api-call-bar", 4, "ngIf"], ["class", "loading-state", 4, "ngIf"], ["class", "error-state", 4, "ngIf"], ["class", "empty-state", 4, "ngIf"], ["class", "table-wrapper", 3, "is-loading", 4, "ngIf"], ["class", "grid-footer", 4, "ngIf"], [3, "serviceName", "tableName", "closeClicked", "navigateToTable", 4, "ngIf"], [3, "row", "schema", "closeClicked", "navigateToTable", 4, "ngIf"], ["matTooltip", "Search within the current page of results. Filters rows client-side across all visible columns.", 1, "quick-search"], [1, "search-icon"], [1, "search-input", 3, "placeholder", "value", "input"], ["class", "search-clear", 3, "click", 4, "ngIf"], [1, "search-clear", 3, "click"], ["mat-icon-button", "", 1, "clear-filters-btn", 3, "matTooltip", "click"], ["matBadgeColor", "accent", "matBadgeSize", "small", 3, "matBadge"], [1, "column-menu-item", 3, "click"], [3, "checked", "change"], [1, "nav-filter-bar"], [1, "nav-filter-icon"], [1, "nav-filter-text"], ["mat-icon-button", "", "matTooltip", "Remove navigation filter and show all records", 1, "nav-filter-clear", 3, "click"], [1, "top-pagination"], [1, "top-pagination-left"], ["class", "page-info", 3, "matTooltip", 4, "ngIf"], [1, "top-pagination-right"], [1, "page-size-label"], [1, "page-size-select", 3, "value", "change"], [3, "value", 4, "ngFor", "ngForOf"], [1, "page-nav"], ["mat-icon-button", "", "matTooltip", "First page", 3, "disabled", "click"], ["mat-icon-button", "", "matTooltip", "Previous page", 3, "disabled", "click"], [1, "page-label"], ["mat-icon-button", "", "matTooltip", "Next page", 3, "disabled", "click"], ["mat-icon-button", "", "matTooltip", "Last page", 3, "disabled", "click"], [1, "page-info", 3, "matTooltip"], [3, "value"], [1, "api-call-bar"], [1, "api-call-desc"], [1, "api-call-top"], ["matTooltip", "HTTP method \u2014 GET retrieves records without modifying data", 1, "api-method"], ["matTooltip", "Click to copy this URL", 1, "api-url", 3, "click"], ["mat-icon-button", "", "matTooltip", "Copy URL to clipboard", 1, "copy-btn", 3, "click"], [1, "api-call-options"], [1, "options-label"], [1, "api-option", 3, "matTooltip"], ["type", "checkbox", 3, "checked", "change"], ["matTooltip", "include_count \u2014 Returns total record count in the response metadata", 1, "api-option"], ["class", "api-call-related", 4, "ngIf"], [1, "api-call-related"], ["class", "api-option", 3, "matTooltip", 4, "ngFor", "ngForOf"], [1, "loading-state"], ["diameter", "40"], [1, "error-state"], ["color", "warn"], ["mat-stroked-button", "", "color", "primary", 3, "click"], [1, "empty-state"], [1, "table-wrapper"], [1, "table-scroll"], ["mat-table", "", "matSort", "", 1, "data-table", 3, "dataSource", "matSortChange"], [3, "matColumnDef", 4, "ngFor", "ngForOf"], ["mat-header-row", "", 4, "matHeaderRowDef", "matHeaderRowDefSticky"], ["mat-header-row", "", "class", "filter-row", 4, "matHeaderRowDef", "matHeaderRowDefSticky"], ["mat-row", "", "class", "clickable-row", "matTooltip", "Click to view full record details", 3, "selected-row", "matTooltipShowDelay", "click", 4, "matRowDef", "matRowDefColumns"], [3, "matColumnDef"], ["mat-header-cell", "", "mat-sort-header", "", "class", "header-cell", 3, "width", "min-width", "max-width", 4, "matHeaderCellDef"], ["mat-cell", "", "class", "data-cell", 3, "width", "min-width", "max-width", "null-cell", "fk-cell", 4, "matCellDef"], ["mat-header-cell", "", "mat-sort-header", "", 1, "header-cell"], ["class", "pk-icon", "matTooltip", "Primary Key", 4, "ngIf"], [1, "resize-handle", 3, "mousedown"], ["matTooltip", "Primary Key", 1, "pk-icon"], ["mat-cell", "", 1, "data-cell"], ["class", "fk-link", 3, "matTooltip", "click", 4, "ngIf"], [4, "ngIf"], [1, "fk-link", 3, "matTooltip", "click"], [1, "fk-nav-icon"], ["mat-header-cell", "", "class", "filter-cell", 3, "width", "min-width", "max-width", 4, "matHeaderCellDef"], ["mat-header-cell", "", 1, "filter-cell"], [1, "filter-group"], [1, "filter-op", 3, "value", "change"], ["class", "filter-input", 3, "placeholder", "value", "input", 4, "ngIf"], [1, "filter-input", 3, "placeholder", "value", "input"], ["mat-header-row", ""], ["mat-header-row", "", 1, "filter-row"], ["mat-row", "", "matTooltip", "Click to view full record details", 1, "clickable-row", 3, "matTooltipShowDelay", "click"], [1, "grid-footer"], ["matTooltip", "Total records matching current server-side filters", 1, "footer-info"], ["matTooltip", "Use the column visibility button to show/hide columns", 1, "footer-info"], [1, "footer-right"], ["class", "page-info-footer", 4, "ngIf"], [1, "page-nav-footer"], ["mat-icon-button", "", 1, "footer-btn", 3, "disabled", "click"], [1, "page-info-footer"], [3, "serviceName", "tableName", "closeClicked", "navigateToTable"], [3, "row", "schema", "closeClicked", "navigateToTable"]],
      template: function DfDataGridComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵtemplate"](0, DfDataGridComponent_div_0_Template, 36, 22, "div", 0);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_3__["ɵɵproperty"]("translocoScope", "dataExplorer");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_11__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_11__.NgFor, _angular_forms__WEBPACK_IMPORTED_MODULE_12__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_12__.NgSelectOption, _angular_forms__WEBPACK_IMPORTED_MODULE_12__["ɵNgSelectMultipleOption"], _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatTableModule, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatTable, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatHeaderCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatHeaderRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatColumnDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatCellDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatRowDef, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatHeaderCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatCell, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatHeaderRow, _angular_material_table__WEBPACK_IMPORTED_MODULE_4__.MatRow, _angular_material_paginator__WEBPACK_IMPORTED_MODULE_9__.MatPaginatorModule, _angular_material_sort__WEBPACK_IMPORTED_MODULE_10__.MatSortModule, _angular_material_sort__WEBPACK_IMPORTED_MODULE_10__.MatSort, _angular_material_sort__WEBPACK_IMPORTED_MODULE_10__.MatSortHeader, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_13__.MatProgressSpinnerModule, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_13__.MatProgressSpinner, _angular_material_icon__WEBPACK_IMPORTED_MODULE_14__.MatIconModule, _angular_material_icon__WEBPACK_IMPORTED_MODULE_14__.MatIcon, _angular_material_button__WEBPACK_IMPORTED_MODULE_15__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_15__.MatButton, _angular_material_button__WEBPACK_IMPORTED_MODULE_15__.MatIconButton, _angular_material_toolbar__WEBPACK_IMPORTED_MODULE_16__.MatToolbarModule, _angular_material_chips__WEBPACK_IMPORTED_MODULE_17__.MatChipsModule, _angular_material_chips__WEBPACK_IMPORTED_MODULE_17__.MatChip, _angular_material_chips__WEBPACK_IMPORTED_MODULE_17__.MatChipSet, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_18__.MatFormFieldModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_19__.MatInputModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_20__.MatTooltipModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_20__.MatTooltip, _angular_material_badge__WEBPACK_IMPORTED_MODULE_21__.MatBadgeModule, _angular_material_badge__WEBPACK_IMPORTED_MODULE_21__.MatBadge, _angular_material_menu__WEBPACK_IMPORTED_MODULE_22__.MatMenuModule, _angular_material_menu__WEBPACK_IMPORTED_MODULE_22__.MatMenu, _angular_material_menu__WEBPACK_IMPORTED_MODULE_22__.MatMenuTrigger, _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_23__.MatCheckboxModule, _angular_material_checkbox__WEBPACK_IMPORTED_MODULE_23__.MatCheckbox, _angular_material_select__WEBPACK_IMPORTED_MODULE_24__.MatSelectModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_25__.TranslocoModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_25__.TranslocoDirective, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_26__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_26__.FaIconComponent, _df_schema_info_component__WEBPACK_IMPORTED_MODULE_0__.DfSchemaInfoComponent, _df_row_detail_component__WEBPACK_IMPORTED_MODULE_1__.DfRowDetailComponent],
      styles: ["[_nghost-%COMP%] {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n\n.data-grid-container[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: row;\n  overflow: hidden;\n}\n\n.grid-main[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n\n.grid-toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 12px;\n  height: 49px;\n  box-sizing: border-box;\n  border-bottom: 1px solid #e0e0e0;\n  background: #fafafa;\n  flex-shrink: 0;\n}\n.grid-toolbar[_ngcontent-%COMP%]   .toolbar-left[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}\n.grid-toolbar[_ngcontent-%COMP%]   .toolbar-left[_ngcontent-%COMP%]   .toolbar-icon[_ngcontent-%COMP%] {\n  color: #7b1fa2;\n  font-size: 16px;\n}\n.grid-toolbar[_ngcontent-%COMP%]   .toolbar-left[_ngcontent-%COMP%]   .table-title[_ngcontent-%COMP%] {\n  font-size: 15px;\n  font-weight: 500;\n  color: #212121;\n}\n.grid-toolbar[_ngcontent-%COMP%]   .toolbar-left[_ngcontent-%COMP%]   .readonly-chip[_ngcontent-%COMP%]   .lock-icon[_ngcontent-%COMP%] {\n  font-size: 11px;\n  margin-right: 4px;\n}\n.grid-toolbar[_ngcontent-%COMP%]   .toolbar-right[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n}\n.grid-toolbar[_ngcontent-%COMP%]   .toolbar-right[_ngcontent-%COMP%]   button.active[_ngcontent-%COMP%] {\n  color: #7b1fa2;\n}\n.grid-toolbar[_ngcontent-%COMP%]   .toolbar-right[_ngcontent-%COMP%]   .clear-filters-btn[_ngcontent-%COMP%] {\n  color: #ef6c00;\n}\n\n.dark-theme[_nghost-%COMP%]   .grid-toolbar[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .grid-toolbar[_ngcontent-%COMP%] {\n  border-bottom-color: #424242;\n  background: #303030;\n}\n.dark-theme[_nghost-%COMP%]   .grid-toolbar[_ngcontent-%COMP%]   .toolbar-left[_ngcontent-%COMP%]   .toolbar-icon[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .grid-toolbar[_ngcontent-%COMP%]   .toolbar-left[_ngcontent-%COMP%]   .toolbar-icon[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n.dark-theme[_nghost-%COMP%]   .grid-toolbar[_ngcontent-%COMP%]   .toolbar-left[_ngcontent-%COMP%]   .table-title[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .grid-toolbar[_ngcontent-%COMP%]   .toolbar-left[_ngcontent-%COMP%]   .table-title[_ngcontent-%COMP%] {\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .grid-toolbar[_ngcontent-%COMP%]   .toolbar-right[_ngcontent-%COMP%]   button.active[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .grid-toolbar[_ngcontent-%COMP%]   .toolbar-right[_ngcontent-%COMP%]   button.active[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n\n\n\n.column-menu-item[_ngcontent-%COMP%] {\n  padding: 4px 16px;\n  font-size: 13px;\n}\n\n\n\n.top-pagination[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 2px 12px;\n  border-bottom: 1px solid #e0e0e0;\n  background: #fafafa;\n  flex-shrink: 0;\n  font-size: 12px;\n  color: #757575;\n}\n.top-pagination[_ngcontent-%COMP%]   .top-pagination-left[_ngcontent-%COMP%]   .page-info[_ngcontent-%COMP%] {\n  white-space: nowrap;\n}\n.top-pagination[_ngcontent-%COMP%]   .top-pagination-right[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.top-pagination[_ngcontent-%COMP%]   .top-pagination-right[_ngcontent-%COMP%]   .page-size-label[_ngcontent-%COMP%] {\n  font-size: 12px;\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.top-pagination[_ngcontent-%COMP%]   .top-pagination-right[_ngcontent-%COMP%]   .page-size-label[_ngcontent-%COMP%]   .page-size-select[_ngcontent-%COMP%] {\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  padding: 2px 4px;\n  font-size: 12px;\n  background: white;\n  color: #424242;\n  outline: none;\n  cursor: pointer;\n}\n.top-pagination[_ngcontent-%COMP%]   .top-pagination-right[_ngcontent-%COMP%]   .page-nav[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0;\n}\n.top-pagination[_ngcontent-%COMP%]   .top-pagination-right[_ngcontent-%COMP%]   .page-nav[_ngcontent-%COMP%]   .page-label[_ngcontent-%COMP%] {\n  font-size: 12px;\n  padding: 0 6px;\n  white-space: nowrap;\n}\n.top-pagination[_ngcontent-%COMP%]   .top-pagination-right[_ngcontent-%COMP%]   .page-nav[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {\n  width: 28px;\n  height: 28px;\n  line-height: 28px;\n}\n.top-pagination[_ngcontent-%COMP%]   .top-pagination-right[_ngcontent-%COMP%]   .page-nav[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%] {\n  font-size: 18px;\n}\n\n.dark-theme[_nghost-%COMP%]   .top-pagination[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .top-pagination[_ngcontent-%COMP%] {\n  border-bottom-color: #424242;\n  background: #303030;\n  color: #9e9e9e;\n}\n.dark-theme[_nghost-%COMP%]   .top-pagination[_ngcontent-%COMP%]   .page-size-select[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .top-pagination[_ngcontent-%COMP%]   .page-size-select[_ngcontent-%COMP%] {\n  background: #2c2c2c !important;\n  border-color: #424242 !important;\n  color: #e0e0e0 !important;\n}\n\n.loading-state[_ngcontent-%COMP%], .error-state[_ngcontent-%COMP%], .empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 16px;\n  padding: 48px 24px;\n  color: #757575;\n  font-size: 14px;\n  flex: 1;\n}\n\n.table-wrapper[_ngcontent-%COMP%] {\n  flex: 1;\n  min-height: 0;\n  overflow: hidden;\n  position: relative;\n}\n.table-wrapper.is-loading[_ngcontent-%COMP%]::after {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 3px;\n  background: linear-gradient(90deg, transparent, #7b1fa2, transparent);\n  animation: _ngcontent-%COMP%_loading-bar 1s infinite;\n  z-index: 10;\n}\n\n@keyframes _ngcontent-%COMP%_loading-bar {\n  0% {\n    transform: translateX(-100%);\n  }\n  100% {\n    transform: translateX(100%);\n  }\n}\n.table-scroll[_ngcontent-%COMP%] {\n  height: 100%;\n  overflow: scroll;\n  \n\n  scrollbar-width: auto;\n  scrollbar-color: #a0a0a0 #e8e8e8;\n}\n.table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar {\n  width: 14px;\n  height: 14px;\n}\n.table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: #e8e8e8;\n}\n.table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: #a0a0a0;\n  border-radius: 7px;\n  border: 2px solid #e8e8e8;\n}\n.table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: #808080;\n}\n.table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:active {\n  background: #666;\n}\n.table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-corner {\n  background: #e8e8e8;\n}\n\n.dark-theme[_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%] {\n  scrollbar-color: #555 #252525;\n}\n.dark-theme[_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-track, .dark-theme   [_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-track {\n  background: #252525;\n}\n.dark-theme[_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb, .dark-theme   [_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: #555;\n  border-color: #252525;\n}\n.dark-theme[_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover, .dark-theme   [_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover {\n  background: #6a6a6a;\n}\n.dark-theme[_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:active, .dark-theme   [_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:active {\n  background: #7a7a7a;\n}\n.dark-theme[_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-corner, .dark-theme   [_nghost-%COMP%]   .table-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-corner {\n  background: #252525;\n}\n\n.data-table[_ngcontent-%COMP%] {\n  width: max-content;\n  min-width: 100%;\n}\n.data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%] {\n  position: relative;\n  flex: none;\n  font-weight: 600;\n  font-size: 12px;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  color: #616161;\n  background: #f5f5f5;\n  white-space: nowrap;\n  padding: 0 16px;\n  border-right: 1px solid #e0e0e0;\n  box-sizing: border-box;\n}\n.data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%]   .resize-handle[_ngcontent-%COMP%] {\n  position: absolute;\n  right: -7px;\n  top: 0;\n  bottom: 0;\n  width: 13px;\n  cursor: col-resize;\n  z-index: 10;\n}\n.data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%]   .resize-handle[_ngcontent-%COMP%]::after {\n  content: \"\";\n  position: absolute;\n  left: 50%;\n  transform: translateX(-50%);\n  top: 20%;\n  bottom: 20%;\n  width: 2px;\n  border-radius: 1px;\n  background: transparent;\n  transition: background 0.15s;\n}\n.data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%]   .resize-handle[_ngcontent-%COMP%]:hover::after {\n  background: #7b1fa2;\n}\n.data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%]   .resize-handle[_ngcontent-%COMP%]:hover {\n  background: rgba(123, 31, 162, 0.08);\n}\n.data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%] {\n  flex: none;\n  padding: 4px 8px;\n  background: #f5f5f5;\n  border-right: 1px solid #e0e0e0;\n  overflow: hidden;\n  box-sizing: border-box;\n}\n.data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-group[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 4px;\n  align-items: center;\n}\n.data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-op[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  padding: 3px 4px;\n  font-size: 11px;\n  background: white;\n  color: #424242;\n  outline: none;\n  cursor: pointer;\n  max-width: 90px;\n}\n.data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-op[_ngcontent-%COMP%]:focus {\n  border-color: #7b1fa2;\n}\n.data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 0;\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  padding: 4px 8px;\n  font-size: 12px;\n  background: white;\n  outline: none;\n  box-sizing: border-box;\n}\n.data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%]:focus {\n  border-color: #7b1fa2;\n}\n.data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%]::placeholder {\n  color: #bdbdbd;\n  font-style: italic;\n}\n.data-table[_ngcontent-%COMP%]   .data-cell[_ngcontent-%COMP%] {\n  flex: none;\n  font-size: 13px;\n  padding: 0 16px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  border-right: 1px solid #f0f0f0;\n  font-family: \"Roboto Mono\", monospace;\n  box-sizing: border-box;\n}\n.data-table[_ngcontent-%COMP%]   .data-cell.null-cell[_ngcontent-%COMP%] {\n  color: #bdbdbd;\n  font-style: italic;\n}\n.data-table[_ngcontent-%COMP%]   tr.mat-mdc-row[_ngcontent-%COMP%]:hover {\n  background: rgba(123, 31, 162, 0.04);\n}\n.data-table[_ngcontent-%COMP%]   tr.mat-mdc-row[_ngcontent-%COMP%] {\n  height: 36px;\n}\n.data-table[_ngcontent-%COMP%]   tr.clickable-row[_ngcontent-%COMP%] {\n  cursor: pointer;\n}\n.data-table[_ngcontent-%COMP%]   tr.selected-row[_ngcontent-%COMP%] {\n  background: rgba(123, 31, 162, 0.08) !important;\n}\n.data-table[_ngcontent-%COMP%]   tr.mat-mdc-header-row[_ngcontent-%COMP%] {\n  height: 40px;\n}\n.data-table[_ngcontent-%COMP%]   tr.filter-row[_ngcontent-%COMP%] {\n  height: 36px;\n}\n\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%] {\n  color: #bdbdbd;\n  background: #383838;\n  border-right-color: #424242;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%]   .resize-handle[_ngcontent-%COMP%]:hover, .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%]   .resize-handle[_ngcontent-%COMP%]:hover {\n  background: rgba(206, 147, 216, 0.1);\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%]   .resize-handle[_ngcontent-%COMP%]:hover::after, .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .header-cell[_ngcontent-%COMP%]   .resize-handle[_ngcontent-%COMP%]:hover::after {\n  background: #ce93d8;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%] {\n  background: #383838;\n  border-right-color: #424242;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-op[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-op[_ngcontent-%COMP%] {\n  background: #2c2c2c;\n  border-color: #424242;\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-op[_ngcontent-%COMP%]:focus, .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-op[_ngcontent-%COMP%]:focus {\n  border-color: #ce93d8;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%] {\n  background: #2c2c2c;\n  border-color: #424242;\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%]:focus, .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%]:focus {\n  border-color: #ce93d8;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%]::placeholder, .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .filter-cell[_ngcontent-%COMP%]   .filter-input[_ngcontent-%COMP%]::placeholder {\n  color: #616161;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .data-cell[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .data-cell[_ngcontent-%COMP%] {\n  border-right-color: #383838;\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .data-cell.null-cell[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   .data-cell.null-cell[_ngcontent-%COMP%] {\n  color: #616161;\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   tr.mat-mdc-row[_ngcontent-%COMP%]:hover, .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   tr.mat-mdc-row[_ngcontent-%COMP%]:hover {\n  background: rgba(206, 147, 216, 0.06);\n}\n.dark-theme[_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   tr.selected-row[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .data-table[_ngcontent-%COMP%]   tr.selected-row[_ngcontent-%COMP%] {\n  background: rgba(206, 147, 216, 0.12) !important;\n}\n\n\n\n.grid-footer[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 4px 12px;\n  border-top: 1px solid #e0e0e0;\n  background: #f5f5f5;\n  flex-shrink: 0;\n  font-size: 12px;\n  color: #757575;\n}\n.grid-footer[_ngcontent-%COMP%]   .footer-info[_ngcontent-%COMP%] {\n  white-space: nowrap;\n}\n.grid-footer[_ngcontent-%COMP%]   .footer-right[_ngcontent-%COMP%] {\n  margin-left: auto;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.grid-footer[_ngcontent-%COMP%]   .footer-right[_ngcontent-%COMP%]   .page-info-footer[_ngcontent-%COMP%] {\n  white-space: nowrap;\n}\n.grid-footer[_ngcontent-%COMP%]   .footer-right[_ngcontent-%COMP%]   .page-nav-footer[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0;\n}\n.grid-footer[_ngcontent-%COMP%]   .footer-right[_ngcontent-%COMP%]   .page-nav-footer[_ngcontent-%COMP%]   .footer-btn[_ngcontent-%COMP%] {\n  width: 26px;\n  height: 26px;\n  line-height: 26px;\n}\n.grid-footer[_ngcontent-%COMP%]   .footer-right[_ngcontent-%COMP%]   .page-nav-footer[_ngcontent-%COMP%]   .footer-btn[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%] {\n  font-size: 18px;\n}\n\n.dark-theme[_nghost-%COMP%]   .grid-footer[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .grid-footer[_ngcontent-%COMP%] {\n  border-top-color: #424242;\n  background: #2c2c2c;\n  color: #9e9e9e;\n}\n\n\n\n.quick-search[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  background: #f5f5f5;\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  padding: 0 6px;\n  height: 28px;\n  gap: 4px;\n}\n.quick-search[_ngcontent-%COMP%]   .search-icon[_ngcontent-%COMP%] {\n  font-size: 16px;\n  width: 16px;\n  height: 16px;\n  color: #9e9e9e;\n}\n.quick-search[_ngcontent-%COMP%]   .search-input[_ngcontent-%COMP%] {\n  border: none;\n  outline: none;\n  background: transparent;\n  font-size: 12px;\n  width: 140px;\n  color: #424242;\n}\n.quick-search[_ngcontent-%COMP%]   .search-input[_ngcontent-%COMP%]::placeholder {\n  color: #bdbdbd;\n}\n.quick-search[_ngcontent-%COMP%]   .search-clear[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  background: none;\n  cursor: pointer;\n  padding: 0;\n  color: #9e9e9e;\n}\n.quick-search[_ngcontent-%COMP%]   .search-clear[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%] {\n  font-size: 14px;\n  width: 14px;\n  height: 14px;\n}\n.quick-search[_ngcontent-%COMP%]   .search-clear[_ngcontent-%COMP%]:hover {\n  color: #616161;\n}\n\n.dark-theme[_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%] {\n  background: #2c2c2c;\n  border-color: #424242;\n}\n.dark-theme[_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-input[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-input[_ngcontent-%COMP%] {\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-input[_ngcontent-%COMP%]::placeholder, .dark-theme   [_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-input[_ngcontent-%COMP%]::placeholder {\n  color: #616161;\n}\n.dark-theme[_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-icon[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-icon[_ngcontent-%COMP%] {\n  color: #757575;\n}\n.dark-theme[_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-clear[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-clear[_ngcontent-%COMP%] {\n  color: #757575;\n}\n.dark-theme[_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-clear[_ngcontent-%COMP%]:hover, .dark-theme   [_nghost-%COMP%]   .quick-search[_ngcontent-%COMP%]   .search-clear[_ngcontent-%COMP%]:hover {\n  color: #bdbdbd;\n}\n\n\n\n.api-call-bar[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  padding: 4px 12px;\n  border-bottom: 1px solid #e0e0e0;\n  background: #f0f4f8;\n  flex-shrink: 0;\n  font-size: 12px;\n  overflow: hidden;\n  gap: 2px;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-call-desc[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #607d8b;\n  line-height: 1.4;\n  padding: 2px 0;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-call-top[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-method[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  font-weight: 700;\n  font-size: 11px;\n  color: white;\n  background: #43a047;\n  padding: 2px 6px;\n  border-radius: 3px;\n  font-family: \"Roboto Mono\", monospace;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-url[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-family: \"Roboto Mono\", monospace;\n  font-size: 12px;\n  color: #37474f;\n  cursor: pointer;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-url[_ngcontent-%COMP%]:hover {\n  color: #1565c0;\n}\n.api-call-bar[_ngcontent-%COMP%]   .copy-btn[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  width: 24px;\n  height: 24px;\n  line-height: 24px;\n}\n.api-call-bar[_ngcontent-%COMP%]   .copy-btn[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%] {\n  font-size: 16px;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%], .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  padding-left: 2px;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .options-label[_ngcontent-%COMP%], .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .options-label[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #9e9e9e;\n  font-weight: 500;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%], .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  font-size: 11px;\n  color: #616161;\n  font-family: \"Roboto Mono\", monospace;\n  cursor: pointer;\n  white-space: nowrap;\n}\n.api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%], .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%] {\n  width: 12px;\n  height: 12px;\n  margin: 0;\n  cursor: pointer;\n  accent-color: #7b1fa2;\n}\n\n.dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%] {\n  background: #1a2332;\n  border-bottom-color: #424242;\n}\n.dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-desc[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-desc[_ngcontent-%COMP%] {\n  color: #78909c;\n}\n.dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-url[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-url[_ngcontent-%COMP%] {\n  color: #b0bec5;\n}\n.dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-url[_ngcontent-%COMP%]:hover, .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-url[_ngcontent-%COMP%]:hover {\n  color: #64b5f6;\n}\n.dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .options-label[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .options-label[_ngcontent-%COMP%], .dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .options-label[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .options-label[_ngcontent-%COMP%] {\n  color: #616161;\n}\n.dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%], .dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%] {\n  color: #9e9e9e;\n}\n.dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-options[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%], .dark-theme[_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .api-call-bar[_ngcontent-%COMP%]   .api-call-related[_ngcontent-%COMP%]   .api-option[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%] {\n  accent-color: #ce93d8;\n}\n\n\n\n.pk-icon[_ngcontent-%COMP%] {\n  font-size: 14px;\n  width: 14px;\n  height: 14px;\n  color: #7b1fa2;\n  margin-right: 2px;\n  vertical-align: middle;\n}\n\n.dark-theme[_nghost-%COMP%]   .pk-icon[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .pk-icon[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n\n\n\n.fk-cell[_ngcontent-%COMP%] {\n  cursor: pointer !important;\n}\n\n.fk-link[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  color: #7b1fa2;\n  text-decoration: none;\n  cursor: pointer;\n  transition: color 0.15s;\n}\n.fk-link[_ngcontent-%COMP%]:hover {\n  color: #4a148c;\n  text-decoration: underline;\n}\n.fk-link[_ngcontent-%COMP%]   .fk-nav-icon[_ngcontent-%COMP%] {\n  font-size: 12px;\n  width: 12px;\n  height: 12px;\n  opacity: 0;\n  transition: opacity 0.15s;\n}\n.fk-link[_ngcontent-%COMP%]:hover   .fk-nav-icon[_ngcontent-%COMP%] {\n  opacity: 0.7;\n}\n\n.dark-theme[_nghost-%COMP%]   .fk-link[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .fk-link[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n.dark-theme[_nghost-%COMP%]   .fk-link[_ngcontent-%COMP%]:hover, .dark-theme   [_nghost-%COMP%]   .fk-link[_ngcontent-%COMP%]:hover {\n  color: #f3e5f5;\n}\n\n\n\n.nav-filter-bar[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 4px 12px;\n  border-bottom: 1px solid #e0e0e0;\n  background: #f3e5f5;\n  flex-shrink: 0;\n  font-size: 12px;\n  color: #4a148c;\n}\n.nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-icon[_ngcontent-%COMP%] {\n  font-size: 16px;\n  width: 16px;\n  height: 16px;\n  color: #7b1fa2;\n}\n.nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-text[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-text[_ngcontent-%COMP%]   code[_ngcontent-%COMP%] {\n  font-family: \"Roboto Mono\", monospace;\n  font-size: 11px;\n  background: rgba(123, 31, 162, 0.1);\n  padding: 1px 4px;\n  border-radius: 3px;\n}\n.nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-clear[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  width: 24px;\n  height: 24px;\n  line-height: 24px;\n  color: #7b1fa2;\n}\n.nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-clear[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%] {\n  font-size: 16px;\n}\n\n.dark-theme[_nghost-%COMP%]   .nav-filter-bar[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .nav-filter-bar[_ngcontent-%COMP%] {\n  background: #2d1b3d;\n  border-bottom-color: #424242;\n  color: #e1bee7;\n}\n.dark-theme[_nghost-%COMP%]   .nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-icon[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-icon[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n.dark-theme[_nghost-%COMP%]   .nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-text[_ngcontent-%COMP%]   code[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-text[_ngcontent-%COMP%]   code[_ngcontent-%COMP%] {\n  background: rgba(206, 147, 216, 0.15);\n}\n.dark-theme[_nghost-%COMP%]   .nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-clear[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .nav-filter-bar[_ngcontent-%COMP%]   .nav-filter-clear[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n\n\n\n.search-no-match[_ngcontent-%COMP%] {\n  display: none !important;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWRhdGEtZXhwbG9yZXIvZGYtZGF0YS1ncmlkLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDTTtFQUNFLGtCQUFBO0VBQ0EsTUFBQTtFQUNBLE9BQUE7RUFDQSxRQUFBO0VBQ0EsU0FBQTtFQUNBLGFBQUE7RUFDQSxzQkFBQTtFQUNBLGdCQUFBO0FBQVI7O0FBR007RUFDRSxPQUFBO0VBQ0EsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsZ0JBQUE7QUFBUjs7QUFHTTtFQUNFLE9BQUE7RUFDQSxZQUFBO0VBQ0EsYUFBQTtFQUNBLHNCQUFBO0VBQ0EsZ0JBQUE7QUFBUjs7QUFHTTtFQUNFLGFBQUE7RUFDQSxtQkFBQTtFQUNBLDhCQUFBO0VBQ0EsZUFBQTtFQUNBLFlBQUE7RUFDQSxzQkFBQTtFQUNBLGdDQUFBO0VBQ0EsbUJBQUE7RUFDQSxjQUFBO0FBQVI7QUFFUTtFQUNFLGFBQUE7RUFDQSxtQkFBQTtFQUNBLFNBQUE7QUFBVjtBQUVVO0VBQ0UsY0FBQTtFQUNBLGVBQUE7QUFBWjtBQUdVO0VBQ0UsZUFBQTtFQUNBLGdCQUFBO0VBQ0EsY0FBQTtBQURaO0FBS1k7RUFDRSxlQUFBO0VBQ0EsaUJBQUE7QUFIZDtBQVFRO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsUUFBQTtBQU5WO0FBUVU7RUFDRSxjQUFBO0FBTlo7QUFTVTtFQUNFLGNBQUE7QUFQWjs7QUFZTTtFQUNFLDRCQUFBO0VBQ0EsbUJBQUE7QUFUUjtBQVdVO0VBQ0UsY0FBQTtBQVRaO0FBV1U7RUFDRSxjQUFBO0FBVFo7QUFhVTtFQUNFLGNBQUE7QUFYWjs7QUFnQk0sMkJBQUE7QUFDQTtFQUNFLGlCQUFBO0VBQ0EsZUFBQTtBQWJSOztBQWdCTSx1QkFBQTtBQUNBO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsOEJBQUE7RUFDQSxpQkFBQTtFQUNBLGdDQUFBO0VBQ0EsbUJBQUE7RUFDQSxjQUFBO0VBQ0EsZUFBQTtFQUNBLGNBQUE7QUFiUjtBQWdCVTtFQUNFLG1CQUFBO0FBZFo7QUFrQlE7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSxRQUFBO0FBaEJWO0FBa0JVO0VBQ0UsZUFBQTtFQUNBLGFBQUE7RUFDQSxtQkFBQTtFQUNBLFFBQUE7QUFoQlo7QUFrQlk7RUFDRSx5QkFBQTtFQUNBLGtCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxlQUFBO0VBQ0EsaUJBQUE7RUFDQSxjQUFBO0VBQ0EsYUFBQTtFQUNBLGVBQUE7QUFoQmQ7QUFvQlU7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSxNQUFBO0FBbEJaO0FBb0JZO0VBQ0UsZUFBQTtFQUNBLGNBQUE7RUFDQSxtQkFBQTtBQWxCZDtBQXFCWTtFQUNFLFdBQUE7RUFDQSxZQUFBO0VBQ0EsaUJBQUE7QUFuQmQ7QUFvQmM7RUFDRSxlQUFBO0FBbEJoQjs7QUF5Qk07RUFDRSw0QkFBQTtFQUNBLG1CQUFBO0VBQ0EsY0FBQTtBQXRCUjtBQXVCUTtFQUNFLDhCQUFBO0VBQ0EsZ0NBQUE7RUFDQSx5QkFBQTtBQXJCVjs7QUF5Qk07OztFQUdFLGFBQUE7RUFDQSxzQkFBQTtFQUNBLG1CQUFBO0VBQ0EsdUJBQUE7RUFDQSxTQUFBO0VBQ0Esa0JBQUE7RUFDQSxjQUFBO0VBQ0EsZUFBQTtFQUNBLE9BQUE7QUF0QlI7O0FBeUJNO0VBQ0UsT0FBQTtFQUNBLGFBQUE7RUFDQSxnQkFBQTtFQUNBLGtCQUFBO0FBdEJSO0FBd0JRO0VBQ0UsV0FBQTtFQUNBLGtCQUFBO0VBQ0EsTUFBQTtFQUNBLE9BQUE7RUFDQSxRQUFBO0VBQ0EsV0FBQTtFQUNBLHFFQUFBO0VBQ0Esa0NBQUE7RUFDQSxXQUFBO0FBdEJWOztBQTBCTTtFQUNFO0lBQ0UsNEJBQUE7RUF2QlI7RUF5Qk07SUFDRSwyQkFBQTtFQXZCUjtBQUNGO0FBMEJNO0VBQ0UsWUFBQTtFQUNBLGdCQUFBO0VBRUEsa0NBQUE7RUF1QkEscUJBQUE7RUFDQSxnQ0FBQTtBQS9DUjtBQXdCUTtFQUNFLFdBQUE7RUFDQSxZQUFBO0FBdEJWO0FBd0JRO0VBQ0UsbUJBQUE7QUF0QlY7QUF3QlE7RUFDRSxtQkFBQTtFQUNBLGtCQUFBO0VBQ0EseUJBQUE7QUF0QlY7QUF1QlU7RUFDRSxtQkFBQTtBQXJCWjtBQXVCVTtFQUNFLGdCQUFBO0FBckJaO0FBd0JRO0VBQ0UsbUJBQUE7QUF0QlY7O0FBNkJNO0VBaUJFLDZCQUFBO0FBMUNSO0FBMEJRO0VBQ0UsbUJBQUE7QUF4QlY7QUEwQlE7RUFDRSxnQkFBQTtFQUNBLHFCQUFBO0FBeEJWO0FBeUJVO0VBQ0UsbUJBQUE7QUF2Qlo7QUF5QlU7RUFDRSxtQkFBQTtBQXZCWjtBQTBCUTtFQUNFLG1CQUFBO0FBeEJWOztBQTZCTTtFQUNFLGtCQUFBO0VBQ0EsZUFBQTtBQTFCUjtBQTRCUTtFQUNFLGtCQUFBO0VBQ0EsVUFBQTtFQUNBLGdCQUFBO0VBQ0EsZUFBQTtFQUNBLHlCQUFBO0VBQ0EscUJBQUE7RUFDQSxjQUFBO0VBQ0EsbUJBQUE7RUFDQSxtQkFBQTtFQUNBLGVBQUE7RUFDQSwrQkFBQTtFQUNBLHNCQUFBO0FBMUJWO0FBNEJVO0VBQ0Usa0JBQUE7RUFDQSxXQUFBO0VBQ0EsTUFBQTtFQUNBLFNBQUE7RUFDQSxXQUFBO0VBQ0Esa0JBQUE7RUFDQSxXQUFBO0FBMUJaO0FBNEJZO0VBQ0UsV0FBQTtFQUNBLGtCQUFBO0VBQ0EsU0FBQTtFQUNBLDJCQUFBO0VBQ0EsUUFBQTtFQUNBLFdBQUE7RUFDQSxVQUFBO0VBQ0Esa0JBQUE7RUFDQSx1QkFBQTtFQUNBLDRCQUFBO0FBMUJkO0FBNEJZO0VBQ0UsbUJBQUE7QUExQmQ7QUE0Qlk7RUFDRSxvQ0FBQTtBQTFCZDtBQStCUTtFQUNFLFVBQUE7RUFDQSxnQkFBQTtFQUNBLG1CQUFBO0VBQ0EsK0JBQUE7RUFDQSxnQkFBQTtFQUNBLHNCQUFBO0FBN0JWO0FBK0JVO0VBQ0UsYUFBQTtFQUNBLFFBQUE7RUFDQSxtQkFBQTtBQTdCWjtBQWdDVTtFQUNFLGNBQUE7RUFDQSx5QkFBQTtFQUNBLGtCQUFBO0VBQ0EsZ0JBQUE7RUFDQSxlQUFBO0VBQ0EsaUJBQUE7RUFDQSxjQUFBO0VBQ0EsYUFBQTtFQUNBLGVBQUE7RUFDQSxlQUFBO0FBOUJaO0FBZ0NZO0VBQ0UscUJBQUE7QUE5QmQ7QUFrQ1U7RUFDRSxPQUFBO0VBQ0EsWUFBQTtFQUNBLHlCQUFBO0VBQ0Esa0JBQUE7RUFDQSxnQkFBQTtFQUNBLGVBQUE7RUFDQSxpQkFBQTtFQUNBLGFBQUE7RUFDQSxzQkFBQTtBQWhDWjtBQWtDWTtFQUNFLHFCQUFBO0FBaENkO0FBbUNZO0VBQ0UsY0FBQTtFQUNBLGtCQUFBO0FBakNkO0FBc0NRO0VBQ0UsVUFBQTtFQUNBLGVBQUE7RUFDQSxlQUFBO0VBQ0EsbUJBQUE7RUFDQSxnQkFBQTtFQUNBLHVCQUFBO0VBQ0EsK0JBQUE7RUFDQSxxQ0FBQTtFQUNBLHNCQUFBO0FBcENWO0FBc0NVO0VBQ0UsY0FBQTtFQUNBLGtCQUFBO0FBcENaO0FBd0NRO0VBQ0Usb0NBQUE7QUF0Q1Y7QUF5Q1E7RUFDRSxZQUFBO0FBdkNWO0FBMENRO0VBQ0UsZUFBQTtBQXhDVjtBQTJDUTtFQUNFLCtDQUFBO0FBekNWO0FBNENRO0VBQ0UsWUFBQTtBQTFDVjtBQTZDUTtFQUNFLFlBQUE7QUEzQ1Y7O0FBZ0RRO0VBQ0UsY0FBQTtFQUNBLG1CQUFBO0VBQ0EsMkJBQUE7QUE3Q1Y7QUErQ1U7RUFDRSxvQ0FBQTtBQTdDWjtBQStDVTtFQUNFLG1CQUFBO0FBN0NaO0FBZ0RRO0VBQ0UsbUJBQUE7RUFDQSwyQkFBQTtBQTlDVjtBQWdEVTtFQUNFLG1CQUFBO0VBQ0EscUJBQUE7RUFDQSxjQUFBO0FBOUNaO0FBK0NZO0VBQ0UscUJBQUE7QUE3Q2Q7QUFpRFU7RUFDRSxtQkFBQTtFQUNBLHFCQUFBO0VBQ0EsY0FBQTtBQS9DWjtBQWdEWTtFQUNFLHFCQUFBO0FBOUNkO0FBZ0RZO0VBQ0UsY0FBQTtBQTlDZDtBQWtEUTtFQUNFLDJCQUFBO0VBQ0EsY0FBQTtBQWhEVjtBQWlEVTtFQUNFLGNBQUE7QUEvQ1o7QUFrRFE7RUFDRSxxQ0FBQTtBQWhEVjtBQWtEUTtFQUNFLGdEQUFBO0FBaERWOztBQW9ETSxzQkFBQTtBQUNBO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsU0FBQTtFQUNBLGlCQUFBO0VBQ0EsNkJBQUE7RUFDQSxtQkFBQTtFQUNBLGNBQUE7RUFDQSxlQUFBO0VBQ0EsY0FBQTtBQWpEUjtBQW1EUTtFQUNFLG1CQUFBO0FBakRWO0FBb0RRO0VBQ0UsaUJBQUE7RUFDQSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSxRQUFBO0FBbERWO0FBb0RVO0VBQ0UsbUJBQUE7QUFsRFo7QUFxRFU7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSxNQUFBO0FBbkRaO0FBcURZO0VBQ0UsV0FBQTtFQUNBLFlBQUE7RUFDQSxpQkFBQTtBQW5EZDtBQW9EYztFQUNFLGVBQUE7QUFsRGhCOztBQXlETTtFQUNFLHlCQUFBO0VBQ0EsbUJBQUE7RUFDQSxjQUFBO0FBdERSOztBQXlETSw0QkFBQTtBQUNBO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsbUJBQUE7RUFDQSx5QkFBQTtFQUNBLGtCQUFBO0VBQ0EsY0FBQTtFQUNBLFlBQUE7RUFDQSxRQUFBO0FBdERSO0FBd0RRO0VBQ0UsZUFBQTtFQUNBLFdBQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTtBQXREVjtBQXlEUTtFQUNFLFlBQUE7RUFDQSxhQUFBO0VBQ0EsdUJBQUE7RUFDQSxlQUFBO0VBQ0EsWUFBQTtFQUNBLGNBQUE7QUF2RFY7QUF3RFU7RUFDRSxjQUFBO0FBdERaO0FBMERRO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsdUJBQUE7RUFDQSxZQUFBO0VBQ0EsZ0JBQUE7RUFDQSxlQUFBO0VBQ0EsVUFBQTtFQUNBLGNBQUE7QUF4RFY7QUF5RFU7RUFDRSxlQUFBO0VBQ0EsV0FBQTtFQUNBLFlBQUE7QUF2RFo7QUF5RFU7RUFDRSxjQUFBO0FBdkRaOztBQTRETTtFQUNFLG1CQUFBO0VBQ0EscUJBQUE7QUF6RFI7QUEwRFE7RUFDRSxjQUFBO0FBeERWO0FBeURVO0VBQ0UsY0FBQTtBQXZEWjtBQTBEUTtFQUNFLGNBQUE7QUF4RFY7QUEwRFE7RUFDRSxjQUFBO0FBeERWO0FBeURVO0VBQ0UsY0FBQTtBQXZEWjs7QUE0RE0saUJBQUE7QUFDQTtFQUNFLGFBQUE7RUFDQSxzQkFBQTtFQUNBLGlCQUFBO0VBQ0EsZ0NBQUE7RUFDQSxtQkFBQTtFQUNBLGNBQUE7RUFDQSxlQUFBO0VBQ0EsZ0JBQUE7RUFDQSxRQUFBO0FBekRSO0FBMkRRO0VBQ0UsZUFBQTtFQUNBLGNBQUE7RUFDQSxnQkFBQTtFQUNBLGNBQUE7QUF6RFY7QUE0RFE7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSxRQUFBO0FBMURWO0FBNkRRO0VBQ0UsY0FBQTtFQUNBLGdCQUFBO0VBQ0EsZUFBQTtFQUNBLFlBQUE7RUFDQSxtQkFBQTtFQUNBLGdCQUFBO0VBQ0Esa0JBQUE7RUFDQSxxQ0FBQTtBQTNEVjtBQThEUTtFQUNFLE9BQUE7RUFDQSxZQUFBO0VBQ0EsZ0JBQUE7RUFDQSx1QkFBQTtFQUNBLG1CQUFBO0VBQ0EscUNBQUE7RUFDQSxlQUFBO0VBQ0EsY0FBQTtFQUNBLGVBQUE7QUE1RFY7QUE2RFU7RUFDRSxjQUFBO0FBM0RaO0FBK0RRO0VBQ0UsY0FBQTtFQUNBLFdBQUE7RUFDQSxZQUFBO0VBQ0EsaUJBQUE7QUE3RFY7QUE4RFU7RUFDRSxlQUFBO0FBNURaO0FBZ0VROztFQUVFLGFBQUE7RUFDQSxlQUFBO0VBQ0EsU0FBQTtFQUNBLGlCQUFBO0FBOURWO0FBZ0VVOztFQUNFLGVBQUE7RUFDQSxjQUFBO0VBQ0EsZ0JBQUE7QUE3RFo7QUFnRVU7O0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsUUFBQTtFQUNBLGVBQUE7RUFDQSxjQUFBO0VBQ0EscUNBQUE7RUFDQSxlQUFBO0VBQ0EsbUJBQUE7QUE3RFo7QUErRFk7O0VBQ0UsV0FBQTtFQUNBLFlBQUE7RUFDQSxTQUFBO0VBQ0EsZUFBQTtFQUNBLHFCQUFBO0FBNURkOztBQWtFTTtFQUNFLG1CQUFBO0VBQ0EsNEJBQUE7QUEvRFI7QUFnRVE7RUFDRSxjQUFBO0FBOURWO0FBZ0VRO0VBQ0UsY0FBQTtBQTlEVjtBQStEVTtFQUNFLGNBQUE7QUE3RFo7QUFrRVU7O0VBQ0UsY0FBQTtBQS9EWjtBQWlFVTs7RUFDRSxjQUFBO0FBOURaO0FBK0RZOztFQUNFLHFCQUFBO0FBNURkOztBQWtFTSxzQkFBQTtBQUNBO0VBQ0UsZUFBQTtFQUNBLFdBQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTtFQUNBLGlCQUFBO0VBQ0Esc0JBQUE7QUEvRFI7O0FBa0VNO0VBQ0UsY0FBQTtBQS9EUjs7QUFrRU0sa0JBQUE7QUFDQTtFQUNFLDBCQUFBO0FBL0RSOztBQWtFTTtFQUNFLG9CQUFBO0VBQ0EsbUJBQUE7RUFDQSxRQUFBO0VBQ0EsY0FBQTtFQUNBLHFCQUFBO0VBQ0EsZUFBQTtFQUNBLHVCQUFBO0FBL0RSO0FBaUVRO0VBQ0UsY0FBQTtFQUNBLDBCQUFBO0FBL0RWO0FBa0VRO0VBQ0UsZUFBQTtFQUNBLFdBQUE7RUFDQSxZQUFBO0VBQ0EsVUFBQTtFQUNBLHlCQUFBO0FBaEVWO0FBbUVRO0VBQ0UsWUFBQTtBQWpFVjs7QUFxRU07RUFDRSxjQUFBO0FBbEVSO0FBbUVRO0VBQ0UsY0FBQTtBQWpFVjs7QUFxRU0sMEJBQUE7QUFDQTtFQUNFLGFBQUE7RUFDQSxtQkFBQTtFQUNBLFFBQUE7RUFDQSxpQkFBQTtFQUNBLGdDQUFBO0VBQ0EsbUJBQUE7RUFDQSxjQUFBO0VBQ0EsZUFBQTtFQUNBLGNBQUE7QUFsRVI7QUFvRVE7RUFDRSxlQUFBO0VBQ0EsV0FBQTtFQUNBLFlBQUE7RUFDQSxjQUFBO0FBbEVWO0FBcUVRO0VBQ0UsT0FBQTtFQUNBLFlBQUE7RUFDQSxnQkFBQTtFQUNBLHVCQUFBO0VBQ0EsbUJBQUE7QUFuRVY7QUFxRVU7RUFDRSxxQ0FBQTtFQUNBLGVBQUE7RUFDQSxtQ0FBQTtFQUNBLGdCQUFBO0VBQ0Esa0JBQUE7QUFuRVo7QUF1RVE7RUFDRSxjQUFBO0VBQ0EsV0FBQTtFQUNBLFlBQUE7RUFDQSxpQkFBQTtFQUNBLGNBQUE7QUFyRVY7QUFzRVU7RUFDRSxlQUFBO0FBcEVaOztBQXlFTTtFQUNFLG1CQUFBO0VBQ0EsNEJBQUE7RUFDQSxjQUFBO0FBdEVSO0FBd0VRO0VBQ0UsY0FBQTtBQXRFVjtBQXdFUTtFQUNFLHFDQUFBO0FBdEVWO0FBd0VRO0VBQ0UsY0FBQTtBQXRFVjs7QUEwRU0sMkJBQUE7QUFDQTtFQUNFLHdCQUFBO0FBdkVSIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgICA6aG9zdCB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICByaWdodDogMDtcbiAgICAgICAgYm90dG9tOiAwO1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgfVxuXG4gICAgICAuZGF0YS1ncmlkLWNvbnRhaW5lciB7XG4gICAgICAgIGZsZXg6IDE7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICB9XG5cbiAgICAgIC5ncmlkLW1haW4ge1xuICAgICAgICBmbGV4OiAxO1xuICAgICAgICBtaW4td2lkdGg6IDA7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICB9XG5cbiAgICAgIC5ncmlkLXRvb2xiYXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgICAgICAgaGVpZ2h0OiA0OXB4O1xuICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UwZTBlMDtcbiAgICAgICAgYmFja2dyb3VuZDogI2ZhZmFmYTtcbiAgICAgICAgZmxleC1zaHJpbms6IDA7XG5cbiAgICAgICAgLnRvb2xiYXItbGVmdCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGdhcDogMTBweDtcblxuICAgICAgICAgIC50b29sYmFyLWljb24ge1xuICAgICAgICAgICAgY29sb3I6ICM3YjFmYTI7XG4gICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLnRhYmxlLXRpdGxlIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTVweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgICAgICBjb2xvcjogIzIxMjEyMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAucmVhZG9ubHktY2hpcCB7XG4gICAgICAgICAgICAubG9jay1pY29uIHtcbiAgICAgICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgICAgICBtYXJnaW4tcmlnaHQ6IDRweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAudG9vbGJhci1yaWdodCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGdhcDogMnB4O1xuXG4gICAgICAgICAgYnV0dG9uLmFjdGl2ZSB7XG4gICAgICAgICAgICBjb2xvcjogIzdiMWZhMjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAuY2xlYXItZmlsdGVycy1idG4ge1xuICAgICAgICAgICAgY29sb3I6ICNlZjZjMDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIDpob3N0LWNvbnRleHQoLmRhcmstdGhlbWUpIC5ncmlkLXRvb2xiYXIge1xuICAgICAgICBib3JkZXItYm90dG9tLWNvbG9yOiAjNDI0MjQyO1xuICAgICAgICBiYWNrZ3JvdW5kOiAjMzAzMDMwO1xuICAgICAgICAudG9vbGJhci1sZWZ0IHtcbiAgICAgICAgICAudG9vbGJhci1pY29uIHtcbiAgICAgICAgICAgIGNvbG9yOiAjY2U5M2Q4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAudGFibGUtdGl0bGUge1xuICAgICAgICAgICAgY29sb3I6ICNlMGUwZTA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC50b29sYmFyLXJpZ2h0IHtcbiAgICAgICAgICBidXR0b24uYWN0aXZlIHtcbiAgICAgICAgICAgIGNvbG9yOiAjY2U5M2Q4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBDb2x1bW4gdmlzaWJpbGl0eSBtZW51ICovXG4gICAgICAuY29sdW1uLW1lbnUtaXRlbSB7XG4gICAgICAgIHBhZGRpbmc6IDRweCAxNnB4O1xuICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICB9XG5cbiAgICAgIC8qIFRvcCBwYWdpbmF0aW9uIGJhciAqL1xuICAgICAgLnRvcC1wYWdpbmF0aW9uIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBwYWRkaW5nOiAycHggMTJweDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMGUwZTA7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmYWZhZmE7XG4gICAgICAgIGZsZXgtc2hyaW5rOiAwO1xuICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgIGNvbG9yOiAjNzU3NTc1O1xuXG4gICAgICAgIC50b3AtcGFnaW5hdGlvbi1sZWZ0IHtcbiAgICAgICAgICAucGFnZS1pbmZvIHtcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLnRvcC1wYWdpbmF0aW9uLXJpZ2h0IHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA4cHg7XG5cbiAgICAgICAgICAucGFnZS1zaXplLWxhYmVsIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAgZ2FwOiA0cHg7XG5cbiAgICAgICAgICAgIC5wYWdlLXNpemUtc2VsZWN0IHtcbiAgICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2UwZTBlMDtcbiAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICAgICAgICBwYWRkaW5nOiAycHggNHB4O1xuICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHdoaXRlO1xuICAgICAgICAgICAgICBjb2xvcjogIzQyNDI0MjtcbiAgICAgICAgICAgICAgb3V0bGluZTogbm9uZTtcbiAgICAgICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC5wYWdlLW5hdiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogMDtcblxuICAgICAgICAgICAgLnBhZ2UtbGFiZWwge1xuICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgIHBhZGRpbmc6IDAgNnB4O1xuICAgICAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBidXR0b24ge1xuICAgICAgICAgICAgICB3aWR0aDogMjhweDtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAyOHB4O1xuICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMjhweDtcbiAgICAgICAgICAgICAgbWF0LWljb24ge1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMThweDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSAudG9wLXBhZ2luYXRpb24ge1xuICAgICAgICBib3JkZXItYm90dG9tLWNvbG9yOiAjNDI0MjQyO1xuICAgICAgICBiYWNrZ3JvdW5kOiAjMzAzMDMwO1xuICAgICAgICBjb2xvcjogIzllOWU5ZTtcbiAgICAgICAgLnBhZ2Utc2l6ZS1zZWxlY3Qge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyYzJjMmMgIWltcG9ydGFudDtcbiAgICAgICAgICBib3JkZXItY29sb3I6ICM0MjQyNDIgIWltcG9ydGFudDtcbiAgICAgICAgICBjb2xvcjogI2UwZTBlMCAhaW1wb3J0YW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC5sb2FkaW5nLXN0YXRlLFxuICAgICAgLmVycm9yLXN0YXRlLFxuICAgICAgLmVtcHR5LXN0YXRlIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgIGdhcDogMTZweDtcbiAgICAgICAgcGFkZGluZzogNDhweCAyNHB4O1xuICAgICAgICBjb2xvcjogIzc1NzU3NTtcbiAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICBmbGV4OiAxO1xuICAgICAgfVxuXG4gICAgICAudGFibGUtd3JhcHBlciB7XG4gICAgICAgIGZsZXg6IDE7XG4gICAgICAgIG1pbi1oZWlnaHQ6IDA7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcblxuICAgICAgICAmLmlzLWxvYWRpbmc6OmFmdGVyIHtcbiAgICAgICAgICBjb250ZW50OiAnJztcbiAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgdG9wOiAwO1xuICAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICAgcmlnaHQ6IDA7XG4gICAgICAgICAgaGVpZ2h0OiAzcHg7XG4gICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDkwZGVnLCB0cmFuc3BhcmVudCwgIzdiMWZhMiwgdHJhbnNwYXJlbnQpO1xuICAgICAgICAgIGFuaW1hdGlvbjogbG9hZGluZy1iYXIgMXMgaW5maW5pdGU7XG4gICAgICAgICAgei1pbmRleDogMTA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgQGtleWZyYW1lcyBsb2FkaW5nLWJhciB7XG4gICAgICAgIDAlIHtcbiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTEwMCUpO1xuICAgICAgICB9XG4gICAgICAgIDEwMCUge1xuICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMDAlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAudGFibGUtc2Nyb2xsIHtcbiAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICBvdmVyZmxvdzogc2Nyb2xsO1xuXG4gICAgICAgIC8qIEZhdCBhbHdheXMtdmlzaWJsZSBzY3JvbGxiYXJzICovXG4gICAgICAgICY6Oi13ZWJraXQtc2Nyb2xsYmFyIHtcbiAgICAgICAgICB3aWR0aDogMTRweDtcbiAgICAgICAgICBoZWlnaHQ6IDE0cHg7XG4gICAgICAgIH1cbiAgICAgICAgJjo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICNlOGU4ZTg7XG4gICAgICAgIH1cbiAgICAgICAgJjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICNhMGEwYTA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogN3B4O1xuICAgICAgICAgIGJvcmRlcjogMnB4IHNvbGlkICNlOGU4ZTg7XG4gICAgICAgICAgJjpob3ZlciB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjODA4MDgwO1xuICAgICAgICAgIH1cbiAgICAgICAgICAmOmFjdGl2ZSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjNjY2O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAmOjotd2Via2l0LXNjcm9sbGJhci1jb3JuZXIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICNlOGU4ZTg7XG4gICAgICAgIH1cblxuICAgICAgICBzY3JvbGxiYXItd2lkdGg6IGF1dG87XG4gICAgICAgIHNjcm9sbGJhci1jb2xvcjogI2EwYTBhMCAjZThlOGU4O1xuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSAudGFibGUtc2Nyb2xsIHtcbiAgICAgICAgJjo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICMyNTI1MjU7XG4gICAgICAgIH1cbiAgICAgICAgJjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICM1NTU7XG4gICAgICAgICAgYm9yZGVyLWNvbG9yOiAjMjUyNTI1O1xuICAgICAgICAgICY6aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzZhNmE2YTtcbiAgICAgICAgICB9XG4gICAgICAgICAgJjphY3RpdmUge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzdhN2E3YTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgJjo6LXdlYmtpdC1zY3JvbGxiYXItY29ybmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMjUyNTI1O1xuICAgICAgICB9XG4gICAgICAgIHNjcm9sbGJhci1jb2xvcjogIzU1NSAjMjUyNTI1O1xuICAgICAgfVxuXG4gICAgICAuZGF0YS10YWJsZSB7XG4gICAgICAgIHdpZHRoOiBtYXgtY29udGVudDtcbiAgICAgICAgbWluLXdpZHRoOiAxMDAlO1xuXG4gICAgICAgIC5oZWFkZXItY2VsbCB7XG4gICAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICAgIGZsZXg6IG5vbmU7XG4gICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICBsZXR0ZXItc3BhY2luZzogMC41cHg7XG4gICAgICAgICAgY29sb3I6ICM2MTYxNjE7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y1ZjVmNTtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgIHBhZGRpbmc6IDAgMTZweDtcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjZTBlMGUwO1xuICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG5cbiAgICAgICAgICAucmVzaXplLWhhbmRsZSB7XG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICByaWdodDogLTdweDtcbiAgICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICAgIGJvdHRvbTogMDtcbiAgICAgICAgICAgIHdpZHRoOiAxM3B4O1xuICAgICAgICAgICAgY3Vyc29yOiBjb2wtcmVzaXplO1xuICAgICAgICAgICAgei1pbmRleDogMTA7XG4gICAgICAgICAgICAvLyBUaGluIHZpc2libGUgbGluZSBjZW50ZXJlZCBvbiBjb2x1bW4gYm9yZGVyXG4gICAgICAgICAgICAmOjphZnRlciB7XG4gICAgICAgICAgICAgIGNvbnRlbnQ6ICcnO1xuICAgICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGxlZnQ6IDUwJTtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpO1xuICAgICAgICAgICAgICB0b3A6IDIwJTtcbiAgICAgICAgICAgICAgYm90dG9tOiAyMCU7XG4gICAgICAgICAgICAgIHdpZHRoOiAycHg7XG4gICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDFweDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4xNXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAmOmhvdmVyOjphZnRlciB7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6ICM3YjFmYTI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAmOmhvdmVyIHtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgxMjMsIDMxLCAxNjIsIDAuMDgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC5maWx0ZXItY2VsbCB7XG4gICAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgICBwYWRkaW5nOiA0cHggOHB4O1xuICAgICAgICAgIGJhY2tncm91bmQ6ICNmNWY1ZjU7XG4gICAgICAgICAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgI2UwZTBlMDtcbiAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG5cbiAgICAgICAgICAuZmlsdGVyLWdyb3VwIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBnYXA6IDRweDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLmZpbHRlci1vcCB7XG4gICAgICAgICAgICBmbGV4LXNocmluazogMDtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNlMGUwZTA7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAzcHggNHB4O1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgICAgYmFja2dyb3VuZDogd2hpdGU7XG4gICAgICAgICAgICBjb2xvcjogIzQyNDI0MjtcbiAgICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICBtYXgtd2lkdGg6IDkwcHg7XG5cbiAgICAgICAgICAgICY6Zm9jdXMge1xuICAgICAgICAgICAgICBib3JkZXItY29sb3I6ICM3YjFmYTI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLmZpbHRlci1pbnB1dCB7XG4gICAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgICAgbWluLXdpZHRoOiAwO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2UwZTBlMDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDRweCA4cHg7XG4gICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuXG4gICAgICAgICAgICAmOmZvY3VzIHtcbiAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiAjN2IxZmEyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAmOjpwbGFjZWhvbGRlciB7XG4gICAgICAgICAgICAgIGNvbG9yOiAjYmRiZGJkO1xuICAgICAgICAgICAgICBmb250LXN0eWxlOiBpdGFsaWM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLmRhdGEtY2VsbCB7XG4gICAgICAgICAgZmxleDogbm9uZTtcbiAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgcGFkZGluZzogMCAxNnB4O1xuICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICAgICAgICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCAjZjBmMGYwO1xuICAgICAgICAgIGZvbnQtZmFtaWx5OiAnUm9ib3RvIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcblxuICAgICAgICAgICYubnVsbC1jZWxsIHtcbiAgICAgICAgICAgIGNvbG9yOiAjYmRiZGJkO1xuICAgICAgICAgICAgZm9udC1zdHlsZTogaXRhbGljO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyLm1hdC1tZGMtcm93OmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDEyMywgMzEsIDE2MiwgMC4wNCk7XG4gICAgICAgIH1cblxuICAgICAgICB0ci5tYXQtbWRjLXJvdyB7XG4gICAgICAgICAgaGVpZ2h0OiAzNnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgdHIuY2xpY2thYmxlLXJvdyB7XG4gICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgdHIuc2VsZWN0ZWQtcm93IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDEyMywgMzEsIDE2MiwgMC4wOCkgIWltcG9ydGFudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyLm1hdC1tZGMtaGVhZGVyLXJvdyB7XG4gICAgICAgICAgaGVpZ2h0OiA0MHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgdHIuZmlsdGVyLXJvdyB7XG4gICAgICAgICAgaGVpZ2h0OiAzNnB4O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIDpob3N0LWNvbnRleHQoLmRhcmstdGhlbWUpIC5kYXRhLXRhYmxlIHtcbiAgICAgICAgLmhlYWRlci1jZWxsIHtcbiAgICAgICAgICBjb2xvcjogI2JkYmRiZDtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMzgzODM4O1xuICAgICAgICAgIGJvcmRlci1yaWdodC1jb2xvcjogIzQyNDI0MjtcblxuICAgICAgICAgIC5yZXNpemUtaGFuZGxlOmhvdmVyIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjA2LCAxNDcsIDIxNiwgMC4xKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLnJlc2l6ZS1oYW5kbGU6aG92ZXI6OmFmdGVyIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICNjZTkzZDg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC5maWx0ZXItY2VsbCB7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzM4MzgzODtcbiAgICAgICAgICBib3JkZXItcmlnaHQtY29sb3I6ICM0MjQyNDI7XG5cbiAgICAgICAgICAuZmlsdGVyLW9wIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICMyYzJjMmM7XG4gICAgICAgICAgICBib3JkZXItY29sb3I6ICM0MjQyNDI7XG4gICAgICAgICAgICBjb2xvcjogI2UwZTBlMDtcbiAgICAgICAgICAgICY6Zm9jdXMge1xuICAgICAgICAgICAgICBib3JkZXItY29sb3I6ICNjZTkzZDg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLmZpbHRlci1pbnB1dCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMmMyYzJjO1xuICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiAjNDI0MjQyO1xuICAgICAgICAgICAgY29sb3I6ICNlMGUwZTA7XG4gICAgICAgICAgICAmOmZvY3VzIHtcbiAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiAjY2U5M2Q4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJjo6cGxhY2Vob2xkZXIge1xuICAgICAgICAgICAgICBjb2xvcjogIzYxNjE2MTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLmRhdGEtY2VsbCB7XG4gICAgICAgICAgYm9yZGVyLXJpZ2h0LWNvbG9yOiAjMzgzODM4O1xuICAgICAgICAgIGNvbG9yOiAjZTBlMGUwO1xuICAgICAgICAgICYubnVsbC1jZWxsIHtcbiAgICAgICAgICAgIGNvbG9yOiAjNjE2MTYxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0ci5tYXQtbWRjLXJvdzpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyMDYsIDE0NywgMjE2LCAwLjA2KTtcbiAgICAgICAgfVxuICAgICAgICB0ci5zZWxlY3RlZC1yb3cge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjA2LCAxNDcsIDIxNiwgMC4xMikgIWltcG9ydGFudDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBGb290ZXIgc3RhdHVzIGJhciAqL1xuICAgICAgLmdyaWQtZm9vdGVyIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZ2FwOiAxNnB4O1xuICAgICAgICBwYWRkaW5nOiA0cHggMTJweDtcbiAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlMGUwZTA7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmNWY1ZjU7XG4gICAgICAgIGZsZXgtc2hyaW5rOiAwO1xuICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgIGNvbG9yOiAjNzU3NTc1O1xuXG4gICAgICAgIC5mb290ZXItaW5mbyB7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5mb290ZXItcmlnaHQge1xuICAgICAgICAgIG1hcmdpbi1sZWZ0OiBhdXRvO1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDhweDtcblxuICAgICAgICAgIC5wYWdlLWluZm8tZm9vdGVyIHtcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLnBhZ2UtbmF2LWZvb3RlciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogMDtcblxuICAgICAgICAgICAgLmZvb3Rlci1idG4ge1xuICAgICAgICAgICAgICB3aWR0aDogMjZweDtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAyNnB4O1xuICAgICAgICAgICAgICBsaW5lLWhlaWdodDogMjZweDtcbiAgICAgICAgICAgICAgbWF0LWljb24ge1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMThweDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSAuZ3JpZC1mb290ZXIge1xuICAgICAgICBib3JkZXItdG9wLWNvbG9yOiAjNDI0MjQyO1xuICAgICAgICBiYWNrZ3JvdW5kOiAjMmMyYzJjO1xuICAgICAgICBjb2xvcjogIzllOWU5ZTtcbiAgICAgIH1cblxuICAgICAgLyogUXVpY2sgc2VhcmNoIGluIHRvb2xiYXIgKi9cbiAgICAgIC5xdWljay1zZWFyY2gge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBiYWNrZ3JvdW5kOiAjZjVmNWY1O1xuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZTBlMGUwO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgIHBhZGRpbmc6IDAgNnB4O1xuICAgICAgICBoZWlnaHQ6IDI4cHg7XG4gICAgICAgIGdhcDogNHB4O1xuXG4gICAgICAgIC5zZWFyY2gtaWNvbiB7XG4gICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgICAgICAgIHdpZHRoOiAxNnB4O1xuICAgICAgICAgIGhlaWdodDogMTZweDtcbiAgICAgICAgICBjb2xvcjogIzllOWU5ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zZWFyY2gtaW5wdXQge1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBvdXRsaW5lOiBub25lO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICB3aWR0aDogMTQwcHg7XG4gICAgICAgICAgY29sb3I6ICM0MjQyNDI7XG4gICAgICAgICAgJjo6cGxhY2Vob2xkZXIge1xuICAgICAgICAgICAgY29sb3I6ICNiZGJkYmQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLnNlYXJjaC1jbGVhciB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgIGNvbG9yOiAjOWU5ZTllO1xuICAgICAgICAgIG1hdC1pY29uIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICAgIHdpZHRoOiAxNHB4O1xuICAgICAgICAgICAgaGVpZ2h0OiAxNHB4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAmOmhvdmVyIHtcbiAgICAgICAgICAgIGNvbG9yOiAjNjE2MTYxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSAucXVpY2stc2VhcmNoIHtcbiAgICAgICAgYmFja2dyb3VuZDogIzJjMmMyYztcbiAgICAgICAgYm9yZGVyLWNvbG9yOiAjNDI0MjQyO1xuICAgICAgICAuc2VhcmNoLWlucHV0IHtcbiAgICAgICAgICBjb2xvcjogI2UwZTBlMDtcbiAgICAgICAgICAmOjpwbGFjZWhvbGRlciB7XG4gICAgICAgICAgICBjb2xvcjogIzYxNjE2MTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLnNlYXJjaC1pY29uIHtcbiAgICAgICAgICBjb2xvcjogIzc1NzU3NTtcbiAgICAgICAgfVxuICAgICAgICAuc2VhcmNoLWNsZWFyIHtcbiAgICAgICAgICBjb2xvcjogIzc1NzU3NTtcbiAgICAgICAgICAmOmhvdmVyIHtcbiAgICAgICAgICAgIGNvbG9yOiAjYmRiZGJkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBBUEkgY2FsbCBiYXIgKi9cbiAgICAgIC5hcGktY2FsbC1iYXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBwYWRkaW5nOiA0cHggMTJweDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMGUwZTA7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmMGY0Zjg7XG4gICAgICAgIGZsZXgtc2hyaW5rOiAwO1xuICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgIGdhcDogMnB4O1xuXG4gICAgICAgIC5hcGktY2FsbC1kZXNjIHtcbiAgICAgICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICAgICAgY29sb3I6ICM2MDdkOGI7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuNDtcbiAgICAgICAgICBwYWRkaW5nOiAycHggMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5hcGktY2FsbC10b3Age1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICBnYXA6IDhweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5hcGktbWV0aG9kIHtcbiAgICAgICAgICBmbGV4LXNocmluazogMDtcbiAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgICAgYmFja2dyb3VuZDogIzQzYTA0NztcbiAgICAgICAgICBwYWRkaW5nOiAycHggNnB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICBmb250LWZhbWlseTogJ1JvYm90byBNb25vJywgbW9ub3NwYWNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLmFwaS11cmwge1xuICAgICAgICAgIGZsZXg6IDE7XG4gICAgICAgICAgbWluLXdpZHRoOiAwO1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICBmb250LWZhbWlseTogJ1JvYm90byBNb25vJywgbW9ub3NwYWNlO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICBjb2xvcjogIzM3NDc0ZjtcbiAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgJjpob3ZlciB7XG4gICAgICAgICAgICBjb2xvcjogIzE1NjVjMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAuY29weS1idG4ge1xuICAgICAgICAgIGZsZXgtc2hyaW5rOiAwO1xuICAgICAgICAgIHdpZHRoOiAyNHB4O1xuICAgICAgICAgIGhlaWdodDogMjRweDtcbiAgICAgICAgICBsaW5lLWhlaWdodDogMjRweDtcbiAgICAgICAgICBtYXQtaWNvbiB7XG4gICAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLmFwaS1jYWxsLW9wdGlvbnMsXG4gICAgICAgIC5hcGktY2FsbC1yZWxhdGVkIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtd3JhcDogd3JhcDtcbiAgICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgICAgcGFkZGluZy1sZWZ0OiAycHg7XG5cbiAgICAgICAgICAub3B0aW9ucy1sYWJlbCB7XG4gICAgICAgICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICAgICAgICBjb2xvcjogIzllOWU5ZTtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLmFwaS1vcHRpb24ge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBnYXA6IDRweDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICAgIGNvbG9yOiAjNjE2MTYxO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdSb2JvdG8gTW9ubycsIG1vbm9zcGFjZTtcbiAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG5cbiAgICAgICAgICAgIGlucHV0W3R5cGU9J2NoZWNrYm94J10ge1xuICAgICAgICAgICAgICB3aWR0aDogMTJweDtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxMnB4O1xuICAgICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgICAgYWNjZW50LWNvbG9yOiAjN2IxZmEyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSAuYXBpLWNhbGwtYmFyIHtcbiAgICAgICAgYmFja2dyb3VuZDogIzFhMjMzMjtcbiAgICAgICAgYm9yZGVyLWJvdHRvbS1jb2xvcjogIzQyNDI0MjtcbiAgICAgICAgLmFwaS1jYWxsLWRlc2Mge1xuICAgICAgICAgIGNvbG9yOiAjNzg5MDljO1xuICAgICAgICB9XG4gICAgICAgIC5hcGktdXJsIHtcbiAgICAgICAgICBjb2xvcjogI2IwYmVjNTtcbiAgICAgICAgICAmOmhvdmVyIHtcbiAgICAgICAgICAgIGNvbG9yOiAjNjRiNWY2O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAuYXBpLWNhbGwtb3B0aW9ucyxcbiAgICAgICAgLmFwaS1jYWxsLXJlbGF0ZWQge1xuICAgICAgICAgIC5vcHRpb25zLWxhYmVsIHtcbiAgICAgICAgICAgIGNvbG9yOiAjNjE2MTYxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuYXBpLW9wdGlvbiB7XG4gICAgICAgICAgICBjb2xvcjogIzllOWU5ZTtcbiAgICAgICAgICAgIGlucHV0W3R5cGU9J2NoZWNrYm94J10ge1xuICAgICAgICAgICAgICBhY2NlbnQtY29sb3I6ICNjZTkzZDg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qIFBLIGljb24gaW4gaGVhZGVyICovXG4gICAgICAucGstaWNvbiB7XG4gICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgd2lkdGg6IDE0cHg7XG4gICAgICAgIGhlaWdodDogMTRweDtcbiAgICAgICAgY29sb3I6ICM3YjFmYTI7XG4gICAgICAgIG1hcmdpbi1yaWdodDogMnB4O1xuICAgICAgICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSAucGstaWNvbiB7XG4gICAgICAgIGNvbG9yOiAjY2U5M2Q4O1xuICAgICAgfVxuXG4gICAgICAvKiBGSyBsaW5rIGNlbGxzICovXG4gICAgICAuZmstY2VsbCB7XG4gICAgICAgIGN1cnNvcjogcG9pbnRlciAhaW1wb3J0YW50O1xuICAgICAgfVxuXG4gICAgICAuZmstbGluayB7XG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBnYXA6IDNweDtcbiAgICAgICAgY29sb3I6ICM3YjFmYTI7XG4gICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB0cmFuc2l0aW9uOiBjb2xvciAwLjE1cztcblxuICAgICAgICAmOmhvdmVyIHtcbiAgICAgICAgICBjb2xvcjogIzRhMTQ4YztcbiAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5may1uYXYtaWNvbiB7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgIHdpZHRoOiAxMnB4O1xuICAgICAgICAgIGhlaWdodDogMTJweDtcbiAgICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC4xNXM7XG4gICAgICAgIH1cblxuICAgICAgICAmOmhvdmVyIC5may1uYXYtaWNvbiB7XG4gICAgICAgICAgb3BhY2l0eTogMC43O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIDpob3N0LWNvbnRleHQoLmRhcmstdGhlbWUpIC5may1saW5rIHtcbiAgICAgICAgY29sb3I6ICNjZTkzZDg7XG4gICAgICAgICY6aG92ZXIge1xuICAgICAgICAgIGNvbG9yOiAjZjNlNWY1O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qIE5hdmlnYXRpb24gZmlsdGVyIGJhciAqL1xuICAgICAgLm5hdi1maWx0ZXItYmFyIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgIHBhZGRpbmc6IDRweCAxMnB4O1xuICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2UwZTBlMDtcbiAgICAgICAgYmFja2dyb3VuZDogI2YzZTVmNTtcbiAgICAgICAgZmxleC1zaHJpbms6IDA7XG4gICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgY29sb3I6ICM0YTE0OGM7XG5cbiAgICAgICAgLm5hdi1maWx0ZXItaWNvbiB7XG4gICAgICAgICAgZm9udC1zaXplOiAxNnB4O1xuICAgICAgICAgIHdpZHRoOiAxNnB4O1xuICAgICAgICAgIGhlaWdodDogMTZweDtcbiAgICAgICAgICBjb2xvcjogIzdiMWZhMjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5uYXYtZmlsdGVyLXRleHQge1xuICAgICAgICAgIGZsZXg6IDE7XG4gICAgICAgICAgbWluLXdpZHRoOiAwO1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcblxuICAgICAgICAgIGNvZGUge1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdSb2JvdG8gTW9ubycsIG1vbm9zcGFjZTtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMTIzLCAzMSwgMTYyLCAwLjEpO1xuICAgICAgICAgICAgcGFkZGluZzogMXB4IDRweDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAubmF2LWZpbHRlci1jbGVhciB7XG4gICAgICAgICAgZmxleC1zaHJpbms6IDA7XG4gICAgICAgICAgd2lkdGg6IDI0cHg7XG4gICAgICAgICAgaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgIGxpbmUtaGVpZ2h0OiAyNHB4O1xuICAgICAgICAgIGNvbG9yOiAjN2IxZmEyO1xuICAgICAgICAgIG1hdC1pY29uIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgOmhvc3QtY29udGV4dCguZGFyay10aGVtZSkgLm5hdi1maWx0ZXItYmFyIHtcbiAgICAgICAgYmFja2dyb3VuZDogIzJkMWIzZDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbS1jb2xvcjogIzQyNDI0MjtcbiAgICAgICAgY29sb3I6ICNlMWJlZTc7XG5cbiAgICAgICAgLm5hdi1maWx0ZXItaWNvbiB7XG4gICAgICAgICAgY29sb3I6ICNjZTkzZDg7XG4gICAgICAgIH1cbiAgICAgICAgLm5hdi1maWx0ZXItdGV4dCBjb2RlIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDIwNiwgMTQ3LCAyMTYsIDAuMTUpO1xuICAgICAgICB9XG4gICAgICAgIC5uYXYtZmlsdGVyLWNsZWFyIHtcbiAgICAgICAgICBjb2xvcjogI2NlOTNkODtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBRdWljayBzZWFyY2ggaGlnaGxpZ2h0ICovXG4gICAgICAuc2VhcmNoLW5vLW1hdGNoIHtcbiAgICAgICAgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgfVxuICAgICJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
}

/***/ }),

/***/ 45211:
/*!***************************************************************!*\
  !*** ./src/app/adf-data-explorer/df-db-selector.component.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfDbSelectorComponent: () => (/* binding */ DfDbSelectorComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_list__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/material/list */ 20943);
/* harmony import */ var _angular_material_icon__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/material/icon */ 93840);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/material/progress-spinner */ 41134);
/* harmony import */ var _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/tooltip */ 80640);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);


















function DfDbSelectorComponent_div_0_div_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "mat-spinner", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.loading"));
  }
}
function DfDbSelectorComponent_div_0_div_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 11)(1, "mat-icon", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "error_outline");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "button", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfDbSelectorComponent_div_0_div_7_Template_button_click_5_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r8);
      const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r7.retry.emit());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](ctx_r3.error);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", t_r1("dataExplorer.retry"), " ");
  }
}
function DfDbSelectorComponent_div_0_div_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 14)(1, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "info_outline");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "small");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.noDatabases"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.noDatabasesHint"));
  }
}
function DfDbSelectorComponent_div_0_mat_nav_list_9_a_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r14 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "a", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfDbSelectorComponent_div_0_mat_nav_list_9_a_1_Template_a_click_0_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r14);
      const db_r12 = restoredCtx.$implicit;
      const ctx_r13 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r13.databaseSelected.emit(db_r12));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "fa-icon", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "div", 19)(3, "span", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "span", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](7, "mat-icon", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](8, "chevron_right");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const db_r12 = ctx.$implicit;
    const ctx_r11 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matTooltip", db_r12.description || db_r12.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r11.faDatabase);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](db_r12.label || db_r12.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](db_r12.type);
  }
}
function DfDbSelectorComponent_div_0_mat_nav_list_9_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-nav-list", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, DfDbSelectorComponent_div_0_mat_nav_list_9_a_1_Template, 9, 4, "a", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx_r5.databases);
  }
}
function DfDbSelectorComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 1)(1, "div", 2)(2, "mat-icon", 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3, "storage");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "span", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](6, DfDbSelectorComponent_div_0_div_6_Template, 4, 1, "div", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](7, DfDbSelectorComponent_div_0_div_7_Template, 7, 2, "div", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](8, DfDbSelectorComponent_div_0_div_8_Template, 7, 2, "div", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](9, DfDbSelectorComponent_div_0_mat_nav_list_9_Template, 2, 1, "mat-nav-list", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r1 = ctx.$implicit;
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.database"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r0.loading);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r0.error && !ctx_r0.loading);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx_r0.loading && !ctx_r0.error && ctx_r0.databases.length === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx_r0.loading && !ctx_r0.error && ctx_r0.databases.length > 0);
  }
}
class DfDbSelectorComponent {
  constructor() {
    this.databases = [];
    this.loading = false;
    this.error = null;
    this.databaseSelected = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this.retry = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this.faDatabase = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faDatabase;
  }
  static {
    this.ɵfac = function DfDbSelectorComponent_Factory(t) {
      return new (t || DfDbSelectorComponent)();
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DfDbSelectorComponent,
      selectors: [["df-db-selector"]],
      inputs: {
        databases: "databases",
        loading: "loading",
        error: "error"
      },
      outputs: {
        databaseSelected: "databaseSelected",
        retry: "retry"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      decls: 1,
      vars: 1,
      consts: [["class", "db-selector", 4, "transloco", "translocoScope"], [1, "db-selector"], [1, "panel-header"], [1, "header-icon"], [1, "header-title"], ["class", "loading-state", 4, "ngIf"], ["class", "error-state", 4, "ngIf"], ["class", "empty-state", 4, "ngIf"], ["class", "db-list", 4, "ngIf"], [1, "loading-state"], ["diameter", "32"], [1, "error-state"], ["color", "warn"], ["mat-stroked-button", "", "color", "primary", 3, "click"], [1, "empty-state"], [1, "db-list"], ["mat-list-item", "", "matTooltipPosition", "right", "class", "db-item", 3, "matTooltip", "click", 4, "ngFor", "ngForOf"], ["mat-list-item", "", "matTooltipPosition", "right", 1, "db-item", 3, "matTooltip", "click"], [1, "db-icon", 3, "icon"], [1, "db-info"], [1, "db-name"], [1, "db-type"], [1, "chevron"]],
      template: function DfDbSelectorComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](0, DfDbSelectorComponent_div_0_Template, 10, 5, "div", 0);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("translocoScope", "dataExplorer");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_2__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_2__.NgFor, _angular_material_list__WEBPACK_IMPORTED_MODULE_3__.MatListModule, _angular_material_list__WEBPACK_IMPORTED_MODULE_3__.MatNavList, _angular_material_list__WEBPACK_IMPORTED_MODULE_3__.MatListItem, _angular_material_icon__WEBPACK_IMPORTED_MODULE_4__.MatIconModule, _angular_material_icon__WEBPACK_IMPORTED_MODULE_4__.MatIcon, _angular_material_button__WEBPACK_IMPORTED_MODULE_5__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_5__.MatButton, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_6__.MatProgressSpinnerModule, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_6__.MatProgressSpinner, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_7__.MatTooltipModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_7__.MatTooltip, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_8__.TranslocoModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_8__.TranslocoDirective, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_9__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_9__.FaIconComponent],
      styles: [".db-selector[_ngcontent-%COMP%] {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 0 16px;\n  height: 49px;\n  box-sizing: border-box;\n  border-bottom: 1px solid #e0e0e0;\n  font-weight: 500;\n  font-size: 14px;\n  color: #424242;\n}\n.panel-header[_ngcontent-%COMP%]   .header-icon[_ngcontent-%COMP%] {\n  font-size: 20px;\n  width: 20px;\n  height: 20px;\n  color: #7b1fa2;\n}\n\n.dark-theme[_nghost-%COMP%]   .panel-header[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .panel-header[_ngcontent-%COMP%] {\n  border-bottom-color: #424242;\n  color: #e0e0e0;\n}\n\n.loading-state[_ngcontent-%COMP%], .error-state[_ngcontent-%COMP%], .empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 12px;\n  padding: 32px 16px;\n  text-align: center;\n  color: #757575;\n  font-size: 13px;\n}\n\n.dark-theme[_nghost-%COMP%]   .loading-state[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .loading-state[_ngcontent-%COMP%], .dark-theme[_nghost-%COMP%]   .error-state[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .error-state[_ngcontent-%COMP%], .dark-theme[_nghost-%COMP%]   .empty-state[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .empty-state[_ngcontent-%COMP%] {\n  color: #bdbdbd;\n}\n\n.db-list[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  padding-top: 4px;\n}\n\n.db-item[_ngcontent-%COMP%] {\n  height: 56px !important;\n  padding: 0 16px !important;\n  cursor: pointer;\n}\n.db-item[_ngcontent-%COMP%]     .mdc-list-item__primary-text {\n  display: flex !important;\n  align-items: center;\n  gap: 12px;\n  width: 100%;\n}\n.db-item[_ngcontent-%COMP%]   .db-icon[_ngcontent-%COMP%] {\n  color: #7b1fa2;\n  font-size: 16px;\n  flex-shrink: 0;\n  pointer-events: none;\n}\n.db-item[_ngcontent-%COMP%]   .db-info[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  pointer-events: none;\n}\n.db-item[_ngcontent-%COMP%]   .db-info[_ngcontent-%COMP%]   .db-name[_ngcontent-%COMP%] {\n  font-size: 14px;\n  font-weight: 500;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.db-item[_ngcontent-%COMP%]   .db-info[_ngcontent-%COMP%]   .db-type[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #9e9e9e;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.db-item[_ngcontent-%COMP%]   .chevron[_ngcontent-%COMP%] {\n  color: #bdbdbd;\n  flex-shrink: 0;\n  pointer-events: none;\n}\n\n.dark-theme[_nghost-%COMP%]   .db-item[_ngcontent-%COMP%]   .db-icon[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .db-item[_ngcontent-%COMP%]   .db-icon[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n.dark-theme[_nghost-%COMP%]   .db-item[_ngcontent-%COMP%]   .db-info[_ngcontent-%COMP%]   .db-type[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .db-item[_ngcontent-%COMP%]   .db-info[_ngcontent-%COMP%]   .db-type[_ngcontent-%COMP%] {\n  color: #757575;\n}\n.dark-theme[_nghost-%COMP%]   .db-item[_ngcontent-%COMP%]   .chevron[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .db-item[_ngcontent-%COMP%]   .chevron[_ngcontent-%COMP%] {\n  color: #616161;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWRhdGEtZXhwbG9yZXIvZGYtZGItc2VsZWN0b3IuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNNO0VBQ0UsWUFBQTtFQUNBLGFBQUE7RUFDQSxzQkFBQTtBQUFSOztBQUdNO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsUUFBQTtFQUNBLGVBQUE7RUFDQSxZQUFBO0VBQ0Esc0JBQUE7RUFDQSxnQ0FBQTtFQUNBLGdCQUFBO0VBQ0EsZUFBQTtFQUNBLGNBQUE7QUFBUjtBQUVRO0VBQ0UsZUFBQTtFQUNBLFdBQUE7RUFDQSxZQUFBO0VBQ0EsY0FBQTtBQUFWOztBQUlNO0VBQ0UsNEJBQUE7RUFDQSxjQUFBO0FBRFI7O0FBSU07OztFQUdFLGFBQUE7RUFDQSxzQkFBQTtFQUNBLG1CQUFBO0VBQ0EsU0FBQTtFQUNBLGtCQUFBO0VBQ0Esa0JBQUE7RUFDQSxjQUFBO0VBQ0EsZUFBQTtBQURSOztBQUlNOzs7RUFHRSxjQUFBO0FBRFI7O0FBSU07RUFDRSxPQUFBO0VBQ0EsZ0JBQUE7RUFDQSxnQkFBQTtBQURSOztBQUlNO0VBQ0UsdUJBQUE7RUFDQSwwQkFBQTtFQUNBLGVBQUE7QUFEUjtBQUdRO0VBQ0Usd0JBQUE7RUFDQSxtQkFBQTtFQUNBLFNBQUE7RUFDQSxXQUFBO0FBRFY7QUFJUTtFQUNFLGNBQUE7RUFDQSxlQUFBO0VBQ0EsY0FBQTtFQUNBLG9CQUFBO0FBRlY7QUFLUTtFQUNFLE9BQUE7RUFDQSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSxZQUFBO0VBQ0Esb0JBQUE7QUFIVjtBQUtVO0VBQ0UsZUFBQTtFQUNBLGdCQUFBO0VBQ0EsbUJBQUE7RUFDQSxnQkFBQTtFQUNBLHVCQUFBO0FBSFo7QUFNVTtFQUNFLGVBQUE7RUFDQSxjQUFBO0VBQ0EsbUJBQUE7RUFDQSxnQkFBQTtFQUNBLHVCQUFBO0FBSlo7QUFRUTtFQUNFLGNBQUE7RUFDQSxjQUFBO0VBQ0Esb0JBQUE7QUFOVjs7QUFXUTtFQUNFLGNBQUE7QUFSVjtBQVVRO0VBQ0UsY0FBQTtBQVJWO0FBVVE7RUFDRSxjQUFBO0FBUlYiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAgIC5kYi1zZWxlY3RvciB7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgIH1cblxuICAgICAgLnBhbmVsLWhlYWRlciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGdhcDogOHB4O1xuICAgICAgICBwYWRkaW5nOiAwIDE2cHg7XG4gICAgICAgIGhlaWdodDogNDlweDtcbiAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMGUwZTA7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgY29sb3I6ICM0MjQyNDI7XG5cbiAgICAgICAgLmhlYWRlci1pY29uIHtcbiAgICAgICAgICBmb250LXNpemU6IDIwcHg7XG4gICAgICAgICAgd2lkdGg6IDIwcHg7XG4gICAgICAgICAgaGVpZ2h0OiAyMHB4O1xuICAgICAgICAgIGNvbG9yOiAjN2IxZmEyO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIDpob3N0LWNvbnRleHQoLmRhcmstdGhlbWUpIC5wYW5lbC1oZWFkZXIge1xuICAgICAgICBib3JkZXItYm90dG9tLWNvbG9yOiAjNDI0MjQyO1xuICAgICAgICBjb2xvcjogI2UwZTBlMDtcbiAgICAgIH1cblxuICAgICAgLmxvYWRpbmctc3RhdGUsXG4gICAgICAuZXJyb3Itc3RhdGUsXG4gICAgICAuZW1wdHktc3RhdGUge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgIHBhZGRpbmc6IDMycHggMTZweDtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBjb2xvcjogIzc1NzU3NTtcbiAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSAubG9hZGluZy1zdGF0ZSxcbiAgICAgIDpob3N0LWNvbnRleHQoLmRhcmstdGhlbWUpIC5lcnJvci1zdGF0ZSxcbiAgICAgIDpob3N0LWNvbnRleHQoLmRhcmstdGhlbWUpIC5lbXB0eS1zdGF0ZSB7XG4gICAgICAgIGNvbG9yOiAjYmRiZGJkO1xuICAgICAgfVxuXG4gICAgICAuZGItbGlzdCB7XG4gICAgICAgIGZsZXg6IDE7XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIHBhZGRpbmctdG9wOiA0cHg7XG4gICAgICB9XG5cbiAgICAgIC5kYi1pdGVtIHtcbiAgICAgICAgaGVpZ2h0OiA1NnB4ICFpbXBvcnRhbnQ7XG4gICAgICAgIHBhZGRpbmc6IDAgMTZweCAhaW1wb3J0YW50O1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG5cbiAgICAgICAgOjpuZy1kZWVwIC5tZGMtbGlzdC1pdGVtX19wcmltYXJ5LXRleHQge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGdhcDogMTJweDtcbiAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5kYi1pY29uIHtcbiAgICAgICAgICBjb2xvcjogIzdiMWZhMjtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgZmxleC1zaHJpbms6IDA7XG4gICAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgICAgIH1cblxuICAgICAgICAuZGItaW5mbyB7XG4gICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgbWluLXdpZHRoOiAwO1xuICAgICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuXG4gICAgICAgICAgLmRiLW5hbWUge1xuICAgICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLmRiLXR5cGUge1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgICAgY29sb3I6ICM5ZTllOWU7XG4gICAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC5jaGV2cm9uIHtcbiAgICAgICAgICBjb2xvcjogI2JkYmRiZDtcbiAgICAgICAgICBmbGV4LXNocmluazogMDtcbiAgICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSAuZGItaXRlbSB7XG4gICAgICAgIC5kYi1pY29uIHtcbiAgICAgICAgICBjb2xvcjogI2NlOTNkODtcbiAgICAgICAgfVxuICAgICAgICAuZGItaW5mbyAuZGItdHlwZSB7XG4gICAgICAgICAgY29sb3I6ICM3NTc1NzU7XG4gICAgICAgIH1cbiAgICAgICAgLmNoZXZyb24ge1xuICAgICAgICAgIGNvbG9yOiAjNjE2MTYxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
}

/***/ }),

/***/ 97543:
/*!**************************************************************!*\
  !*** ./src/app/adf-data-explorer/df-row-detail.component.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfRowDetailComponent: () => (/* binding */ DfRowDetailComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_icon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/material/icon */ 93840);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_chips__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/material/chips */ 12772);
/* harmony import */ var _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/tooltip */ 80640);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @ngneat/transloco */ 76075);













function DfRowDetailComponent_div_0_div_7_div_1_span_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "span", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const fi_r10 = ctx.ngIf;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](fi_r10.dbType);
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_mat_chip_set_5_mat_chip_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-chip", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1, "PK");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_mat_chip_set_5_mat_chip_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-chip", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1, "FK");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const fi_r11 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().ngIf;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matTooltip", fi_r11.refTable + "." + fi_r11.refField);
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_mat_chip_set_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-chip-set", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, DfRowDetailComponent_div_0_div_7_div_1_mat_chip_set_5_mat_chip_1_Template, 2, 0, "mat-chip", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](2, DfRowDetailComponent_div_0_div_7_div_1_mat_chip_set_5_mat_chip_2_Template, 2, 1, "mat-chip", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const fi_r11 = ctx.ngIf;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", fi_r11.isPrimaryKey);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", fi_r11.isForeignKey);
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "span", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3).$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.nullValue"));
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_ng_container_8_pre_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "pre", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipe"](2, "json");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const key_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2).$implicit;
    const ctx_r16 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵpipeBind1"](2, 1, ctx_r16.row[key_r4]));
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_ng_container_8_span_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "span", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const key_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2).$implicit;
    const ctx_r17 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](ctx_r17.row[key_r4]);
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_ng_container_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, DfRowDetailComponent_div_0_div_7_div_1_ng_container_8_pre_1_Template, 3, 3, "pre", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](2, DfRowDetailComponent_div_0_div_7_div_1_ng_container_8_span_2_Template, 2, 1, "span", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const key_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r8.isObject(ctx_r8.row[key_r4]));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx_r8.isObject(ctx_r8.row[key_r4]));
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_div_9_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 27)(1, "mat-icon", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "link");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "a", 29);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfRowDetailComponent_div_0_div_7_div_1_div_9_Template_a_click_3_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r23);
      const key_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
      const ctx_r21 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r21.navigateToTable.emit(ctx_r21.getFieldInfo(key_r4).refTable));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const key_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    const ctx_r9 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate2"](" ", ctx_r9.getFieldInfo(key_r4).refTable, ".", ctx_r9.getFieldInfo(key_r4).refField, " ");
  }
}
function DfRowDetailComponent_div_0_div_7_div_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 8)(1, "div", 9)(2, "span", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](4, DfRowDetailComponent_div_0_div_7_div_1_span_4_Template, 2, 1, "span", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](5, DfRowDetailComponent_div_0_div_7_div_1_mat_chip_set_5_Template, 3, 2, "mat-chip-set", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "div", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](7, DfRowDetailComponent_div_0_div_7_div_1_ng_container_7_Template, 3, 1, "ng-container", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](8, DfRowDetailComponent_div_0_div_7_div_1_ng_container_8_Template, 3, 2, "ng-container", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](9, DfRowDetailComponent_div_0_div_7_div_1_div_9_Template, 5, 2, "div", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const key_r4 = ctx.$implicit;
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
    let tmp_6_0;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](key_r4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r3.getFieldInfo(key_r4));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r3.getFieldInfo(key_r4));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassProp"]("null-value", ctx_r3.row[key_r4] === null || ctx_r3.row[key_r4] === undefined);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r3.row[key_r4] === null || ctx_r3.row[key_r4] === undefined);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r3.row[key_r4] !== null && ctx_r3.row[key_r4] !== undefined);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ((tmp_6_0 = ctx_r3.getFieldInfo(key_r4)) == null ? null : tmp_6_0.isForeignKey) && ((tmp_6_0 = ctx_r3.getFieldInfo(key_r4)) == null ? null : tmp_6_0.refTable));
  }
}
function DfRowDetailComponent_div_0_div_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, DfRowDetailComponent_div_0_div_7_div_1_Template, 10, 8, "div", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx_r2.objectKeys(ctx_r2.row));
  }
}
function DfRowDetailComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 1)(1, "div", 2)(2, "span", 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "button", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfRowDetailComponent_div_0_Template_button_click_4_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r26);
      const ctx_r25 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r25.closeClicked.emit());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6, "close");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](7, DfRowDetailComponent_div_0_div_7_Template, 2, 1, "div", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r1 = ctx.$implicit;
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.recordDetail"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r0.row);
  }
}
class DfRowDetailComponent {
  constructor() {
    this.row = null;
    this.schema = null;
    this.closeClicked = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this.navigateToTable = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this.objectKeys = Object.keys;
  }
  isObject(value) {
    return value !== null && typeof value === 'object';
  }
  getFieldInfo(columnName) {
    if (!this.schema?.field) return null;
    return this.schema.field.find(f => f.name === columnName) || null;
  }
  static {
    this.ɵfac = function DfRowDetailComponent_Factory(t) {
      return new (t || DfRowDetailComponent)();
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DfRowDetailComponent,
      selectors: [["df-row-detail"]],
      inputs: {
        row: "row",
        schema: "schema"
      },
      outputs: {
        closeClicked: "closeClicked",
        navigateToTable: "navigateToTable"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      decls: 1,
      vars: 1,
      consts: [["class", "row-detail-panel", 4, "transloco", "translocoScope"], [1, "row-detail-panel"], [1, "detail-header"], [1, "detail-title"], ["mat-icon-button", "", 1, "close-btn", 3, "click"], ["class", "detail-body", 4, "ngIf"], [1, "detail-body"], ["class", "field-entry", 4, "ngFor", "ngForOf"], [1, "field-entry"], [1, "field-label"], [1, "field-key"], ["class", "field-type-badge", 4, "ngIf"], ["class", "field-badges", 4, "ngIf"], [1, "field-value"], [4, "ngIf"], ["class", "field-ref", 4, "ngIf"], [1, "field-type-badge"], [1, "field-badges"], ["class", "badge-pk", "disabled", "", 4, "ngIf"], ["class", "badge-fk", "disabled", "", 3, "matTooltip", 4, "ngIf"], ["disabled", "", 1, "badge-pk"], ["disabled", "", 1, "badge-fk", 3, "matTooltip"], [1, "null-badge"], ["class", "json-value", 4, "ngIf"], ["class", "text-value", 4, "ngIf"], [1, "json-value"], [1, "text-value"], [1, "field-ref"], [1, "ref-icon"], [1, "ref-link", 3, "click"]],
      template: function DfRowDetailComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](0, DfRowDetailComponent_div_0_Template, 8, 2, "div", 0);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("translocoScope", "dataExplorer");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_1__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_1__.NgFor, _angular_common__WEBPACK_IMPORTED_MODULE_1__.JsonPipe, _angular_material_icon__WEBPACK_IMPORTED_MODULE_2__.MatIconModule, _angular_material_icon__WEBPACK_IMPORTED_MODULE_2__.MatIcon, _angular_material_button__WEBPACK_IMPORTED_MODULE_3__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_3__.MatIconButton, _angular_material_chips__WEBPACK_IMPORTED_MODULE_4__.MatChipsModule, _angular_material_chips__WEBPACK_IMPORTED_MODULE_4__.MatChip, _angular_material_chips__WEBPACK_IMPORTED_MODULE_4__.MatChipSet, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_5__.MatTooltipModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_5__.MatTooltip, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_6__.TranslocoModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_6__.TranslocoDirective],
      styles: [".row-detail-panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  width: 380px;\n  border-left: 1px solid #e0e0e0;\n  background: #fafafa;\n  overflow: hidden;\n}\n\n.detail-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 12px;\n  border-bottom: 1px solid #e0e0e0;\n  background: #f5f5f5;\n}\n.detail-header[_ngcontent-%COMP%]   .detail-title[_ngcontent-%COMP%] {\n  font-size: 13px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  color: #616161;\n}\n.detail-header[_ngcontent-%COMP%]   .close-btn[_ngcontent-%COMP%] {\n  width: 28px;\n  height: 28px;\n  line-height: 28px;\n}\n\n.detail-body[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  padding: 0;\n}\n\n.field-entry[_ngcontent-%COMP%] {\n  padding: 8px 12px;\n  border-bottom: 1px solid #f0f0f0;\n}\n.field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-bottom: 4px;\n}\n.field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%]   .field-key[_ngcontent-%COMP%] {\n  font-size: 12px;\n  font-weight: 600;\n  color: #424242;\n  font-family: \"Roboto Mono\", monospace;\n}\n.field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%]   .field-type-badge[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #9e9e9e;\n  font-family: \"Roboto Mono\", monospace;\n}\n.field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%] {\n  display: inline-flex;\n  gap: 4px;\n}\n.field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%]   mat-chip[_ngcontent-%COMP%] {\n  font-size: 9px;\n  min-height: 18px;\n  padding: 0 6px;\n}\n.field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%]   .badge-pk[_ngcontent-%COMP%] {\n  --mdc-chip-elevated-container-color: #7b1fa2;\n  --mdc-chip-label-text-color: white;\n}\n.field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%]   .badge-fk[_ngcontent-%COMP%] {\n  --mdc-chip-elevated-container-color: #1565c0;\n  --mdc-chip-label-text-color: white;\n}\n.field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%] {\n  font-size: 13px;\n  color: #212121;\n  word-break: break-word;\n}\n.field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%]   .null-badge[_ngcontent-%COMP%] {\n  display: inline-block;\n  font-size: 11px;\n  padding: 1px 8px;\n  border-radius: 4px;\n  background: #eeeeee;\n  color: #9e9e9e;\n  font-style: italic;\n}\n.field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%]   .json-value[_ngcontent-%COMP%] {\n  font-size: 12px;\n  font-family: \"Roboto Mono\", monospace;\n  background: #f5f5f5;\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  padding: 8px;\n  margin: 4px 0 0;\n  overflow-x: auto;\n  max-height: 200px;\n  white-space: pre-wrap;\n}\n.field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%]   .text-value[_ngcontent-%COMP%] {\n  white-space: pre-wrap;\n}\n.field-entry.null-value[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%] {\n  color: #9e9e9e;\n}\n.field-entry[_ngcontent-%COMP%]   .field-ref[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  margin-top: 4px;\n}\n.field-entry[_ngcontent-%COMP%]   .field-ref[_ngcontent-%COMP%]   .ref-icon[_ngcontent-%COMP%] {\n  font-size: 14px;\n  width: 14px;\n  height: 14px;\n  color: #9e9e9e;\n}\n\n.ref-link[_ngcontent-%COMP%] {\n  color: #1565c0;\n  cursor: pointer;\n  font-size: 11px;\n  text-decoration: none;\n}\n.ref-link[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n\n.dark-theme[_nghost-%COMP%]   .row-detail-panel[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .row-detail-panel[_ngcontent-%COMP%] {\n  background: #1e1e1e;\n  border-left-color: #424242;\n}\n.dark-theme[_nghost-%COMP%]   .detail-header[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .detail-header[_ngcontent-%COMP%] {\n  background: #2c2c2c;\n  border-bottom-color: #424242;\n}\n.dark-theme[_nghost-%COMP%]   .detail-header[_ngcontent-%COMP%]   .detail-title[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .detail-header[_ngcontent-%COMP%]   .detail-title[_ngcontent-%COMP%] {\n  color: #bdbdbd;\n}\n.dark-theme[_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%] {\n  border-bottom-color: #2c2c2c;\n}\n.dark-theme[_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%]   .field-key[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%]   .field-label[_ngcontent-%COMP%]   .field-key[_ngcontent-%COMP%] {\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%] {\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%]   .null-badge[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%]   .null-badge[_ngcontent-%COMP%] {\n  background: #333;\n  color: #757575;\n}\n.dark-theme[_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%]   .json-value[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .field-entry[_ngcontent-%COMP%]   .field-value[_ngcontent-%COMP%]   .json-value[_ngcontent-%COMP%] {\n  background: #2c2c2c;\n  border-color: #424242;\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .ref-link[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .ref-link[_ngcontent-%COMP%] {\n  color: #64b5f6;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWRhdGEtZXhwbG9yZXIvZGYtcm93LWRldGFpbC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ007RUFDRSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLDhCQUFBO0VBQ0EsbUJBQUE7RUFDQSxnQkFBQTtBQUFSOztBQUdNO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsOEJBQUE7RUFDQSxpQkFBQTtFQUNBLGdDQUFBO0VBQ0EsbUJBQUE7QUFBUjtBQUVRO0VBQ0UsZUFBQTtFQUNBLGdCQUFBO0VBQ0EseUJBQUE7RUFDQSxxQkFBQTtFQUNBLGNBQUE7QUFBVjtBQUdRO0VBQ0UsV0FBQTtFQUNBLFlBQUE7RUFDQSxpQkFBQTtBQURWOztBQUtNO0VBQ0UsT0FBQTtFQUNBLGdCQUFBO0VBQ0EsVUFBQTtBQUZSOztBQUtNO0VBQ0UsaUJBQUE7RUFDQSxnQ0FBQTtBQUZSO0FBSVE7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSxRQUFBO0VBQ0Esa0JBQUE7QUFGVjtBQUlVO0VBQ0UsZUFBQTtFQUNBLGdCQUFBO0VBQ0EsY0FBQTtFQUNBLHFDQUFBO0FBRlo7QUFLVTtFQUNFLGVBQUE7RUFDQSxjQUFBO0VBQ0EscUNBQUE7QUFIWjtBQU1VO0VBQ0Usb0JBQUE7RUFDQSxRQUFBO0FBSlo7QUFNWTtFQUNFLGNBQUE7RUFDQSxnQkFBQTtFQUNBLGNBQUE7QUFKZDtBQU9ZO0VBQ0UsNENBQUE7RUFDQSxrQ0FBQTtBQUxkO0FBUVk7RUFDRSw0Q0FBQTtFQUNBLGtDQUFBO0FBTmQ7QUFXUTtFQUNFLGVBQUE7RUFDQSxjQUFBO0VBQ0Esc0JBQUE7QUFUVjtBQVdVO0VBQ0UscUJBQUE7RUFDQSxlQUFBO0VBQ0EsZ0JBQUE7RUFDQSxrQkFBQTtFQUNBLG1CQUFBO0VBQ0EsY0FBQTtFQUNBLGtCQUFBO0FBVFo7QUFZVTtFQUNFLGVBQUE7RUFDQSxxQ0FBQTtFQUNBLG1CQUFBO0VBQ0EseUJBQUE7RUFDQSxrQkFBQTtFQUNBLFlBQUE7RUFDQSxlQUFBO0VBQ0EsZ0JBQUE7RUFDQSxpQkFBQTtFQUNBLHFCQUFBO0FBVlo7QUFhVTtFQUNFLHFCQUFBO0FBWFo7QUFlUTtFQUNFLGNBQUE7QUFiVjtBQWdCUTtFQUNFLGFBQUE7RUFDQSxtQkFBQTtFQUNBLFFBQUE7RUFDQSxlQUFBO0FBZFY7QUFnQlU7RUFDRSxlQUFBO0VBQ0EsV0FBQTtFQUNBLFlBQUE7RUFDQSxjQUFBO0FBZFo7O0FBbUJNO0VBQ0UsY0FBQTtFQUNBLGVBQUE7RUFDQSxlQUFBO0VBQ0EscUJBQUE7QUFoQlI7QUFpQlE7RUFDRSwwQkFBQTtBQWZWOztBQW9CUTtFQUNFLG1CQUFBO0VBQ0EsMEJBQUE7QUFqQlY7QUFtQlE7RUFDRSxtQkFBQTtFQUNBLDRCQUFBO0FBakJWO0FBa0JVO0VBQ0UsY0FBQTtBQWhCWjtBQW1CUTtFQUNFLDRCQUFBO0FBakJWO0FBa0JVO0VBQ0UsY0FBQTtBQWhCWjtBQWtCVTtFQUNFLGNBQUE7QUFoQlo7QUFpQlk7RUFDRSxnQkFBQTtFQUNBLGNBQUE7QUFmZDtBQWlCWTtFQUNFLG1CQUFBO0VBQ0EscUJBQUE7RUFDQSxjQUFBO0FBZmQ7QUFtQlE7RUFDRSxjQUFBO0FBakJWIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgICAucm93LWRldGFpbC1wYW5lbCB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgd2lkdGg6IDM4MHB4O1xuICAgICAgICBib3JkZXItbGVmdDogMXB4IHNvbGlkICNlMGUwZTA7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmYWZhZmE7XG4gICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICB9XG5cbiAgICAgIC5kZXRhaWwtaGVhZGVyIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICBwYWRkaW5nOiA4cHggMTJweDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMGUwZTA7XG4gICAgICAgIGJhY2tncm91bmQ6ICNmNWY1ZjU7XG5cbiAgICAgICAgLmRldGFpbC10aXRsZSB7XG4gICAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICBsZXR0ZXItc3BhY2luZzogMC41cHg7XG4gICAgICAgICAgY29sb3I6ICM2MTYxNjE7XG4gICAgICAgIH1cblxuICAgICAgICAuY2xvc2UtYnRuIHtcbiAgICAgICAgICB3aWR0aDogMjhweDtcbiAgICAgICAgICBoZWlnaHQ6IDI4cHg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDI4cHg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLmRldGFpbC1ib2R5IHtcbiAgICAgICAgZmxleDogMTtcbiAgICAgICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICAgICAgcGFkZGluZzogMDtcbiAgICAgIH1cblxuICAgICAgLmZpZWxkLWVudHJ5IHtcbiAgICAgICAgcGFkZGluZzogOHB4IDEycHg7XG4gICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZjBmMGYwO1xuXG4gICAgICAgIC5maWVsZC1sYWJlbCB7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGdhcDogNnB4O1xuICAgICAgICAgIG1hcmdpbi1ib3R0b206IDRweDtcblxuICAgICAgICAgIC5maWVsZC1rZXkge1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICAgIGNvbG9yOiAjNDI0MjQyO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdSb2JvdG8gTW9ubycsIG1vbm9zcGFjZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAuZmllbGQtdHlwZS1iYWRnZSB7XG4gICAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgICBjb2xvcjogIzllOWU5ZTtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnUm9ib3RvIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLmZpZWxkLWJhZGdlcyB7XG4gICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgICAgIGdhcDogNHB4O1xuXG4gICAgICAgICAgICBtYXQtY2hpcCB7XG4gICAgICAgICAgICAgIGZvbnQtc2l6ZTogOXB4O1xuICAgICAgICAgICAgICBtaW4taGVpZ2h0OiAxOHB4O1xuICAgICAgICAgICAgICBwYWRkaW5nOiAwIDZweDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLmJhZGdlLXBrIHtcbiAgICAgICAgICAgICAgLS1tZGMtY2hpcC1lbGV2YXRlZC1jb250YWluZXItY29sb3I6ICM3YjFmYTI7XG4gICAgICAgICAgICAgIC0tbWRjLWNoaXAtbGFiZWwtdGV4dC1jb2xvcjogd2hpdGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5iYWRnZS1mayB7XG4gICAgICAgICAgICAgIC0tbWRjLWNoaXAtZWxldmF0ZWQtY29udGFpbmVyLWNvbG9yOiAjMTU2NWMwO1xuICAgICAgICAgICAgICAtLW1kYy1jaGlwLWxhYmVsLXRleHQtY29sb3I6IHdoaXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC5maWVsZC12YWx1ZSB7XG4gICAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgICAgIGNvbG9yOiAjMjEyMTIxO1xuICAgICAgICAgIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG5cbiAgICAgICAgICAubnVsbC1iYWRnZSB7XG4gICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgICAgICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAxcHggOHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICAgICAgYmFja2dyb3VuZDogI2VlZWVlZTtcbiAgICAgICAgICAgIGNvbG9yOiAjOWU5ZTllO1xuICAgICAgICAgICAgZm9udC1zdHlsZTogaXRhbGljO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC5qc29uLXZhbHVlIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnUm9ib3RvIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjVmNWY1O1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2UwZTBlMDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDhweDtcbiAgICAgICAgICAgIG1hcmdpbjogNHB4IDAgMDtcbiAgICAgICAgICAgIG92ZXJmbG93LXg6IGF1dG87XG4gICAgICAgICAgICBtYXgtaGVpZ2h0OiAyMDBweDtcbiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAudGV4dC12YWx1ZSB7XG4gICAgICAgICAgICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgJi5udWxsLXZhbHVlIC5maWVsZC12YWx1ZSB7XG4gICAgICAgICAgY29sb3I6ICM5ZTllOWU7XG4gICAgICAgIH1cblxuICAgICAgICAuZmllbGQtcmVmIHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgZ2FwOiA0cHg7XG4gICAgICAgICAgbWFyZ2luLXRvcDogNHB4O1xuXG4gICAgICAgICAgLnJlZi1pY29uIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICAgIHdpZHRoOiAxNHB4O1xuICAgICAgICAgICAgaGVpZ2h0OiAxNHB4O1xuICAgICAgICAgICAgY29sb3I6ICM5ZTllOWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC5yZWYtbGluayB7XG4gICAgICAgIGNvbG9yOiAjMTU2NWMwO1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgICAgICAmOmhvdmVyIHtcbiAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICA6aG9zdC1jb250ZXh0KC5kYXJrLXRoZW1lKSB7XG4gICAgICAgIC5yb3ctZGV0YWlsLXBhbmVsIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMWUxZTFlO1xuICAgICAgICAgIGJvcmRlci1sZWZ0LWNvbG9yOiAjNDI0MjQyO1xuICAgICAgICB9XG4gICAgICAgIC5kZXRhaWwtaGVhZGVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMmMyYzJjO1xuICAgICAgICAgIGJvcmRlci1ib3R0b20tY29sb3I6ICM0MjQyNDI7XG4gICAgICAgICAgLmRldGFpbC10aXRsZSB7XG4gICAgICAgICAgICBjb2xvcjogI2JkYmRiZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLmZpZWxkLWVudHJ5IHtcbiAgICAgICAgICBib3JkZXItYm90dG9tLWNvbG9yOiAjMmMyYzJjO1xuICAgICAgICAgIC5maWVsZC1sYWJlbCAuZmllbGQta2V5IHtcbiAgICAgICAgICAgIGNvbG9yOiAjZTBlMGUwO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuZmllbGQtdmFsdWUge1xuICAgICAgICAgICAgY29sb3I6ICNlMGUwZTA7XG4gICAgICAgICAgICAubnVsbC1iYWRnZSB7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6ICMzMzM7XG4gICAgICAgICAgICAgIGNvbG9yOiAjNzU3NTc1O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmpzb24tdmFsdWUge1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMmMyYzJjO1xuICAgICAgICAgICAgICBib3JkZXItY29sb3I6ICM0MjQyNDI7XG4gICAgICAgICAgICAgIGNvbG9yOiAjZTBlMGUwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAucmVmLWxpbmsge1xuICAgICAgICAgIGNvbG9yOiAjNjRiNWY2O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
}

/***/ }),

/***/ 54589:
/*!***************************************************************!*\
  !*** ./src/app/adf-data-explorer/df-schema-info.component.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfSchemaInfoComponent: () => (/* binding */ DfSchemaInfoComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_icon__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/icon */ 93840);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_chips__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/chips */ 12772);
/* harmony import */ var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/progress-spinner */ 41134);
/* harmony import */ var _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/tooltip */ 80640);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ 10819);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs/operators */ 33900);
/* harmony import */ var _services_data_explorer_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./services/data-explorer.service */ 40903);


















function DfSchemaInfoComponent_div_0_div_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](1, "mat-spinner", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
}
function DfSchemaInfoComponent_div_0_div_8_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 10)(1, "mat-icon", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2, "error_outline");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](3, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](ctx_r3.error);
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_4_mat_chip_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-chip", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, "PK");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_4_mat_chip_6_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-chip", 29);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, "FK");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const field_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("matTooltip", field_r7.refTable + "." + field_r7.refField);
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_4_mat_chip_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "mat-chip", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, "UQ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_4_span_11_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "span", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, "NOT NULL");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_4_span_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "span", 32);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, "AUTO");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_4_div_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r17 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 33)(1, "mat-icon", 34);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2, "subdirectory_arrow_right");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](3, "a", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DfSchemaInfoComponent_div_0_div_9_div_4_div_13_Template_a_click_3_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵrestoreView"](_r17);
      const field_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]().$implicit;
      const ctx_r15 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵresetView"](ctx_r15.navigateToTable.emit(field_r7.refTable));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const field_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"](" ", field_r7.refTable, ".", field_r7.refField, " ");
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 17)(1, "div", 18)(2, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](4, "mat-chip-set", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](5, DfSchemaInfoComponent_div_0_div_9_div_4_mat_chip_5_Template, 2, 0, "mat-chip", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](6, DfSchemaInfoComponent_div_0_div_9_div_4_mat_chip_6_Template, 2, 1, "mat-chip", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](7, DfSchemaInfoComponent_div_0_div_9_div_4_mat_chip_7_Template, 2, 0, "mat-chip", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](8, "div", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](10, "div", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](11, DfSchemaInfoComponent_div_0_div_9_div_4_span_11_Template, 2, 0, "span", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](12, DfSchemaInfoComponent_div_0_div_9_div_4_span_12_Template, 2, 0, "span", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](13, DfSchemaInfoComponent_div_0_div_9_div_4_div_13_Template, 5, 2, "div", 27);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const field_r7 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](field_r7.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", field_r7.isPrimaryKey);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", field_r7.isForeignKey);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", field_r7.isUnique && !field_r7.isPrimaryKey);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](field_r7.dbType);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", !field_r7.allowNull);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", field_r7.autoIncrement);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", field_r7.isForeignKey && field_r7.refTable);
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_5_div_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r22 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 38)(1, "mat-icon", 39);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](3, "div", 40)(4, "span", 41);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](6, "a", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DfSchemaInfoComponent_div_0_div_9_div_5_div_4_Template_a_click_6_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵrestoreView"](_r22);
      const rel_r20 = restoredCtx.$implicit;
      const ctx_r21 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](4);
      return _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵresetView"](ctx_r21.navigateToTable.emit(rel_r20.refTable));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](8, "span", 42);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](9);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const rel_r20 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](rel_r20.type === "belongs_to" ? "arrow_back" : "arrow_forward");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](rel_r20.type);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](rel_r20.refTable);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"]("", rel_r20.field, " \u2192 ", rel_r20.refField, "");
  }
}
function DfSchemaInfoComponent_div_0_div_9_div_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div")(1, "div", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](3, "div", 36);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](4, DfSchemaInfoComponent_div_0_div_9_div_5_div_4_Template, 10, 5, "div", 37);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2).$implicit;
    const ctx_r6 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"](" ", t_r1("dataExplorer.relationships"), " (", ctx_r6.schema.related.length, ") ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx_r6.schema.related);
  }
}
function DfSchemaInfoComponent_div_0_div_9_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 12)(1, "div", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](3, "div", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](4, DfSchemaInfoComponent_div_0_div_9_div_4_Template, 14, 8, "div", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](5, DfSchemaInfoComponent_div_0_div_9_div_5_Template, 5, 3, "div", 16);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]().$implicit;
    const ctx_r4 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"](" ", t_r1("dataExplorer.columns"), " (", ctx_r4.schema.field.length, ") ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx_r4.schema.field);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx_r4.schema.related && ctx_r4.schema.related.length > 0);
  }
}
function DfSchemaInfoComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r26 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 1)(1, "div", 2)(2, "span", 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](4, "button", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function DfSchemaInfoComponent_div_0_Template_button_click_4_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵrestoreView"](_r26);
      const ctx_r25 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵresetView"](ctx_r25.closeClicked.emit());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](5, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](6, "close");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](7, DfSchemaInfoComponent_div_0_div_7_Template, 2, 0, "div", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](8, DfSchemaInfoComponent_div_0_div_8_Template, 5, 1, "div", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](9, DfSchemaInfoComponent_div_0_div_9_Template, 6, 4, "div", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r1 = ctx.$implicit;
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](t_r1("dataExplorer.schemaInfo"));
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx_r0.loading);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx_r0.error && !ctx_r0.loading);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx_r0.schema && !ctx_r0.loading && !ctx_r0.error);
  }
}
class DfSchemaInfoComponent {
  constructor(dataExplorerService) {
    this.dataExplorerService = dataExplorerService;
    this.serviceName = '';
    this.tableName = '';
    this.closeClicked = new _angular_core__WEBPACK_IMPORTED_MODULE_1__.EventEmitter();
    this.navigateToTable = new _angular_core__WEBPACK_IMPORTED_MODULE_1__.EventEmitter();
    this.schema = null;
    this.loading = false;
    this.error = null;
    this.cache = new Map();
    this.destroy$ = new rxjs__WEBPACK_IMPORTED_MODULE_2__.Subject();
  }
  ngOnChanges(changes) {
    if (changes['tableName'] || changes['serviceName']) {
      this.loadSchema();
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  loadSchema() {
    if (!this.serviceName || !this.tableName) return;
    const cacheKey = `${this.serviceName}:${this.tableName}`;
    if (this.cache.has(cacheKey)) {
      this.schema = this.cache.get(cacheKey);
      return;
    }
    this.loading = true;
    this.error = null;
    this.dataExplorerService.getTableSchema(this.serviceName, this.tableName).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_3__.takeUntil)(this.destroy$)).subscribe({
      next: schema => {
        this.schema = schema;
        this.cache.set(cacheKey, schema);
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.error?.message || 'Failed to load schema';
        this.loading = false;
      }
    });
  }
  getSchema() {
    return this.schema;
  }
  getCachedSchema(serviceName, tableName) {
    return this.cache.get(`${serviceName}:${tableName}`) || null;
  }
  static {
    this.ɵfac = function DfSchemaInfoComponent_Factory(t) {
      return new (t || DfSchemaInfoComponent)(_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdirectiveInject"](_services_data_explorer_service__WEBPACK_IMPORTED_MODULE_0__.DataExplorerService));
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: DfSchemaInfoComponent,
      selectors: [["df-schema-info"]],
      inputs: {
        serviceName: "serviceName",
        tableName: "tableName"
      },
      outputs: {
        closeClicked: "closeClicked",
        navigateToTable: "navigateToTable"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵNgOnChangesFeature"], _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵStandaloneFeature"]],
      decls: 1,
      vars: 1,
      consts: [["class", "schema-info-panel", 4, "transloco", "translocoScope"], [1, "schema-info-panel"], [1, "schema-header"], [1, "schema-title"], ["mat-icon-button", "", 1, "close-btn", 3, "click"], ["class", "schema-loading", 4, "ngIf"], ["class", "schema-error", 4, "ngIf"], ["class", "schema-body", 4, "ngIf"], [1, "schema-loading"], ["diameter", "24"], [1, "schema-error"], ["color", "warn"], [1, "schema-body"], [1, "section-header"], [1, "field-list"], ["class", "field-row", 4, "ngFor", "ngForOf"], [4, "ngIf"], [1, "field-row"], [1, "field-name"], [1, "field-badges"], ["class", "badge-pk", "disabled", "", 4, "ngIf"], ["class", "badge-fk", "disabled", "", 3, "matTooltip", 4, "ngIf"], ["class", "badge-uq", "disabled", "", 4, "ngIf"], [1, "field-type"], [1, "field-meta"], ["class", "not-null", 4, "ngIf"], ["class", "auto-inc", 4, "ngIf"], ["class", "field-ref", 4, "ngIf"], ["disabled", "", 1, "badge-pk"], ["disabled", "", 1, "badge-fk", 3, "matTooltip"], ["disabled", "", 1, "badge-uq"], [1, "not-null"], [1, "auto-inc"], [1, "field-ref"], [1, "ref-icon"], [1, "ref-link", 3, "click"], [1, "rel-list"], ["class", "rel-row", 4, "ngFor", "ngForOf"], [1, "rel-row"], [1, "rel-icon"], [1, "rel-info"], [1, "rel-type"], [1, "rel-field"]],
      template: function DfSchemaInfoComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](0, DfSchemaInfoComponent_div_0_Template, 10, 4, "div", 0);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("translocoScope", "dataExplorer");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_4__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgFor, _angular_material_icon__WEBPACK_IMPORTED_MODULE_5__.MatIconModule, _angular_material_icon__WEBPACK_IMPORTED_MODULE_5__.MatIcon, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatIconButton, _angular_material_chips__WEBPACK_IMPORTED_MODULE_7__.MatChipsModule, _angular_material_chips__WEBPACK_IMPORTED_MODULE_7__.MatChip, _angular_material_chips__WEBPACK_IMPORTED_MODULE_7__.MatChipSet, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_8__.MatProgressSpinnerModule, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_8__.MatProgressSpinner, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_9__.MatTooltipModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_9__.MatTooltip, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_10__.TranslocoModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_10__.TranslocoDirective],
      styles: [".schema-info-panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  border-left: 1px solid #e0e0e0;\n  background: #fafafa;\n  width: 320px;\n  overflow: hidden;\n}\n\n.schema-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 12px;\n  border-bottom: 1px solid #e0e0e0;\n  background: #f5f5f5;\n}\n.schema-header[_ngcontent-%COMP%]   .schema-title[_ngcontent-%COMP%] {\n  font-size: 13px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  color: #616161;\n}\n.schema-header[_ngcontent-%COMP%]   .close-btn[_ngcontent-%COMP%] {\n  width: 28px;\n  height: 28px;\n  line-height: 28px;\n}\n\n.schema-loading[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: center;\n  padding: 24px;\n}\n\n.schema-error[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 12px;\n  font-size: 13px;\n  color: #d32f2f;\n}\n\n.schema-body[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  padding: 0;\n}\n\n.section-header[_ngcontent-%COMP%] {\n  font-size: 11px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  color: #9e9e9e;\n  padding: 12px 12px 6px;\n  border-bottom: 1px solid #eeeeee;\n}\n\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%] {\n  padding: 6px 12px;\n  border-bottom: 1px solid #f5f5f5;\n  font-size: 12px;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-name[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-weight: 500;\n  color: #212121;\n  font-family: \"Roboto Mono\", monospace;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%] {\n  display: inline-flex;\n  gap: 4px;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%]   mat-chip[_ngcontent-%COMP%] {\n  font-size: 9px;\n  min-height: 18px;\n  padding: 0 6px;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%]   .badge-pk[_ngcontent-%COMP%] {\n  --mdc-chip-elevated-container-color: #7b1fa2;\n  --mdc-chip-label-text-color: white;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%]   .badge-fk[_ngcontent-%COMP%] {\n  --mdc-chip-elevated-container-color: #1565c0;\n  --mdc-chip-label-text-color: white;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-badges[_ngcontent-%COMP%]   .badge-uq[_ngcontent-%COMP%] {\n  --mdc-chip-elevated-container-color: #ef6c00;\n  --mdc-chip-label-text-color: white;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-type[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #757575;\n  margin-top: 2px;\n  font-family: \"Roboto Mono\", monospace;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-meta[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  margin-top: 2px;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-meta[_ngcontent-%COMP%]   .not-null[_ngcontent-%COMP%], .field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-meta[_ngcontent-%COMP%]   .auto-inc[_ngcontent-%COMP%] {\n  font-size: 10px;\n  color: #9e9e9e;\n  text-transform: uppercase;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-ref[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  margin-top: 2px;\n}\n.field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-ref[_ngcontent-%COMP%]   .ref-icon[_ngcontent-%COMP%] {\n  font-size: 14px;\n  width: 14px;\n  height: 14px;\n  color: #9e9e9e;\n}\n\n.ref-link[_ngcontent-%COMP%] {\n  color: #1565c0;\n  cursor: pointer;\n  font-size: 11px;\n  text-decoration: none;\n}\n.ref-link[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n\n.rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 6px 12px;\n  border-bottom: 1px solid #f5f5f5;\n}\n.rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%]   .rel-icon[_ngcontent-%COMP%] {\n  font-size: 16px;\n  width: 16px;\n  height: 16px;\n  color: #7b1fa2;\n  margin-top: 2px;\n}\n.rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%]   .rel-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n.rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%]   .rel-info[_ngcontent-%COMP%]   .rel-type[_ngcontent-%COMP%] {\n  font-size: 10px;\n  text-transform: uppercase;\n  color: #9e9e9e;\n  letter-spacing: 0.5px;\n}\n.rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%]   .rel-info[_ngcontent-%COMP%]   .rel-field[_ngcontent-%COMP%] {\n  font-size: 11px;\n  color: #757575;\n  font-family: \"Roboto Mono\", monospace;\n}\n\n.dark-theme[_nghost-%COMP%]   .schema-info-panel[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .schema-info-panel[_ngcontent-%COMP%] {\n  background: #1e1e1e;\n  border-left-color: #424242;\n}\n.dark-theme[_nghost-%COMP%]   .schema-header[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .schema-header[_ngcontent-%COMP%] {\n  background: #2c2c2c;\n  border-bottom-color: #424242;\n}\n.dark-theme[_nghost-%COMP%]   .schema-header[_ngcontent-%COMP%]   .schema-title[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .schema-header[_ngcontent-%COMP%]   .schema-title[_ngcontent-%COMP%] {\n  color: #bdbdbd;\n}\n.dark-theme[_nghost-%COMP%]   .section-header[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .section-header[_ngcontent-%COMP%] {\n  color: #757575;\n  border-bottom-color: #333;\n}\n.dark-theme[_nghost-%COMP%]   .field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%] {\n  border-bottom-color: #2c2c2c;\n}\n.dark-theme[_nghost-%COMP%]   .field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-name[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-name[_ngcontent-%COMP%] {\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-type[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .field-list[_ngcontent-%COMP%]   .field-row[_ngcontent-%COMP%]   .field-type[_ngcontent-%COMP%] {\n  color: #9e9e9e;\n}\n.dark-theme[_nghost-%COMP%]   .ref-link[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .ref-link[_ngcontent-%COMP%] {\n  color: #64b5f6;\n}\n.dark-theme[_nghost-%COMP%]   .rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%] {\n  border-bottom-color: #2c2c2c;\n}\n.dark-theme[_nghost-%COMP%]   .rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%]   .rel-icon[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .rel-list[_ngcontent-%COMP%]   .rel-row[_ngcontent-%COMP%]   .rel-icon[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWRhdGEtZXhwbG9yZXIvZGYtc2NoZW1hLWluZm8uY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNNO0VBQ0UsYUFBQTtFQUNBLHNCQUFBO0VBQ0EsWUFBQTtFQUNBLDhCQUFBO0VBQ0EsbUJBQUE7RUFDQSxZQUFBO0VBQ0EsZ0JBQUE7QUFBUjs7QUFHTTtFQUNFLGFBQUE7RUFDQSxtQkFBQTtFQUNBLDhCQUFBO0VBQ0EsaUJBQUE7RUFDQSxnQ0FBQTtFQUNBLG1CQUFBO0FBQVI7QUFFUTtFQUNFLGVBQUE7RUFDQSxnQkFBQTtFQUNBLHlCQUFBO0VBQ0EscUJBQUE7RUFDQSxjQUFBO0FBQVY7QUFHUTtFQUNFLFdBQUE7RUFDQSxZQUFBO0VBQ0EsaUJBQUE7QUFEVjs7QUFLTTtFQUNFLGFBQUE7RUFDQSx1QkFBQTtFQUNBLGFBQUE7QUFGUjs7QUFLTTtFQUNFLGFBQUE7RUFDQSxtQkFBQTtFQUNBLFFBQUE7RUFDQSxhQUFBO0VBQ0EsZUFBQTtFQUNBLGNBQUE7QUFGUjs7QUFLTTtFQUNFLE9BQUE7RUFDQSxnQkFBQTtFQUNBLFVBQUE7QUFGUjs7QUFLTTtFQUNFLGVBQUE7RUFDQSxnQkFBQTtFQUNBLHlCQUFBO0VBQ0EscUJBQUE7RUFDQSxjQUFBO0VBQ0Esc0JBQUE7RUFDQSxnQ0FBQTtBQUZSOztBQU1RO0VBQ0UsaUJBQUE7RUFDQSxnQ0FBQTtFQUNBLGVBQUE7QUFIVjtBQUtVO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsUUFBQTtFQUNBLGdCQUFBO0VBQ0EsY0FBQTtFQUNBLHFDQUFBO0FBSFo7QUFNVTtFQUNFLG9CQUFBO0VBQ0EsUUFBQTtBQUpaO0FBTVk7RUFDRSxjQUFBO0VBQ0EsZ0JBQUE7RUFDQSxjQUFBO0FBSmQ7QUFPWTtFQUNFLDRDQUFBO0VBQ0Esa0NBQUE7QUFMZDtBQVFZO0VBQ0UsNENBQUE7RUFDQSxrQ0FBQTtBQU5kO0FBU1k7RUFDRSw0Q0FBQTtFQUNBLGtDQUFBO0FBUGQ7QUFXVTtFQUNFLGVBQUE7RUFDQSxjQUFBO0VBQ0EsZUFBQTtFQUNBLHFDQUFBO0FBVFo7QUFZVTtFQUNFLGFBQUE7RUFDQSxRQUFBO0VBQ0EsZUFBQTtBQVZaO0FBWVk7O0VBRUUsZUFBQTtFQUNBLGNBQUE7RUFDQSx5QkFBQTtBQVZkO0FBY1U7RUFDRSxhQUFBO0VBQ0EsbUJBQUE7RUFDQSxRQUFBO0VBQ0EsZUFBQTtBQVpaO0FBY1k7RUFDRSxlQUFBO0VBQ0EsV0FBQTtFQUNBLFlBQUE7RUFDQSxjQUFBO0FBWmQ7O0FBa0JNO0VBQ0UsY0FBQTtFQUNBLGVBQUE7RUFDQSxlQUFBO0VBQ0EscUJBQUE7QUFmUjtBQWdCUTtFQUNFLDBCQUFBO0FBZFY7O0FBbUJRO0VBQ0UsYUFBQTtFQUNBLHVCQUFBO0VBQ0EsUUFBQTtFQUNBLGlCQUFBO0VBQ0EsZ0NBQUE7QUFoQlY7QUFrQlU7RUFDRSxlQUFBO0VBQ0EsV0FBQTtFQUNBLFlBQUE7RUFDQSxjQUFBO0VBQ0EsZUFBQTtBQWhCWjtBQW1CVTtFQUNFLGFBQUE7RUFDQSxzQkFBQTtFQUNBLFFBQUE7QUFqQlo7QUFtQlk7RUFDRSxlQUFBO0VBQ0EseUJBQUE7RUFDQSxjQUFBO0VBQ0EscUJBQUE7QUFqQmQ7QUFvQlk7RUFDRSxlQUFBO0VBQ0EsY0FBQTtFQUNBLHFDQUFBO0FBbEJkOztBQXlCUTtFQUNFLG1CQUFBO0VBQ0EsMEJBQUE7QUF0QlY7QUF3QlE7RUFDRSxtQkFBQTtFQUNBLDRCQUFBO0FBdEJWO0FBdUJVO0VBQ0UsY0FBQTtBQXJCWjtBQXdCUTtFQUNFLGNBQUE7RUFDQSx5QkFBQTtBQXRCVjtBQXdCUTtFQUNFLDRCQUFBO0FBdEJWO0FBdUJVO0VBQ0UsY0FBQTtBQXJCWjtBQXVCVTtFQUNFLGNBQUE7QUFyQlo7QUF3QlE7RUFDRSxjQUFBO0FBdEJWO0FBd0JRO0VBQ0UsNEJBQUE7QUF0QlY7QUF1QlU7RUFDRSxjQUFBO0FBckJaIiwic291cmNlc0NvbnRlbnQiOlsiXG4gICAgICAuc2NoZW1hLWluZm8tcGFuZWwge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIGJvcmRlci1sZWZ0OiAxcHggc29saWQgI2UwZTBlMDtcbiAgICAgICAgYmFja2dyb3VuZDogI2ZhZmFmYTtcbiAgICAgICAgd2lkdGg6IDMyMHB4O1xuICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgfVxuXG4gICAgICAuc2NoZW1hLWhlYWRlciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgcGFkZGluZzogOHB4IDEycHg7XG4gICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZTBlMGUwO1xuICAgICAgICBiYWNrZ3JvdW5kOiAjZjVmNWY1O1xuXG4gICAgICAgIC5zY2hlbWEtdGl0bGUge1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuNXB4O1xuICAgICAgICAgIGNvbG9yOiAjNjE2MTYxO1xuICAgICAgICB9XG5cbiAgICAgICAgLmNsb3NlLWJ0biB7XG4gICAgICAgICAgd2lkdGg6IDI4cHg7XG4gICAgICAgICAgaGVpZ2h0OiAyOHB4O1xuICAgICAgICAgIGxpbmUtaGVpZ2h0OiAyOHB4O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC5zY2hlbWEtbG9hZGluZyB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICBwYWRkaW5nOiAyNHB4O1xuICAgICAgfVxuXG4gICAgICAuc2NoZW1hLWVycm9yIHtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgIHBhZGRpbmc6IDEycHg7XG4gICAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgICAgY29sb3I6ICNkMzJmMmY7XG4gICAgICB9XG5cbiAgICAgIC5zY2hlbWEtYm9keSB7XG4gICAgICAgIGZsZXg6IDE7XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICB9XG5cbiAgICAgIC5zZWN0aW9uLWhlYWRlciB7XG4gICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDAuNXB4O1xuICAgICAgICBjb2xvcjogIzllOWU5ZTtcbiAgICAgICAgcGFkZGluZzogMTJweCAxMnB4IDZweDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlZWVlZWU7XG4gICAgICB9XG5cbiAgICAgIC5maWVsZC1saXN0IHtcbiAgICAgICAgLmZpZWxkLXJvdyB7XG4gICAgICAgICAgcGFkZGluZzogNnB4IDEycHg7XG4gICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNmNWY1ZjU7XG4gICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuXG4gICAgICAgICAgLmZpZWxkLW5hbWUge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgICAgICBjb2xvcjogIzIxMjEyMTtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnUm9ib3RvIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLmZpZWxkLWJhZGdlcyB7XG4gICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgICAgICAgICAgIGdhcDogNHB4O1xuXG4gICAgICAgICAgICBtYXQtY2hpcCB7XG4gICAgICAgICAgICAgIGZvbnQtc2l6ZTogOXB4O1xuICAgICAgICAgICAgICBtaW4taGVpZ2h0OiAxOHB4O1xuICAgICAgICAgICAgICBwYWRkaW5nOiAwIDZweDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLmJhZGdlLXBrIHtcbiAgICAgICAgICAgICAgLS1tZGMtY2hpcC1lbGV2YXRlZC1jb250YWluZXItY29sb3I6ICM3YjFmYTI7XG4gICAgICAgICAgICAgIC0tbWRjLWNoaXAtbGFiZWwtdGV4dC1jb2xvcjogd2hpdGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5iYWRnZS1mayB7XG4gICAgICAgICAgICAgIC0tbWRjLWNoaXAtZWxldmF0ZWQtY29udGFpbmVyLWNvbG9yOiAjMTU2NWMwO1xuICAgICAgICAgICAgICAtLW1kYy1jaGlwLWxhYmVsLXRleHQtY29sb3I6IHdoaXRlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAuYmFkZ2UtdXEge1xuICAgICAgICAgICAgICAtLW1kYy1jaGlwLWVsZXZhdGVkLWNvbnRhaW5lci1jb2xvcjogI2VmNmMwMDtcbiAgICAgICAgICAgICAgLS1tZGMtY2hpcC1sYWJlbC10ZXh0LWNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAuZmllbGQtdHlwZSB7XG4gICAgICAgICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICAgICAgICBjb2xvcjogIzc1NzU3NTtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDJweDtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnUm9ib3RvIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLmZpZWxkLW1ldGEge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMnB4O1xuXG4gICAgICAgICAgICAubm90LW51bGwsXG4gICAgICAgICAgICAuYXV0by1pbmMge1xuICAgICAgICAgICAgICBmb250LXNpemU6IDEwcHg7XG4gICAgICAgICAgICAgIGNvbG9yOiAjOWU5ZTllO1xuICAgICAgICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC5maWVsZC1yZWYge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBnYXA6IDRweDtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDJweDtcblxuICAgICAgICAgICAgLnJlZi1pY29uIHtcbiAgICAgICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICAgICAgICB3aWR0aDogMTRweDtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxNHB4O1xuICAgICAgICAgICAgICBjb2xvcjogIzllOWU5ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLnJlZi1saW5rIHtcbiAgICAgICAgY29sb3I6ICMxNTY1YzA7XG4gICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgICAgICY6aG92ZXIge1xuICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC5yZWwtbGlzdCB7XG4gICAgICAgIC5yZWwtcm93IHtcbiAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgIHBhZGRpbmc6IDZweCAxMnB4O1xuICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZjVmNWY1O1xuXG4gICAgICAgICAgLnJlbC1pY29uIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweDtcbiAgICAgICAgICAgIHdpZHRoOiAxNnB4O1xuICAgICAgICAgICAgaGVpZ2h0OiAxNnB4O1xuICAgICAgICAgICAgY29sb3I6ICM3YjFmYTI7XG4gICAgICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLnJlbC1pbmZvIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICAgICAgZ2FwOiAycHg7XG5cbiAgICAgICAgICAgIC5yZWwtdHlwZSB7XG4gICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTBweDtcbiAgICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICAgICAgY29sb3I6ICM5ZTllOWU7XG4gICAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAwLjVweDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLnJlbC1maWVsZCB7XG4gICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICAgICAgY29sb3I6ICM3NTc1NzU7XG4gICAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnUm9ib3RvIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIDpob3N0LWNvbnRleHQoLmRhcmstdGhlbWUpIHtcbiAgICAgICAgLnNjaGVtYS1pbmZvLXBhbmVsIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMWUxZTFlO1xuICAgICAgICAgIGJvcmRlci1sZWZ0LWNvbG9yOiAjNDI0MjQyO1xuICAgICAgICB9XG4gICAgICAgIC5zY2hlbWEtaGVhZGVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjMmMyYzJjO1xuICAgICAgICAgIGJvcmRlci1ib3R0b20tY29sb3I6ICM0MjQyNDI7XG4gICAgICAgICAgLnNjaGVtYS10aXRsZSB7XG4gICAgICAgICAgICBjb2xvcjogI2JkYmRiZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLnNlY3Rpb24taGVhZGVyIHtcbiAgICAgICAgICBjb2xvcjogIzc1NzU3NTtcbiAgICAgICAgICBib3JkZXItYm90dG9tLWNvbG9yOiAjMzMzO1xuICAgICAgICB9XG4gICAgICAgIC5maWVsZC1saXN0IC5maWVsZC1yb3cge1xuICAgICAgICAgIGJvcmRlci1ib3R0b20tY29sb3I6ICMyYzJjMmM7XG4gICAgICAgICAgLmZpZWxkLW5hbWUge1xuICAgICAgICAgICAgY29sb3I6ICNlMGUwZTA7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5maWVsZC10eXBlIHtcbiAgICAgICAgICAgIGNvbG9yOiAjOWU5ZTllO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAucmVmLWxpbmsge1xuICAgICAgICAgIGNvbG9yOiAjNjRiNWY2O1xuICAgICAgICB9XG4gICAgICAgIC5yZWwtbGlzdCAucmVsLXJvdyB7XG4gICAgICAgICAgYm9yZGVyLWJvdHRvbS1jb2xvcjogIzJjMmMyYztcbiAgICAgICAgICAucmVsLWljb24ge1xuICAgICAgICAgICAgY29sb3I6ICNjZTkzZDg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgIl0sInNvdXJjZVJvb3QiOiIifQ== */"]
    });
  }
}

/***/ }),

/***/ 27885:
/*!***************************************************************!*\
  !*** ./src/app/adf-data-explorer/df-schema-tree.component.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DfSchemaTreeComponent: () => (/* binding */ DfSchemaTreeComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_list__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/material/list */ 20943);
/* harmony import */ var _angular_material_icon__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/material/icon */ 93840);
/* harmony import */ var _angular_material_button__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @angular/material/button */ 84175);
/* harmony import */ var _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/material/progress-spinner */ 41134);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/material/form-field */ 24950);
/* harmony import */ var _angular_material_input__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @angular/material/input */ 95541);
/* harmony import */ var _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @angular/material/tooltip */ 80640);
/* harmony import */ var _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @ngneat/transloco */ 76075);
/* harmony import */ var _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @fortawesome/angular-fontawesome */ 17518);
/* harmony import */ var _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @fortawesome/free-solid-svg-icons */ 29634);
























function DfSchemaTreeComponent_div_0_div_8_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 12)(1, "mat-form-field", 13)(2, "mat-icon", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3, "search");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "input", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("ngModelChange", function DfSchemaTreeComponent_div_0_div_8_Template_input_ngModelChange_4_listener($event) {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r9);
      const ctx_r8 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r8.searchQuery = $event);
    })("ngModelChange", function DfSchemaTreeComponent_div_0_div_8_Template_input_ngModelChange_4_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r9);
      const ctx_r10 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r10.filterTables());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("placeholder", t_r1("dataExplorer.searchTables"))("ngModel", ctx_r2.searchQuery);
  }
}
function DfSchemaTreeComponent_div_0_div_9_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 16)(1, "span", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "span", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.tables"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](ctx_r3.filteredTables.length);
  }
}
function DfSchemaTreeComponent_div_0_div_10_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 19);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "mat-spinner", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.loadingSchema"));
  }
}
function DfSchemaTreeComponent_div_0_div_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r15 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 21)(1, "mat-icon", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "error_outline");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "button", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfSchemaTreeComponent_div_0_div_11_Template_button_click_5_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r15);
      const ctx_r14 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r14.retry.emit());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    const ctx_r5 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](ctx_r5.error);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate1"](" ", t_r1("dataExplorer.retry"), " ");
  }
}
function DfSchemaTreeComponent_div_0_div_12_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 24)(1, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](2, "info_outline");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "span");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](5, "small");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const t_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.noTables"));
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](t_r1("dataExplorer.noTablesHint"));
  }
}
function DfSchemaTreeComponent_div_0_mat_nav_list_13_a_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r21 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "a", 27);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfSchemaTreeComponent_div_0_mat_nav_list_13_a_1_Template_a_click_0_listener() {
      const restoredCtx = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r21);
      const table_r19 = restoredCtx.$implicit;
      const ctx_r20 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r20.tableSelected.emit(table_r19));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "fa-icon", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "span", 29);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const table_r19 = ctx.$implicit;
    const ctx_r18 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassProp"]("selected", (ctx_r18.selectedTable == null ? null : ctx_r18.selectedTable.name) === table_r19.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r18.faTable);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](table_r19.name);
  }
}
function DfSchemaTreeComponent_div_0_mat_nav_list_13_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "mat-nav-list", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, DfSchemaTreeComponent_div_0_mat_nav_list_13_a_1_Template, 4, 4, "a", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r7 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngForOf", ctx_r7.filteredTables);
  }
}
function DfSchemaTreeComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r23 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 1)(1, "div", 2)(2, "button", 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function DfSchemaTreeComponent_div_0_Template_button_click_2_listener() {
      _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵrestoreView"](_r23);
      const ctx_r22 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵresetView"](ctx_r22.backClicked.emit());
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "mat-icon");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](4, "arrow_back");
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](5, "fa-icon", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](6, "span", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](8, DfSchemaTreeComponent_div_0_div_8_Template, 5, 2, "div", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](9, DfSchemaTreeComponent_div_0_div_9_Template, 5, 2, "div", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](10, DfSchemaTreeComponent_div_0_div_10_Template, 4, 1, "div", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](11, DfSchemaTreeComponent_div_0_div_11_Template, 7, 2, "div", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](12, DfSchemaTreeComponent_div_0_div_12_Template, 7, 2, "div", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](13, DfSchemaTreeComponent_div_0_mat_nav_list_13_Template, 2, 1, "mat-nav-list", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const ctx_r0 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("icon", ctx_r0.faDatabase);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("matTooltip", ctx_r0.serviceLabel);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](ctx_r0.serviceLabel);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx_r0.loading && !ctx_r0.error && ctx_r0.tables.length > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx_r0.loading && !ctx_r0.error && ctx_r0.tables.length > 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r0.loading);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r0.error && !ctx_r0.loading);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx_r0.loading && !ctx_r0.error && ctx_r0.tables.length === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx_r0.loading && !ctx_r0.error && ctx_r0.filteredTables.length > 0);
  }
}
class DfSchemaTreeComponent {
  constructor() {
    this.serviceName = '';
    this.serviceLabel = '';
    this.tables = [];
    this.loading = false;
    this.error = null;
    this.selectedTable = null;
    this.tableSelected = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this.backClicked = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this.retry = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this.faTable = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faTable;
    this.faDatabase = _fortawesome_free_solid_svg_icons__WEBPACK_IMPORTED_MODULE_1__.faDatabase;
    this.searchQuery = '';
    this.filteredTables = [];
  }
  ngOnChanges(changes) {
    if (changes['tables']) {
      this.filterTables();
    }
  }
  filterTables() {
    if (!this.searchQuery) {
      this.filteredTables = this.tables;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredTables = this.tables.filter(t => t.name.toLowerCase().includes(q));
    }
  }
  static {
    this.ɵfac = function DfSchemaTreeComponent_Factory(t) {
      return new (t || DfSchemaTreeComponent)();
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: DfSchemaTreeComponent,
      selectors: [["df-schema-tree"]],
      inputs: {
        serviceName: "serviceName",
        serviceLabel: "serviceLabel",
        tables: "tables",
        loading: "loading",
        error: "error",
        selectedTable: "selectedTable"
      },
      outputs: {
        tableSelected: "tableSelected",
        backClicked: "backClicked",
        retry: "retry"
      },
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵNgOnChangesFeature"], _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵStandaloneFeature"]],
      decls: 1,
      vars: 1,
      consts: [["class", "schema-tree", 4, "transloco", "translocoScope"], [1, "schema-tree"], [1, "panel-header"], ["mat-icon-button", "", 1, "back-btn", 3, "click"], [1, "header-icon", 3, "icon"], [1, "header-title", 3, "matTooltip"], ["class", "search-box", 4, "ngIf"], ["class", "tables-header", 4, "ngIf"], ["class", "loading-state", 4, "ngIf"], ["class", "error-state", 4, "ngIf"], ["class", "empty-state", 4, "ngIf"], ["class", "table-list", 4, "ngIf"], [1, "search-box"], ["appearance", "outline", 1, "search-field"], ["matPrefix", ""], ["matInput", "", 3, "placeholder", "ngModel", "ngModelChange"], [1, "tables-header"], [1, "tables-label"], [1, "tables-count"], [1, "loading-state"], ["diameter", "32"], [1, "error-state"], ["color", "warn"], ["mat-stroked-button", "", "color", "primary", 3, "click"], [1, "empty-state"], [1, "table-list"], ["mat-list-item", "", "class", "table-item", 3, "selected", "click", 4, "ngFor", "ngForOf"], ["mat-list-item", "", 1, "table-item", 3, "click"], [1, "table-icon", 3, "icon"], [1, "table-name"]],
      template: function DfSchemaTreeComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](0, DfSchemaTreeComponent_div_0_Template, 14, 9, "div", 0);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("translocoScope", "dataExplorer");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_2__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_2__.NgFor, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.FormsModule, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.DefaultValueAccessor, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.NgControlStatus, _angular_forms__WEBPACK_IMPORTED_MODULE_3__.NgModel, _angular_material_list__WEBPACK_IMPORTED_MODULE_4__.MatListModule, _angular_material_list__WEBPACK_IMPORTED_MODULE_4__.MatNavList, _angular_material_list__WEBPACK_IMPORTED_MODULE_4__.MatListItem, _angular_material_icon__WEBPACK_IMPORTED_MODULE_5__.MatIconModule, _angular_material_icon__WEBPACK_IMPORTED_MODULE_5__.MatIcon, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatButtonModule, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatButton, _angular_material_button__WEBPACK_IMPORTED_MODULE_6__.MatIconButton, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_7__.MatProgressSpinnerModule, _angular_material_progress_spinner__WEBPACK_IMPORTED_MODULE_7__.MatProgressSpinner, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_8__.MatFormFieldModule, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_8__.MatFormField, _angular_material_form_field__WEBPACK_IMPORTED_MODULE_8__.MatPrefix, _angular_material_input__WEBPACK_IMPORTED_MODULE_9__.MatInputModule, _angular_material_input__WEBPACK_IMPORTED_MODULE_9__.MatInput, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_10__.MatTooltipModule, _angular_material_tooltip__WEBPACK_IMPORTED_MODULE_10__.MatTooltip, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__.TranslocoModule, _ngneat_transloco__WEBPACK_IMPORTED_MODULE_11__.TranslocoDirective, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_12__.FontAwesomeModule, _fortawesome_angular_fontawesome__WEBPACK_IMPORTED_MODULE_12__.FaIconComponent],
      styles: [".schema-tree[_ngcontent-%COMP%] {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 0 12px 0 8px;\n  height: 49px;\n  box-sizing: border-box;\n  border-bottom: 1px solid #e0e0e0;\n  font-weight: 500;\n  font-size: 14px;\n  color: #424242;\n}\n.panel-header[_ngcontent-%COMP%]   .back-btn[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  width: 36px;\n  height: 36px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.panel-header[_ngcontent-%COMP%]   .back-btn[_ngcontent-%COMP%]     .mat-mdc-button-touch-target {\n  width: 36px;\n  height: 36px;\n}\n.panel-header[_ngcontent-%COMP%]   .back-btn[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%] {\n  font-size: 20px;\n  width: 20px;\n  height: 20px;\n}\n.panel-header[_ngcontent-%COMP%]   .header-icon[_ngcontent-%COMP%] {\n  color: #7b1fa2;\n  font-size: 16px;\n  flex-shrink: 0;\n}\n.panel-header[_ngcontent-%COMP%]   .header-title[_ngcontent-%COMP%] {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  flex: 1;\n  min-width: 0;\n}\n\n.dark-theme[_nghost-%COMP%]   .panel-header[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .panel-header[_ngcontent-%COMP%] {\n  border-bottom-color: #424242;\n  color: #e0e0e0;\n}\n.dark-theme[_nghost-%COMP%]   .panel-header[_ngcontent-%COMP%]   .header-icon[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .panel-header[_ngcontent-%COMP%]   .header-icon[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n\n.search-box[_ngcontent-%COMP%] {\n  padding: 12px 12px 0;\n}\n.search-box[_ngcontent-%COMP%]   .search-field[_ngcontent-%COMP%] {\n  width: 100%;\n}\n.search-box[_ngcontent-%COMP%]   .search-field[_ngcontent-%COMP%]     .mat-mdc-form-field-infix {\n  min-height: 44px;\n  padding: 8px 0 !important;\n  display: flex;\n  align-items: center;\n}\n.search-box[_ngcontent-%COMP%]   .search-field[_ngcontent-%COMP%]     .mat-mdc-text-field-wrapper {\n  padding: 0 12px;\n}\n.search-box[_ngcontent-%COMP%]   .search-field[_ngcontent-%COMP%]     .mat-mdc-form-field-icon-prefix {\n  padding: 0 8px 0 0;\n  display: flex;\n  align-items: center;\n}\n.search-box[_ngcontent-%COMP%]   .search-field[_ngcontent-%COMP%]     input.mat-mdc-input-element {\n  font-size: 14px;\n  line-height: 1.4;\n  height: auto;\n}\n.search-box[_ngcontent-%COMP%]   .search-field[_ngcontent-%COMP%]     .mat-mdc-form-field-subscript-wrapper {\n  display: none;\n}\n\n.tables-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 16px 4px;\n  font-size: 11px;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  color: #9e9e9e;\n  font-weight: 600;\n}\n.tables-header[_ngcontent-%COMP%]   .tables-count[_ngcontent-%COMP%] {\n  background: #e0e0e0;\n  border-radius: 10px;\n  padding: 1px 8px;\n  font-size: 11px;\n  font-weight: 500;\n  color: #616161;\n}\n\n.dark-theme[_nghost-%COMP%]   .tables-header[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .tables-header[_ngcontent-%COMP%] {\n  color: #757575;\n}\n.dark-theme[_nghost-%COMP%]   .tables-header[_ngcontent-%COMP%]   .tables-count[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .tables-header[_ngcontent-%COMP%]   .tables-count[_ngcontent-%COMP%] {\n  background: #424242;\n  color: #bdbdbd;\n}\n\n.loading-state[_ngcontent-%COMP%], .error-state[_ngcontent-%COMP%], .empty-state[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 12px;\n  padding: 32px 16px;\n  text-align: center;\n  color: #757575;\n  font-size: 13px;\n}\n\n.table-list[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  padding-top: 0;\n}\n\n.table-item[_ngcontent-%COMP%] {\n  height: 40px !important;\n  padding: 0 16px !important;\n  font-size: 13px;\n  cursor: pointer;\n}\n.table-item[_ngcontent-%COMP%]     .mdc-list-item__primary-text {\n  display: flex !important;\n  align-items: center;\n  width: 100%;\n}\n.table-item[_ngcontent-%COMP%]   .table-icon[_ngcontent-%COMP%] {\n  color: #7b1fa2;\n  font-size: 13px;\n  margin-right: 10px;\n  flex-shrink: 0;\n  pointer-events: none;\n}\n.table-item[_ngcontent-%COMP%]   .table-name[_ngcontent-%COMP%] {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  pointer-events: none;\n}\n.table-item.selected[_ngcontent-%COMP%] {\n  background: rgba(123, 31, 162, 0.08);\n  font-weight: 500;\n}\n\n.dark-theme[_nghost-%COMP%]   .table-item[_ngcontent-%COMP%]   .table-icon[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .table-item[_ngcontent-%COMP%]   .table-icon[_ngcontent-%COMP%] {\n  color: #ce93d8;\n}\n.dark-theme[_nghost-%COMP%]   .table-item.selected[_ngcontent-%COMP%], .dark-theme   [_nghost-%COMP%]   .table-item.selected[_ngcontent-%COMP%] {\n  background: rgba(206, 147, 216, 0.12);\n}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8uL3NyYy9hcHAvYWRmLWRhdGEtZXhwbG9yZXIvZGYtc2NoZW1hLXRyZWUuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNNO0VBQ0UsWUFBQTtFQUNBLGFBQUE7RUFDQSxzQkFBQTtBQUFSOztBQUdNO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsUUFBQTtFQUNBLHFCQUFBO0VBQ0EsWUFBQTtFQUNBLHNCQUFBO0VBQ0EsZ0NBQUE7RUFDQSxnQkFBQTtFQUNBLGVBQUE7RUFDQSxjQUFBO0FBQVI7QUFFUTtFQUNFLGNBQUE7RUFDQSxXQUFBO0VBQ0EsWUFBQTtFQUNBLGFBQUE7RUFDQSxtQkFBQTtFQUNBLHVCQUFBO0FBQVY7QUFFVTtFQUNFLFdBQUE7RUFDQSxZQUFBO0FBQVo7QUFHVTtFQUNFLGVBQUE7RUFDQSxXQUFBO0VBQ0EsWUFBQTtBQURaO0FBS1E7RUFDRSxjQUFBO0VBQ0EsZUFBQTtFQUNBLGNBQUE7QUFIVjtBQU1RO0VBQ0UsbUJBQUE7RUFDQSxnQkFBQTtFQUNBLHVCQUFBO0VBQ0EsT0FBQTtFQUNBLFlBQUE7QUFKVjs7QUFRTTtFQUNFLDRCQUFBO0VBQ0EsY0FBQTtBQUxSO0FBTVE7RUFDRSxjQUFBO0FBSlY7O0FBUU07RUFDRSxvQkFBQTtBQUxSO0FBT1E7RUFDRSxXQUFBO0FBTFY7QUFPVTtFQUNFLGdCQUFBO0VBQ0EseUJBQUE7RUFDQSxhQUFBO0VBQ0EsbUJBQUE7QUFMWjtBQU9VO0VBQ0UsZUFBQTtBQUxaO0FBT1U7RUFDRSxrQkFBQTtFQUNBLGFBQUE7RUFDQSxtQkFBQTtBQUxaO0FBT1U7RUFDRSxlQUFBO0VBQ0EsZ0JBQUE7RUFDQSxZQUFBO0FBTFo7QUFPVTtFQUNFLGFBQUE7QUFMWjs7QUFVTTtFQUNFLGFBQUE7RUFDQSxtQkFBQTtFQUNBLDhCQUFBO0VBQ0EscUJBQUE7RUFDQSxlQUFBO0VBQ0EseUJBQUE7RUFDQSxxQkFBQTtFQUNBLGNBQUE7RUFDQSxnQkFBQTtBQVBSO0FBU1E7RUFDRSxtQkFBQTtFQUNBLG1CQUFBO0VBQ0EsZ0JBQUE7RUFDQSxlQUFBO0VBQ0EsZ0JBQUE7RUFDQSxjQUFBO0FBUFY7O0FBV007RUFDRSxjQUFBO0FBUlI7QUFTUTtFQUNFLG1CQUFBO0VBQ0EsY0FBQTtBQVBWOztBQVdNOzs7RUFHRSxhQUFBO0VBQ0Esc0JBQUE7RUFDQSxtQkFBQTtFQUNBLFNBQUE7RUFDQSxrQkFBQTtFQUNBLGtCQUFBO0VBQ0EsY0FBQTtFQUNBLGVBQUE7QUFSUjs7QUFXTTtFQUNFLE9BQUE7RUFDQSxnQkFBQTtFQUNBLGNBQUE7QUFSUjs7QUFXTTtFQUNFLHVCQUFBO0VBQ0EsMEJBQUE7RUFDQSxlQUFBO0VBQ0EsZUFBQTtBQVJSO0FBVVE7RUFDRSx3QkFBQTtFQUNBLG1CQUFBO0VBQ0EsV0FBQTtBQVJWO0FBV1E7RUFDRSxjQUFBO0VBQ0EsZUFBQTtFQUNBLGtCQUFBO0VBQ0EsY0FBQTtFQUNBLG9CQUFBO0FBVFY7QUFZUTtFQUNFLG1CQUFBO0VBQ0EsZ0JBQUE7RUFDQSx1QkFBQTtFQUNBLG9CQUFBO0FBVlY7QUFhUTtFQUNFLG9DQUFBO0VBQ0EsZ0JBQUE7QUFYVjs7QUFnQlE7RUFDRSxjQUFBO0FBYlY7QUFlUTtFQUNFLHFDQUFBO0FBYlYiLCJzb3VyY2VzQ29udGVudCI6WyJcbiAgICAgIC5zY2hlbWEtdHJlZSB7XG4gICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgIH1cblxuICAgICAgLnBhbmVsLWhlYWRlciB7XG4gICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIGdhcDogOHB4O1xuICAgICAgICBwYWRkaW5nOiAwIDEycHggMCA4cHg7XG4gICAgICAgIGhlaWdodDogNDlweDtcbiAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlMGUwZTA7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgY29sb3I6ICM0MjQyNDI7XG5cbiAgICAgICAgLmJhY2stYnRuIHtcbiAgICAgICAgICBmbGV4LXNocmluazogMDtcbiAgICAgICAgICB3aWR0aDogMzZweDtcbiAgICAgICAgICBoZWlnaHQ6IDM2cHg7XG4gICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuXG4gICAgICAgICAgOjpuZy1kZWVwIC5tYXQtbWRjLWJ1dHRvbi10b3VjaC10YXJnZXQge1xuICAgICAgICAgICAgd2lkdGg6IDM2cHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDM2cHg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbWF0LWljb24ge1xuICAgICAgICAgICAgZm9udC1zaXplOiAyMHB4O1xuICAgICAgICAgICAgd2lkdGg6IDIwcHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDIwcHg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLmhlYWRlci1pY29uIHtcbiAgICAgICAgICBjb2xvcjogIzdiMWZhMjtcbiAgICAgICAgICBmb250LXNpemU6IDE2cHg7XG4gICAgICAgICAgZmxleC1zaHJpbms6IDA7XG4gICAgICAgIH1cblxuICAgICAgICAuaGVhZGVyLXRpdGxlIHtcbiAgICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgICAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICBtaW4td2lkdGg6IDA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgOmhvc3QtY29udGV4dCguZGFyay10aGVtZSkgLnBhbmVsLWhlYWRlciB7XG4gICAgICAgIGJvcmRlci1ib3R0b20tY29sb3I6ICM0MjQyNDI7XG4gICAgICAgIGNvbG9yOiAjZTBlMGUwO1xuICAgICAgICAuaGVhZGVyLWljb24ge1xuICAgICAgICAgIGNvbG9yOiAjY2U5M2Q4O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC5zZWFyY2gtYm94IHtcbiAgICAgICAgcGFkZGluZzogMTJweCAxMnB4IDA7XG5cbiAgICAgICAgLnNlYXJjaC1maWVsZCB7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG5cbiAgICAgICAgICA6Om5nLWRlZXAgLm1hdC1tZGMtZm9ybS1maWVsZC1pbmZpeCB7XG4gICAgICAgICAgICBtaW4taGVpZ2h0OiA0NHB4O1xuICAgICAgICAgICAgcGFkZGluZzogOHB4IDAgIWltcG9ydGFudDtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIH1cbiAgICAgICAgICA6Om5nLWRlZXAgLm1hdC1tZGMtdGV4dC1maWVsZC13cmFwcGVyIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDAgMTJweDtcbiAgICAgICAgICB9XG4gICAgICAgICAgOjpuZy1kZWVwIC5tYXQtbWRjLWZvcm0tZmllbGQtaWNvbi1wcmVmaXgge1xuICAgICAgICAgICAgcGFkZGluZzogMCA4cHggMCAwO1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIDo6bmctZGVlcCBpbnB1dC5tYXQtbWRjLWlucHV0LWVsZW1lbnQge1xuICAgICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEuNDtcbiAgICAgICAgICAgIGhlaWdodDogYXV0bztcbiAgICAgICAgICB9XG4gICAgICAgICAgOjpuZy1kZWVwIC5tYXQtbWRjLWZvcm0tZmllbGQtc3Vic2NyaXB0LXdyYXBwZXIge1xuICAgICAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLnRhYmxlcy1oZWFkZXIge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgICAgIHBhZGRpbmc6IDhweCAxNnB4IDRweDtcbiAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICAgICAgICBsZXR0ZXItc3BhY2luZzogMC41cHg7XG4gICAgICAgIGNvbG9yOiAjOWU5ZTllO1xuICAgICAgICBmb250LXdlaWdodDogNjAwO1xuXG4gICAgICAgIC50YWJsZXMtY291bnQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICNlMGUwZTA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICAgICAgICBwYWRkaW5nOiAxcHggOHB4O1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIGNvbG9yOiAjNjE2MTYxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIDpob3N0LWNvbnRleHQoLmRhcmstdGhlbWUpIC50YWJsZXMtaGVhZGVyIHtcbiAgICAgICAgY29sb3I6ICM3NTc1NzU7XG4gICAgICAgIC50YWJsZXMtY291bnQge1xuICAgICAgICAgIGJhY2tncm91bmQ6ICM0MjQyNDI7XG4gICAgICAgICAgY29sb3I6ICNiZGJkYmQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLmxvYWRpbmctc3RhdGUsXG4gICAgICAuZXJyb3Itc3RhdGUsXG4gICAgICAuZW1wdHktc3RhdGUge1xuICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgIHBhZGRpbmc6IDMycHggMTZweDtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBjb2xvcjogIzc1NzU3NTtcbiAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgfVxuXG4gICAgICAudGFibGUtbGlzdCB7XG4gICAgICAgIGZsZXg6IDE7XG4gICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgIHBhZGRpbmctdG9wOiAwO1xuICAgICAgfVxuXG4gICAgICAudGFibGUtaXRlbSB7XG4gICAgICAgIGhlaWdodDogNDBweCAhaW1wb3J0YW50O1xuICAgICAgICBwYWRkaW5nOiAwIDE2cHggIWltcG9ydGFudDtcbiAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG5cbiAgICAgICAgOjpuZy1kZWVwIC5tZGMtbGlzdC1pdGVtX19wcmltYXJ5LXRleHQge1xuICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRhYmxlLWljb24ge1xuICAgICAgICAgIGNvbG9yOiAjN2IxZmEyO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgICAgICBtYXJnaW4tcmlnaHQ6IDEwcHg7XG4gICAgICAgICAgZmxleC1zaHJpbms6IDA7XG4gICAgICAgICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgICAgIH1cblxuICAgICAgICAudGFibGUtbmFtZSB7XG4gICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICAgICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgJi5zZWxlY3RlZCB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgxMjMsIDMxLCAxNjIsIDAuMDgpO1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgOmhvc3QtY29udGV4dCguZGFyay10aGVtZSkgLnRhYmxlLWl0ZW0ge1xuICAgICAgICAudGFibGUtaWNvbiB7XG4gICAgICAgICAgY29sb3I6ICNjZTkzZDg7XG4gICAgICAgIH1cbiAgICAgICAgJi5zZWxlY3RlZCB7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyMDYsIDE0NywgMjE2LCAwLjEyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICJdLCJzb3VyY2VSb290IjoiIn0= */"]
    });
  }
}

/***/ }),

/***/ 40903:
/*!*********************************************************************!*\
  !*** ./src/app/adf-data-explorer/services/data-explorer.service.ts ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DataExplorerService: () => (/* binding */ DataExplorerService)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common/http */ 46443);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs */ 61873);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs */ 43942);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! rxjs/operators */ 70271);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rxjs/operators */ 36647);
/* harmony import */ var _shared_constants_urls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/constants/urls */ 63532);






const DB_GROUPS = ['Database', 'Big Data'];
class DataExplorerService {
  constructor() {
    this.http = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.inject)(_angular_common_http__WEBPACK_IMPORTED_MODULE_2__.HttpClient);
  }
  getDatabaseServices() {
    // Step 1: Get service type names for Database and Big Data groups
    const typeRequests = DB_GROUPS.map(group => this.http.get(`${_shared_constants_urls__WEBPACK_IMPORTED_MODULE_0__.BASE_URL}/system/service_type`, {
      params: {
        fields: 'name',
        group
      },
      headers: {
        'show-loading': '',
        'Cache-Control': 'no-cache, private'
      }
    }));
    return (0,rxjs__WEBPACK_IMPORTED_MODULE_3__.forkJoin)(typeRequests).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_4__.map)(responses => responses.flatMap(r => r.resource || []).map(t => t.name)), (0,rxjs_operators__WEBPACK_IMPORTED_MODULE_5__.switchMap)(typeNames => {
      if (typeNames.length === 0) {
        return new rxjs__WEBPACK_IMPORTED_MODULE_6__.Observable(sub => {
          sub.next([]);
          sub.complete();
        });
      }
      const typeFilter = `(type in ("${typeNames.join('","')}"))`;
      return this.http.get(`${_shared_constants_urls__WEBPACK_IMPORTED_MODULE_0__.BASE_URL}/system/service`, {
        params: {
          filter: typeFilter,
          fields: 'id,name,label,description,type',
          limit: '100',
          sort: 'name'
        },
        headers: {
          'show-loading': '',
          'Cache-Control': 'no-cache, private'
        }
      }).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_4__.map)(res => (res.resource || []).filter(s => s.isActive !== false)));
    }));
  }
  getSchema(serviceName) {
    return this.http.get(`${_shared_constants_urls__WEBPACK_IMPORTED_MODULE_0__.BASE_URL}/${serviceName}/_schema`, {
      headers: {
        'show-loading': ''
      }
    }).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_4__.map)(res => (res.resource || []).sort((a, b) => a.name.localeCompare(b.name))));
  }
  getTableSchema(serviceName, tableName) {
    return this.http.get(`${_shared_constants_urls__WEBPACK_IMPORTED_MODULE_0__.BASE_URL}/${serviceName}/_schema/${tableName}`, {
      params: {
        refresh: 'true'
      },
      headers: {
        'show-loading': ''
      }
    });
  }
  getTableData(serviceName, tableName, limit = 50, offset = 0, order, filter) {
    const params = {
      limit: limit.toString(),
      offset: offset.toString(),
      include_count: 'true'
    };
    if (order) {
      params.order = order;
    }
    if (filter) {
      params.filter = filter;
    }
    return this.http.get(`${_shared_constants_urls__WEBPACK_IMPORTED_MODULE_0__.BASE_URL}/${serviceName}/_table/${tableName}`, {
      params,
      headers: {
        'show-loading': ''
      }
    });
  }
  static {
    this.ɵfac = function DataExplorerService_Factory(t) {
      return new (t || DataExplorerService)();
    };
  }
  static {
    this.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineInjectable"]({
      token: DataExplorerService,
      factory: DataExplorerService.ɵfac,
      providedIn: 'root'
    });
  }
}

/***/ }),

/***/ 16256:
/*!***********************************************************!*\
  !*** ./node_modules/@angular/material/fesm2022/badge.mjs ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MatBadge: () => (/* binding */ MatBadge),
/* harmony export */   MatBadgeModule: () => (/* binding */ MatBadgeModule)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/platform-browser/animations */ 37580);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var _angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/cdk/a11y */ 72102);
/* harmony import */ var _angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/cdk/coercion */ 2814);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common */ 60316);








let nextId = 0;
// Boilerplate for applying mixins to MatBadge.
/** @docs-private */
const _MatBadgeBase = (0,_angular_material_core__WEBPACK_IMPORTED_MODULE_0__.mixinDisabled)(class {});
const BADGE_CONTENT_CLASS = 'mat-badge-content';
/** Directive to display a text badge. */
class MatBadge extends _MatBadgeBase {
  /** The color of the badge. Can be `primary`, `accent`, or `warn`. */
  get color() {
    return this._color;
  }
  set color(value) {
    this._setColor(value);
    this._color = value;
  }
  /** Whether the badge should overlap its contents or not */
  get overlap() {
    return this._overlap;
  }
  set overlap(val) {
    this._overlap = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_1__.coerceBooleanProperty)(val);
  }
  /** The content for the badge */
  get content() {
    return this._content;
  }
  set content(newContent) {
    this._updateRenderedContent(newContent);
  }
  /** Message used to describe the decorated element via aria-describedby */
  get description() {
    return this._description;
  }
  set description(newDescription) {
    this._updateDescription(newDescription);
  }
  /** Whether the badge is hidden. */
  get hidden() {
    return this._hidden;
  }
  set hidden(val) {
    this._hidden = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_1__.coerceBooleanProperty)(val);
  }
  constructor(_ngZone, _elementRef, _ariaDescriber, _renderer, _animationMode) {
    super();
    this._ngZone = _ngZone;
    this._elementRef = _elementRef;
    this._ariaDescriber = _ariaDescriber;
    this._renderer = _renderer;
    this._animationMode = _animationMode;
    this._color = 'primary';
    this._overlap = true;
    /**
     * Position the badge should reside.
     * Accepts any combination of 'above'|'below' and 'before'|'after'
     */
    this.position = 'above after';
    /** Size of the badge. Can be 'small', 'medium', or 'large'. */
    this.size = 'medium';
    /** Unique id for the badge */
    this._id = nextId++;
    /** Whether the OnInit lifecycle hook has run yet */
    this._isInitialized = false;
    /** InteractivityChecker to determine if the badge host is focusable. */
    this._interactivityChecker = (0,_angular_core__WEBPACK_IMPORTED_MODULE_2__.inject)(_angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_3__.InteractivityChecker);
    this._document = (0,_angular_core__WEBPACK_IMPORTED_MODULE_2__.inject)(_angular_common__WEBPACK_IMPORTED_MODULE_4__.DOCUMENT);
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      const nativeElement = _elementRef.nativeElement;
      if (nativeElement.nodeType !== nativeElement.ELEMENT_NODE) {
        throw Error('matBadge must be attached to an element node.');
      }
      const matIconTagName = 'mat-icon';
      // Heads-up for developers to avoid putting matBadge on <mat-icon>
      // as it is aria-hidden by default docs mention this at:
      // https://material.angular.io/components/badge/overview#accessibility
      if (nativeElement.tagName.toLowerCase() === matIconTagName && nativeElement.getAttribute('aria-hidden') === 'true') {
        console.warn(`Detected a matBadge on an "aria-hidden" "<mat-icon>". ` + `Consider setting aria-hidden="false" in order to surface the information assistive technology.` + `\n${nativeElement.outerHTML}`);
      }
    }
  }
  /** Whether the badge is above the host or not */
  isAbove() {
    return this.position.indexOf('below') === -1;
  }
  /** Whether the badge is after the host or not */
  isAfter() {
    return this.position.indexOf('before') === -1;
  }
  /**
   * Gets the element into which the badge's content is being rendered. Undefined if the element
   * hasn't been created (e.g. if the badge doesn't have content).
   */
  getBadgeElement() {
    return this._badgeElement;
  }
  ngOnInit() {
    // We may have server-side rendered badge that we need to clear.
    // We need to do this in ngOnInit because the full content of the component
    // on which the badge is attached won't necessarily be in the DOM until this point.
    this._clearExistingBadges();
    if (this.content && !this._badgeElement) {
      this._badgeElement = this._createBadgeElement();
      this._updateRenderedContent(this.content);
    }
    this._isInitialized = true;
  }
  ngOnDestroy() {
    // ViewEngine only: when creating a badge through the Renderer, Angular remembers its index.
    // We have to destroy it ourselves, otherwise it'll be retained in memory.
    if (this._renderer.destroyNode) {
      this._renderer.destroyNode(this._badgeElement);
      this._inlineBadgeDescription?.remove();
    }
    this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this.description);
  }
  /** Gets whether the badge's host element is interactive. */
  _isHostInteractive() {
    // Ignore visibility since it requires an expensive style caluclation.
    return this._interactivityChecker.isFocusable(this._elementRef.nativeElement, {
      ignoreVisibility: true
    });
  }
  /** Creates the badge element */
  _createBadgeElement() {
    const badgeElement = this._renderer.createElement('span');
    const activeClass = 'mat-badge-active';
    badgeElement.setAttribute('id', `mat-badge-content-${this._id}`);
    // The badge is aria-hidden because we don't want it to appear in the page's navigation
    // flow. Instead, we use the badge to describe the decorated element with aria-describedby.
    badgeElement.setAttribute('aria-hidden', 'true');
    badgeElement.classList.add(BADGE_CONTENT_CLASS);
    if (this._animationMode === 'NoopAnimations') {
      badgeElement.classList.add('_mat-animation-noopable');
    }
    this._elementRef.nativeElement.appendChild(badgeElement);
    // animate in after insertion
    if (typeof requestAnimationFrame === 'function' && this._animationMode !== 'NoopAnimations') {
      this._ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          badgeElement.classList.add(activeClass);
        });
      });
    } else {
      badgeElement.classList.add(activeClass);
    }
    return badgeElement;
  }
  /** Update the text content of the badge element in the DOM, creating the element if necessary. */
  _updateRenderedContent(newContent) {
    const newContentNormalized = `${newContent ?? ''}`.trim();
    // Don't create the badge element if the directive isn't initialized because we want to
    // append the badge element to the *end* of the host element's content for backwards
    // compatibility.
    if (this._isInitialized && newContentNormalized && !this._badgeElement) {
      this._badgeElement = this._createBadgeElement();
    }
    if (this._badgeElement) {
      this._badgeElement.textContent = newContentNormalized;
    }
    this._content = newContentNormalized;
  }
  /** Updates the host element's aria description via AriaDescriber. */
  _updateDescription(newDescription) {
    // Always start by removing the aria-describedby; we will add a new one if necessary.
    this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this.description);
    // NOTE: We only check whether the host is interactive here, which happens during
    // when then badge content changes. It is possible that the host changes
    // interactivity status separate from one of these. However, watching the interactivity
    // status of the host would require a `MutationObserver`, which is likely more code + overhead
    // than it's worth; from usages inside Google, we see that the vats majority of badges either
    // never change interactivity, or also set `matBadgeHidden` based on the same condition.
    if (!newDescription || this._isHostInteractive()) {
      this._removeInlineDescription();
    }
    this._description = newDescription;
    // We don't add `aria-describedby` for non-interactive hosts elements because we
    // instead insert the description inline.
    if (this._isHostInteractive()) {
      this._ariaDescriber.describe(this._elementRef.nativeElement, newDescription);
    } else {
      this._updateInlineDescription();
    }
  }
  _updateInlineDescription() {
    // Create the inline description element if it doesn't exist
    if (!this._inlineBadgeDescription) {
      this._inlineBadgeDescription = this._document.createElement('span');
      this._inlineBadgeDescription.classList.add('cdk-visually-hidden');
    }
    this._inlineBadgeDescription.textContent = this.description;
    this._badgeElement?.appendChild(this._inlineBadgeDescription);
  }
  _removeInlineDescription() {
    this._inlineBadgeDescription?.remove();
    this._inlineBadgeDescription = undefined;
  }
  /** Adds css theme class given the color to the component host */
  _setColor(colorPalette) {
    const classList = this._elementRef.nativeElement.classList;
    classList.remove(`mat-badge-${this._color}`);
    if (colorPalette) {
      classList.add(`mat-badge-${colorPalette}`);
    }
  }
  /** Clears any existing badges that might be left over from server-side rendering. */
  _clearExistingBadges() {
    // Only check direct children of this host element in order to avoid deleting
    // any badges that might exist in descendant elements.
    const badges = this._elementRef.nativeElement.querySelectorAll(`:scope > .${BADGE_CONTENT_CLASS}`);
    for (const badgeElement of Array.from(badges)) {
      if (badgeElement !== this._badgeElement) {
        badgeElement.remove();
      }
    }
  }
  static {
    this.ɵfac = function MatBadge_Factory(t) {
      return new (t || MatBadge)(_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_2__.NgZone), _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_2__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdirectiveInject"](_angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_3__.AriaDescriber), _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_2__.Renderer2), _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_2__.ANIMATION_MODULE_TYPE, 8));
    };
  }
  static {
    this.ɵdir = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineDirective"]({
      type: MatBadge,
      selectors: [["", "matBadge", ""]],
      hostAttrs: [1, "mat-badge"],
      hostVars: 20,
      hostBindings: function MatBadge_HostBindings(rf, ctx) {
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵclassProp"]("mat-badge-overlap", ctx.overlap)("mat-badge-above", ctx.isAbove())("mat-badge-below", !ctx.isAbove())("mat-badge-before", !ctx.isAfter())("mat-badge-after", ctx.isAfter())("mat-badge-small", ctx.size === "small")("mat-badge-medium", ctx.size === "medium")("mat-badge-large", ctx.size === "large")("mat-badge-hidden", ctx.hidden || !ctx.content)("mat-badge-disabled", ctx.disabled);
        }
      },
      inputs: {
        disabled: ["matBadgeDisabled", "disabled"],
        color: ["matBadgeColor", "color"],
        overlap: ["matBadgeOverlap", "overlap"],
        position: ["matBadgePosition", "position"],
        content: ["matBadge", "content"],
        description: ["matBadgeDescription", "description"],
        size: ["matBadgeSize", "size"],
        hidden: ["matBadgeHidden", "hidden"]
      },
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵInheritDefinitionFeature"]]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵsetClassMetadata"](MatBadge, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Directive,
    args: [{
      selector: '[matBadge]',
      inputs: ['disabled: matBadgeDisabled'],
      host: {
        'class': 'mat-badge',
        '[class.mat-badge-overlap]': 'overlap',
        '[class.mat-badge-above]': 'isAbove()',
        '[class.mat-badge-below]': '!isAbove()',
        '[class.mat-badge-before]': '!isAfter()',
        '[class.mat-badge-after]': 'isAfter()',
        '[class.mat-badge-small]': 'size === "small"',
        '[class.mat-badge-medium]': 'size === "medium"',
        '[class.mat-badge-large]': 'size === "large"',
        '[class.mat-badge-hidden]': 'hidden || !content',
        '[class.mat-badge-disabled]': 'disabled'
      }
    }]
  }], function () {
    return [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.NgZone
    }, {
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.ElementRef
    }, {
      type: _angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_3__.AriaDescriber
    }, {
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Renderer2
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Optional
      }, {
        type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Inject,
        args: [_angular_core__WEBPACK_IMPORTED_MODULE_2__.ANIMATION_MODULE_TYPE]
      }]
    }];
  }, {
    color: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Input,
      args: ['matBadgeColor']
    }],
    overlap: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Input,
      args: ['matBadgeOverlap']
    }],
    position: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Input,
      args: ['matBadgePosition']
    }],
    content: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Input,
      args: ['matBadge']
    }],
    description: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Input,
      args: ['matBadgeDescription']
    }],
    size: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Input,
      args: ['matBadgeSize']
    }],
    hidden: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.Input,
      args: ['matBadgeHidden']
    }]
  });
})();
class MatBadgeModule {
  static {
    this.ɵfac = function MatBadgeModule_Factory(t) {
      return new (t || MatBadgeModule)();
    };
  }
  static {
    this.ɵmod = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineNgModule"]({
      type: MatBadgeModule
    });
  }
  static {
    this.ɵinj = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineInjector"]({
      imports: [_angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_3__.A11yModule, _angular_material_core__WEBPACK_IMPORTED_MODULE_0__.MatCommonModule, _angular_material_core__WEBPACK_IMPORTED_MODULE_0__.MatCommonModule]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵsetClassMetadata"](MatBadgeModule, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_2__.NgModule,
    args: [{
      imports: [_angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_3__.A11yModule, _angular_material_core__WEBPACK_IMPORTED_MODULE_0__.MatCommonModule],
      exports: [MatBadge, _angular_material_core__WEBPACK_IMPORTED_MODULE_0__.MatCommonModule],
      declarations: [MatBadge]
    }]
  }], null, null);
})();

/**
 * Generated bundle index. Do not edit.
 */



/***/ }),

/***/ 12772:
/*!***********************************************************!*\
  !*** ./node_modules/@angular/material/fesm2022/chips.mjs ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MAT_CHIP: () => (/* binding */ MAT_CHIP),
/* harmony export */   MAT_CHIPS_DEFAULT_OPTIONS: () => (/* binding */ MAT_CHIPS_DEFAULT_OPTIONS),
/* harmony export */   MAT_CHIP_AVATAR: () => (/* binding */ MAT_CHIP_AVATAR),
/* harmony export */   MAT_CHIP_LISTBOX_CONTROL_VALUE_ACCESSOR: () => (/* binding */ MAT_CHIP_LISTBOX_CONTROL_VALUE_ACCESSOR),
/* harmony export */   MAT_CHIP_REMOVE: () => (/* binding */ MAT_CHIP_REMOVE),
/* harmony export */   MAT_CHIP_TRAILING_ICON: () => (/* binding */ MAT_CHIP_TRAILING_ICON),
/* harmony export */   MatChip: () => (/* binding */ MatChip),
/* harmony export */   MatChipAvatar: () => (/* binding */ MatChipAvatar),
/* harmony export */   MatChipEditInput: () => (/* binding */ MatChipEditInput),
/* harmony export */   MatChipGrid: () => (/* binding */ MatChipGrid),
/* harmony export */   MatChipGridChange: () => (/* binding */ MatChipGridChange),
/* harmony export */   MatChipInput: () => (/* binding */ MatChipInput),
/* harmony export */   MatChipListbox: () => (/* binding */ MatChipListbox),
/* harmony export */   MatChipListboxChange: () => (/* binding */ MatChipListboxChange),
/* harmony export */   MatChipOption: () => (/* binding */ MatChipOption),
/* harmony export */   MatChipRemove: () => (/* binding */ MatChipRemove),
/* harmony export */   MatChipRow: () => (/* binding */ MatChipRow),
/* harmony export */   MatChipSelectionChange: () => (/* binding */ MatChipSelectionChange),
/* harmony export */   MatChipSet: () => (/* binding */ MatChipSet),
/* harmony export */   MatChipTrailingIcon: () => (/* binding */ MatChipTrailingIcon),
/* harmony export */   MatChipsModule: () => (/* binding */ MatChipsModule)
/* harmony export */ });
/* harmony import */ var _angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/cdk/coercion */ 2814);
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 37580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @angular/common */ 60316);
/* harmony import */ var _angular_material_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/material/core */ 74646);
/* harmony import */ var _angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/cdk/a11y */ 72102);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! rxjs */ 10819);
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! rxjs */ 63617);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! rxjs/operators */ 64334);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! rxjs/operators */ 33900);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! rxjs/operators */ 63037);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! rxjs/operators */ 36647);
/* harmony import */ var _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/cdk/keycodes */ 74879);
/* harmony import */ var _angular_cdk_bidi__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/cdk/bidi */ 63680);
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @angular/forms */ 34456);
/* harmony import */ var _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @angular/material/form-field */ 24950);



















/** Injection token to be used to override the default options for the chips module. */
function MatChip_span_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "span", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1, 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
}
function MatChip_span_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "span", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1, 2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
}
const _c0 = ["*", [["mat-chip-avatar"], ["", "matChipAvatar", ""]], [["mat-chip-trailing-icon"], ["", "matChipRemove", ""], ["", "matChipTrailingIcon", ""]]];
const _c1 = ["*", "mat-chip-avatar, [matChipAvatar]", "mat-chip-trailing-icon,[matChipRemove],[matChipTrailingIcon]"];
function MatChipOption_span_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "span", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1, 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](2, "span", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnamespaceSVG"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "svg", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](4, "path", 11);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
  }
}
function MatChipOption_span_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "span", 12);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1, 2);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
}
const _c2 = ".mdc-evolution-chip,.mdc-evolution-chip__cell,.mdc-evolution-chip__action{display:inline-flex;align-items:center}.mdc-evolution-chip{position:relative;max-width:100%}.mdc-evolution-chip .mdc-elevation-overlay{width:100%;height:100%;top:0;left:0}.mdc-evolution-chip__cell,.mdc-evolution-chip__action{height:100%}.mdc-evolution-chip__cell--primary{overflow-x:hidden}.mdc-evolution-chip__cell--trailing{flex:1 0 auto}.mdc-evolution-chip__action{align-items:center;background:none;border:none;box-sizing:content-box;cursor:pointer;display:inline-flex;justify-content:center;outline:none;padding:0;text-decoration:none;color:inherit}.mdc-evolution-chip__action--presentational{cursor:auto}.mdc-evolution-chip--disabled,.mdc-evolution-chip__action:disabled{pointer-events:none}.mdc-evolution-chip__action--primary{overflow-x:hidden}.mdc-evolution-chip__action--trailing{position:relative;overflow:visible}.mdc-evolution-chip__action--primary:before{box-sizing:border-box;content:\"\";height:100%;left:0;position:absolute;pointer-events:none;top:0;width:100%;z-index:1}.mdc-evolution-chip--touch{margin-top:8px;margin-bottom:8px}.mdc-evolution-chip__action-touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}.mdc-evolution-chip__text-label{white-space:nowrap;user-select:none;text-overflow:ellipsis;overflow:hidden}.mdc-evolution-chip__graphic{align-items:center;display:inline-flex;justify-content:center;overflow:hidden;pointer-events:none;position:relative;flex:1 0 auto}.mdc-evolution-chip__checkmark{position:absolute;opacity:0;top:50%;left:50%}.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--selected):not(.mdc-evolution-chip--with-primary-icon) .mdc-evolution-chip__graphic{width:0}.mdc-evolution-chip__checkmark-background{opacity:0}.mdc-evolution-chip__checkmark-svg{display:block}.mdc-evolution-chip__checkmark-path{stroke-width:2px;stroke-dasharray:29.7833385;stroke-dashoffset:29.7833385;stroke:currentColor}.mdc-evolution-chip--selecting .mdc-evolution-chip__graphic{transition:width 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark{transition:transform 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 45ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__graphic{transition:width 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark{transition:opacity 50ms 0ms linear,transform 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-50%, -50%)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selected .mdc-evolution-chip__icon--primary{opacity:0}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark{transform:translate(-50%, -50%);opacity:1}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}@keyframes mdc-evolution-chip-enter{from{transform:scale(0.8);opacity:.4}to{transform:scale(1);opacity:1}}.mdc-evolution-chip--enter{animation:mdc-evolution-chip-enter 100ms 0ms cubic-bezier(0, 0, 0.2, 1)}@keyframes mdc-evolution-chip-exit{from{opacity:1}to{opacity:0}}.mdc-evolution-chip--exit{animation:mdc-evolution-chip-exit 75ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mdc-evolution-chip--hidden{opacity:0;pointer-events:none;transition:width 150ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mat-mdc-standard-chip{border-radius:var(--mdc-chip-container-shape-radius);height:var(--mdc-chip-container-height);--mdc-chip-container-shape-family:rounded;--mdc-chip-container-shape-radius:16px 16px 16px 16px;--mdc-chip-with-avatar-avatar-shape-family:rounded;--mdc-chip-with-avatar-avatar-shape-radius:14px 14px 14px 14px;--mdc-chip-with-avatar-avatar-size:28px;--mdc-chip-with-icon-icon-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__ripple{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:before{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{border-radius:var(--mdc-chip-with-avatar-avatar-shape-radius)}.mat-mdc-standard-chip.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--with-primary-icon){--mdc-chip-graphic-selected-width:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip .mdc-evolution-chip__graphic{height:var(--mdc-chip-with-avatar-avatar-size);width:var(--mdc-chip-with-avatar-avatar-size);font-size:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled){background-color:var(--mdc-chip-elevated-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip .mdc-evolution-chip__text-label{font-family:var(--mdc-chip-label-text-font);line-height:var(--mdc-chip-label-text-line-height);font-size:var(--mdc-chip-label-text-size);font-weight:var(--mdc-chip-label-text-weight);letter-spacing:var(--mdc-chip-label-text-tracking)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__text-label{color:var(--mdc-chip-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{height:var(--mdc-chip-with-icon-icon-size);width:var(--mdc-chip-with-icon-icon-size);font-size:var(--mdc-chip-with-icon-icon-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-trailing-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-disabled-trailing-icon-color)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary.mdc-ripple-upgraded--background-focused .mdc-evolution-chip__ripple::before,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:not(.mdc-ripple-upgraded):focus .mdc-evolution-chip__ripple::before{transition-duration:75ms;opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-chip-focus-overlay{background:var(--mdc-chip-focus-state-layer-color);opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-standard-chip .mdc-evolution-chip__checkmark{height:20px;width:20px}.mat-mdc-standard-chip .mdc-evolution-chip__icon--trailing{height:18px;width:18px;font-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color, currentColor)}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip{-webkit-tap-highlight-color:rgba(0,0,0,0)}.cdk-high-contrast-active .mat-mdc-standard-chip{outline:solid 1px}.cdk-high-contrast-active .mat-mdc-standard-chip .mdc-evolution-chip__checkmark-path{stroke:CanvasText !important}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{opacity:.4}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mat-mdc-chip-action-label{overflow:visible}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary{flex-basis:100%}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{font:inherit;letter-spacing:inherit;white-space:inherit}.mat-mdc-standard-chip .mat-mdc-chip-graphic,.mat-mdc-standard-chip .mat-mdc-chip-trailing-icon{box-sizing:content-box}.mat-mdc-standard-chip._mat-animation-noopable,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__graphic,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark-path{transition-duration:1ms;animation-duration:1ms}.mat-mdc-basic-chip .mdc-evolution-chip__action--primary{font:inherit}.mat-mdc-chip-focus-overlay{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;opacity:0;border-radius:inherit;transition:opacity 150ms linear}._mat-animation-noopable .mat-mdc-chip-focus-overlay{transition:none}.mat-mdc-basic-chip .mat-mdc-chip-focus-overlay{display:none}.mat-mdc-chip:hover .mat-mdc-chip-focus-overlay{opacity:.04}.mat-mdc-chip.cdk-focused .mat-mdc-chip-focus-overlay{opacity:.12}.mat-mdc-chip .mat-ripple.mat-mdc-chip-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-chip-avatar{text-align:center;line-height:1;color:var(--mdc-chip-with-icon-icon-color, currentColor)}.mat-mdc-chip{position:relative;z-index:0}.mat-mdc-chip-action-label{text-align:left;z-index:1}[dir=rtl] .mat-mdc-chip-action-label{text-align:right}.mat-mdc-chip.mdc-evolution-chip--with-trailing-action .mat-mdc-chip-action-label{position:relative}.mat-mdc-chip-action-label .mat-mdc-chip-primary-focus-indicator{position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none}.mat-mdc-chip-action-label .mat-mdc-focus-indicator::before{margin:calc(calc(var(--mat-mdc-focus-indicator-border-width, 3px) + 2px) * -1)}.mat-mdc-chip-remove{opacity:.54}.mat-mdc-chip-remove:focus{opacity:1}.mat-mdc-chip-remove::before{margin:calc(var(--mat-mdc-focus-indicator-border-width, 3px) * -1);left:8px;right:8px}.mat-mdc-chip-remove .mat-icon{width:inherit;height:inherit;font-size:inherit;box-sizing:content-box}.mat-chip-edit-input{cursor:text;display:inline-block;color:inherit;outline:0}.cdk-high-contrast-active .mat-mdc-chip-selected:not(.mat-mdc-chip-multiple){outline-width:3px}.mat-mdc-chip-action:focus .mat-mdc-focus-indicator::before{content:\"\"}";
function MatChipRow_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](1, "span", 8);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
  }
}
function MatChipRow_span_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "span", 9);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
}
function MatChipRow_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1, 1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
  }
}
function MatChipRow_ng_container_5_ng_content_1_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](0, 2, ["*ngIf", "contentEditInput; else defaultMatChipEditInput"]);
  }
}
function MatChipRow_ng_container_5_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "span", 12);
  }
}
function MatChipRow_ng_container_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerStart"](0);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](1, MatChipRow_ng_container_5_ng_content_1_Template, 1, 0, "ng-content", 10);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](2, MatChipRow_ng_container_5_ng_template_2_Template, 1, 0, "ng-template", null, 11, _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplateRefExtractor"]);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementContainerEnd"]();
  }
  if (rf & 2) {
    const _r6 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵreference"](3);
    const ctx_r3 = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx_r3.contentEditInput)("ngIfElse", _r6);
  }
}
function MatChipRow_span_7_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "span", 13);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1, 3);
    _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
  }
}
const _c3 = [[["mat-chip-avatar"], ["", "matChipAvatar", ""]], "*", [["", "matChipEditInput", ""]], [["mat-chip-trailing-icon"], ["", "matChipRemove", ""], ["", "matChipTrailingIcon", ""]]];
const _c4 = ["mat-chip-avatar, [matChipAvatar]", "*", "[matChipEditInput]", "mat-chip-trailing-icon,[matChipRemove],[matChipTrailingIcon]"];
const _c5 = ["*"];
const _c6 = ".mdc-evolution-chip-set{display:flex}.mdc-evolution-chip-set:focus{outline:none}.mdc-evolution-chip-set__chips{display:flex;flex-flow:wrap;min-width:0}.mdc-evolution-chip-set--overflow .mdc-evolution-chip-set__chips{flex-flow:nowrap}.mdc-evolution-chip-set .mdc-evolution-chip-set__chips{margin-left:-8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip-set__chips,.mdc-evolution-chip-set .mdc-evolution-chip-set__chips[dir=rtl]{margin-left:0;margin-right:-8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-left:8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip,.mdc-evolution-chip-set .mdc-evolution-chip[dir=rtl]{margin-left:0;margin-right:8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-top:4px;margin-bottom:4px}.mat-mdc-chip-set .mdc-evolution-chip-set__chips{min-width:100%}.mat-mdc-chip-set-stacked{flex-direction:column;align-items:flex-start}.mat-mdc-chip-set-stacked .mat-mdc-chip{width:100%}.mat-mdc-chip-set-stacked .mdc-evolution-chip__graphic{flex-grow:0}.mat-mdc-chip-set-stacked .mdc-evolution-chip__action--primary{flex-basis:100%;justify-content:start}input.mat-mdc-chip-input{flex:1 0 150px;margin-left:8px}[dir=rtl] input.mat-mdc-chip-input{margin-left:0;margin-right:8px}";
const MAT_CHIPS_DEFAULT_OPTIONS = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.InjectionToken('mat-chips-default-options');
/**
 * Injection token that can be used to reference instances of `MatChipAvatar`. It serves as
 * alternative token to the actual `MatChipAvatar` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
const MAT_CHIP_AVATAR = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.InjectionToken('MatChipAvatar');
/**
 * Injection token that can be used to reference instances of `MatChipTrailingIcon`. It serves as
 * alternative token to the actual `MatChipTrailingIcon` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
const MAT_CHIP_TRAILING_ICON = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.InjectionToken('MatChipTrailingIcon');
/**
 * Injection token that can be used to reference instances of `MatChipRemove`. It serves as
 * alternative token to the actual `MatChipRemove` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
const MAT_CHIP_REMOVE = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.InjectionToken('MatChipRemove');
/**
 * Injection token used to avoid a circular dependency between the `MatChip` and `MatChipAction`.
 */
const MAT_CHIP = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.InjectionToken('MatChip');
class _MatChipActionBase {}
const _MatChipActionMixinBase = (0,_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.mixinTabIndex)(_MatChipActionBase, -1);
/**
 * Section within a chip.
 * @docs-private
 */
class MatChipAction extends _MatChipActionMixinBase {
  /** Whether the action is disabled. */
  get disabled() {
    return this._disabled || this._parentChip.disabled;
  }
  set disabled(value) {
    this._disabled = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
  }
  /**
   * Determine the value of the disabled attribute for this chip action.
   */
  _getDisabledAttribute() {
    // When this chip action is disabled and focusing disabled chips is not permitted, return empty
    // string to indicate that disabled attribute should be included.
    return this.disabled && !this._allowFocusWhenDisabled ? '' : null;
  }
  /**
   * Determine the value of the tabindex attribute for this chip action.
   */
  _getTabindex() {
    return this.disabled && !this._allowFocusWhenDisabled || !this.isInteractive ? null : this.tabIndex.toString();
  }
  constructor(_elementRef, _parentChip) {
    super();
    this._elementRef = _elementRef;
    this._parentChip = _parentChip;
    /** Whether the action is interactive. */
    this.isInteractive = true;
    /** Whether this is the primary action in the chip. */
    this._isPrimary = true;
    this._disabled = false;
    /**
     * Private API to allow focusing this chip when it is disabled.
     */
    this._allowFocusWhenDisabled = false;
    if (_elementRef.nativeElement.nodeName === 'BUTTON') {
      _elementRef.nativeElement.setAttribute('type', 'button');
    }
  }
  focus() {
    this._elementRef.nativeElement.focus();
  }
  _handleClick(event) {
    if (!this.disabled && this.isInteractive && this._isPrimary) {
      event.preventDefault();
      this._parentChip._handlePrimaryActionInteraction();
    }
  }
  _handleKeydown(event) {
    if ((event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.ENTER || event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.SPACE) && !this.disabled && this.isInteractive && this._isPrimary && !this._parentChip._isEditing) {
      event.preventDefault();
      this._parentChip._handlePrimaryActionInteraction();
    }
  }
  static {
    this.ɵfac = function MatChipAction_Factory(t) {
      return new (t || MatChipAction)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](MAT_CHIP));
    };
  }
  static {
    this.ɵdir = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineDirective"]({
      type: MatChipAction,
      selectors: [["", "matChipAction", ""]],
      hostAttrs: [1, "mdc-evolution-chip__action", "mat-mdc-chip-action"],
      hostVars: 9,
      hostBindings: function MatChipAction_HostBindings(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("click", function MatChipAction_click_HostBindingHandler($event) {
            return ctx._handleClick($event);
          })("keydown", function MatChipAction_keydown_HostBindingHandler($event) {
            return ctx._handleKeydown($event);
          });
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("tabindex", ctx._getTabindex())("disabled", ctx._getDisabledAttribute())("aria-disabled", ctx.disabled);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassProp"]("mdc-evolution-chip__action--primary", ctx._isPrimary)("mdc-evolution-chip__action--presentational", !ctx.isInteractive)("mdc-evolution-chip__action--trailing", !ctx._isPrimary);
        }
      },
      inputs: {
        disabled: "disabled",
        tabIndex: "tabIndex",
        isInteractive: "isInteractive",
        _allowFocusWhenDisabled: "_allowFocusWhenDisabled"
      },
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipAction, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Directive,
    args: [{
      selector: '[matChipAction]',
      inputs: ['disabled', 'tabIndex'],
      host: {
        'class': 'mdc-evolution-chip__action mat-mdc-chip-action',
        '[class.mdc-evolution-chip__action--primary]': '_isPrimary',
        '[class.mdc-evolution-chip__action--presentational]': '!isInteractive',
        '[class.mdc-evolution-chip__action--trailing]': '!_isPrimary',
        '[attr.tabindex]': '_getTabindex()',
        '[attr.disabled]': '_getDisabledAttribute()',
        '[attr.aria-disabled]': 'disabled',
        '(click)': '_handleClick($event)',
        '(keydown)': '_handleKeydown($event)'
      }
    }]
  }], function () {
    return [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [MAT_CHIP]
      }]
    }];
  }, {
    isInteractive: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    disabled: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    _allowFocusWhenDisabled: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }]
  });
})();

/** Avatar image within a chip. */
class MatChipAvatar {
  static {
    this.ɵfac = function MatChipAvatar_Factory(t) {
      return new (t || MatChipAvatar)();
    };
  }
  static {
    this.ɵdir = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineDirective"]({
      type: MatChipAvatar,
      selectors: [["mat-chip-avatar"], ["", "matChipAvatar", ""]],
      hostAttrs: ["role", "img", 1, "mat-mdc-chip-avatar", "mdc-evolution-chip__icon", "mdc-evolution-chip__icon--primary"],
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([{
        provide: MAT_CHIP_AVATAR,
        useExisting: MatChipAvatar
      }])]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipAvatar, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Directive,
    args: [{
      selector: 'mat-chip-avatar, [matChipAvatar]',
      host: {
        'class': 'mat-mdc-chip-avatar mdc-evolution-chip__icon mdc-evolution-chip__icon--primary',
        'role': 'img'
      },
      providers: [{
        provide: MAT_CHIP_AVATAR,
        useExisting: MatChipAvatar
      }]
    }]
  }], null, null);
})();
/** Non-interactive trailing icon in a chip. */
class MatChipTrailingIcon extends MatChipAction {
  constructor() {
    super(...arguments);
    /**
     * MDC considers all trailing actions as a remove icon,
     * but we support non-interactive trailing icons.
     */
    this.isInteractive = false;
    this._isPrimary = false;
  }
  static {
    this.ɵfac = /* @__PURE__ */function () {
      let ɵMatChipTrailingIcon_BaseFactory;
      return function MatChipTrailingIcon_Factory(t) {
        return (ɵMatChipTrailingIcon_BaseFactory || (ɵMatChipTrailingIcon_BaseFactory = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetInheritedFactory"](MatChipTrailingIcon)))(t || MatChipTrailingIcon);
      };
    }();
  }
  static {
    this.ɵdir = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineDirective"]({
      type: MatChipTrailingIcon,
      selectors: [["mat-chip-trailing-icon"], ["", "matChipTrailingIcon", ""]],
      hostAttrs: ["aria-hidden", "true", 1, "mat-mdc-chip-trailing-icon", "mdc-evolution-chip__icon", "mdc-evolution-chip__icon--trailing"],
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([{
        provide: MAT_CHIP_TRAILING_ICON,
        useExisting: MatChipTrailingIcon
      }]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipTrailingIcon, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Directive,
    args: [{
      selector: 'mat-chip-trailing-icon, [matChipTrailingIcon]',
      host: {
        'class': 'mat-mdc-chip-trailing-icon mdc-evolution-chip__icon mdc-evolution-chip__icon--trailing',
        'aria-hidden': 'true'
      },
      providers: [{
        provide: MAT_CHIP_TRAILING_ICON,
        useExisting: MatChipTrailingIcon
      }]
    }]
  }], null, null);
})();
/**
 * Directive to remove the parent chip when the trailing icon is clicked or
 * when the ENTER key is pressed on it.
 *
 * Recommended for use with the Material Design "cancel" icon
 * available at https://material.io/icons/#ic_cancel.
 *
 * Example:
 *
 * ```
 * <mat-chip>
 *   <mat-icon matChipRemove>cancel</mat-icon>
 * </mat-chip>
 * ```
 */
class MatChipRemove extends MatChipAction {
  constructor() {
    super(...arguments);
    this._isPrimary = false;
  }
  _handleClick(event) {
    if (!this.disabled) {
      event.stopPropagation();
      event.preventDefault();
      this._parentChip.remove();
    }
  }
  _handleKeydown(event) {
    if ((event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.ENTER || event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.SPACE) && !this.disabled) {
      event.stopPropagation();
      event.preventDefault();
      this._parentChip.remove();
    }
  }
  static {
    this.ɵfac = /* @__PURE__ */function () {
      let ɵMatChipRemove_BaseFactory;
      return function MatChipRemove_Factory(t) {
        return (ɵMatChipRemove_BaseFactory || (ɵMatChipRemove_BaseFactory = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetInheritedFactory"](MatChipRemove)))(t || MatChipRemove);
      };
    }();
  }
  static {
    this.ɵdir = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineDirective"]({
      type: MatChipRemove,
      selectors: [["", "matChipRemove", ""]],
      hostAttrs: ["role", "button", 1, "mat-mdc-chip-remove", "mat-mdc-chip-trailing-icon", "mat-mdc-focus-indicator", "mdc-evolution-chip__icon", "mdc-evolution-chip__icon--trailing"],
      hostVars: 1,
      hostBindings: function MatChipRemove_HostBindings(rf, ctx) {
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("aria-hidden", null);
        }
      },
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([{
        provide: MAT_CHIP_REMOVE,
        useExisting: MatChipRemove
      }]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipRemove, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Directive,
    args: [{
      selector: '[matChipRemove]',
      host: {
        'class': 'mat-mdc-chip-remove mat-mdc-chip-trailing-icon mat-mdc-focus-indicator ' + 'mdc-evolution-chip__icon mdc-evolution-chip__icon--trailing',
        'role': 'button',
        '[attr.aria-hidden]': 'null'
      },
      providers: [{
        provide: MAT_CHIP_REMOVE,
        useExisting: MatChipRemove
      }]
    }]
  }], null, null);
})();
let uid = 0;
/**
 * Boilerplate for applying mixins to MatChip.
 * @docs-private
 */
const _MatChipMixinBase = (0,_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.mixinTabIndex)((0,_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.mixinColor)((0,_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.mixinDisableRipple)((0,_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.mixinDisabled)(class {
  constructor(_elementRef) {
    this._elementRef = _elementRef;
  }
})), 'primary'), -1);
/**
 * Material design styled Chip base component. Used inside the MatChipSet component.
 *
 * Extended by MatChipOption and MatChipRow for different interaction patterns.
 */
class MatChip extends _MatChipMixinBase {
  _hasFocus() {
    return this._hasFocusInternal;
  }
  /**
   * The value of the chip. Defaults to the content inside
   * the `mat-mdc-chip-action-label` element.
   */
  get value() {
    return this._value !== undefined ? this._value : this._textElement.textContent.trim();
  }
  set value(value) {
    this._value = value;
  }
  /**
   * Determines whether or not the chip displays the remove styling and emits (removed) events.
   */
  get removable() {
    return this._removable;
  }
  set removable(value) {
    this._removable = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
  }
  /**
   * Colors the chip for emphasis as if it were selected.
   */
  get highlighted() {
    return this._highlighted;
  }
  set highlighted(value) {
    this._highlighted = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
  }
  /**
   * Reference to the MatRipple instance of the chip.
   * @deprecated Considered an implementation detail. To be removed.
   * @breaking-change 17.0.0
   */
  get ripple() {
    return this._rippleLoader?.getRipple(this._elementRef.nativeElement);
  }
  set ripple(v) {
    this._rippleLoader?.attachRipple(this._elementRef.nativeElement, v);
  }
  constructor(_changeDetectorRef, elementRef, _ngZone, _focusMonitor, _document, animationMode, _globalRippleOptions, tabIndex) {
    super(elementRef);
    this._changeDetectorRef = _changeDetectorRef;
    this._ngZone = _ngZone;
    this._focusMonitor = _focusMonitor;
    this._globalRippleOptions = _globalRippleOptions;
    /** Emits when the chip is focused. */
    this._onFocus = new rxjs__WEBPACK_IMPORTED_MODULE_4__.Subject();
    /** Emits when the chip is blurred. */
    this._onBlur = new rxjs__WEBPACK_IMPORTED_MODULE_4__.Subject();
    /** Role for the root of the chip. */
    this.role = null;
    /** Whether the chip has focus. */
    this._hasFocusInternal = false;
    /** A unique id for the chip. If none is supplied, it will be auto-generated. */
    this.id = `mat-mdc-chip-${uid++}`;
    // TODO(#26104): Consider deprecating and using `_computeAriaAccessibleName` instead.
    // `ariaLabel` may be unnecessary, and `_computeAriaAccessibleName` only supports
    // datepicker's use case.
    /** ARIA label for the content of the chip. */
    this.ariaLabel = null;
    // TODO(#26104): Consider deprecating and using `_computeAriaAccessibleName` instead.
    // `ariaDescription` may be unnecessary, and `_computeAriaAccessibleName` only supports
    // datepicker's use case.
    /** ARIA description for the content of the chip. */
    this.ariaDescription = null;
    /** Id of a span that contains this chip's aria description. */
    this._ariaDescriptionId = `${this.id}-aria-description`;
    this._removable = true;
    this._highlighted = false;
    /** Emitted when a chip is to be removed. */
    this.removed = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    /** Emitted when the chip is destroyed. */
    this.destroyed = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    /** The unstyled chip selector for this component. */
    this.basicChipAttrName = 'mat-basic-chip';
    /**
     * Handles the lazy creation of the MatChip ripple.
     * Used to improve initial load time of large applications.
     */
    this._rippleLoader = (0,_angular_core__WEBPACK_IMPORTED_MODULE_0__.inject)(_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MatRippleLoader);
    this._document = _document;
    this._animationsDisabled = animationMode === 'NoopAnimations';
    if (tabIndex != null) {
      this.tabIndex = parseInt(tabIndex) ?? this.defaultTabIndex;
    }
    this._monitorFocus();
    this._rippleLoader?.configureRipple(this._elementRef.nativeElement, {
      className: 'mat-mdc-chip-ripple',
      disabled: this._isRippleDisabled()
    });
  }
  ngOnInit() {
    // This check needs to happen in `ngOnInit` so the overridden value of
    // `basicChipAttrName` coming from base classes can be picked up.
    const element = this._elementRef.nativeElement;
    this._isBasicChip = element.hasAttribute(this.basicChipAttrName) || element.tagName.toLowerCase() === this.basicChipAttrName;
  }
  ngAfterViewInit() {
    this._textElement = this._elementRef.nativeElement.querySelector('.mat-mdc-chip-action-label');
    if (this._pendingFocus) {
      this._pendingFocus = false;
      this.focus();
    }
  }
  ngAfterContentInit() {
    // Since the styling depends on the presence of some
    // actions, we have to mark for check on changes.
    this._actionChanges = (0,rxjs__WEBPACK_IMPORTED_MODULE_5__.merge)(this._allLeadingIcons.changes, this._allTrailingIcons.changes, this._allRemoveIcons.changes).subscribe(() => this._changeDetectorRef.markForCheck());
  }
  ngDoCheck() {
    this._rippleLoader.setDisabled(this._elementRef.nativeElement, this._isRippleDisabled());
  }
  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
    this._rippleLoader?.destroyRipple(this._elementRef.nativeElement);
    this._actionChanges?.unsubscribe();
    this.destroyed.emit({
      chip: this
    });
    this.destroyed.complete();
  }
  /**
   * Allows for programmatic removal of the chip.
   *
   * Informs any listeners of the removal request. Does not remove the chip from the DOM.
   */
  remove() {
    if (this.removable) {
      this.removed.emit({
        chip: this
      });
    }
  }
  /** Whether or not the ripple should be disabled. */
  _isRippleDisabled() {
    return this.disabled || this.disableRipple || this._animationsDisabled || this._isBasicChip || !!this._globalRippleOptions?.disabled;
  }
  /** Returns whether the chip has a trailing icon. */
  _hasTrailingIcon() {
    return !!(this.trailingIcon || this.removeIcon);
  }
  /** Handles keyboard events on the chip. */
  _handleKeydown(event) {
    if (event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.BACKSPACE || event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.DELETE) {
      event.preventDefault();
      this.remove();
    }
  }
  /** Allows for programmatic focusing of the chip. */
  focus() {
    if (!this.disabled) {
      // If `focus` is called before `ngAfterViewInit`, we won't have access to the primary action.
      // This can happen if the consumer tries to focus a chip immediately after it is added.
      // Queue the method to be called again on init.
      if (this.primaryAction) {
        this.primaryAction.focus();
      } else {
        this._pendingFocus = true;
      }
    }
  }
  /** Gets the action that contains a specific target node. */
  _getSourceAction(target) {
    return this._getActions().find(action => {
      const element = action._elementRef.nativeElement;
      return element === target || element.contains(target);
    });
  }
  /** Gets all of the actions within the chip. */
  _getActions() {
    const result = [];
    if (this.primaryAction) {
      result.push(this.primaryAction);
    }
    if (this.removeIcon) {
      result.push(this.removeIcon);
    }
    if (this.trailingIcon) {
      result.push(this.trailingIcon);
    }
    return result;
  }
  /** Handles interactions with the primary action of the chip. */
  _handlePrimaryActionInteraction() {
    // Empty here, but is overwritten in child classes.
  }
  /** Starts the focus monitoring process on the chip. */
  _monitorFocus() {
    this._focusMonitor.monitor(this._elementRef, true).subscribe(origin => {
      const hasFocus = origin !== null;
      if (hasFocus !== this._hasFocusInternal) {
        this._hasFocusInternal = hasFocus;
        if (hasFocus) {
          this._onFocus.next({
            chip: this
          });
        } else {
          // When animations are enabled, Angular may end up removing the chip from the DOM a little
          // earlier than usual, causing it to be blurred and throwing off the logic in the chip list
          // that moves focus not the next item. To work around the issue, we defer marking the chip
          // as not focused until the next time the zone stabilizes.
          this._ngZone.onStable.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_6__.take)(1)).subscribe(() => this._ngZone.run(() => this._onBlur.next({
            chip: this
          })));
        }
      }
    });
  }
  static {
    this.ɵfac = function MatChip_Factory(t) {
      return new (t || MatChip)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectorRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.NgZone), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_7__.FocusMonitor), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_common__WEBPACK_IMPORTED_MODULE_8__.DOCUMENT), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ANIMATION_MODULE_TYPE, 8), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MAT_RIPPLE_GLOBAL_OPTIONS, 8), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵinjectAttribute"]('tabindex'));
    };
  }
  static {
    this.ɵcmp = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: MatChip,
      selectors: [["mat-basic-chip"], ["", "mat-basic-chip", ""], ["mat-chip"], ["", "mat-chip", ""]],
      contentQueries: function MatChip_ContentQueries(rf, ctx, dirIndex) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MAT_CHIP_AVATAR, 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MAT_CHIP_TRAILING_ICON, 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MAT_CHIP_REMOVE, 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MAT_CHIP_AVATAR, 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MAT_CHIP_TRAILING_ICON, 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MAT_CHIP_REMOVE, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.leadingIcon = _t.first);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.trailingIcon = _t.first);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.removeIcon = _t.first);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx._allLeadingIcons = _t);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx._allTrailingIcons = _t);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx._allRemoveIcons = _t);
        }
      },
      viewQuery: function MatChip_Query(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵviewQuery"](MatChipAction, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.primaryAction = _t.first);
        }
      },
      hostAttrs: [1, "mat-mdc-chip"],
      hostVars: 30,
      hostBindings: function MatChip_HostBindings(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("keydown", function MatChip_keydown_HostBindingHandler($event) {
            return ctx._handleKeydown($event);
          });
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵhostProperty"]("id", ctx.id);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("role", ctx.role)("tabindex", ctx.role ? ctx.tabIndex : null)("aria-label", ctx.ariaLabel);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassProp"]("mdc-evolution-chip", !ctx._isBasicChip)("mdc-evolution-chip--disabled", ctx.disabled)("mdc-evolution-chip--with-trailing-action", ctx._hasTrailingIcon())("mdc-evolution-chip--with-primary-graphic", ctx.leadingIcon)("mdc-evolution-chip--with-primary-icon", ctx.leadingIcon)("mdc-evolution-chip--with-avatar", ctx.leadingIcon)("mat-mdc-chip-with-avatar", ctx.leadingIcon)("mat-mdc-chip-highlighted", ctx.highlighted)("mat-mdc-chip-disabled", ctx.disabled)("mat-mdc-basic-chip", ctx._isBasicChip)("mat-mdc-standard-chip", !ctx._isBasicChip)("mat-mdc-chip-with-trailing-icon", ctx._hasTrailingIcon())("_mat-animation-noopable", ctx._animationsDisabled);
        }
      },
      inputs: {
        color: "color",
        disabled: "disabled",
        disableRipple: "disableRipple",
        tabIndex: "tabIndex",
        role: "role",
        id: "id",
        ariaLabel: ["aria-label", "ariaLabel"],
        ariaDescription: ["aria-description", "ariaDescription"],
        value: "value",
        removable: "removable",
        highlighted: "highlighted"
      },
      outputs: {
        removed: "removed",
        destroyed: "destroyed"
      },
      exportAs: ["matChip"],
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([{
        provide: MAT_CHIP,
        useExisting: MatChip
      }]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]],
      ngContentSelectors: _c1,
      decls: 8,
      vars: 3,
      consts: [[1, "mat-mdc-chip-focus-overlay"], [1, "mdc-evolution-chip__cell", "mdc-evolution-chip__cell--primary"], ["matChipAction", "", 3, "isInteractive"], ["class", "mdc-evolution-chip__graphic mat-mdc-chip-graphic", 4, "ngIf"], [1, "mdc-evolution-chip__text-label", "mat-mdc-chip-action-label"], [1, "mat-mdc-chip-primary-focus-indicator", "mat-mdc-focus-indicator"], ["class", "mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing", 4, "ngIf"], [1, "mdc-evolution-chip__graphic", "mat-mdc-chip-graphic"], [1, "mdc-evolution-chip__cell", "mdc-evolution-chip__cell--trailing"]],
      template: function MatChip_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojectionDef"](_c0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "span", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "span", 1)(2, "span", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](3, MatChip_span_3_Template, 2, 0, "span", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "span", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](6, "span", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](7, MatChip_span_7_Template, 2, 0, "span", 6);
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("isInteractive", false);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.leadingIcon);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx._hasTrailingIcon());
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_8__.NgIf, MatChipAction],
      styles: [".mdc-evolution-chip,.mdc-evolution-chip__cell,.mdc-evolution-chip__action{display:inline-flex;align-items:center}.mdc-evolution-chip{position:relative;max-width:100%}.mdc-evolution-chip .mdc-elevation-overlay{width:100%;height:100%;top:0;left:0}.mdc-evolution-chip__cell,.mdc-evolution-chip__action{height:100%}.mdc-evolution-chip__cell--primary{overflow-x:hidden}.mdc-evolution-chip__cell--trailing{flex:1 0 auto}.mdc-evolution-chip__action{align-items:center;background:none;border:none;box-sizing:content-box;cursor:pointer;display:inline-flex;justify-content:center;outline:none;padding:0;text-decoration:none;color:inherit}.mdc-evolution-chip__action--presentational{cursor:auto}.mdc-evolution-chip--disabled,.mdc-evolution-chip__action:disabled{pointer-events:none}.mdc-evolution-chip__action--primary{overflow-x:hidden}.mdc-evolution-chip__action--trailing{position:relative;overflow:visible}.mdc-evolution-chip__action--primary:before{box-sizing:border-box;content:\"\";height:100%;left:0;position:absolute;pointer-events:none;top:0;width:100%;z-index:1}.mdc-evolution-chip--touch{margin-top:8px;margin-bottom:8px}.mdc-evolution-chip__action-touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}.mdc-evolution-chip__text-label{white-space:nowrap;user-select:none;text-overflow:ellipsis;overflow:hidden}.mdc-evolution-chip__graphic{align-items:center;display:inline-flex;justify-content:center;overflow:hidden;pointer-events:none;position:relative;flex:1 0 auto}.mdc-evolution-chip__checkmark{position:absolute;opacity:0;top:50%;left:50%}.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--selected):not(.mdc-evolution-chip--with-primary-icon) .mdc-evolution-chip__graphic{width:0}.mdc-evolution-chip__checkmark-background{opacity:0}.mdc-evolution-chip__checkmark-svg{display:block}.mdc-evolution-chip__checkmark-path{stroke-width:2px;stroke-dasharray:29.7833385;stroke-dashoffset:29.7833385;stroke:currentColor}.mdc-evolution-chip--selecting .mdc-evolution-chip__graphic{transition:width 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark{transition:transform 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 45ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__graphic{transition:width 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark{transition:opacity 50ms 0ms linear,transform 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-50%, -50%)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selected .mdc-evolution-chip__icon--primary{opacity:0}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark{transform:translate(-50%, -50%);opacity:1}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}@keyframes mdc-evolution-chip-enter{from{transform:scale(0.8);opacity:.4}to{transform:scale(1);opacity:1}}.mdc-evolution-chip--enter{animation:mdc-evolution-chip-enter 100ms 0ms cubic-bezier(0, 0, 0.2, 1)}@keyframes mdc-evolution-chip-exit{from{opacity:1}to{opacity:0}}.mdc-evolution-chip--exit{animation:mdc-evolution-chip-exit 75ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mdc-evolution-chip--hidden{opacity:0;pointer-events:none;transition:width 150ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mat-mdc-standard-chip{border-radius:var(--mdc-chip-container-shape-radius);height:var(--mdc-chip-container-height);--mdc-chip-container-shape-family:rounded;--mdc-chip-container-shape-radius:16px 16px 16px 16px;--mdc-chip-with-avatar-avatar-shape-family:rounded;--mdc-chip-with-avatar-avatar-shape-radius:14px 14px 14px 14px;--mdc-chip-with-avatar-avatar-size:28px;--mdc-chip-with-icon-icon-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__ripple{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:before{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{border-radius:var(--mdc-chip-with-avatar-avatar-shape-radius)}.mat-mdc-standard-chip.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--with-primary-icon){--mdc-chip-graphic-selected-width:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip .mdc-evolution-chip__graphic{height:var(--mdc-chip-with-avatar-avatar-size);width:var(--mdc-chip-with-avatar-avatar-size);font-size:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled){background-color:var(--mdc-chip-elevated-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip .mdc-evolution-chip__text-label{font-family:var(--mdc-chip-label-text-font);line-height:var(--mdc-chip-label-text-line-height);font-size:var(--mdc-chip-label-text-size);font-weight:var(--mdc-chip-label-text-weight);letter-spacing:var(--mdc-chip-label-text-tracking)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__text-label{color:var(--mdc-chip-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{height:var(--mdc-chip-with-icon-icon-size);width:var(--mdc-chip-with-icon-icon-size);font-size:var(--mdc-chip-with-icon-icon-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-trailing-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-disabled-trailing-icon-color)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary.mdc-ripple-upgraded--background-focused .mdc-evolution-chip__ripple::before,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:not(.mdc-ripple-upgraded):focus .mdc-evolution-chip__ripple::before{transition-duration:75ms;opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-chip-focus-overlay{background:var(--mdc-chip-focus-state-layer-color);opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-standard-chip .mdc-evolution-chip__checkmark{height:20px;width:20px}.mat-mdc-standard-chip .mdc-evolution-chip__icon--trailing{height:18px;width:18px;font-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color, currentColor)}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip{-webkit-tap-highlight-color:rgba(0,0,0,0)}.cdk-high-contrast-active .mat-mdc-standard-chip{outline:solid 1px}.cdk-high-contrast-active .mat-mdc-standard-chip .mdc-evolution-chip__checkmark-path{stroke:CanvasText !important}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{opacity:.4}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mat-mdc-chip-action-label{overflow:visible}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary{flex-basis:100%}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{font:inherit;letter-spacing:inherit;white-space:inherit}.mat-mdc-standard-chip .mat-mdc-chip-graphic,.mat-mdc-standard-chip .mat-mdc-chip-trailing-icon{box-sizing:content-box}.mat-mdc-standard-chip._mat-animation-noopable,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__graphic,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark-path{transition-duration:1ms;animation-duration:1ms}.mat-mdc-basic-chip .mdc-evolution-chip__action--primary{font:inherit}.mat-mdc-chip-focus-overlay{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;opacity:0;border-radius:inherit;transition:opacity 150ms linear}._mat-animation-noopable .mat-mdc-chip-focus-overlay{transition:none}.mat-mdc-basic-chip .mat-mdc-chip-focus-overlay{display:none}.mat-mdc-chip:hover .mat-mdc-chip-focus-overlay{opacity:.04}.mat-mdc-chip.cdk-focused .mat-mdc-chip-focus-overlay{opacity:.12}.mat-mdc-chip .mat-ripple.mat-mdc-chip-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-chip-avatar{text-align:center;line-height:1;color:var(--mdc-chip-with-icon-icon-color, currentColor)}.mat-mdc-chip{position:relative;z-index:0}.mat-mdc-chip-action-label{text-align:left;z-index:1}[dir=rtl] .mat-mdc-chip-action-label{text-align:right}.mat-mdc-chip.mdc-evolution-chip--with-trailing-action .mat-mdc-chip-action-label{position:relative}.mat-mdc-chip-action-label .mat-mdc-chip-primary-focus-indicator{position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none}.mat-mdc-chip-action-label .mat-mdc-focus-indicator::before{margin:calc(calc(var(--mat-mdc-focus-indicator-border-width, 3px) + 2px) * -1)}.mat-mdc-chip-remove{opacity:.54}.mat-mdc-chip-remove:focus{opacity:1}.mat-mdc-chip-remove::before{margin:calc(var(--mat-mdc-focus-indicator-border-width, 3px) * -1);left:8px;right:8px}.mat-mdc-chip-remove .mat-icon{width:inherit;height:inherit;font-size:inherit;box-sizing:content-box}.mat-chip-edit-input{cursor:text;display:inline-block;color:inherit;outline:0}.cdk-high-contrast-active .mat-mdc-chip-selected:not(.mat-mdc-chip-multiple){outline-width:3px}.mat-mdc-chip-action:focus .mat-mdc-focus-indicator::before{content:\"\"}"],
      encapsulation: 2,
      changeDetection: 0
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChip, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Component,
    args: [{
      selector: 'mat-basic-chip, [mat-basic-chip], mat-chip, [mat-chip]',
      inputs: ['color', 'disabled', 'disableRipple', 'tabIndex'],
      exportAs: 'matChip',
      host: {
        'class': 'mat-mdc-chip',
        '[class.mdc-evolution-chip]': '!_isBasicChip',
        '[class.mdc-evolution-chip--disabled]': 'disabled',
        '[class.mdc-evolution-chip--with-trailing-action]': '_hasTrailingIcon()',
        '[class.mdc-evolution-chip--with-primary-graphic]': 'leadingIcon',
        '[class.mdc-evolution-chip--with-primary-icon]': 'leadingIcon',
        '[class.mdc-evolution-chip--with-avatar]': 'leadingIcon',
        '[class.mat-mdc-chip-with-avatar]': 'leadingIcon',
        '[class.mat-mdc-chip-highlighted]': 'highlighted',
        '[class.mat-mdc-chip-disabled]': 'disabled',
        '[class.mat-mdc-basic-chip]': '_isBasicChip',
        '[class.mat-mdc-standard-chip]': '!_isBasicChip',
        '[class.mat-mdc-chip-with-trailing-icon]': '_hasTrailingIcon()',
        '[class._mat-animation-noopable]': '_animationsDisabled',
        '[id]': 'id',
        '[attr.role]': 'role',
        '[attr.tabindex]': 'role ? tabIndex : null',
        '[attr.aria-label]': 'ariaLabel',
        '(keydown)': '_handleKeydown($event)'
      },
      encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ViewEncapsulation.None,
      changeDetection: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectionStrategy.OnPush,
      providers: [{
        provide: MAT_CHIP,
        useExisting: MatChip
      }],
      template: "<span class=\"mat-mdc-chip-focus-overlay\"></span>\n\n<span class=\"mdc-evolution-chip__cell mdc-evolution-chip__cell--primary\">\n  <span matChipAction [isInteractive]=\"false\">\n    <span class=\"mdc-evolution-chip__graphic mat-mdc-chip-graphic\" *ngIf=\"leadingIcon\">\n      <ng-content select=\"mat-chip-avatar, [matChipAvatar]\"></ng-content>\n    </span>\n    <span class=\"mdc-evolution-chip__text-label mat-mdc-chip-action-label\">\n      <ng-content></ng-content>\n      <span class=\"mat-mdc-chip-primary-focus-indicator mat-mdc-focus-indicator\"></span>\n    </span>\n  </span>\n</span>\n\n<span\n  class=\"mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing\"\n  *ngIf=\"_hasTrailingIcon()\">\n  <ng-content select=\"mat-chip-trailing-icon,[matChipRemove],[matChipTrailingIcon]\"></ng-content>\n</span>\n",
      styles: [".mdc-evolution-chip,.mdc-evolution-chip__cell,.mdc-evolution-chip__action{display:inline-flex;align-items:center}.mdc-evolution-chip{position:relative;max-width:100%}.mdc-evolution-chip .mdc-elevation-overlay{width:100%;height:100%;top:0;left:0}.mdc-evolution-chip__cell,.mdc-evolution-chip__action{height:100%}.mdc-evolution-chip__cell--primary{overflow-x:hidden}.mdc-evolution-chip__cell--trailing{flex:1 0 auto}.mdc-evolution-chip__action{align-items:center;background:none;border:none;box-sizing:content-box;cursor:pointer;display:inline-flex;justify-content:center;outline:none;padding:0;text-decoration:none;color:inherit}.mdc-evolution-chip__action--presentational{cursor:auto}.mdc-evolution-chip--disabled,.mdc-evolution-chip__action:disabled{pointer-events:none}.mdc-evolution-chip__action--primary{overflow-x:hidden}.mdc-evolution-chip__action--trailing{position:relative;overflow:visible}.mdc-evolution-chip__action--primary:before{box-sizing:border-box;content:\"\";height:100%;left:0;position:absolute;pointer-events:none;top:0;width:100%;z-index:1}.mdc-evolution-chip--touch{margin-top:8px;margin-bottom:8px}.mdc-evolution-chip__action-touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}.mdc-evolution-chip__text-label{white-space:nowrap;user-select:none;text-overflow:ellipsis;overflow:hidden}.mdc-evolution-chip__graphic{align-items:center;display:inline-flex;justify-content:center;overflow:hidden;pointer-events:none;position:relative;flex:1 0 auto}.mdc-evolution-chip__checkmark{position:absolute;opacity:0;top:50%;left:50%}.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--selected):not(.mdc-evolution-chip--with-primary-icon) .mdc-evolution-chip__graphic{width:0}.mdc-evolution-chip__checkmark-background{opacity:0}.mdc-evolution-chip__checkmark-svg{display:block}.mdc-evolution-chip__checkmark-path{stroke-width:2px;stroke-dasharray:29.7833385;stroke-dashoffset:29.7833385;stroke:currentColor}.mdc-evolution-chip--selecting .mdc-evolution-chip__graphic{transition:width 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark{transition:transform 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 45ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__graphic{transition:width 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark{transition:opacity 50ms 0ms linear,transform 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-50%, -50%)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selected .mdc-evolution-chip__icon--primary{opacity:0}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark{transform:translate(-50%, -50%);opacity:1}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}@keyframes mdc-evolution-chip-enter{from{transform:scale(0.8);opacity:.4}to{transform:scale(1);opacity:1}}.mdc-evolution-chip--enter{animation:mdc-evolution-chip-enter 100ms 0ms cubic-bezier(0, 0, 0.2, 1)}@keyframes mdc-evolution-chip-exit{from{opacity:1}to{opacity:0}}.mdc-evolution-chip--exit{animation:mdc-evolution-chip-exit 75ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mdc-evolution-chip--hidden{opacity:0;pointer-events:none;transition:width 150ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mat-mdc-standard-chip{border-radius:var(--mdc-chip-container-shape-radius);height:var(--mdc-chip-container-height);--mdc-chip-container-shape-family:rounded;--mdc-chip-container-shape-radius:16px 16px 16px 16px;--mdc-chip-with-avatar-avatar-shape-family:rounded;--mdc-chip-with-avatar-avatar-shape-radius:14px 14px 14px 14px;--mdc-chip-with-avatar-avatar-size:28px;--mdc-chip-with-icon-icon-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__ripple{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:before{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{border-radius:var(--mdc-chip-with-avatar-avatar-shape-radius)}.mat-mdc-standard-chip.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--with-primary-icon){--mdc-chip-graphic-selected-width:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip .mdc-evolution-chip__graphic{height:var(--mdc-chip-with-avatar-avatar-size);width:var(--mdc-chip-with-avatar-avatar-size);font-size:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled){background-color:var(--mdc-chip-elevated-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip .mdc-evolution-chip__text-label{font-family:var(--mdc-chip-label-text-font);line-height:var(--mdc-chip-label-text-line-height);font-size:var(--mdc-chip-label-text-size);font-weight:var(--mdc-chip-label-text-weight);letter-spacing:var(--mdc-chip-label-text-tracking)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__text-label{color:var(--mdc-chip-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{height:var(--mdc-chip-with-icon-icon-size);width:var(--mdc-chip-with-icon-icon-size);font-size:var(--mdc-chip-with-icon-icon-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-trailing-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-disabled-trailing-icon-color)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary.mdc-ripple-upgraded--background-focused .mdc-evolution-chip__ripple::before,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:not(.mdc-ripple-upgraded):focus .mdc-evolution-chip__ripple::before{transition-duration:75ms;opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-chip-focus-overlay{background:var(--mdc-chip-focus-state-layer-color);opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-standard-chip .mdc-evolution-chip__checkmark{height:20px;width:20px}.mat-mdc-standard-chip .mdc-evolution-chip__icon--trailing{height:18px;width:18px;font-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color, currentColor)}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip{-webkit-tap-highlight-color:rgba(0,0,0,0)}.cdk-high-contrast-active .mat-mdc-standard-chip{outline:solid 1px}.cdk-high-contrast-active .mat-mdc-standard-chip .mdc-evolution-chip__checkmark-path{stroke:CanvasText !important}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{opacity:.4}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mat-mdc-chip-action-label{overflow:visible}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary{flex-basis:100%}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{font:inherit;letter-spacing:inherit;white-space:inherit}.mat-mdc-standard-chip .mat-mdc-chip-graphic,.mat-mdc-standard-chip .mat-mdc-chip-trailing-icon{box-sizing:content-box}.mat-mdc-standard-chip._mat-animation-noopable,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__graphic,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark-path{transition-duration:1ms;animation-duration:1ms}.mat-mdc-basic-chip .mdc-evolution-chip__action--primary{font:inherit}.mat-mdc-chip-focus-overlay{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;opacity:0;border-radius:inherit;transition:opacity 150ms linear}._mat-animation-noopable .mat-mdc-chip-focus-overlay{transition:none}.mat-mdc-basic-chip .mat-mdc-chip-focus-overlay{display:none}.mat-mdc-chip:hover .mat-mdc-chip-focus-overlay{opacity:.04}.mat-mdc-chip.cdk-focused .mat-mdc-chip-focus-overlay{opacity:.12}.mat-mdc-chip .mat-ripple.mat-mdc-chip-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-chip-avatar{text-align:center;line-height:1;color:var(--mdc-chip-with-icon-icon-color, currentColor)}.mat-mdc-chip{position:relative;z-index:0}.mat-mdc-chip-action-label{text-align:left;z-index:1}[dir=rtl] .mat-mdc-chip-action-label{text-align:right}.mat-mdc-chip.mdc-evolution-chip--with-trailing-action .mat-mdc-chip-action-label{position:relative}.mat-mdc-chip-action-label .mat-mdc-chip-primary-focus-indicator{position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none}.mat-mdc-chip-action-label .mat-mdc-focus-indicator::before{margin:calc(calc(var(--mat-mdc-focus-indicator-border-width, 3px) + 2px) * -1)}.mat-mdc-chip-remove{opacity:.54}.mat-mdc-chip-remove:focus{opacity:1}.mat-mdc-chip-remove::before{margin:calc(var(--mat-mdc-focus-indicator-border-width, 3px) * -1);left:8px;right:8px}.mat-mdc-chip-remove .mat-icon{width:inherit;height:inherit;font-size:inherit;box-sizing:content-box}.mat-chip-edit-input{cursor:text;display:inline-block;color:inherit;outline:0}.cdk-high-contrast-active .mat-mdc-chip-selected:not(.mat-mdc-chip-multiple){outline-width:3px}.mat-mdc-chip-action:focus .mat-mdc-focus-indicator::before{content:\"\"}"]
    }]
  }], function () {
    return [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectorRef
    }, {
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef
    }, {
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.NgZone
    }, {
      type: _angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_7__.FocusMonitor
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [_angular_common__WEBPACK_IMPORTED_MODULE_8__.DOCUMENT]
      }]
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }, {
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [_angular_core__WEBPACK_IMPORTED_MODULE_0__.ANIMATION_MODULE_TYPE]
      }]
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }, {
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MAT_RIPPLE_GLOBAL_OPTIONS]
      }]
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Attribute,
        args: ['tabindex']
      }]
    }];
  }, {
    role: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    _allLeadingIcons: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChildren,
      args: [MAT_CHIP_AVATAR, {
        descendants: true
      }]
    }],
    _allTrailingIcons: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChildren,
      args: [MAT_CHIP_TRAILING_ICON, {
        descendants: true
      }]
    }],
    _allRemoveIcons: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChildren,
      args: [MAT_CHIP_REMOVE, {
        descendants: true
      }]
    }],
    id: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    ariaLabel: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input,
      args: ['aria-label']
    }],
    ariaDescription: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input,
      args: ['aria-description']
    }],
    value: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    removable: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    highlighted: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    removed: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Output
    }],
    destroyed: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Output
    }],
    leadingIcon: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChild,
      args: [MAT_CHIP_AVATAR]
    }],
    trailingIcon: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChild,
      args: [MAT_CHIP_TRAILING_ICON]
    }],
    removeIcon: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChild,
      args: [MAT_CHIP_REMOVE]
    }],
    primaryAction: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ViewChild,
      args: [MatChipAction]
    }]
  });
})();

/** Event object emitted by MatChipOption when selected or deselected. */
class MatChipSelectionChange {
  constructor( /** Reference to the chip that emitted the event. */
  source, /** Whether the chip that emitted the event is selected. */
  selected, /** Whether the selection change was a result of a user interaction. */
  isUserInput = false) {
    this.source = source;
    this.selected = selected;
    this.isUserInput = isUserInput;
  }
}
/**
 * An extension of the MatChip component that supports chip selection. Used with MatChipListbox.
 *
 * Unlike other chips, the user can focus on disabled chip options inside a MatChipListbox. The
 * user cannot click disabled chips.
 */
class MatChipOption extends MatChip {
  constructor() {
    super(...arguments);
    /** Default chip options. */
    this._defaultOptions = (0,_angular_core__WEBPACK_IMPORTED_MODULE_0__.inject)(MAT_CHIPS_DEFAULT_OPTIONS, {
      optional: true
    });
    /** Whether the chip list is selectable. */
    this.chipListSelectable = true;
    /** Whether the chip list is in multi-selection mode. */
    this._chipListMultiple = false;
    /** Whether the chip list hides single-selection indicator. */
    this._chipListHideSingleSelectionIndicator = this._defaultOptions?.hideSingleSelectionIndicator ?? false;
    this._selectable = true;
    this._selected = false;
    /** The unstyled chip selector for this component. */
    this.basicChipAttrName = 'mat-basic-chip-option';
    /** Emitted when the chip is selected or deselected. */
    this.selectionChange = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
  }
  /**
   * Whether or not the chip is selectable.
   *
   * When a chip is not selectable, changes to its selected state are always
   * ignored. By default an option chip is selectable, and it becomes
   * non-selectable if its parent chip list is not selectable.
   */
  get selectable() {
    return this._selectable && this.chipListSelectable;
  }
  set selectable(value) {
    this._selectable = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
    this._changeDetectorRef.markForCheck();
  }
  /** Whether the chip is selected. */
  get selected() {
    return this._selected;
  }
  set selected(value) {
    this._setSelectedState((0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value), false, true);
  }
  /**
   * The ARIA selected applied to the chip. Conforms to WAI ARIA best practices for listbox
   * interaction patterns.
   *
   * From [WAI ARIA Listbox authoring practices guide](
   * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/):
   *  "If any options are selected, each selected option has either aria-selected or aria-checked
   *  set to true. All options that are selectable but not selected have either aria-selected or
   *  aria-checked set to false."
   *
   * Set `aria-selected="false"` on not-selected listbox options that are selectable to fix
   * VoiceOver reading every option as "selected" (#25736).
   */
  get ariaSelected() {
    return this.selectable ? this.selected.toString() : null;
  }
  ngOnInit() {
    super.ngOnInit();
    this.role = 'presentation';
  }
  /** Selects the chip. */
  select() {
    this._setSelectedState(true, false, true);
  }
  /** Deselects the chip. */
  deselect() {
    this._setSelectedState(false, false, true);
  }
  /** Selects this chip and emits userInputSelection event */
  selectViaInteraction() {
    this._setSelectedState(true, true, true);
  }
  /** Toggles the current selected state of this chip. */
  toggleSelected(isUserInput = false) {
    this._setSelectedState(!this.selected, isUserInput, true);
    return this.selected;
  }
  _handlePrimaryActionInteraction() {
    if (!this.disabled) {
      // Interacting with the primary action implies that the chip already has focus, however
      // there's a bug in Safari where focus ends up lingering on the previous chip (see #27544).
      // We work around it by explicitly focusing the primary action of the current chip.
      this.focus();
      if (this.selectable) {
        this.toggleSelected(true);
      }
    }
  }
  _hasLeadingGraphic() {
    if (this.leadingIcon) {
      return true;
    }
    // The checkmark graphic communicates selected state for both single-select and multi-select.
    // Include checkmark in single-select to fix a11y issue where selected state is communicated
    // visually only using color (#25886).
    return !this._chipListHideSingleSelectionIndicator || this._chipListMultiple;
  }
  _setSelectedState(isSelected, isUserInput, emitEvent) {
    if (isSelected !== this.selected) {
      this._selected = isSelected;
      if (emitEvent) {
        this.selectionChange.emit({
          source: this,
          isUserInput,
          selected: this.selected
        });
      }
      this._changeDetectorRef.markForCheck();
    }
  }
  static {
    this.ɵfac = /* @__PURE__ */function () {
      let ɵMatChipOption_BaseFactory;
      return function MatChipOption_Factory(t) {
        return (ɵMatChipOption_BaseFactory || (ɵMatChipOption_BaseFactory = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetInheritedFactory"](MatChipOption)))(t || MatChipOption);
      };
    }();
  }
  static {
    this.ɵcmp = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: MatChipOption,
      selectors: [["mat-basic-chip-option"], ["", "mat-basic-chip-option", ""], ["mat-chip-option"], ["", "mat-chip-option", ""]],
      hostAttrs: [1, "mat-mdc-chip", "mat-mdc-chip-option"],
      hostVars: 37,
      hostBindings: function MatChipOption_HostBindings(rf, ctx) {
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵhostProperty"]("id", ctx.id);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("tabindex", null)("aria-label", null)("aria-description", null)("role", ctx.role);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassProp"]("mdc-evolution-chip", !ctx._isBasicChip)("mdc-evolution-chip--filter", !ctx._isBasicChip)("mdc-evolution-chip--selectable", !ctx._isBasicChip)("mat-mdc-chip-selected", ctx.selected)("mat-mdc-chip-multiple", ctx._chipListMultiple)("mat-mdc-chip-disabled", ctx.disabled)("mat-mdc-chip-with-avatar", ctx.leadingIcon)("mdc-evolution-chip--disabled", ctx.disabled)("mdc-evolution-chip--selected", ctx.selected)("mdc-evolution-chip--selecting", !ctx._animationsDisabled)("mdc-evolution-chip--with-trailing-action", ctx._hasTrailingIcon())("mdc-evolution-chip--with-primary-icon", ctx.leadingIcon)("mdc-evolution-chip--with-primary-graphic", ctx._hasLeadingGraphic())("mdc-evolution-chip--with-avatar", ctx.leadingIcon)("mat-mdc-chip-highlighted", ctx.highlighted)("mat-mdc-chip-with-trailing-icon", ctx._hasTrailingIcon());
        }
      },
      inputs: {
        color: "color",
        disabled: "disabled",
        disableRipple: "disableRipple",
        tabIndex: "tabIndex",
        selectable: "selectable",
        selected: "selected"
      },
      outputs: {
        selectionChange: "selectionChange"
      },
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([{
        provide: MatChip,
        useExisting: MatChipOption
      }, {
        provide: MAT_CHIP,
        useExisting: MatChipOption
      }]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]],
      ngContentSelectors: _c1,
      decls: 10,
      vars: 9,
      consts: [[1, "mat-mdc-chip-focus-overlay"], [1, "mdc-evolution-chip__cell", "mdc-evolution-chip__cell--primary"], ["matChipAction", "", "role", "option", 3, "tabIndex", "_allowFocusWhenDisabled"], ["class", "mdc-evolution-chip__graphic mat-mdc-chip-graphic", 4, "ngIf"], [1, "mdc-evolution-chip__text-label", "mat-mdc-chip-action-label"], [1, "mat-mdc-chip-primary-focus-indicator", "mat-mdc-focus-indicator"], ["class", "mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing", 4, "ngIf"], [1, "cdk-visually-hidden", 3, "id"], [1, "mdc-evolution-chip__graphic", "mat-mdc-chip-graphic"], [1, "mdc-evolution-chip__checkmark"], ["viewBox", "-2 -3 30 30", "focusable", "false", "aria-hidden", "true", 1, "mdc-evolution-chip__checkmark-svg"], ["fill", "none", "stroke", "currentColor", "d", "M1.73,12.91 8.1,19.28 22.79,4.59", 1, "mdc-evolution-chip__checkmark-path"], [1, "mdc-evolution-chip__cell", "mdc-evolution-chip__cell--trailing"]],
      template: function MatChipOption_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojectionDef"](_c0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](0, "span", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "span", 1)(2, "button", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](3, MatChipOption_span_3_Template, 5, 0, "span", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](4, "span", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](6, "span", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](7, MatChipOption_span_7_Template, 2, 0, "span", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "span", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("tabIndex", ctx.tabIndex)("_allowFocusWhenDisabled", true);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("aria-selected", ctx.ariaSelected)("aria-label", ctx.ariaLabel)("aria-describedby", ctx._ariaDescriptionId);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx._hasLeadingGraphic());
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx._hasTrailingIcon());
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("id", ctx._ariaDescriptionId);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](ctx.ariaDescription);
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_8__.NgIf, MatChipAction],
      styles: [_c2],
      encapsulation: 2,
      changeDetection: 0
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipOption, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Component,
    args: [{
      selector: 'mat-basic-chip-option, [mat-basic-chip-option], mat-chip-option, [mat-chip-option]',
      inputs: ['color', 'disabled', 'disableRipple', 'tabIndex'],
      host: {
        'class': 'mat-mdc-chip mat-mdc-chip-option',
        '[class.mdc-evolution-chip]': '!_isBasicChip',
        '[class.mdc-evolution-chip--filter]': '!_isBasicChip',
        '[class.mdc-evolution-chip--selectable]': '!_isBasicChip',
        '[class.mat-mdc-chip-selected]': 'selected',
        '[class.mat-mdc-chip-multiple]': '_chipListMultiple',
        '[class.mat-mdc-chip-disabled]': 'disabled',
        '[class.mat-mdc-chip-with-avatar]': 'leadingIcon',
        '[class.mdc-evolution-chip--disabled]': 'disabled',
        '[class.mdc-evolution-chip--selected]': 'selected',
        // This class enables the transition on the checkmark. Usually MDC adds it when selection
        // starts and removes it once the animation is finished. We don't need to go through all
        // the trouble, because we only care about the selection animation. MDC needs to do it,
        // because they also have an exit animation that we don't care about.
        '[class.mdc-evolution-chip--selecting]': '!_animationsDisabled',
        '[class.mdc-evolution-chip--with-trailing-action]': '_hasTrailingIcon()',
        '[class.mdc-evolution-chip--with-primary-icon]': 'leadingIcon',
        '[class.mdc-evolution-chip--with-primary-graphic]': '_hasLeadingGraphic()',
        '[class.mdc-evolution-chip--with-avatar]': 'leadingIcon',
        '[class.mat-mdc-chip-highlighted]': 'highlighted',
        '[class.mat-mdc-chip-with-trailing-icon]': '_hasTrailingIcon()',
        '[attr.tabindex]': 'null',
        '[attr.aria-label]': 'null',
        '[attr.aria-description]': 'null',
        '[attr.role]': 'role',
        '[id]': 'id'
      },
      providers: [{
        provide: MatChip,
        useExisting: MatChipOption
      }, {
        provide: MAT_CHIP,
        useExisting: MatChipOption
      }],
      encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ViewEncapsulation.None,
      changeDetection: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectionStrategy.OnPush,
      template: "<span class=\"mat-mdc-chip-focus-overlay\"></span>\n\n<span class=\"mdc-evolution-chip__cell mdc-evolution-chip__cell--primary\">\n  <button\n    matChipAction\n    [tabIndex]=\"tabIndex\"\n    [_allowFocusWhenDisabled]=\"true\"\n    [attr.aria-selected]=\"ariaSelected\"\n    [attr.aria-label]=\"ariaLabel\"\n    [attr.aria-describedby]=\"_ariaDescriptionId\"\n    role=\"option\">\n    <span class=\"mdc-evolution-chip__graphic mat-mdc-chip-graphic\" *ngIf=\"_hasLeadingGraphic()\">\n      <ng-content select=\"mat-chip-avatar, [matChipAvatar]\"></ng-content>\n      <span class=\"mdc-evolution-chip__checkmark\">\n        <svg\n          class=\"mdc-evolution-chip__checkmark-svg\"\n          viewBox=\"-2 -3 30 30\"\n          focusable=\"false\"\n          aria-hidden=\"true\">\n          <path class=\"mdc-evolution-chip__checkmark-path\"\n                fill=\"none\" stroke=\"currentColor\" d=\"M1.73,12.91 8.1,19.28 22.79,4.59\" />\n        </svg>\n      </span>\n    </span>\n    <span class=\"mdc-evolution-chip__text-label mat-mdc-chip-action-label\">\n      <ng-content></ng-content>\n      <span class=\"mat-mdc-chip-primary-focus-indicator mat-mdc-focus-indicator\"></span>\n    </span>\n  </button>\n</span>\n\n<span\n  class=\"mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing\"\n  *ngIf=\"_hasTrailingIcon()\">\n  <ng-content select=\"mat-chip-trailing-icon,[matChipRemove],[matChipTrailingIcon]\"></ng-content>\n</span>\n\n<span class=\"cdk-visually-hidden\" [id]=\"_ariaDescriptionId\">{{ariaDescription}}</span>\n",
      styles: [".mdc-evolution-chip,.mdc-evolution-chip__cell,.mdc-evolution-chip__action{display:inline-flex;align-items:center}.mdc-evolution-chip{position:relative;max-width:100%}.mdc-evolution-chip .mdc-elevation-overlay{width:100%;height:100%;top:0;left:0}.mdc-evolution-chip__cell,.mdc-evolution-chip__action{height:100%}.mdc-evolution-chip__cell--primary{overflow-x:hidden}.mdc-evolution-chip__cell--trailing{flex:1 0 auto}.mdc-evolution-chip__action{align-items:center;background:none;border:none;box-sizing:content-box;cursor:pointer;display:inline-flex;justify-content:center;outline:none;padding:0;text-decoration:none;color:inherit}.mdc-evolution-chip__action--presentational{cursor:auto}.mdc-evolution-chip--disabled,.mdc-evolution-chip__action:disabled{pointer-events:none}.mdc-evolution-chip__action--primary{overflow-x:hidden}.mdc-evolution-chip__action--trailing{position:relative;overflow:visible}.mdc-evolution-chip__action--primary:before{box-sizing:border-box;content:\"\";height:100%;left:0;position:absolute;pointer-events:none;top:0;width:100%;z-index:1}.mdc-evolution-chip--touch{margin-top:8px;margin-bottom:8px}.mdc-evolution-chip__action-touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}.mdc-evolution-chip__text-label{white-space:nowrap;user-select:none;text-overflow:ellipsis;overflow:hidden}.mdc-evolution-chip__graphic{align-items:center;display:inline-flex;justify-content:center;overflow:hidden;pointer-events:none;position:relative;flex:1 0 auto}.mdc-evolution-chip__checkmark{position:absolute;opacity:0;top:50%;left:50%}.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--selected):not(.mdc-evolution-chip--with-primary-icon) .mdc-evolution-chip__graphic{width:0}.mdc-evolution-chip__checkmark-background{opacity:0}.mdc-evolution-chip__checkmark-svg{display:block}.mdc-evolution-chip__checkmark-path{stroke-width:2px;stroke-dasharray:29.7833385;stroke-dashoffset:29.7833385;stroke:currentColor}.mdc-evolution-chip--selecting .mdc-evolution-chip__graphic{transition:width 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark{transition:transform 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 45ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__graphic{transition:width 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark{transition:opacity 50ms 0ms linear,transform 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-50%, -50%)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selected .mdc-evolution-chip__icon--primary{opacity:0}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark{transform:translate(-50%, -50%);opacity:1}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}@keyframes mdc-evolution-chip-enter{from{transform:scale(0.8);opacity:.4}to{transform:scale(1);opacity:1}}.mdc-evolution-chip--enter{animation:mdc-evolution-chip-enter 100ms 0ms cubic-bezier(0, 0, 0.2, 1)}@keyframes mdc-evolution-chip-exit{from{opacity:1}to{opacity:0}}.mdc-evolution-chip--exit{animation:mdc-evolution-chip-exit 75ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mdc-evolution-chip--hidden{opacity:0;pointer-events:none;transition:width 150ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mat-mdc-standard-chip{border-radius:var(--mdc-chip-container-shape-radius);height:var(--mdc-chip-container-height);--mdc-chip-container-shape-family:rounded;--mdc-chip-container-shape-radius:16px 16px 16px 16px;--mdc-chip-with-avatar-avatar-shape-family:rounded;--mdc-chip-with-avatar-avatar-shape-radius:14px 14px 14px 14px;--mdc-chip-with-avatar-avatar-size:28px;--mdc-chip-with-icon-icon-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__ripple{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:before{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{border-radius:var(--mdc-chip-with-avatar-avatar-shape-radius)}.mat-mdc-standard-chip.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--with-primary-icon){--mdc-chip-graphic-selected-width:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip .mdc-evolution-chip__graphic{height:var(--mdc-chip-with-avatar-avatar-size);width:var(--mdc-chip-with-avatar-avatar-size);font-size:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled){background-color:var(--mdc-chip-elevated-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip .mdc-evolution-chip__text-label{font-family:var(--mdc-chip-label-text-font);line-height:var(--mdc-chip-label-text-line-height);font-size:var(--mdc-chip-label-text-size);font-weight:var(--mdc-chip-label-text-weight);letter-spacing:var(--mdc-chip-label-text-tracking)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__text-label{color:var(--mdc-chip-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{height:var(--mdc-chip-with-icon-icon-size);width:var(--mdc-chip-with-icon-icon-size);font-size:var(--mdc-chip-with-icon-icon-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-trailing-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-disabled-trailing-icon-color)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary.mdc-ripple-upgraded--background-focused .mdc-evolution-chip__ripple::before,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:not(.mdc-ripple-upgraded):focus .mdc-evolution-chip__ripple::before{transition-duration:75ms;opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-chip-focus-overlay{background:var(--mdc-chip-focus-state-layer-color);opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-standard-chip .mdc-evolution-chip__checkmark{height:20px;width:20px}.mat-mdc-standard-chip .mdc-evolution-chip__icon--trailing{height:18px;width:18px;font-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color, currentColor)}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip{-webkit-tap-highlight-color:rgba(0,0,0,0)}.cdk-high-contrast-active .mat-mdc-standard-chip{outline:solid 1px}.cdk-high-contrast-active .mat-mdc-standard-chip .mdc-evolution-chip__checkmark-path{stroke:CanvasText !important}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{opacity:.4}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mat-mdc-chip-action-label{overflow:visible}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary{flex-basis:100%}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{font:inherit;letter-spacing:inherit;white-space:inherit}.mat-mdc-standard-chip .mat-mdc-chip-graphic,.mat-mdc-standard-chip .mat-mdc-chip-trailing-icon{box-sizing:content-box}.mat-mdc-standard-chip._mat-animation-noopable,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__graphic,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark-path{transition-duration:1ms;animation-duration:1ms}.mat-mdc-basic-chip .mdc-evolution-chip__action--primary{font:inherit}.mat-mdc-chip-focus-overlay{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;opacity:0;border-radius:inherit;transition:opacity 150ms linear}._mat-animation-noopable .mat-mdc-chip-focus-overlay{transition:none}.mat-mdc-basic-chip .mat-mdc-chip-focus-overlay{display:none}.mat-mdc-chip:hover .mat-mdc-chip-focus-overlay{opacity:.04}.mat-mdc-chip.cdk-focused .mat-mdc-chip-focus-overlay{opacity:.12}.mat-mdc-chip .mat-ripple.mat-mdc-chip-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-chip-avatar{text-align:center;line-height:1;color:var(--mdc-chip-with-icon-icon-color, currentColor)}.mat-mdc-chip{position:relative;z-index:0}.mat-mdc-chip-action-label{text-align:left;z-index:1}[dir=rtl] .mat-mdc-chip-action-label{text-align:right}.mat-mdc-chip.mdc-evolution-chip--with-trailing-action .mat-mdc-chip-action-label{position:relative}.mat-mdc-chip-action-label .mat-mdc-chip-primary-focus-indicator{position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none}.mat-mdc-chip-action-label .mat-mdc-focus-indicator::before{margin:calc(calc(var(--mat-mdc-focus-indicator-border-width, 3px) + 2px) * -1)}.mat-mdc-chip-remove{opacity:.54}.mat-mdc-chip-remove:focus{opacity:1}.mat-mdc-chip-remove::before{margin:calc(var(--mat-mdc-focus-indicator-border-width, 3px) * -1);left:8px;right:8px}.mat-mdc-chip-remove .mat-icon{width:inherit;height:inherit;font-size:inherit;box-sizing:content-box}.mat-chip-edit-input{cursor:text;display:inline-block;color:inherit;outline:0}.cdk-high-contrast-active .mat-mdc-chip-selected:not(.mat-mdc-chip-multiple){outline-width:3px}.mat-mdc-chip-action:focus .mat-mdc-focus-indicator::before{content:\"\"}"]
    }]
  }], null, {
    selectable: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    selected: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    selectionChange: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Output
    }]
  });
})();

/**
 * A directive that makes a span editable and exposes functions to modify and retrieve the
 * element's contents.
 */
class MatChipEditInput {
  constructor(_elementRef, _document) {
    this._elementRef = _elementRef;
    this._document = _document;
  }
  initialize(initialValue) {
    this.getNativeElement().focus();
    this.setValue(initialValue);
  }
  getNativeElement() {
    return this._elementRef.nativeElement;
  }
  setValue(value) {
    this.getNativeElement().textContent = value;
    this._moveCursorToEndOfInput();
  }
  getValue() {
    return this.getNativeElement().textContent || '';
  }
  _moveCursorToEndOfInput() {
    const range = this._document.createRange();
    range.selectNodeContents(this.getNativeElement());
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  static {
    this.ɵfac = function MatChipEditInput_Factory(t) {
      return new (t || MatChipEditInput)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_common__WEBPACK_IMPORTED_MODULE_8__.DOCUMENT));
    };
  }
  static {
    this.ɵdir = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineDirective"]({
      type: MatChipEditInput,
      selectors: [["span", "matChipEditInput", ""]],
      hostAttrs: ["role", "textbox", "tabindex", "-1", "contenteditable", "true", 1, "mat-chip-edit-input"]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipEditInput, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Directive,
    args: [{
      selector: 'span[matChipEditInput]',
      host: {
        'class': 'mat-chip-edit-input',
        'role': 'textbox',
        'tabindex': '-1',
        'contenteditable': 'true'
      }
    }]
  }], function () {
    return [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [_angular_common__WEBPACK_IMPORTED_MODULE_8__.DOCUMENT]
      }]
    }];
  }, null);
})();

/**
 * An extension of the MatChip component used with MatChipGrid and
 * the matChipInputFor directive.
 */
class MatChipRow extends MatChip {
  constructor(changeDetectorRef, elementRef, ngZone, focusMonitor, _document, animationMode, globalRippleOptions, tabIndex) {
    super(changeDetectorRef, elementRef, ngZone, focusMonitor, _document, animationMode, globalRippleOptions, tabIndex);
    this.basicChipAttrName = 'mat-basic-chip-row';
    /**
     * The editing action has to be triggered in a timeout. While we're waiting on it, a blur
     * event might occur which will interrupt the editing. This flag is used to avoid interruptions
     * while the editing action is being initialized.
     */
    this._editStartPending = false;
    this.editable = false;
    /** Emitted when the chip is edited. */
    this.edited = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this._isEditing = false;
    this.role = 'row';
    this._onBlur.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this.destroyed)).subscribe(() => {
      if (this._isEditing && !this._editStartPending) {
        this._onEditFinish();
      }
    });
  }
  _hasTrailingIcon() {
    // The trailing icon is hidden while editing.
    return !this._isEditing && super._hasTrailingIcon();
  }
  /** Sends focus to the first gridcell when the user clicks anywhere inside the chip. */
  _handleFocus() {
    if (!this._isEditing && !this.disabled) {
      this.focus();
    }
  }
  _handleKeydown(event) {
    if (event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.ENTER && !this.disabled) {
      if (this._isEditing) {
        event.preventDefault();
        this._onEditFinish();
      } else if (this.editable) {
        this._startEditing(event);
      }
    } else if (this._isEditing) {
      // Stop the event from reaching the chip set in order to avoid navigating.
      event.stopPropagation();
    } else {
      super._handleKeydown(event);
    }
  }
  _handleDoubleclick(event) {
    if (!this.disabled && this.editable) {
      this._startEditing(event);
    }
  }
  _startEditing(event) {
    if (!this.primaryAction || this.removeIcon && this._getSourceAction(event.target) === this.removeIcon) {
      return;
    }
    // The value depends on the DOM so we need to extract it before we flip the flag.
    const value = this.value;
    this._isEditing = this._editStartPending = true;
    // Starting the editing sequence below depends on the edit input
    // query resolving on time. Trigger a synchronous change detection to
    // ensure that it happens by the time we hit the timeout below.
    this._changeDetectorRef.detectChanges();
    // TODO(crisbeto): this timeout shouldn't be necessary given the `detectChange` call above.
    // Defer initializing the input so it has time to be added to the DOM.
    setTimeout(() => {
      this._getEditInput().initialize(value);
      this._editStartPending = false;
    });
  }
  _onEditFinish() {
    this._isEditing = this._editStartPending = false;
    this.edited.emit({
      chip: this,
      value: this._getEditInput().getValue()
    });
    // If the edit input is still focused or focus was returned to the body after it was destroyed,
    // return focus to the chip contents.
    if (this._document.activeElement === this._getEditInput().getNativeElement() || this._document.activeElement === this._document.body) {
      this.primaryAction.focus();
    }
  }
  _isRippleDisabled() {
    return super._isRippleDisabled() || this._isEditing;
  }
  /**
   * Gets the projected chip edit input, or the default input if none is projected in. One of these
   * two values is guaranteed to be defined.
   */
  _getEditInput() {
    return this.contentEditInput || this.defaultEditInput;
  }
  static {
    this.ɵfac = function MatChipRow_Factory(t) {
      return new (t || MatChipRow)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectorRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.NgZone), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_7__.FocusMonitor), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_common__WEBPACK_IMPORTED_MODULE_8__.DOCUMENT), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ANIMATION_MODULE_TYPE, 8), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MAT_RIPPLE_GLOBAL_OPTIONS, 8), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵinjectAttribute"]('tabindex'));
    };
  }
  static {
    this.ɵcmp = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: MatChipRow,
      selectors: [["mat-chip-row"], ["", "mat-chip-row", ""], ["mat-basic-chip-row"], ["", "mat-basic-chip-row", ""]],
      contentQueries: function MatChipRow_ContentQueries(rf, ctx, dirIndex) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MatChipEditInput, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.contentEditInput = _t.first);
        }
      },
      viewQuery: function MatChipRow_Query(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵviewQuery"](MatChipEditInput, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx.defaultEditInput = _t.first);
        }
      },
      hostAttrs: [1, "mat-mdc-chip", "mat-mdc-chip-row", "mdc-evolution-chip"],
      hostVars: 27,
      hostBindings: function MatChipRow_HostBindings(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("focus", function MatChipRow_focus_HostBindingHandler($event) {
            return ctx._handleFocus($event);
          })("dblclick", function MatChipRow_dblclick_HostBindingHandler($event) {
            return ctx._handleDoubleclick($event);
          });
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵhostProperty"]("id", ctx.id);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("tabindex", ctx.disabled ? null : -1)("aria-label", null)("aria-description", null)("role", ctx.role);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassProp"]("mat-mdc-chip-with-avatar", ctx.leadingIcon)("mat-mdc-chip-disabled", ctx.disabled)("mat-mdc-chip-editing", ctx._isEditing)("mat-mdc-chip-editable", ctx.editable)("mdc-evolution-chip--disabled", ctx.disabled)("mdc-evolution-chip--with-trailing-action", ctx._hasTrailingIcon())("mdc-evolution-chip--with-primary-graphic", ctx.leadingIcon)("mdc-evolution-chip--with-primary-icon", ctx.leadingIcon)("mdc-evolution-chip--with-avatar", ctx.leadingIcon)("mat-mdc-chip-highlighted", ctx.highlighted)("mat-mdc-chip-with-trailing-icon", ctx._hasTrailingIcon());
        }
      },
      inputs: {
        color: "color",
        disabled: "disabled",
        disableRipple: "disableRipple",
        tabIndex: "tabIndex",
        editable: "editable"
      },
      outputs: {
        edited: "edited"
      },
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([{
        provide: MatChip,
        useExisting: MatChipRow
      }, {
        provide: MAT_CHIP,
        useExisting: MatChipRow
      }]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]],
      ngContentSelectors: _c4,
      decls: 10,
      vars: 12,
      consts: [[4, "ngIf"], ["role", "gridcell", "matChipAction", "", 1, "mdc-evolution-chip__cell", "mdc-evolution-chip__cell--primary", 3, "tabIndex", "disabled"], ["class", "mdc-evolution-chip__graphic mat-mdc-chip-graphic", 4, "ngIf"], [1, "mdc-evolution-chip__text-label", "mat-mdc-chip-action-label", 3, "ngSwitch"], [4, "ngSwitchCase"], ["aria-hidden", "true", 1, "mat-mdc-chip-primary-focus-indicator", "mat-mdc-focus-indicator"], ["class", "mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing", "role", "gridcell", 4, "ngIf"], [1, "cdk-visually-hidden", 3, "id"], [1, "mat-mdc-chip-focus-overlay"], [1, "mdc-evolution-chip__graphic", "mat-mdc-chip-graphic"], [4, "ngIf", "ngIfElse"], ["defaultMatChipEditInput", ""], ["matChipEditInput", ""], ["role", "gridcell", 1, "mdc-evolution-chip__cell", "mdc-evolution-chip__cell--trailing"]],
      template: function MatChipRow_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojectionDef"](_c3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](0, MatChipRow_ng_container_0_Template, 2, 0, "ng-container", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](1, "span", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](2, MatChipRow_span_2_Template, 2, 0, "span", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](3, "span", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](4, MatChipRow_ng_container_4_Template, 2, 0, "ng-container", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](5, MatChipRow_ng_container_5_Template, 4, 2, "ng-container", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelement"](6, "span", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtemplate"](7, MatChipRow_span_7_Template, 2, 0, "span", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](8, "span", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtext"](9);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", !ctx._isEditing);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("tabIndex", ctx.tabIndex)("disabled", ctx.disabled);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("aria-label", ctx.ariaLabel)("aria-describedby", ctx._ariaDescriptionId);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx.leadingIcon);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngSwitch", ctx._isEditing);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngSwitchCase", false);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngSwitchCase", true);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("ngIf", ctx._hasTrailingIcon());
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵproperty"]("id", ctx._ariaDescriptionId);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵadvance"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵtextInterpolate"](ctx.ariaDescription);
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_8__.NgIf, _angular_common__WEBPACK_IMPORTED_MODULE_8__.NgSwitch, _angular_common__WEBPACK_IMPORTED_MODULE_8__.NgSwitchCase, MatChipAction, MatChipEditInput],
      styles: [_c2],
      encapsulation: 2,
      changeDetection: 0
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipRow, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Component,
    args: [{
      selector: 'mat-chip-row, [mat-chip-row], mat-basic-chip-row, [mat-basic-chip-row]',
      inputs: ['color', 'disabled', 'disableRipple', 'tabIndex'],
      host: {
        'class': 'mat-mdc-chip mat-mdc-chip-row mdc-evolution-chip',
        '[class.mat-mdc-chip-with-avatar]': 'leadingIcon',
        '[class.mat-mdc-chip-disabled]': 'disabled',
        '[class.mat-mdc-chip-editing]': '_isEditing',
        '[class.mat-mdc-chip-editable]': 'editable',
        '[class.mdc-evolution-chip--disabled]': 'disabled',
        '[class.mdc-evolution-chip--with-trailing-action]': '_hasTrailingIcon()',
        '[class.mdc-evolution-chip--with-primary-graphic]': 'leadingIcon',
        '[class.mdc-evolution-chip--with-primary-icon]': 'leadingIcon',
        '[class.mdc-evolution-chip--with-avatar]': 'leadingIcon',
        '[class.mat-mdc-chip-highlighted]': 'highlighted',
        '[class.mat-mdc-chip-with-trailing-icon]': '_hasTrailingIcon()',
        '[id]': 'id',
        // Has to have a negative tabindex in order to capture
        // focus and redirect it to the primary action.
        '[attr.tabindex]': 'disabled ? null : -1',
        '[attr.aria-label]': 'null',
        '[attr.aria-description]': 'null',
        '[attr.role]': 'role',
        '(focus)': '_handleFocus($event)',
        '(dblclick)': '_handleDoubleclick($event)'
      },
      providers: [{
        provide: MatChip,
        useExisting: MatChipRow
      }, {
        provide: MAT_CHIP,
        useExisting: MatChipRow
      }],
      encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ViewEncapsulation.None,
      changeDetection: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectionStrategy.OnPush,
      template: "<ng-container *ngIf=\"!_isEditing\">\n  <span class=\"mat-mdc-chip-focus-overlay\"></span>\n</ng-container>\n\n<span class=\"mdc-evolution-chip__cell mdc-evolution-chip__cell--primary\" role=\"gridcell\"\n    matChipAction\n    [tabIndex]=\"tabIndex\"\n    [disabled]=\"disabled\"\n    [attr.aria-label]=\"ariaLabel\"\n    [attr.aria-describedby]=\"_ariaDescriptionId\">\n  <span class=\"mdc-evolution-chip__graphic mat-mdc-chip-graphic\" *ngIf=\"leadingIcon\">\n    <ng-content select=\"mat-chip-avatar, [matChipAvatar]\"></ng-content>\n  </span>\n  <span class=\"mdc-evolution-chip__text-label mat-mdc-chip-action-label\" [ngSwitch]=\"_isEditing\">\n    <ng-container *ngSwitchCase=\"false\"><ng-content></ng-content></ng-container>\n\n    <ng-container *ngSwitchCase=\"true\">\n      <ng-content *ngIf=\"contentEditInput; else defaultMatChipEditInput\"\n                  select=\"[matChipEditInput]\"></ng-content>\n      <ng-template #defaultMatChipEditInput><span matChipEditInput></span></ng-template>\n    </ng-container>\n\n    <span class=\"mat-mdc-chip-primary-focus-indicator mat-mdc-focus-indicator\" aria-hidden=\"true\"></span>\n  </span>\n</span>\n\n<span\n  class=\"mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing\"\n  role=\"gridcell\"\n  *ngIf=\"_hasTrailingIcon()\">\n  <ng-content select=\"mat-chip-trailing-icon,[matChipRemove],[matChipTrailingIcon]\"></ng-content>\n</span>\n\n<span class=\"cdk-visually-hidden\" [id]=\"_ariaDescriptionId\">{{ariaDescription}}</span>\n",
      styles: [".mdc-evolution-chip,.mdc-evolution-chip__cell,.mdc-evolution-chip__action{display:inline-flex;align-items:center}.mdc-evolution-chip{position:relative;max-width:100%}.mdc-evolution-chip .mdc-elevation-overlay{width:100%;height:100%;top:0;left:0}.mdc-evolution-chip__cell,.mdc-evolution-chip__action{height:100%}.mdc-evolution-chip__cell--primary{overflow-x:hidden}.mdc-evolution-chip__cell--trailing{flex:1 0 auto}.mdc-evolution-chip__action{align-items:center;background:none;border:none;box-sizing:content-box;cursor:pointer;display:inline-flex;justify-content:center;outline:none;padding:0;text-decoration:none;color:inherit}.mdc-evolution-chip__action--presentational{cursor:auto}.mdc-evolution-chip--disabled,.mdc-evolution-chip__action:disabled{pointer-events:none}.mdc-evolution-chip__action--primary{overflow-x:hidden}.mdc-evolution-chip__action--trailing{position:relative;overflow:visible}.mdc-evolution-chip__action--primary:before{box-sizing:border-box;content:\"\";height:100%;left:0;position:absolute;pointer-events:none;top:0;width:100%;z-index:1}.mdc-evolution-chip--touch{margin-top:8px;margin-bottom:8px}.mdc-evolution-chip__action-touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}.mdc-evolution-chip__text-label{white-space:nowrap;user-select:none;text-overflow:ellipsis;overflow:hidden}.mdc-evolution-chip__graphic{align-items:center;display:inline-flex;justify-content:center;overflow:hidden;pointer-events:none;position:relative;flex:1 0 auto}.mdc-evolution-chip__checkmark{position:absolute;opacity:0;top:50%;left:50%}.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--selected):not(.mdc-evolution-chip--with-primary-icon) .mdc-evolution-chip__graphic{width:0}.mdc-evolution-chip__checkmark-background{opacity:0}.mdc-evolution-chip__checkmark-svg{display:block}.mdc-evolution-chip__checkmark-path{stroke-width:2px;stroke-dasharray:29.7833385;stroke-dashoffset:29.7833385;stroke:currentColor}.mdc-evolution-chip--selecting .mdc-evolution-chip__graphic{transition:width 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark{transition:transform 150ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--selecting .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 45ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__graphic{transition:width 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark{transition:opacity 50ms 0ms linear,transform 100ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-75%, -50%)}.mdc-evolution-chip--deselecting .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--selecting-with-primary-icon .mdc-evolution-chip__checkmark-path{transition:stroke-dashoffset 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__icon--primary{transition:opacity 150ms 75ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark{transition:opacity 75ms 0ms cubic-bezier(0.4, 0, 0.2, 1);transform:translate(-50%, -50%)}.mdc-evolution-chip--deselecting-with-primary-icon .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}.mdc-evolution-chip--selected .mdc-evolution-chip__icon--primary{opacity:0}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark{transform:translate(-50%, -50%);opacity:1}.mdc-evolution-chip--selected .mdc-evolution-chip__checkmark-path{stroke-dashoffset:0}@keyframes mdc-evolution-chip-enter{from{transform:scale(0.8);opacity:.4}to{transform:scale(1);opacity:1}}.mdc-evolution-chip--enter{animation:mdc-evolution-chip-enter 100ms 0ms cubic-bezier(0, 0, 0.2, 1)}@keyframes mdc-evolution-chip-exit{from{opacity:1}to{opacity:0}}.mdc-evolution-chip--exit{animation:mdc-evolution-chip-exit 75ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mdc-evolution-chip--hidden{opacity:0;pointer-events:none;transition:width 150ms 0ms cubic-bezier(0.4, 0, 1, 1)}.mat-mdc-standard-chip{border-radius:var(--mdc-chip-container-shape-radius);height:var(--mdc-chip-container-height);--mdc-chip-container-shape-family:rounded;--mdc-chip-container-shape-radius:16px 16px 16px 16px;--mdc-chip-with-avatar-avatar-shape-family:rounded;--mdc-chip-with-avatar-avatar-shape-radius:14px 14px 14px 14px;--mdc-chip-with-avatar-avatar-size:28px;--mdc-chip-with-icon-icon-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__ripple{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:before{border-radius:var(--mdc-chip-container-shape-radius)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{border-radius:var(--mdc-chip-with-avatar-avatar-shape-radius)}.mat-mdc-standard-chip.mdc-evolution-chip--selectable:not(.mdc-evolution-chip--with-primary-icon){--mdc-chip-graphic-selected-width:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip .mdc-evolution-chip__graphic{height:var(--mdc-chip-with-avatar-avatar-size);width:var(--mdc-chip-with-avatar-avatar-size);font-size:var(--mdc-chip-with-avatar-avatar-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled){background-color:var(--mdc-chip-elevated-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled{background-color:var(--mdc-chip-elevated-disabled-container-color)}.mat-mdc-standard-chip .mdc-evolution-chip__text-label{font-family:var(--mdc-chip-label-text-font);line-height:var(--mdc-chip-label-text-line-height);font-size:var(--mdc-chip-label-text-size);font-weight:var(--mdc-chip-label-text-weight);letter-spacing:var(--mdc-chip-label-text-tracking)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__text-label{color:var(--mdc-chip-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip.mdc-evolution-chip--selected.mdc-evolution-chip--disabled .mdc-evolution-chip__text-label{color:var(--mdc-chip-disabled-label-text-color)}.mat-mdc-standard-chip .mdc-evolution-chip__icon--primary{height:var(--mdc-chip-with-icon-icon-size);width:var(--mdc-chip-with-icon-icon-size);font-size:var(--mdc-chip-with-icon-icon-size)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--primary{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-disabled-icon-color)}.mat-mdc-standard-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-trailing-icon-color)}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__icon--trailing{color:var(--mdc-chip-with-trailing-icon-disabled-trailing-icon-color)}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary.mdc-ripple-upgraded--background-focused .mdc-evolution-chip__ripple::before,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary:not(.mdc-ripple-upgraded):focus .mdc-evolution-chip__ripple::before{transition-duration:75ms;opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-chip-focus-overlay{background:var(--mdc-chip-focus-state-layer-color);opacity:var(--mdc-chip-focus-state-layer-opacity)}.mat-mdc-standard-chip .mdc-evolution-chip__checkmark{height:20px;width:20px}.mat-mdc-standard-chip .mdc-evolution-chip__icon--trailing{height:18px;width:18px;font-size:18px}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:12px;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:12px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:6px;padding-right:6px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:6px;padding-right:6px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip.mdc-evolution-chip--disabled .mdc-evolution-chip__checkmark{color:var(--mdc-chip-with-icon-selected-icon-color, currentColor)}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary{padding-left:0;padding-right:12px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:12px;padding-right:0}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic{padding-left:4px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__graphic[dir=rtl]{padding-left:8px;padding-right:4px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing{padding-left:8px;padding-right:8px}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--trailing[dir=rtl]{padding-left:8px;padding-right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing{left:8px;right:initial}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__ripple--trailing[dir=rtl]{left:initial;right:8px}.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary{padding-left:0;padding-right:0}[dir=rtl] .mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary,.mdc-evolution-chip--with-avatar.mdc-evolution-chip--with-primary-graphic.mdc-evolution-chip--with-trailing-action .mdc-evolution-chip__action--primary[dir=rtl]{padding-left:0;padding-right:0}.mat-mdc-standard-chip{-webkit-tap-highlight-color:rgba(0,0,0,0)}.cdk-high-contrast-active .mat-mdc-standard-chip{outline:solid 1px}.cdk-high-contrast-active .mat-mdc-standard-chip .mdc-evolution-chip__checkmark-path{stroke:CanvasText !important}.mat-mdc-standard-chip.mdc-evolution-chip--disabled{opacity:.4}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary,.mat-mdc-standard-chip .mdc-evolution-chip__action--primary,.mat-mdc-standard-chip .mat-mdc-chip-action-label{overflow:visible}.mat-mdc-standard-chip .mdc-evolution-chip__cell--primary{flex-basis:100%}.mat-mdc-standard-chip .mdc-evolution-chip__action--primary{font:inherit;letter-spacing:inherit;white-space:inherit}.mat-mdc-standard-chip .mat-mdc-chip-graphic,.mat-mdc-standard-chip .mat-mdc-chip-trailing-icon{box-sizing:content-box}.mat-mdc-standard-chip._mat-animation-noopable,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__graphic,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark,.mat-mdc-standard-chip._mat-animation-noopable .mdc-evolution-chip__checkmark-path{transition-duration:1ms;animation-duration:1ms}.mat-mdc-basic-chip .mdc-evolution-chip__action--primary{font:inherit}.mat-mdc-chip-focus-overlay{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;opacity:0;border-radius:inherit;transition:opacity 150ms linear}._mat-animation-noopable .mat-mdc-chip-focus-overlay{transition:none}.mat-mdc-basic-chip .mat-mdc-chip-focus-overlay{display:none}.mat-mdc-chip:hover .mat-mdc-chip-focus-overlay{opacity:.04}.mat-mdc-chip.cdk-focused .mat-mdc-chip-focus-overlay{opacity:.12}.mat-mdc-chip .mat-ripple.mat-mdc-chip-ripple{top:0;left:0;right:0;bottom:0;position:absolute;pointer-events:none;border-radius:inherit}.mat-mdc-chip-avatar{text-align:center;line-height:1;color:var(--mdc-chip-with-icon-icon-color, currentColor)}.mat-mdc-chip{position:relative;z-index:0}.mat-mdc-chip-action-label{text-align:left;z-index:1}[dir=rtl] .mat-mdc-chip-action-label{text-align:right}.mat-mdc-chip.mdc-evolution-chip--with-trailing-action .mat-mdc-chip-action-label{position:relative}.mat-mdc-chip-action-label .mat-mdc-chip-primary-focus-indicator{position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none}.mat-mdc-chip-action-label .mat-mdc-focus-indicator::before{margin:calc(calc(var(--mat-mdc-focus-indicator-border-width, 3px) + 2px) * -1)}.mat-mdc-chip-remove{opacity:.54}.mat-mdc-chip-remove:focus{opacity:1}.mat-mdc-chip-remove::before{margin:calc(var(--mat-mdc-focus-indicator-border-width, 3px) * -1);left:8px;right:8px}.mat-mdc-chip-remove .mat-icon{width:inherit;height:inherit;font-size:inherit;box-sizing:content-box}.mat-chip-edit-input{cursor:text;display:inline-block;color:inherit;outline:0}.cdk-high-contrast-active .mat-mdc-chip-selected:not(.mat-mdc-chip-multiple){outline-width:3px}.mat-mdc-chip-action:focus .mat-mdc-focus-indicator::before{content:\"\"}"]
    }]
  }], function () {
    return [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectorRef
    }, {
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef
    }, {
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.NgZone
    }, {
      type: _angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_7__.FocusMonitor
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [_angular_common__WEBPACK_IMPORTED_MODULE_8__.DOCUMENT]
      }]
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }, {
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [_angular_core__WEBPACK_IMPORTED_MODULE_0__.ANIMATION_MODULE_TYPE]
      }]
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }, {
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MAT_RIPPLE_GLOBAL_OPTIONS]
      }]
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Attribute,
        args: ['tabindex']
      }]
    }];
  }, {
    editable: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    edited: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Output
    }],
    defaultEditInput: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ViewChild,
      args: [MatChipEditInput]
    }],
    contentEditInput: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChild,
      args: [MatChipEditInput]
    }]
  });
})();

/**
 * Boilerplate for applying mixins to MatChipSet.
 * @docs-private
 */
class MatChipSetBase {
  constructor(_elementRef) {}
}
const _MatChipSetMixinBase = (0,_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.mixinTabIndex)(MatChipSetBase);
/**
 * Basic container component for the MatChip component.
 *
 * Extended by MatChipListbox and MatChipGrid for different interaction patterns.
 */
class MatChipSet extends _MatChipSetMixinBase {
  /** Combined stream of all of the child chips' focus events. */
  get chipFocusChanges() {
    return this._getChipStream(chip => chip._onFocus);
  }
  /** Combined stream of all of the child chips' remove events. */
  get chipDestroyedChanges() {
    return this._getChipStream(chip => chip.destroyed);
  }
  /** Whether the chip set is disabled. */
  get disabled() {
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
    this._syncChipsState();
  }
  /** Whether the chip list contains chips or not. */
  get empty() {
    return !this._chips || this._chips.length === 0;
  }
  /** The ARIA role applied to the chip set. */
  get role() {
    if (this._explicitRole) {
      return this._explicitRole;
    }
    return this.empty ? null : this._defaultRole;
  }
  set role(value) {
    this._explicitRole = value;
  }
  /** Whether any of the chips inside of this chip-set has focus. */
  get focused() {
    return this._hasFocusedChip();
  }
  constructor(_elementRef, _changeDetectorRef, _dir) {
    super(_elementRef);
    this._elementRef = _elementRef;
    this._changeDetectorRef = _changeDetectorRef;
    this._dir = _dir;
    /** Index of the last destroyed chip that had focus. */
    this._lastDestroyedFocusedChipIndex = null;
    /** Subject that emits when the component has been destroyed. */
    this._destroyed = new rxjs__WEBPACK_IMPORTED_MODULE_4__.Subject();
    /** Role to use if it hasn't been overwritten by the user. */
    this._defaultRole = 'presentation';
    this._disabled = false;
    this._explicitRole = null;
    /** Flat list of all the actions contained within the chips. */
    this._chipActions = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.QueryList();
  }
  ngAfterViewInit() {
    this._setUpFocusManagement();
    this._trackChipSetChanges();
    this._trackDestroyedFocusedChip();
  }
  ngOnDestroy() {
    this._keyManager?.destroy();
    this._chipActions.destroy();
    this._destroyed.next();
    this._destroyed.complete();
  }
  /** Checks whether any of the chips is focused. */
  _hasFocusedChip() {
    return this._chips && this._chips.some(chip => chip._hasFocus());
  }
  /** Syncs the chip-set's state with the individual chips. */
  _syncChipsState() {
    if (this._chips) {
      this._chips.forEach(chip => {
        chip.disabled = this._disabled;
        chip._changeDetectorRef.markForCheck();
      });
    }
  }
  /** Dummy method for subclasses to override. Base chip set cannot be focused. */
  focus() {}
  /** Handles keyboard events on the chip set. */
  _handleKeydown(event) {
    if (this._originatesFromChip(event)) {
      this._keyManager.onKeydown(event);
    }
  }
  /**
   * Utility to ensure all indexes are valid.
   *
   * @param index The index to be checked.
   * @returns True if the index is valid for our list of chips.
   */
  _isValidIndex(index) {
    return index >= 0 && index < this._chips.length;
  }
  /**
   * Removes the `tabindex` from the chip set and resets it back afterwards, allowing the
   * user to tab out of it. This prevents the set from capturing focus and redirecting
   * it back to the first chip, creating a focus trap, if it user tries to tab away.
   */
  _allowFocusEscape() {
    if (this.tabIndex !== -1) {
      const previousTabIndex = this.tabIndex;
      this.tabIndex = -1;
      // Note that this needs to be a `setTimeout`, because a `Promise.resolve`
      // doesn't allow enough time for the focus to escape.
      setTimeout(() => this.tabIndex = previousTabIndex);
    }
  }
  /**
   * Gets a stream of events from all the chips within the set.
   * The stream will automatically incorporate any newly-added chips.
   */
  _getChipStream(mappingFunction) {
    return this._chips.changes.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_10__.startWith)(null), (0,rxjs_operators__WEBPACK_IMPORTED_MODULE_11__.switchMap)(() => (0,rxjs__WEBPACK_IMPORTED_MODULE_5__.merge)(...this._chips.map(mappingFunction))));
  }
  /** Checks whether an event comes from inside a chip element. */
  _originatesFromChip(event) {
    let currentElement = event.target;
    while (currentElement && currentElement !== this._elementRef.nativeElement) {
      if (currentElement.classList.contains('mat-mdc-chip')) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }
    return false;
  }
  /** Sets up the chip set's focus management logic. */
  _setUpFocusManagement() {
    // Create a flat `QueryList` containing the actions of all of the chips.
    // This allows us to navigate both within the chip and move to the next/previous
    // one using the existing `ListKeyManager`.
    this._chips.changes.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_10__.startWith)(this._chips)).subscribe(chips => {
      const actions = [];
      chips.forEach(chip => chip._getActions().forEach(action => actions.push(action)));
      this._chipActions.reset(actions);
      this._chipActions.notifyOnChanges();
    });
    this._keyManager = new _angular_cdk_a11y__WEBPACK_IMPORTED_MODULE_7__.FocusKeyManager(this._chipActions).withVerticalOrientation().withHorizontalOrientation(this._dir ? this._dir.value : 'ltr').withHomeAndEnd().skipPredicate(action => this._skipPredicate(action));
    // Keep the manager active index in sync so that navigation picks
    // up from the current chip if the user clicks into the list directly.
    this.chipFocusChanges.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(({
      chip
    }) => {
      const action = chip._getSourceAction(document.activeElement);
      if (action) {
        this._keyManager.updateActiveItem(action);
      }
    });
    this._dir?.change.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(direction => this._keyManager.withHorizontalOrientation(direction));
  }
  /**
   * Determines if key manager should avoid putting a given chip action in the tab index. Skip
   * non-interactive and disabled actions since the user can't do anything with them.
   */
  _skipPredicate(action) {
    // Skip chips that the user cannot interact with. `mat-chip-set` does not permit focusing disabled
    // chips.
    return !action.isInteractive || action.disabled;
  }
  /** Listens to changes in the chip set and syncs up the state of the individual chips. */
  _trackChipSetChanges() {
    this._chips.changes.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_10__.startWith)(null), (0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(() => {
      if (this.disabled) {
        // Since this happens after the content has been
        // checked, we need to defer it to the next tick.
        Promise.resolve().then(() => this._syncChipsState());
      }
      this._redirectDestroyedChipFocus();
    });
  }
  /** Starts tracking the destroyed chips in order to capture the focused one. */
  _trackDestroyedFocusedChip() {
    this.chipDestroyedChanges.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(event => {
      const chipArray = this._chips.toArray();
      const chipIndex = chipArray.indexOf(event.chip);
      // If the focused chip is destroyed, save its index so that we can move focus to the next
      // chip. We only save the index here, rather than move the focus immediately, because we want
      // to wait until the chip is removed from the chip list before focusing the next one. This
      // allows us to keep focus on the same index if the chip gets swapped out.
      if (this._isValidIndex(chipIndex) && event.chip._hasFocus()) {
        this._lastDestroyedFocusedChipIndex = chipIndex;
      }
    });
  }
  /**
   * Finds the next appropriate chip to move focus to,
   * if the currently-focused chip is destroyed.
   */
  _redirectDestroyedChipFocus() {
    if (this._lastDestroyedFocusedChipIndex == null) {
      return;
    }
    if (this._chips.length) {
      const newIndex = Math.min(this._lastDestroyedFocusedChipIndex, this._chips.length - 1);
      const chipToFocus = this._chips.toArray()[newIndex];
      if (chipToFocus.disabled) {
        // If we're down to one disabled chip, move focus back to the set.
        if (this._chips.length === 1) {
          this.focus();
        } else {
          this._keyManager.setPreviousItemActive();
        }
      } else {
        chipToFocus.focus();
      }
    } else {
      this.focus();
    }
    this._lastDestroyedFocusedChipIndex = null;
  }
  static {
    this.ɵfac = function MatChipSet_Factory(t) {
      return new (t || MatChipSet)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectorRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_cdk_bidi__WEBPACK_IMPORTED_MODULE_12__.Directionality, 8));
    };
  }
  static {
    this.ɵcmp = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: MatChipSet,
      selectors: [["mat-chip-set"]],
      contentQueries: function MatChipSet_ContentQueries(rf, ctx, dirIndex) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MatChip, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx._chips = _t);
        }
      },
      hostAttrs: [1, "mat-mdc-chip-set", "mdc-evolution-chip-set"],
      hostVars: 1,
      hostBindings: function MatChipSet_HostBindings(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("keydown", function MatChipSet_keydown_HostBindingHandler($event) {
            return ctx._handleKeydown($event);
          });
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("role", ctx.role);
        }
      },
      inputs: {
        disabled: "disabled",
        role: "role"
      },
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]],
      ngContentSelectors: _c5,
      decls: 2,
      vars: 0,
      consts: [["role", "presentation", 1, "mdc-evolution-chip-set__chips"]],
      template: function MatChipSet_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojectionDef"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: [".mdc-evolution-chip-set{display:flex}.mdc-evolution-chip-set:focus{outline:none}.mdc-evolution-chip-set__chips{display:flex;flex-flow:wrap;min-width:0}.mdc-evolution-chip-set--overflow .mdc-evolution-chip-set__chips{flex-flow:nowrap}.mdc-evolution-chip-set .mdc-evolution-chip-set__chips{margin-left:-8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip-set__chips,.mdc-evolution-chip-set .mdc-evolution-chip-set__chips[dir=rtl]{margin-left:0;margin-right:-8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-left:8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip,.mdc-evolution-chip-set .mdc-evolution-chip[dir=rtl]{margin-left:0;margin-right:8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-top:4px;margin-bottom:4px}.mat-mdc-chip-set .mdc-evolution-chip-set__chips{min-width:100%}.mat-mdc-chip-set-stacked{flex-direction:column;align-items:flex-start}.mat-mdc-chip-set-stacked .mat-mdc-chip{width:100%}.mat-mdc-chip-set-stacked .mdc-evolution-chip__graphic{flex-grow:0}.mat-mdc-chip-set-stacked .mdc-evolution-chip__action--primary{flex-basis:100%;justify-content:start}input.mat-mdc-chip-input{flex:1 0 150px;margin-left:8px}[dir=rtl] input.mat-mdc-chip-input{margin-left:0;margin-right:8px}"],
      encapsulation: 2,
      changeDetection: 0
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipSet, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Component,
    args: [{
      selector: 'mat-chip-set',
      template: `
    <div class="mdc-evolution-chip-set__chips" role="presentation">
      <ng-content></ng-content>
    </div>
  `,
      host: {
        'class': 'mat-mdc-chip-set mdc-evolution-chip-set',
        '(keydown)': '_handleKeydown($event)',
        '[attr.role]': 'role'
      },
      encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ViewEncapsulation.None,
      changeDetection: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectionStrategy.OnPush,
      styles: [".mdc-evolution-chip-set{display:flex}.mdc-evolution-chip-set:focus{outline:none}.mdc-evolution-chip-set__chips{display:flex;flex-flow:wrap;min-width:0}.mdc-evolution-chip-set--overflow .mdc-evolution-chip-set__chips{flex-flow:nowrap}.mdc-evolution-chip-set .mdc-evolution-chip-set__chips{margin-left:-8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip-set__chips,.mdc-evolution-chip-set .mdc-evolution-chip-set__chips[dir=rtl]{margin-left:0;margin-right:-8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-left:8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip,.mdc-evolution-chip-set .mdc-evolution-chip[dir=rtl]{margin-left:0;margin-right:8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-top:4px;margin-bottom:4px}.mat-mdc-chip-set .mdc-evolution-chip-set__chips{min-width:100%}.mat-mdc-chip-set-stacked{flex-direction:column;align-items:flex-start}.mat-mdc-chip-set-stacked .mat-mdc-chip{width:100%}.mat-mdc-chip-set-stacked .mdc-evolution-chip__graphic{flex-grow:0}.mat-mdc-chip-set-stacked .mdc-evolution-chip__action--primary{flex-basis:100%;justify-content:start}input.mat-mdc-chip-input{flex:1 0 150px;margin-left:8px}[dir=rtl] input.mat-mdc-chip-input{margin-left:0;margin-right:8px}"]
    }]
  }], function () {
    return [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef
    }, {
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectorRef
    }, {
      type: _angular_cdk_bidi__WEBPACK_IMPORTED_MODULE_12__.Directionality,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }]
    }];
  }, {
    disabled: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    role: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    _chips: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChildren,
      args: [MatChip, {
        // We need to use `descendants: true`, because Ivy will no longer match
        // indirect descendants if it's left as false.
        descendants: true
      }]
    }]
  });
})();

/** Change event object that is emitted when the chip listbox value has changed. */
class MatChipListboxChange {
  constructor( /** Chip listbox that emitted the event. */
  source, /** Value of the chip listbox when the event was emitted. */
  value) {
    this.source = source;
    this.value = value;
  }
}
/**
 * Provider Expression that allows mat-chip-listbox to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)].
 * @docs-private
 */
const MAT_CHIP_LISTBOX_CONTROL_VALUE_ACCESSOR = {
  provide: _angular_forms__WEBPACK_IMPORTED_MODULE_13__.NG_VALUE_ACCESSOR,
  useExisting: (0,_angular_core__WEBPACK_IMPORTED_MODULE_0__.forwardRef)(() => MatChipListbox),
  multi: true
};
/**
 * An extension of the MatChipSet component that supports chip selection.
 * Used with MatChipOption chips.
 */
class MatChipListbox extends MatChipSet {
  constructor() {
    super(...arguments);
    /**
     * Function when touched. Set as part of ControlValueAccessor implementation.
     * @docs-private
     */
    this._onTouched = () => {};
    /**
     * Function when changed. Set as part of ControlValueAccessor implementation.
     * @docs-private
     */
    this._onChange = () => {};
    // TODO: MDC uses `grid` here
    this._defaultRole = 'listbox';
    /** Default chip options. */
    this._defaultOptions = (0,_angular_core__WEBPACK_IMPORTED_MODULE_0__.inject)(MAT_CHIPS_DEFAULT_OPTIONS, {
      optional: true
    });
    this._multiple = false;
    /** Orientation of the chip list. */
    this.ariaOrientation = 'horizontal';
    this._selectable = true;
    /**
     * A function to compare the option values with the selected values. The first argument
     * is a value from an option. The second is a value from the selection. A boolean
     * should be returned.
     */
    this.compareWith = (o1, o2) => o1 === o2;
    this._required = false;
    this._hideSingleSelectionIndicator = this._defaultOptions?.hideSingleSelectionIndicator ?? false;
    /** Event emitted when the selected chip listbox value has been changed by the user. */
    this.change = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this._chips = undefined;
  }
  /** Whether the user should be allowed to select multiple chips. */
  get multiple() {
    return this._multiple;
  }
  set multiple(value) {
    this._multiple = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
    this._syncListboxProperties();
  }
  /** The array of selected chips inside the chip listbox. */
  get selected() {
    const selectedChips = this._chips.toArray().filter(chip => chip.selected);
    return this.multiple ? selectedChips : selectedChips[0];
  }
  /**
   * Whether or not this chip listbox is selectable.
   *
   * When a chip listbox is not selectable, the selected states for all
   * the chips inside the chip listbox are always ignored.
   */
  get selectable() {
    return this._selectable;
  }
  set selectable(value) {
    this._selectable = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
    this._syncListboxProperties();
  }
  /** Whether this chip listbox is required. */
  get required() {
    return this._required;
  }
  set required(value) {
    this._required = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
  }
  /** Whether checkmark indicator for single-selection options is hidden. */
  get hideSingleSelectionIndicator() {
    return this._hideSingleSelectionIndicator;
  }
  set hideSingleSelectionIndicator(value) {
    this._hideSingleSelectionIndicator = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
    this._syncListboxProperties();
  }
  /** Combined stream of all of the child chips' selection change events. */
  get chipSelectionChanges() {
    return this._getChipStream(chip => chip.selectionChange);
  }
  /** Combined stream of all of the child chips' blur events. */
  get chipBlurChanges() {
    return this._getChipStream(chip => chip._onBlur);
  }
  /** The value of the listbox, which is the combined value of the selected chips. */
  get value() {
    return this._value;
  }
  set value(value) {
    this.writeValue(value);
    this._value = value;
  }
  ngAfterContentInit() {
    if (this._pendingInitialValue !== undefined) {
      Promise.resolve().then(() => {
        this._setSelectionByValue(this._pendingInitialValue, false);
        this._pendingInitialValue = undefined;
      });
    }
    this._chips.changes.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_10__.startWith)(null), (0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(() => {
      // Update listbox selectable/multiple properties on chips
      this._syncListboxProperties();
    });
    this.chipBlurChanges.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(() => this._blur());
    this.chipSelectionChanges.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(event => {
      if (!this.multiple) {
        this._chips.forEach(chip => {
          if (chip !== event.source) {
            chip._setSelectedState(false, false, false);
          }
        });
      }
      if (event.isUserInput) {
        this._propagateChanges();
      }
    });
  }
  /**
   * Focuses the first selected chip in this chip listbox, or the first non-disabled chip when there
   * are no selected chips.
   */
  focus() {
    if (this.disabled) {
      return;
    }
    const firstSelectedChip = this._getFirstSelectedChip();
    if (firstSelectedChip && !firstSelectedChip.disabled) {
      firstSelectedChip.focus();
    } else if (this._chips.length > 0) {
      this._keyManager.setFirstItemActive();
    } else {
      this._elementRef.nativeElement.focus();
    }
  }
  /**
   * Implemented as part of ControlValueAccessor.
   * @docs-private
   */
  writeValue(value) {
    if (this._chips) {
      this._setSelectionByValue(value, false);
    } else if (value != null) {
      this._pendingInitialValue = value;
    }
  }
  /**
   * Implemented as part of ControlValueAccessor.
   * @docs-private
   */
  registerOnChange(fn) {
    this._onChange = fn;
  }
  /**
   * Implemented as part of ControlValueAccessor.
   * @docs-private
   */
  registerOnTouched(fn) {
    this._onTouched = fn;
  }
  /**
   * Implemented as part of ControlValueAccessor.
   * @docs-private
   */
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  /** Selects all chips with value. */
  _setSelectionByValue(value, isUserInput = true) {
    this._clearSelection();
    if (Array.isArray(value)) {
      value.forEach(currentValue => this._selectValue(currentValue, isUserInput));
    } else {
      this._selectValue(value, isUserInput);
    }
  }
  /** When blurred, marks the field as touched when focus moved outside the chip listbox. */
  _blur() {
    if (!this.disabled) {
      // Wait to see if focus moves to an individual chip.
      setTimeout(() => {
        if (!this.focused) {
          this._markAsTouched();
        }
      });
    }
  }
  _keydown(event) {
    if (event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.TAB) {
      super._allowFocusEscape();
    }
  }
  /** Marks the field as touched */
  _markAsTouched() {
    this._onTouched();
    this._changeDetectorRef.markForCheck();
  }
  /** Emits change event to set the model value. */
  _propagateChanges() {
    let valueToEmit = null;
    if (Array.isArray(this.selected)) {
      valueToEmit = this.selected.map(chip => chip.value);
    } else {
      valueToEmit = this.selected ? this.selected.value : undefined;
    }
    this._value = valueToEmit;
    this.change.emit(new MatChipListboxChange(this, valueToEmit));
    this._onChange(valueToEmit);
    this._changeDetectorRef.markForCheck();
  }
  /**
   * Deselects every chip in the listbox.
   * @param skip Chip that should not be deselected.
   */
  _clearSelection(skip) {
    this._chips.forEach(chip => {
      if (chip !== skip) {
        chip.deselect();
      }
    });
  }
  /**
   * Finds and selects the chip based on its value.
   * @returns Chip that has the corresponding value.
   */
  _selectValue(value, isUserInput) {
    const correspondingChip = this._chips.find(chip => {
      return chip.value != null && this.compareWith(chip.value, value);
    });
    if (correspondingChip) {
      isUserInput ? correspondingChip.selectViaInteraction() : correspondingChip.select();
    }
    return correspondingChip;
  }
  /** Syncs the chip-listbox selection state with the individual chips. */
  _syncListboxProperties() {
    if (this._chips) {
      // Defer setting the value in order to avoid the "Expression
      // has changed after it was checked" errors from Angular.
      Promise.resolve().then(() => {
        this._chips.forEach(chip => {
          chip._chipListMultiple = this.multiple;
          chip.chipListSelectable = this._selectable;
          chip._chipListHideSingleSelectionIndicator = this.hideSingleSelectionIndicator;
          chip._changeDetectorRef.markForCheck();
        });
      });
    }
  }
  /** Returns the first selected chip in this listbox, or undefined if no chips are selected. */
  _getFirstSelectedChip() {
    if (Array.isArray(this.selected)) {
      return this.selected.length ? this.selected[0] : undefined;
    } else {
      return this.selected;
    }
  }
  /**
   * Determines if key manager should avoid putting a given chip action in the tab index. Skip
   * non-interactive actions since the user can't do anything with them.
   */
  _skipPredicate(action) {
    // Override the skip predicate in the base class to avoid skipping disabled chips. Allow
    // disabled chip options to receive focus to align with WAI ARIA recommendation. Normally WAI
    // ARIA's instructions are to exclude disabled items from the tab order, but it makes a few
    // exceptions for compound widgets.
    //
    // From [Developing a Keyboard Interface](
    // https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/):
    //   "For the following composite widget elements, keep them focusable when disabled: Options in a
    //   Listbox..."
    return !action.isInteractive;
  }
  static {
    this.ɵfac = /* @__PURE__ */function () {
      let ɵMatChipListbox_BaseFactory;
      return function MatChipListbox_Factory(t) {
        return (ɵMatChipListbox_BaseFactory || (ɵMatChipListbox_BaseFactory = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵgetInheritedFactory"](MatChipListbox)))(t || MatChipListbox);
      };
    }();
  }
  static {
    this.ɵcmp = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: MatChipListbox,
      selectors: [["mat-chip-listbox"]],
      contentQueries: function MatChipListbox_ContentQueries(rf, ctx, dirIndex) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MatChipOption, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx._chips = _t);
        }
      },
      hostAttrs: ["ngSkipHydration", "", 1, "mdc-evolution-chip-set", "mat-mdc-chip-listbox"],
      hostVars: 11,
      hostBindings: function MatChipListbox_HostBindings(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("focus", function MatChipListbox_focus_HostBindingHandler() {
            return ctx.focus();
          })("blur", function MatChipListbox_blur_HostBindingHandler() {
            return ctx._blur();
          })("keydown", function MatChipListbox_keydown_HostBindingHandler($event) {
            return ctx._keydown($event);
          });
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵhostProperty"]("tabIndex", ctx.empty ? -1 : ctx.tabIndex);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("role", ctx.role)("aria-describedby", ctx._ariaDescribedby || null)("aria-required", ctx.role ? ctx.required : null)("aria-disabled", ctx.disabled.toString())("aria-multiselectable", ctx.multiple)("aria-orientation", ctx.ariaOrientation);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassProp"]("mat-mdc-chip-list-disabled", ctx.disabled)("mat-mdc-chip-list-required", ctx.required);
        }
      },
      inputs: {
        tabIndex: "tabIndex",
        multiple: "multiple",
        ariaOrientation: ["aria-orientation", "ariaOrientation"],
        selectable: "selectable",
        compareWith: "compareWith",
        required: "required",
        hideSingleSelectionIndicator: "hideSingleSelectionIndicator",
        value: "value"
      },
      outputs: {
        change: "change"
      },
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([MAT_CHIP_LISTBOX_CONTROL_VALUE_ACCESSOR]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]],
      ngContentSelectors: _c5,
      decls: 2,
      vars: 0,
      consts: [["role", "presentation", 1, "mdc-evolution-chip-set__chips"]],
      template: function MatChipListbox_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojectionDef"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: [_c6],
      encapsulation: 2,
      changeDetection: 0
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipListbox, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Component,
    args: [{
      selector: 'mat-chip-listbox',
      template: `
    <div class="mdc-evolution-chip-set__chips" role="presentation">
      <ng-content></ng-content>
    </div>
  `,
      inputs: ['tabIndex'],
      host: {
        'class': 'mdc-evolution-chip-set mat-mdc-chip-listbox',
        '[attr.role]': 'role',
        '[tabIndex]': 'empty ? -1 : tabIndex',
        // TODO: replace this binding with use of AriaDescriber
        '[attr.aria-describedby]': '_ariaDescribedby || null',
        '[attr.aria-required]': 'role ? required : null',
        '[attr.aria-disabled]': 'disabled.toString()',
        '[attr.aria-multiselectable]': 'multiple',
        '[attr.aria-orientation]': 'ariaOrientation',
        'ngSkipHydration': '',
        '[class.mat-mdc-chip-list-disabled]': 'disabled',
        '[class.mat-mdc-chip-list-required]': 'required',
        '(focus)': 'focus()',
        '(blur)': '_blur()',
        '(keydown)': '_keydown($event)'
      },
      providers: [MAT_CHIP_LISTBOX_CONTROL_VALUE_ACCESSOR],
      encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ViewEncapsulation.None,
      changeDetection: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectionStrategy.OnPush,
      styles: [".mdc-evolution-chip-set{display:flex}.mdc-evolution-chip-set:focus{outline:none}.mdc-evolution-chip-set__chips{display:flex;flex-flow:wrap;min-width:0}.mdc-evolution-chip-set--overflow .mdc-evolution-chip-set__chips{flex-flow:nowrap}.mdc-evolution-chip-set .mdc-evolution-chip-set__chips{margin-left:-8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip-set__chips,.mdc-evolution-chip-set .mdc-evolution-chip-set__chips[dir=rtl]{margin-left:0;margin-right:-8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-left:8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip,.mdc-evolution-chip-set .mdc-evolution-chip[dir=rtl]{margin-left:0;margin-right:8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-top:4px;margin-bottom:4px}.mat-mdc-chip-set .mdc-evolution-chip-set__chips{min-width:100%}.mat-mdc-chip-set-stacked{flex-direction:column;align-items:flex-start}.mat-mdc-chip-set-stacked .mat-mdc-chip{width:100%}.mat-mdc-chip-set-stacked .mdc-evolution-chip__graphic{flex-grow:0}.mat-mdc-chip-set-stacked .mdc-evolution-chip__action--primary{flex-basis:100%;justify-content:start}input.mat-mdc-chip-input{flex:1 0 150px;margin-left:8px}[dir=rtl] input.mat-mdc-chip-input{margin-left:0;margin-right:8px}"]
    }]
  }], null, {
    multiple: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    ariaOrientation: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input,
      args: ['aria-orientation']
    }],
    selectable: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    compareWith: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    required: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    hideSingleSelectionIndicator: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    value: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    change: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Output
    }],
    _chips: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChildren,
      args: [MatChipOption, {
        // We need to use `descendants: true`, because Ivy will no longer match
        // indirect descendants if it's left as false.
        descendants: true
      }]
    }]
  });
})();

/** Change event object that is emitted when the chip grid value has changed. */
class MatChipGridChange {
  constructor( /** Chip grid that emitted the event. */
  source, /** Value of the chip grid when the event was emitted. */
  value) {
    this.source = source;
    this.value = value;
  }
}
/**
 * Boilerplate for applying mixins to MatChipGrid.
 * @docs-private
 */
class MatChipGridBase extends MatChipSet {
  constructor(elementRef, changeDetectorRef, dir, _defaultErrorStateMatcher, _parentForm, _parentFormGroup,
  /**
   * Form control bound to the component.
   * Implemented as part of `MatFormFieldControl`.
   * @docs-private
   */
  ngControl) {
    super(elementRef, changeDetectorRef, dir);
    this._defaultErrorStateMatcher = _defaultErrorStateMatcher;
    this._parentForm = _parentForm;
    this._parentFormGroup = _parentFormGroup;
    this.ngControl = ngControl;
    /**
     * Emits whenever the component state changes and should cause the parent
     * form-field to update. Implemented as part of `MatFormFieldControl`.
     * @docs-private
     */
    this.stateChanges = new rxjs__WEBPACK_IMPORTED_MODULE_4__.Subject();
  }
}
const _MatChipGridMixinBase = (0,_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.mixinErrorState)(MatChipGridBase);
/**
 * An extension of the MatChipSet component used with MatChipRow chips and
 * the matChipInputFor directive.
 */
class MatChipGrid extends _MatChipGridMixinBase {
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get disabled() {
    return this.ngControl ? !!this.ngControl.disabled : this._disabled;
  }
  set disabled(value) {
    this._disabled = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
    this._syncChipsState();
  }
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get id() {
    return this._chipInput.id;
  }
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get empty() {
    return (!this._chipInput || this._chipInput.empty) && (!this._chips || this._chips.length === 0);
  }
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get placeholder() {
    return this._chipInput ? this._chipInput.placeholder : this._placeholder;
  }
  set placeholder(value) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  /** Whether any chips or the matChipInput inside of this chip-grid has focus. */
  get focused() {
    return this._chipInput.focused || this._hasFocusedChip();
  }
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get required() {
    return this._required ?? this.ngControl?.control?.hasValidator(_angular_forms__WEBPACK_IMPORTED_MODULE_13__.Validators.required) ?? false;
  }
  set required(value) {
    this._required = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
    this.stateChanges.next();
  }
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get shouldLabelFloat() {
    return !this.empty || this.focused;
  }
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get value() {
    return this._value;
  }
  set value(value) {
    this._value = value;
  }
  /** Combined stream of all of the child chips' blur events. */
  get chipBlurChanges() {
    return this._getChipStream(chip => chip._onBlur);
  }
  constructor(elementRef, changeDetectorRef, dir, parentForm, parentFormGroup, defaultErrorStateMatcher, ngControl) {
    super(elementRef, changeDetectorRef, dir, defaultErrorStateMatcher, parentForm, parentFormGroup, ngControl);
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    this.controlType = 'mat-chip-grid';
    this._defaultRole = 'grid';
    /**
     * List of element ids to propagate to the chipInput's aria-describedby attribute.
     */
    this._ariaDescribedbyIds = [];
    /**
     * Function when touched. Set as part of ControlValueAccessor implementation.
     * @docs-private
     */
    this._onTouched = () => {};
    /**
     * Function when changed. Set as part of ControlValueAccessor implementation.
     * @docs-private
     */
    this._onChange = () => {};
    this._value = [];
    /** Emits when the chip grid value has been changed by the user. */
    this.change = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    /**
     * Emits whenever the raw value of the chip-grid changes. This is here primarily
     * to facilitate the two-way binding for the `value` input.
     * @docs-private
     */
    this.valueChange = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    this._chips = undefined;
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }
  ngAfterContentInit() {
    this.chipBlurChanges.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(() => {
      this._blur();
      this.stateChanges.next();
    });
    (0,rxjs__WEBPACK_IMPORTED_MODULE_5__.merge)(this.chipFocusChanges, this._chips.changes).pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_9__.takeUntil)(this._destroyed)).subscribe(() => this.stateChanges.next());
  }
  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (!this._chipInput && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('mat-chip-grid must be used in combination with matChipInputFor.');
    }
  }
  ngDoCheck() {
    if (this.ngControl) {
      // We need to re-evaluate this on every change detection cycle, because there are some
      // error triggers that we can't subscribe to (e.g. parent form submissions). This means
      // that whatever logic is in here has to be super lean or we risk destroying the performance.
      this.updateErrorState();
    }
  }
  ngOnDestroy() {
    super.ngOnDestroy();
    this.stateChanges.complete();
  }
  /** Associates an HTML input element with this chip grid. */
  registerInput(inputElement) {
    this._chipInput = inputElement;
    this._chipInput.setDescribedByIds(this._ariaDescribedbyIds);
  }
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  onContainerClick(event) {
    if (!this.disabled && !this._originatesFromChip(event)) {
      this.focus();
    }
  }
  /**
   * Focuses the first chip in this chip grid, or the associated input when there
   * are no eligible chips.
   */
  focus() {
    if (this.disabled || this._chipInput.focused) {
      return;
    }
    if (!this._chips.length || this._chips.first.disabled) {
      // Delay until the next tick, because this can cause a "changed after checked"
      // error if the input does something on focus (e.g. opens an autocomplete).
      Promise.resolve().then(() => this._chipInput.focus());
    } else if (this._chips.length) {
      this._keyManager.setFirstItemActive();
    }
    this.stateChanges.next();
  }
  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  setDescribedByIds(ids) {
    // We must keep this up to date to handle the case where ids are set
    // before the chip input is registered.
    this._ariaDescribedbyIds = ids;
    this._chipInput?.setDescribedByIds(ids);
  }
  /**
   * Implemented as part of ControlValueAccessor.
   * @docs-private
   */
  writeValue(value) {
    // The user is responsible for creating the child chips, so we just store the value.
    this._value = value;
  }
  /**
   * Implemented as part of ControlValueAccessor.
   * @docs-private
   */
  registerOnChange(fn) {
    this._onChange = fn;
  }
  /**
   * Implemented as part of ControlValueAccessor.
   * @docs-private
   */
  registerOnTouched(fn) {
    this._onTouched = fn;
  }
  /**
   * Implemented as part of ControlValueAccessor.
   * @docs-private
   */
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
    this.stateChanges.next();
  }
  /** When blurred, mark the field as touched when focus moved outside the chip grid. */
  _blur() {
    if (!this.disabled) {
      // Check whether the focus moved to chip input.
      // If the focus is not moved to chip input, mark the field as touched. If the focus moved
      // to chip input, do nothing.
      // Timeout is needed to wait for the focus() event trigger on chip input.
      setTimeout(() => {
        if (!this.focused) {
          this._propagateChanges();
          this._markAsTouched();
        }
      });
    }
  }
  /**
   * Removes the `tabindex` from the chip grid and resets it back afterwards, allowing the
   * user to tab out of it. This prevents the grid from capturing focus and redirecting
   * it back to the first chip, creating a focus trap, if it user tries to tab away.
   */
  _allowFocusEscape() {
    if (!this._chipInput.focused) {
      super._allowFocusEscape();
    }
  }
  /** Handles custom keyboard events. */
  _handleKeydown(event) {
    if (event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.TAB) {
      if (this._chipInput.focused && (0,_angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.hasModifierKey)(event, 'shiftKey') && this._chips.length && !this._chips.last.disabled) {
        event.preventDefault();
        if (this._keyManager.activeItem) {
          this._keyManager.setActiveItem(this._keyManager.activeItem);
        } else {
          this._focusLastChip();
        }
      } else {
        // Use the super method here since it doesn't check for the input
        // focused state. This allows focus to escape if there's only one
        // disabled chip left in the list.
        super._allowFocusEscape();
      }
    } else if (!this._chipInput.focused) {
      super._handleKeydown(event);
    }
    this.stateChanges.next();
  }
  _focusLastChip() {
    if (this._chips.length) {
      this._chips.last.focus();
    }
  }
  /** Emits change event to set the model value. */
  _propagateChanges() {
    const valueToEmit = this._chips.length ? this._chips.toArray().map(chip => chip.value) : [];
    this._value = valueToEmit;
    this.change.emit(new MatChipGridChange(this, valueToEmit));
    this.valueChange.emit(valueToEmit);
    this._onChange(valueToEmit);
    this._changeDetectorRef.markForCheck();
  }
  /** Mark the field as touched */
  _markAsTouched() {
    this._onTouched();
    this._changeDetectorRef.markForCheck();
    this.stateChanges.next();
  }
  static {
    this.ɵfac = function MatChipGrid_Factory(t) {
      return new (t || MatChipGrid)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectorRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_cdk_bidi__WEBPACK_IMPORTED_MODULE_12__.Directionality, 8), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_13__.NgForm, 8), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_13__.FormGroupDirective, 8), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.ErrorStateMatcher), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_forms__WEBPACK_IMPORTED_MODULE_13__.NgControl, 10));
    };
  }
  static {
    this.ɵcmp = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineComponent"]({
      type: MatChipGrid,
      selectors: [["mat-chip-grid"]],
      contentQueries: function MatChipGrid_ContentQueries(rf, ctx, dirIndex) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵcontentQuery"](dirIndex, MatChipRow, 5);
        }
        if (rf & 2) {
          let _t;
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵqueryRefresh"](_t = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵloadQuery"]()) && (ctx._chips = _t);
        }
      },
      hostAttrs: [1, "mat-mdc-chip-set", "mat-mdc-chip-grid", "mdc-evolution-chip-set"],
      hostVars: 10,
      hostBindings: function MatChipGrid_HostBindings(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("focus", function MatChipGrid_focus_HostBindingHandler() {
            return ctx.focus();
          })("blur", function MatChipGrid_blur_HostBindingHandler() {
            return ctx._blur();
          });
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵhostProperty"]("tabIndex", ctx._chips && ctx._chips.length === 0 ? -1 : ctx.tabIndex);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("role", ctx.role)("aria-disabled", ctx.disabled.toString())("aria-invalid", ctx.errorState);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵclassProp"]("mat-mdc-chip-list-disabled", ctx.disabled)("mat-mdc-chip-list-invalid", ctx.errorState)("mat-mdc-chip-list-required", ctx.required);
        }
      },
      inputs: {
        tabIndex: "tabIndex",
        disabled: "disabled",
        placeholder: "placeholder",
        required: "required",
        value: "value",
        errorStateMatcher: "errorStateMatcher"
      },
      outputs: {
        change: "change",
        valueChange: "valueChange"
      },
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵProvidersFeature"]([{
        provide: _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MatFormFieldControl,
        useExisting: MatChipGrid
      }]), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵInheritDefinitionFeature"]],
      ngContentSelectors: _c5,
      decls: 2,
      vars: 0,
      consts: [["role", "presentation", 1, "mdc-evolution-chip-set__chips"]],
      template: function MatChipGrid_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojectionDef"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵprojection"](1);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵelementEnd"]();
        }
      },
      styles: [_c6],
      encapsulation: 2,
      changeDetection: 0
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipGrid, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Component,
    args: [{
      selector: 'mat-chip-grid',
      template: `
    <div class="mdc-evolution-chip-set__chips" role="presentation">
      <ng-content></ng-content>
    </div>
  `,
      inputs: ['tabIndex'],
      host: {
        'class': 'mat-mdc-chip-set mat-mdc-chip-grid mdc-evolution-chip-set',
        '[attr.role]': 'role',
        '[tabIndex]': '_chips && _chips.length === 0 ? -1 : tabIndex',
        '[attr.aria-disabled]': 'disabled.toString()',
        '[attr.aria-invalid]': 'errorState',
        '[class.mat-mdc-chip-list-disabled]': 'disabled',
        '[class.mat-mdc-chip-list-invalid]': 'errorState',
        '[class.mat-mdc-chip-list-required]': 'required',
        '(focus)': 'focus()',
        '(blur)': '_blur()'
      },
      providers: [{
        provide: _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MatFormFieldControl,
        useExisting: MatChipGrid
      }],
      encapsulation: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ViewEncapsulation.None,
      changeDetection: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectionStrategy.OnPush,
      styles: [".mdc-evolution-chip-set{display:flex}.mdc-evolution-chip-set:focus{outline:none}.mdc-evolution-chip-set__chips{display:flex;flex-flow:wrap;min-width:0}.mdc-evolution-chip-set--overflow .mdc-evolution-chip-set__chips{flex-flow:nowrap}.mdc-evolution-chip-set .mdc-evolution-chip-set__chips{margin-left:-8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip-set__chips,.mdc-evolution-chip-set .mdc-evolution-chip-set__chips[dir=rtl]{margin-left:0;margin-right:-8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-left:8px;margin-right:0}[dir=rtl] .mdc-evolution-chip-set .mdc-evolution-chip,.mdc-evolution-chip-set .mdc-evolution-chip[dir=rtl]{margin-left:0;margin-right:8px}.mdc-evolution-chip-set .mdc-evolution-chip{margin-top:4px;margin-bottom:4px}.mat-mdc-chip-set .mdc-evolution-chip-set__chips{min-width:100%}.mat-mdc-chip-set-stacked{flex-direction:column;align-items:flex-start}.mat-mdc-chip-set-stacked .mat-mdc-chip{width:100%}.mat-mdc-chip-set-stacked .mdc-evolution-chip__graphic{flex-grow:0}.mat-mdc-chip-set-stacked .mdc-evolution-chip__action--primary{flex-basis:100%;justify-content:start}input.mat-mdc-chip-input{flex:1 0 150px;margin-left:8px}[dir=rtl] input.mat-mdc-chip-input{margin-left:0;margin-right:8px}"]
    }]
  }], function () {
    return [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef
    }, {
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ChangeDetectorRef
    }, {
      type: _angular_cdk_bidi__WEBPACK_IMPORTED_MODULE_12__.Directionality,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }]
    }, {
      type: _angular_forms__WEBPACK_IMPORTED_MODULE_13__.NgForm,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }]
    }, {
      type: _angular_forms__WEBPACK_IMPORTED_MODULE_13__.FormGroupDirective,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }]
    }, {
      type: _angular_material_core__WEBPACK_IMPORTED_MODULE_1__.ErrorStateMatcher
    }, {
      type: _angular_forms__WEBPACK_IMPORTED_MODULE_13__.NgControl,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }, {
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Self
      }]
    }];
  }, {
    disabled: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    placeholder: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    required: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    value: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    errorStateMatcher: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    change: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Output
    }],
    valueChange: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Output
    }],
    _chips: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ContentChildren,
      args: [MatChipRow, {
        // We need to use `descendants: true`, because Ivy will no longer match
        // indirect descendants if it's left as false.
        descendants: true
      }]
    }]
  });
})();

// Increasing integer for generating unique ids.
let nextUniqueId = 0;
/**
 * Directive that adds chip-specific behaviors to an input element inside `<mat-form-field>`.
 * May be placed inside or outside of a `<mat-chip-grid>`.
 */
class MatChipInput {
  /** Register input for chip list */
  set chipGrid(value) {
    if (value) {
      this._chipGrid = value;
      this._chipGrid.registerInput(this);
    }
  }
  /**
   * Whether or not the chipEnd event will be emitted when the input is blurred.
   */
  get addOnBlur() {
    return this._addOnBlur;
  }
  set addOnBlur(value) {
    this._addOnBlur = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
  }
  /** Whether the input is disabled. */
  get disabled() {
    return this._disabled || this._chipGrid && this._chipGrid.disabled;
  }
  set disabled(value) {
    this._disabled = (0,_angular_cdk_coercion__WEBPACK_IMPORTED_MODULE_2__.coerceBooleanProperty)(value);
  }
  /** Whether the input is empty. */
  get empty() {
    return !this.inputElement.value;
  }
  constructor(_elementRef, defaultOptions, formField) {
    this._elementRef = _elementRef;
    /** Whether the control is focused. */
    this.focused = false;
    this._addOnBlur = false;
    /** Emitted when a chip is to be added. */
    this.chipEnd = new _angular_core__WEBPACK_IMPORTED_MODULE_0__.EventEmitter();
    /** The input's placeholder text. */
    this.placeholder = '';
    /** Unique id for the input. */
    this.id = `mat-mdc-chip-list-input-${nextUniqueId++}`;
    this._disabled = false;
    this.inputElement = this._elementRef.nativeElement;
    this.separatorKeyCodes = defaultOptions.separatorKeyCodes;
    if (formField) {
      this.inputElement.classList.add('mat-mdc-form-field-input-control');
    }
  }
  ngOnChanges() {
    this._chipGrid.stateChanges.next();
  }
  ngOnDestroy() {
    this.chipEnd.complete();
  }
  ngAfterContentInit() {
    this._focusLastChipOnBackspace = this.empty;
  }
  /** Utility method to make host definition/tests more clear. */
  _keydown(event) {
    if (event) {
      // To prevent the user from accidentally deleting chips when pressing BACKSPACE continuously,
      // We focus the last chip on backspace only after the user has released the backspace button,
      // And the input is empty (see behaviour in _keyup)
      if (event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.BACKSPACE && this._focusLastChipOnBackspace) {
        this._chipGrid._focusLastChip();
        event.preventDefault();
        return;
      } else {
        this._focusLastChipOnBackspace = false;
      }
    }
    this._emitChipEnd(event);
  }
  /**
   * Pass events to the keyboard manager. Available here for tests.
   */
  _keyup(event) {
    // Allow user to move focus to chips next time he presses backspace
    if (!this._focusLastChipOnBackspace && event.keyCode === _angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.BACKSPACE && this.empty) {
      this._focusLastChipOnBackspace = true;
      event.preventDefault();
    }
  }
  /** Checks to see if the blur should emit the (chipEnd) event. */
  _blur() {
    if (this.addOnBlur) {
      this._emitChipEnd();
    }
    this.focused = false;
    // Blur the chip list if it is not focused
    if (!this._chipGrid.focused) {
      this._chipGrid._blur();
    }
    this._chipGrid.stateChanges.next();
  }
  _focus() {
    this.focused = true;
    this._focusLastChipOnBackspace = this.empty;
    this._chipGrid.stateChanges.next();
  }
  /** Checks to see if the (chipEnd) event needs to be emitted. */
  _emitChipEnd(event) {
    if (!event || this._isSeparatorKey(event)) {
      this.chipEnd.emit({
        input: this.inputElement,
        value: this.inputElement.value,
        chipInput: this
      });
      event?.preventDefault();
    }
  }
  _onInput() {
    // Let chip list know whenever the value changes.
    this._chipGrid.stateChanges.next();
  }
  /** Focuses the input. */
  focus() {
    this.inputElement.focus();
  }
  /** Clears the input */
  clear() {
    this.inputElement.value = '';
    this._focusLastChipOnBackspace = true;
  }
  setDescribedByIds(ids) {
    const element = this._elementRef.nativeElement;
    // Set the value directly in the DOM since this binding
    // is prone to "changed after checked" errors.
    if (ids.length) {
      element.setAttribute('aria-describedby', ids.join(' '));
    } else {
      element.removeAttribute('aria-describedby');
    }
  }
  /** Checks whether a keycode is one of the configured separators. */
  _isSeparatorKey(event) {
    return !(0,_angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.hasModifierKey)(event) && new Set(this.separatorKeyCodes).has(event.keyCode);
  }
  static {
    this.ɵfac = function MatChipInput_Factory(t) {
      return new (t || MatChipInput)(_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](MAT_CHIPS_DEFAULT_OPTIONS), _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdirectiveInject"](_angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MAT_FORM_FIELD, 8));
    };
  }
  static {
    this.ɵdir = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineDirective"]({
      type: MatChipInput,
      selectors: [["input", "matChipInputFor", ""]],
      hostAttrs: [1, "mat-mdc-chip-input", "mat-mdc-input-element", "mdc-text-field__input", "mat-input-element"],
      hostVars: 6,
      hostBindings: function MatChipInput_HostBindings(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵlistener"]("keydown", function MatChipInput_keydown_HostBindingHandler($event) {
            return ctx._keydown($event);
          })("keyup", function MatChipInput_keyup_HostBindingHandler($event) {
            return ctx._keyup($event);
          })("blur", function MatChipInput_blur_HostBindingHandler() {
            return ctx._blur();
          })("focus", function MatChipInput_focus_HostBindingHandler() {
            return ctx._focus();
          })("input", function MatChipInput_input_HostBindingHandler() {
            return ctx._onInput();
          });
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵhostProperty"]("id", ctx.id);
          _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵattribute"]("disabled", ctx.disabled || null)("placeholder", ctx.placeholder || null)("aria-invalid", ctx._chipGrid && ctx._chipGrid.ngControl ? ctx._chipGrid.ngControl.invalid : null)("aria-required", ctx._chipGrid && ctx._chipGrid.required || null)("required", ctx._chipGrid && ctx._chipGrid.required || null);
        }
      },
      inputs: {
        chipGrid: ["matChipInputFor", "chipGrid"],
        addOnBlur: ["matChipInputAddOnBlur", "addOnBlur"],
        separatorKeyCodes: ["matChipInputSeparatorKeyCodes", "separatorKeyCodes"],
        placeholder: "placeholder",
        id: "id",
        disabled: "disabled"
      },
      outputs: {
        chipEnd: "matChipInputTokenEnd"
      },
      exportAs: ["matChipInput", "matChipInputFor"],
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵNgOnChangesFeature"]]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipInput, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Directive,
    args: [{
      selector: 'input[matChipInputFor]',
      exportAs: 'matChipInput, matChipInputFor',
      host: {
        // TODO: eventually we should remove `mat-input-element` from here since it comes from the
        // non-MDC version of the input. It's currently being kept for backwards compatibility, because
        // the MDC chips were landed initially with it.
        'class': 'mat-mdc-chip-input mat-mdc-input-element mdc-text-field__input mat-input-element',
        '(keydown)': '_keydown($event)',
        '(keyup)': '_keyup($event)',
        '(blur)': '_blur()',
        '(focus)': '_focus()',
        '(input)': '_onInput()',
        '[id]': 'id',
        '[attr.disabled]': 'disabled || null',
        '[attr.placeholder]': 'placeholder || null',
        '[attr.aria-invalid]': '_chipGrid && _chipGrid.ngControl ? _chipGrid.ngControl.invalid : null',
        '[attr.aria-required]': '_chipGrid && _chipGrid.required || null',
        '[attr.required]': '_chipGrid && _chipGrid.required || null'
      }
    }]
  }], function () {
    return [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.ElementRef
    }, {
      type: undefined,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [MAT_CHIPS_DEFAULT_OPTIONS]
      }]
    }, {
      type: _angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MatFormField,
      decorators: [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Optional
      }, {
        type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Inject,
        args: [_angular_material_form_field__WEBPACK_IMPORTED_MODULE_14__.MAT_FORM_FIELD]
      }]
    }];
  }, {
    chipGrid: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input,
      args: ['matChipInputFor']
    }],
    addOnBlur: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input,
      args: ['matChipInputAddOnBlur']
    }],
    separatorKeyCodes: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input,
      args: ['matChipInputSeparatorKeyCodes']
    }],
    chipEnd: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Output,
      args: ['matChipInputTokenEnd']
    }],
    placeholder: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    id: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }],
    disabled: [{
      type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.Input
    }]
  });
})();
const CHIP_DECLARATIONS = [MatChip, MatChipAvatar, MatChipEditInput, MatChipGrid, MatChipInput, MatChipListbox, MatChipOption, MatChipRemove, MatChipRow, MatChipSet, MatChipTrailingIcon];
class MatChipsModule {
  static {
    this.ɵfac = function MatChipsModule_Factory(t) {
      return new (t || MatChipsModule)();
    };
  }
  static {
    this.ɵmod = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineNgModule"]({
      type: MatChipsModule
    });
  }
  static {
    this.ɵinj = /* @__PURE__ */_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjector"]({
      providers: [_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.ErrorStateMatcher, {
        provide: MAT_CHIPS_DEFAULT_OPTIONS,
        useValue: {
          separatorKeyCodes: [_angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.ENTER]
        }
      }],
      imports: [_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MatCommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_8__.CommonModule, _angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MatRippleModule, _angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MatCommonModule]
    });
  }
}
(function () {
  (typeof ngDevMode === "undefined" || ngDevMode) && _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵsetClassMetadata"](MatChipsModule, [{
    type: _angular_core__WEBPACK_IMPORTED_MODULE_0__.NgModule,
    args: [{
      imports: [_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MatCommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_8__.CommonModule, _angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MatRippleModule],
      exports: [_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.MatCommonModule, CHIP_DECLARATIONS],
      declarations: [MatChipAction, CHIP_DECLARATIONS],
      providers: [_angular_material_core__WEBPACK_IMPORTED_MODULE_1__.ErrorStateMatcher, {
        provide: MAT_CHIPS_DEFAULT_OPTIONS,
        useValue: {
          separatorKeyCodes: [_angular_cdk_keycodes__WEBPACK_IMPORTED_MODULE_3__.ENTER]
        }
      }]
    }]
  }], null, null);
})();

/**
 * Generated bundle index. Do not edit.
 */



/***/ })

}]);
//# sourceMappingURL=src_app_adf-data-explorer_df-data-explorer_component_ts.js.map