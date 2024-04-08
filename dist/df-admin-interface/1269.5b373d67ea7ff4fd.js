"use strict";(self.webpackChunkdf_admin_interface=self.webpackChunkdf_admin_interface||[]).push([[1269],{41269:(v,m,o)=>{o.r(m),o.d(m,{DfCorsConfigDetailsComponent:()=>D});var d,e=o(97582),s=o(56223),_=o(32296),f=o(23680),l=o(64170),u=o(2032),E=o(98525),g=o(82599),A=o(42346),i=o(86806),c=o(75986),a=o(75058),p=o(78791),T=o(41089),M=o(26306),O=o(58504),t=o(65879),P=o(81896);o(6625);const b=function(h){return{label:h}};let D=((d=class{constructor(n,r,C,Z){this.corsConfigService=n,this.router=r,this.activatedRoute=C,this.formBuilder=Z,this.allMethodsSelected=!1,this.type="create",this.alertMsg="",this.showAlert=!1,this.alertType="error",this.corsForm=this.formBuilder.group({path:["",s.kI.required],description:[""],origins:["",s.kI.required],headers:["",s.kI.required],exposedHeaders:["",s.kI.required],maxAge:[0,s.kI.required],methods:["",s.kI.required],credentials:[!0],enabled:[!0]})}ngOnInit(){this.activatedRoute.data.subscribe(n=>{this.type=n.type,"edit"===this.type&&(this.corsConfigToEdit=n.data,this.corsForm.setValue({path:this.corsConfigToEdit.path,description:this.corsConfigToEdit.description,origins:this.corsConfigToEdit.origin,headers:this.corsConfigToEdit.header,exposedHeaders:this.corsConfigToEdit.exposedHeader,maxAge:this.corsConfigToEdit.maxAge,methods:this.corsConfigToEdit.method,credentials:this.corsConfigToEdit.supportsCredentials,enabled:this.corsConfigToEdit.enabled}),5===this.corsConfigToEdit.method.length&&(this.allMethodsSelected=!0))})}triggerAlert(n,r){this.alertType=n,this.alertMsg=r,this.showAlert=!0}assemblePayload(){const n={path:this.corsForm.value.path,description:this.corsForm.value.description,origin:this.corsForm.value.origins,header:this.corsForm.value.headers,exposedHeader:this.corsForm.value.exposedHeaders,maxAge:this.corsForm.value.maxAge,method:this.corsForm.value.methods,supportsCredentials:this.corsForm.value.credentials,enabled:this.corsForm.value.enabled};return this.corsConfigToEdit?{...n,createdById:this.corsConfigToEdit.createdById,createdDate:this.corsConfigToEdit.createdDate,lastModifiedById:this.corsConfigToEdit.lastModifiedById,lastModifiedDate:this.corsConfigToEdit.lastModifiedDate}:n}onSubmit(){if(this.corsForm.valid)if(this.corsConfigToEdit){const n=this.assemblePayload();this.corsConfigService.update(this.corsConfigToEdit.id,n,{snackbarSuccess:"cors.alerts.updateSuccess"}).pipe((0,M.K)(r=>(this.triggerAlert("error",r.error.error.message),(0,O._)(()=>new Error(r))))).subscribe(r=>{this.router.navigate(["../",r.id],{relativeTo:this.activatedRoute})})}else{const n=this.assemblePayload();this.corsConfigService.create({resource:[n]},{fields:"*",snackbarSuccess:"cors.alerts.createSuccess"}).pipe((0,M.K)(r=>(this.triggerAlert("error",r.error.error.context.resource[0].message),(0,O._)(()=>new Error(r))))).subscribe(r=>{this.router.navigate(["../",r.resource[0].id],{relativeTo:this.activatedRoute})})}}onCancel(){this.router.navigate(["../"],{relativeTo:this.activatedRoute})}}).\u0275fac=function(n){return new(n||d)(t.Y36(i.Qi),t.Y36(P.F0),t.Y36(P.gz),t.Y36(s.qu))},d.\u0275cmp=t.Xpm({type:d,selectors:[["df-cors-config-details"]],standalone:!0,features:[t.jDz],decls:52,vars:42,consts:[[3,"showAlert","alertType","alertClosed"],[1,"df-cors-config-container"],[1,"details-section",3,"formGroup","ngSubmit"],["subscriptSizing","dynamic",1,"dynamic-width"],["matInput","","type","url","formControlName","path"],["matInput","","type","text","formControlName","origins"],["subscriptSizing","dynamic",1,"full-width"],["rows","1","matInput","","type","text","formControlName","description"],["matInput","","type","text","formControlName","headers"],["matInput","","type","text","formControlName","exposedHeaders"],["matInput","","type","number","formControlName","maxAge"],["formControlName","methods","type","verb_multiple",1,"dynamic-width",3,"schema"],["formControlName","credentials",1,"dynamic-width"],["formControlName","enabled",1,"dynamic-width"],[1,"full-width","action-bar"],["type","button","mat-flat-button","",3,"click"],["mat-flat-button","","color","primary","type","submit"]],template:function(n,r){1&n&&(t.TgZ(0,"df-alert",0),t.NdJ("alertClosed",function(){return r.showAlert=!1}),t._uU(1),t.qZA(),t.TgZ(2,"div",1)(3,"h4"),t._uU(4),t.ALo(5,"transloco"),t.qZA(),t.TgZ(6,"form",2),t.NdJ("ngSubmit",function(){return r.onSubmit()}),t.TgZ(7,"mat-form-field",3)(8,"mat-label"),t._uU(9),t.ALo(10,"transloco"),t.qZA(),t._UZ(11,"input",4),t.qZA(),t.TgZ(12,"mat-form-field",3)(13,"mat-label"),t._uU(14),t.ALo(15,"transloco"),t.qZA(),t._UZ(16,"input",5),t.qZA(),t.TgZ(17,"mat-form-field",6)(18,"mat-label"),t._uU(19),t.ALo(20,"transloco"),t.qZA(),t._UZ(21,"textarea",7),t.qZA(),t.TgZ(22,"mat-form-field",3)(23,"mat-label"),t._uU(24),t.ALo(25,"transloco"),t.qZA(),t._UZ(26,"input",8),t.qZA(),t.TgZ(27,"mat-form-field",3)(28,"mat-label"),t._uU(29),t.ALo(30,"transloco"),t.qZA(),t._UZ(31,"input",9),t.qZA(),t.TgZ(32,"mat-form-field",3)(33,"mat-label"),t._uU(34),t.ALo(35,"transloco"),t.qZA(),t._UZ(36,"input",10),t.qZA(),t._UZ(37,"df-verb-picker",11),t.ALo(38,"transloco"),t.TgZ(39,"mat-slide-toggle",12),t._uU(40),t.ALo(41,"transloco"),t.qZA(),t.TgZ(42,"mat-slide-toggle",13),t._uU(43),t.ALo(44,"transloco"),t.qZA(),t.TgZ(45,"div",14)(46,"button",15),t.NdJ("click",function(){return r.onCancel()}),t._uU(47),t.ALo(48,"transloco"),t.qZA(),t.TgZ(49,"button",16),t._uU(50),t.ALo(51,"transloco"),t.qZA()()()()),2&n&&(t.Q6J("showAlert",r.showAlert)("alertType",r.alertType),t.xp6(1),t.hij(" ",r.alertMsg,"\n"),t.xp6(3),t.Oqu(t.lcZ(5,16,"cors.pageSubtitle")),t.xp6(2),t.Q6J("formGroup",r.corsForm),t.xp6(3),t.Oqu(t.lcZ(10,18,"cors.formControls.path")),t.xp6(5),t.Oqu(t.lcZ(15,20,"cors.formControls.origins")),t.xp6(5),t.Oqu(t.lcZ(20,22,"cors.formControls.description")),t.xp6(5),t.Oqu(t.lcZ(25,24,"cors.formControls.headers")),t.xp6(5),t.Oqu(t.lcZ(30,26,"cors.formControls.exposedHeaders")),t.xp6(5),t.Oqu(t.lcZ(35,28,"cors.formControls.maxAge")),t.xp6(3),t.Q6J("schema",t.VKq(40,b,t.lcZ(38,30,"cors.formControls.methods"))),t.xp6(3),t.hij(" ",t.lcZ(41,32,"cors.formControls.supportsCredentials")," "),t.xp6(3),t.hij(" ",t.lcZ(44,34,"cors.formControls.enabled")," "),t.xp6(4),t.hij(" ",t.lcZ(48,36,"cancel")," "),t.xp6(3),t.hij(" ",t.lcZ(51,38,"create"===r.type?"create":"update")," "))},dependencies:[s.UX,s._Y,s.Fj,s.wV,s.JJ,s.JL,s.sg,s.u,s.u5,l.lN,l.KE,l.hX,c.p9,u.c,u.Nt,E.LD,f.Ng,g.rP,g.Rr,_.ot,_.lW,A.Ot,a.M,T.v],encapsulation:2}),d);D=(0,e.gn)([(0,p.c)({checkProperties:!0})],D)},41089:(v,m,o)=>{o.d(m,{v:()=>A});var e=o(65879),s=o(96814),_=o(32296),f=o(45597),l=o(90590);function u(i,c){if(1&i){const a=e.EpF();e.TgZ(0,"button",5),e.NdJ("click",function(){e.CHM(a);const T=e.oxw(2);return e.KtG(T.dismissAlert())}),e.TgZ(1,"fa-icon",6),e._uU(2),e.qZA()()}if(2&i){const a=e.oxw(2);e.xp6(1),e.Q6J("icon",a.faXmark),e.xp6(1),e.Oqu("alerts.close")}}function E(i,c){if(1&i&&(e.TgZ(0,"div",1),e._UZ(1,"fa-icon",2),e.TgZ(2,"span",3),e.Hsn(3),e.qZA(),e.YNc(4,u,3,2,"button",4),e.qZA()),2&i){const a=e.oxw();e.Tol(a.alertType),e.xp6(1),e.Q6J("icon",a.icon),e.xp6(3),e.Q6J("ngIf",a.dismissible)}}const g=["*"];let A=(()=>{class i{constructor(){this.alertType="success",this.showAlert=!1,this.dismissible=!0,this.alertClosed=new e.vpe,this.faXmark=l.g82}dismissAlert(){this.alertClosed.emit()}get icon(){switch(this.alertType){case"success":return l.f8k;case"error":return l.$9F;case"warning":return l.RLE;default:return l.sqG}}}return i.\u0275fac=function(a){return new(a||i)},i.\u0275cmp=e.Xpm({type:i,selectors:[["df-alert"]],inputs:{alertType:"alertType",showAlert:"showAlert",dismissible:"dismissible"},outputs:{alertClosed:"alertClosed"},standalone:!0,features:[e.jDz],ngContentSelectors:g,decls:1,vars:1,consts:[["class","alert-container",3,"class",4,"ngIf"],[1,"alert-container"],["aria-hidden","true",1,"alert-icon",3,"icon"],["role","alert",1,"alert-message"],["mat-icon-button","","class","dismiss-alert",3,"click",4,"ngIf"],["mat-icon-button","",1,"dismiss-alert",3,"click"],[3,"icon"]],template:function(a,p){1&a&&(e.F$t(),e.YNc(0,E,5,4,"div",0)),2&a&&e.Q6J("ngIf",p.showAlert)},dependencies:[s.O5,_.ot,_.RK,f.uH,f.BN],styles:[".alert-container[_ngcontent-%COMP%]{display:flex;flex-direction:row;align-items:center;justify-content:space-between;border:1px solid;border-radius:5px;box-shadow:0 0 5px #0003;color:#000}.alert-container[_ngcontent-%COMP%]   .alert-message[_ngcontent-%COMP%]{flex:1;padding:8px}.alert-container[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{padding:0 10px}.alert-container.success[_ngcontent-%COMP%]{border-color:#81c784;background-color:#c8e6c9}.alert-container.success[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#4caf50}.alert-container.error[_ngcontent-%COMP%]{border-color:#e57373;background-color:#ffcdd2}.alert-container.error[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#f44336}.alert-container.warning[_ngcontent-%COMP%]{border-color:#ffb74d;background-color:#ffe0b2}.alert-container.warning[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#ff9800}.alert-container.info[_ngcontent-%COMP%]{border-color:#64b5f6;background-color:#bbdefb}.alert-container.info[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#2196f3}"]}),i})()}}]);