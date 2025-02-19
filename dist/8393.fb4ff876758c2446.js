"use strict";(self.webpackChunkdf_admin_interface=self.webpackChunkdf_admin_interface||[]).push([[8393],{78393:(ne,x,o)=>{o.r(x),o.d(x,{DfScriptDetailsComponent:()=>D});var y=o(97582),A=o(78791),C=o(82599),f=o(42346),p=o(64170),d=o(98525),l=o(96814),Z=o(24546);const E=[{label:(0,f.Iu)("scriptTypes.nodejs"),value:Z.h.NODEJS,extension:"js"},{label:(0,f.Iu)("scriptTypes.php"),value:Z.h.PHP,extension:"php"},{label:(0,f.Iu)("scriptTypes.python"),value:Z.h.PYTHON,extension:"py"}];var u,c=o(56223),v=o(32296),J=o(62810),F=o(24630),_=o(2032),U=o(27921),L=o(37398),P=o(15711),S=o(86806),Q=o(25313),T=o(23680),Y=o(45597),m=o(3305),M=o(6625),k=o(94664),j=o(30977),e=o(65879),N=o(65763);function w(i,n){if(1&i&&(e.TgZ(0,"mat-option",12),e._uU(1),e.qZA()),2&i){const t=n.$implicit;e.Q6J("value",t.label),e.xp6(1),e.hij(" ",t.label," ")}}function R(i,n){if(1&i){const t=e.EpF();e.ynx(0),e.TgZ(1,"form",1),e.ALo(2,"async"),e.TgZ(3,"mat-accordion")(4,"mat-expansion-panel",2)(5,"mat-expansion-panel-header")(6,"mat-panel-title"),e._uU(7," Link to Service "),e.qZA(),e._UZ(8,"mat-panel-description"),e.qZA(),e.TgZ(9,"mat-form-field",3)(10,"mat-label"),e._uU(11,"Select Service"),e.qZA(),e.TgZ(12,"mat-select",4),e.YNc(13,w,2,2,"mat-option",5),e.qZA()(),e.TgZ(14,"mat-form-field",3)(15,"mat-label"),e._uU(16,"Repository: "),e.qZA(),e._UZ(17,"input",6),e.qZA(),e.TgZ(18,"mat-form-field",3)(19,"mat-label"),e._uU(20,"Branch/Tag: "),e.qZA(),e._UZ(21,"input",7),e.qZA(),e.TgZ(22,"mat-form-field",3)(23,"mat-label"),e._uU(24,"Path"),e.qZA(),e._UZ(25,"input",8),e.qZA(),e.TgZ(26,"div",9)(27,"button",10),e.NdJ("click",function(){e.CHM(t);const s=e.oxw();return e.KtG(s.onViewLatest())}),e._UZ(28,"i",11),e._uU(29," View Latest "),e.qZA(),e.TgZ(30,"button",10),e.NdJ("click",function(){e.CHM(t);const s=e.oxw();return e.KtG(s.onDeleteCache())}),e._UZ(31,"i",11),e._uU(32," Delete Cache "),e.qZA()()()()(),e.BQk()}if(2&i){const t=e.oxw();e.xp6(1),e.Tol(e.lcZ(2,5,t.isDarkMode)?"dark-theme":""),e.Q6J("formGroup",t.roleForm),e.xp6(3),e.Q6J("expanded",!1),e.xp6(9),e.Q6J("ngForOf",t.storageServices)}}let b=((u=class{constructor(n,t,a,s){this.themeService=n,this.cacheService=t,this.baseService=a,this.crudService=s,this.storageServices=[],this.selectType=!1,this.isDarkMode=this.themeService.darkMode$,this.roleForm=new c.cw({serviceList:new c.NI(""),repoInput:new c.NI(""),branchInput:new c.NI(""),pathInput:new c.NI("")}),this.baseService.getAll({additionalParams:[{key:"group",value:"source control,file"}]}).subscribe(r=>{this.storageServices=r.services})}ngOnInit(){this.updateDataSource()}ngOnChanges(n){n.storageServiceId&&this.findServiceById()}findServiceById(){this.selectType="github"===this.storageServices.find(t=>t.name===this.storageServiceId)?.type}updateDataSource(){}onViewLatest(){const n=this.roleForm.getRawValue(),I=`${n.serviceList??""}/_repo/${n.repoInput??""}?branch=${n.branchInput??""}&content=1&path=${n.pathInput??""}`;I.endsWith(".json")?this.baseService.downloadJson(I).subscribe(h=>this.content.setValue(h)):this.baseService.downloadFile(I).pipe((0,k.w)(h=>(0,j.Vu)(h))).subscribe(h=>this.content.setValue(h))}onDeleteCache(){this.cache&&this.cacheService.delete(`_event/${this.cache}`,{snackbarSuccess:"scripts.deleteCacheSuccessMsg"}).subscribe()}}).\u0275fac=function(n){return new(n||u)(e.Y36(N.F),e.Y36(S.OP),e.Y36(S.PA),e.Y36(S.qY))},u.\u0275cmp=e.Xpm({type:u,selectors:[["df-link-service"]],inputs:{cache:"cache",storageServiceId:"storageServiceId",storagePath:"storagePath",content:"content"},standalone:!0,features:[e._Bn([M.R]),e.TTD,e.jDz],decls:1,vars:1,consts:[[4,"ngIf"],[1,"details-section",3,"formGroup"],[3,"expanded"],["appearance","outline","subscriptSizing","dynamic",1,"full-width","form-field-gap"],["formControlName","serviceList"],[3,"value",4,"ngFor","ngForOf"],["matInput","","type","text","placeholder","path","formControlName","repoInput"],["matInput","","type","text","placeholder","path","formControlName","branchInput"],["matInput","","type","text","placeholder","path","formControlName","pathInput"],[1,"full-width","action-bar"],["mat-flat-button","","type","button","color","primary",1,"save-btn",3,"click"],[1,"fa","fa-refresh"],[3,"value"]],template:function(n,t){1&n&&e.YNc(0,R,33,7,"ng-container",0),2&n&&e.Q6J("ngIf",t.selectType)},dependencies:[p.lN,p.KE,p.hX,v.ot,v.lW,Q.p0,_.c,_.Nt,d.LD,d.gD,T.ey,C.rP,Y.uH,m.To,m.pp,m.ib,m.yz,m.yK,m.u4,l.Ov,T.Ng,c.UX,c._Y,c.Fj,c.JJ,c.JL,c.sg,c.u,l.ez,l.sg,l.O5],styles:[".lnik-service-accordion[_ngcontent-%COMP%]{padding:16px 0}.mat-column-actions[_ngcontent-%COMP%], .mat-column-private[_ngcontent-%COMP%]{max-width:10%}.mat-mdc-cell[_ngcontent-%COMP%]{padding:8px}.form-field-gap[_ngcontent-%COMP%]{margin-top:10px;margin-bottom:10px}"]}),u);b=(0,y.gn)([(0,A.c)({checkProperties:!0})],b);var g,q=o(94517),O=o(81896);function G(i,n){if(1&i&&(e.TgZ(0,"mat-option",17),e._uU(1),e.qZA()),2&i){const t=n.$implicit;e.Q6J("value",t),e.xp6(1),e.hij(" ",t," ")}}function B(i,n){if(1&i&&(e.TgZ(0,"mat-option",17),e._uU(1),e.qZA()),2&i){const t=n.$implicit;e.Q6J("value",t),e.xp6(1),e.hij(" ",t," ")}}function V(i,n){if(1&i&&(e.TgZ(0,"mat-option",17),e._uU(1),e.qZA()),2&i){const t=n.$implicit;e.Q6J("value",t),e.xp6(1),e.hij(" ",t," ")}}function $(i,n){1&i&&(e.ynx(0),e._uU(1,"Table Name"),e.BQk())}function H(i,n){1&i&&e._uU(0,"Name")}function K(i,n){if(1&i&&(e.TgZ(0,"mat-option",17),e._uU(1),e.qZA()),2&i){const t=n.$implicit;e.Q6J("value",t),e.xp6(1),e.hij(" ",t," ")}}function z(i,n){if(1&i){const t=e.EpF();e.ynx(0),e.TgZ(1,"mat-form-field",3)(2,"mat-label"),e.YNc(3,$,2,0,"ng-container",1),e.YNc(4,H,1,0,"ng-template",null,18,e.W1O),e.qZA(),e.TgZ(6,"mat-select",13),e.NdJ("valueChange",function(s){e.CHM(t);const r=e.oxw(2);return e.KtG(r.selectTable=s)})("selectionChange",function(){e.CHM(t);const s=e.oxw(2);return e.KtG(s.selectedTable())}),e.YNc(7,K,2,2,"mat-option",5),e.qZA()(),e.BQk()}if(2&i){const t=e.MAs(5),a=e.oxw(2);e.xp6(3),e.Q6J("ngIf","table"===a.tableProcedureFlag)("ngIfElse",t),e.xp6(3),e.Q6J("value",a.selectTable),e.xp6(1),e.Q6J("ngForOf",a.tableOptions)}}function W(i,n){if(1&i&&(e.ynx(0),e.TgZ(1,"mat-form-field",19)(2,"mat-label"),e._uU(3),e.ALo(4,"transloco"),e.qZA(),e._UZ(5,"input",20),e.qZA(),e.BQk()),2&i){const t=e.oxw(2);e.xp6(3),e.Oqu(e.lcZ(4,2,"scripts.scriptName")),e.xp6(2),e.Q6J("value",t.completeScriptName)}}function X(i,n){if(1&i){const t=e.EpF();e.ynx(0),e.TgZ(1,"mat-form-field",3)(2,"mat-label"),e._uU(3),e.ALo(4,"transloco"),e.qZA(),e.TgZ(5,"mat-select",13),e.NdJ("valueChange",function(s){e.CHM(t);const r=e.oxw();return e.KtG(r.selectedServiceItem=s)})("selectionChange",function(){e.CHM(t);const s=e.oxw();return e.KtG(s.selectedServiceItemEvent())}),e.YNc(6,G,2,2,"mat-option",5),e.qZA()(),e.TgZ(7,"mat-form-field",14)(8,"mat-label"),e._uU(9),e.ALo(10,"transloco"),e.qZA(),e.TgZ(11,"mat-select",13),e.NdJ("valueChange",function(s){e.CHM(t);const r=e.oxw();return e.KtG(r.selectedEventItem=s)})("selectionChange",function(){e.CHM(t);const s=e.oxw();return e.KtG(s.selectedEventItemEvent())}),e.YNc(12,B,2,2,"mat-option",5),e.qZA()(),e.TgZ(13,"mat-form-field",14)(14,"mat-label"),e._uU(15),e.ALo(16,"transloco"),e.qZA(),e.TgZ(17,"mat-select",15),e.NdJ("valueChange",function(s){e.CHM(t);const r=e.oxw();return e.KtG(r.selectedRouteItem=s)}),e.YNc(18,V,2,2,"mat-option",5),e.qZA()(),e.YNc(19,z,8,4,"ng-container",16),e.YNc(20,W,6,4,"ng-container",16),e.BQk()}if(2&i){const t=e.oxw();e.xp6(3),e.Oqu(e.lcZ(4,11,"service")),e.xp6(2),e.Q6J("value",t.selectedServiceItem),e.xp6(1),e.Q6J("ngForOf",t.storeServiceArray),e.xp6(3),e.Oqu(e.lcZ(10,13,"scripts.scriptType")),e.xp6(2),e.Q6J("value",t.selectedEventItem),e.xp6(1),e.Q6J("ngForOf",t.ungroupedEventItems),e.xp6(3),e.Oqu(e.lcZ(16,15,"scripts.scriptMethod")),e.xp6(2),e.Q6J("value",t.selectedRouteItem),e.xp6(1),e.Q6J("ngForOf",t.ungroupedRouteOptions),e.xp6(1),e.Q6J("ngIf",t.tableOptions),e.xp6(1),e.Q6J("ngIf",t.completeScriptName)}}function ee(i,n){if(1&i&&(e.TgZ(0,"mat-form-field",19)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e._UZ(4,"input",21),e.qZA()),2&i){const t=e.oxw();e.xp6(2),e.Oqu(e.lcZ(3,2,"scripts.tableName")),e.xp6(2),e.Q6J("value",t.completeScriptName)}}function te(i,n){if(1&i&&(e.TgZ(0,"mat-option",17),e._uU(1),e.qZA()),2&i){const t=n.$implicit;e.Q6J("value",t.value),e.xp6(1),e.hij(" ",t.label," ")}}let D=((g=class{constructor(n,t,a,s,r){this.activatedRoute=n,this.fb=t,this.router=a,this.eventScriptService=s,this.themeService=r,this.types=E,this.type="create",this.loaded=!1,this.isDarkMode=this.themeService.darkMode$,this.storeServiceArray=[],this.ungroupedEventItems=[],this.scriptForm=this.fb.group({name:[""],type:["nodejs",[c.kI.required]],content:[""],storageServiceId:[],storagePath:[""],isActive:[!1],allow_event_modification:[!1]})}ngOnInit(){this.activatedRoute.data.subscribe(({data:n,type:t})=>{if(this.type=t,"edit"===t){this.scriptDetails=n;let a=Object.keys(n).reduce((s,r)=>({...s,[(0,q.Vn)(r)]:n[r]}),{});a={...a,isActive:n.isActive},this.scriptForm.patchValue(a),this.scriptForm.controls.name.disable(),this.completeScriptName=n.name}else this.scriptEvents=(0,P.p)(n),this.unGroupedEvents=n,this.storageServices=n,this.storeServiceArray=Object.keys(this.storageServices)}),this.scriptEventsOptions=this.scriptForm.controls.name.valueChanges.pipe((0,U.O)(""),(0,L.U)(n=>this.filterGroup(n))),this.loaded=!0}getControl(n){return this.scriptForm.controls[n]}goBack(){this.router.navigate(["../"],{relativeTo:this.activatedRoute})}submit(){if(!this.scriptForm.valid)return;const n=this.scriptForm.getRawValue(),t={...n,storageServiceId:"local_file"===n.storageServiceId?.type?n.storageServiceId?.id:null,storage_path:"local_file"===n.storageServiceId?.type?n.storagePath:null,name:this.completeScriptName??this.selectedRouteItem};"edit"===this.type?(this.scriptDetails={...this.scriptDetails,...t},this.eventScriptService.update(n.name,n).subscribe(()=>this.goBack())):(this.scriptDetails=n,this.eventScriptService.create(t,void 0,t.name).subscribe(()=>this.goBack()))}filterGroup(n){return n?this.scriptEvents.map(t=>({name:t.name,endpoints:t.endpoints.filter(a=>a.toLowerCase().includes(n.toLowerCase()))})).filter(t=>t.endpoints.length>0):this.scriptEvents}selectedServiceItemEvent(){this.ungroupedEventItems=[],this.ungroupedRouteOptions=[],this.selectedRouteItem="";let n=this.selectedServiceItem;"api_docs"===n&&(n="apiDocs"),this.ungroupedEventOptions=this.unGroupedEvents[n],this.ungroupedEventItems=this.ungroupedEventItems||[],Object.keys(this.ungroupedEventOptions).forEach(t=>{this.ungroupedEventItems.push(t)})}selectedEventItemEvent(){this.ungroupedRouteOptions=[...this.ungroupedEventOptions[this.selectedEventItem].endpoints];const n=this.ungroupedEventOptions[this.selectedEventItem].parameter;n&&"object"==typeof n&&Object.keys(n).length>0&&("tableName"===Object.keys(n)[0]?(this.tableProcedureFlag="table",this.tableOptions=[...this.ungroupedEventOptions[this.selectedEventItem].parameter.tableName]):"procedureName"===Object.keys(n)[0]?(this.tableProcedureFlag="procedure",this.tableOptions=[...this.ungroupedEventOptions[this.selectedEventItem].parameter.procedureName]):"functionName"===Object.keys(n)[0]&&(this.tableProcedureFlag="function",this.tableOptions=[...this.ungroupedEventOptions[this.selectedEventItem].parameter.procedureName]))}selectedTable(){this.completeScriptName=this.selectedRouteItem.replace("{table_name}",this.selectTable)}selectedRoute(){this.completeScriptName=this.selectedRouteItem,this.selectTable&&(this.completeScriptName=this.completeScriptName.replace("{table_name}",this.selectTable))}}).\u0275fac=function(n){return new(n||g)(e.Y36(O.gz),e.Y36(c.qu),e.Y36(O.F0),e.Y36(S.qY),e.Y36(N.F))},g.\u0275cmp=e.Xpm({type:g,selectors:[["df-script-details"]],standalone:!0,features:[e.jDz],decls:26,vars:32,consts:[[1,"details-section",3,"formGroup","ngSubmit"],[4,"ngIf","ngIfElse"],["editing",""],["appearance","outline","subscriptSizing","dynamic",1,"full-width"],["formControlName","type"],[3,"value",4,"ngFor","ngForOf"],["formControlName","isActive",1,"dynamic-width"],["formControlName","allow_event_modification",1,"dynamic-width"],[3,"cache","storageServiceId","storagePath","content"],[1,"full-width",3,"cache","type","storageServiceId","storagePath","content"],[1,"full-width","action-bar"],["mat-flat-button","","type","button",1,"cancel-btn",3,"click"],["mat-flat-button","","color","primary",1,"save-btn"],[3,"value","valueChange","selectionChange"],["appearance","outline","subscriptSizing","dynamic",1,"half-width"],[3,"value","valueChange"],[4,"ngIf"],[3,"value"],["procedure",""],["appearance","outline",1,"full-width"],["matInput","",3,"value"],["matInput","","disabled","",3,"value"]],template:function(n,t){if(1&n&&(e.TgZ(0,"form",0),e.NdJ("ngSubmit",function(){return t.submit()}),e.ALo(1,"async"),e.YNc(2,X,21,17,"ng-container",1),e.YNc(3,ee,5,4,"ng-template",null,2,e.W1O),e.TgZ(5,"mat-form-field",3)(6,"mat-label"),e._uU(7),e.ALo(8,"transloco"),e.qZA(),e.TgZ(9,"mat-select",4),e.YNc(10,te,2,2,"mat-option",5),e.qZA()(),e.TgZ(11,"mat-slide-toggle",6),e._uU(12),e.ALo(13,"transloco"),e.qZA(),e.TgZ(14,"mat-slide-toggle",7),e._uU(15),e.ALo(16,"transloco"),e.qZA(),e._UZ(17,"df-link-service",8)(18,"df-script-editor",9),e.TgZ(19,"div",10)(20,"button",11),e.NdJ("click",function(){return t.goBack()}),e._uU(21),e.ALo(22,"transloco"),e.qZA(),e.TgZ(23,"button",12),e._uU(24),e.ALo(25,"transloco"),e.qZA()()()),2&n){const a=e.MAs(4);e.Tol(e.lcZ(1,20,t.isDarkMode)?"dark-theme":""),e.Q6J("formGroup",t.scriptForm),e.xp6(2),e.Q6J("ngIf","edit"!==t.type)("ngIfElse",a),e.xp6(5),e.Oqu(e.lcZ(8,22,"scriptType")),e.xp6(3),e.Q6J("ngForOf",t.types),e.xp6(2),e.Oqu(e.lcZ(13,24,"active")),e.xp6(3),e.Oqu(e.lcZ(16,26,"eventModification")),e.xp6(2),e.Q6J("cache",t.scriptForm.getRawValue().name)("storageServiceId",t.selectedServiceItem)("storagePath",t.getControl("storagePath"))("content",t.getControl("content")),e.xp6(1),e.Q6J("cache",t.scriptForm.getRawValue().name)("type",t.getControl("type"))("storageServiceId",t.getControl("storageServiceId"))("storagePath",t.getControl("storagePath"))("content",t.getControl("content")),e.xp6(3),e.hij(" ",e.lcZ(22,28,"cancel")," "),e.xp6(3),e.hij(" ",e.lcZ(25,30,"save")," ")}},dependencies:[C.rP,C.Rr,f.Ot,p.lN,p.KE,p.hX,d.LD,d.gD,T.ey,l.ax,c.u5,c._Y,c.JJ,c.JL,c.UX,c.sg,c.u,v.ot,v.lW,J.E,F.Bb,_.c,_.Nt,l.Ov,l.ez,l.O5,b],encapsulation:2}),g);D=(0,y.gn)([(0,A.c)({checkProperties:!0})],D)}}]);