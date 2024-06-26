"use strict";(self.webpackChunkdf_admin_interface=self.webpackChunkdf_admin_interface||[]).push([[4796],{41089:(R,P,a)=>{a.d(P,{v:()=>M});var _=a(65879),c=a(96814),n=a(32296),m=a(45597),f=a(90590);function h(u,g){if(1&u){const C=_.EpF();_.TgZ(0,"button",5),_.NdJ("click",function(){_.CHM(C);const e=_.oxw(2);return _.KtG(e.dismissAlert())}),_.TgZ(1,"fa-icon",6),_._uU(2),_.qZA()()}if(2&u){const C=_.oxw(2);_.xp6(1),_.Q6J("icon",C.faXmark),_.xp6(1),_.Oqu("alerts.close")}}function T(u,g){if(1&u&&(_.TgZ(0,"div",1),_._UZ(1,"fa-icon",2),_.TgZ(2,"span",3),_.Hsn(3),_.qZA(),_.YNc(4,h,3,2,"button",4),_.qZA()),2&u){const C=_.oxw();_.Tol(C.alertType),_.xp6(1),_.Q6J("icon",C.icon),_.xp6(3),_.Q6J("ngIf",C.dismissible)}}const t=["*"];let M=(()=>{class u{constructor(){this.alertType="success",this.showAlert=!1,this.dismissible=!0,this.alertClosed=new _.vpe,this.faXmark=f.g82}dismissAlert(){this.alertClosed.emit()}get icon(){switch(this.alertType){case"success":return f.f8k;case"error":return f.$9F;case"warning":return f.RLE;default:return f.sqG}}}return u.\u0275fac=function(C){return new(C||u)},u.\u0275cmp=_.Xpm({type:u,selectors:[["df-alert"]],inputs:{alertType:"alertType",showAlert:"showAlert",dismissible:"dismissible"},outputs:{alertClosed:"alertClosed"},standalone:!0,features:[_.jDz],ngContentSelectors:t,decls:1,vars:1,consts:[["class","alert-container",3,"class",4,"ngIf"],[1,"alert-container"],["aria-hidden","true",1,"alert-icon",3,"icon"],["role","alert",1,"alert-message"],["mat-icon-button","","class","dismiss-alert",3,"click",4,"ngIf"],["mat-icon-button","",1,"dismiss-alert",3,"click"],[3,"icon"]],template:function(C,o){1&C&&(_.F$t(),_.YNc(0,T,5,4,"div",0)),2&C&&_.Q6J("ngIf",o.showAlert)},dependencies:[c.O5,n.ot,n.RK,m.uH,m.BN],styles:[".alert-container[_ngcontent-%COMP%]{display:flex;flex-direction:row;align-items:center;justify-content:space-between;border:1px solid;border-radius:5px;box-shadow:0 0 5px #0003;color:#000}.alert-container[_ngcontent-%COMP%]   .alert-message[_ngcontent-%COMP%]{flex:1;padding:8px}.alert-container[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{padding:0 10px}.alert-container.success[_ngcontent-%COMP%]{border-color:#81c784;background-color:#c8e6c9}.alert-container.success[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#4caf50}.alert-container.error[_ngcontent-%COMP%]{border-color:#e57373;background-color:#ffcdd2}.alert-container.error[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#f44336}.alert-container.warning[_ngcontent-%COMP%]{border-color:#ffb74d;background-color:#ffe0b2}.alert-container.warning[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#ff9800}.alert-container.info[_ngcontent-%COMP%]{border-color:#64b5f6;background-color:#bbdefb}.alert-container.info[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#2196f3}"]}),u})()},84870:(R,P,a)=>{a.d(P,{a:()=>B});var E,_=a(97582),c=a(96814),n=a(56223),m=a(64170),f=a(32296),h=a(25313),T=a(2032),t=a(82599),M=a(45597),u=a(3305),g=a(90590),C=a(42346),o=a(78791),e=a(65879),I=a(65763);function U(r,l){if(1&r&&(e.TgZ(0,"mat-accordion")(1,"mat-expansion-panel")(2,"mat-expansion-panel-header")(3,"mat-panel-title"),e._uU(4),e.ALo(5,"transloco"),e.qZA(),e.TgZ(6,"mat-panel-description"),e._uU(7),e.ALo(8,"transloco"),e.qZA()(),e.GkF(9,3),e.qZA()()),2&r){e.oxw();const i=e.MAs(4);e.xp6(4),e.hij(" ",e.lcZ(5,3,"lookupKeys.label"),""),e.xp6(3),e.Oqu(e.lcZ(8,5,"lookupKeys.desc")),e.xp6(2),e.Q6J("ngTemplateOutlet",i)}}function L(r,l){1&r&&(e.TgZ(0,"mat-header-cell"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&r&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"name")," "))}function p(r,l){1&r&&(e.TgZ(0,"mat-cell",16)(1,"mat-form-field",17)(2,"mat-label"),e._uU(3),e.ALo(4,"transloco"),e.qZA(),e._UZ(5,"input",18),e.qZA()()),2&r&&(e.Q6J("formGroupName",l.index),e.xp6(3),e.Oqu(e.lcZ(4,2,"name")))}function s(r,l){1&r&&(e.TgZ(0,"mat-header-cell"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&r&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"value")," "))}function d(r,l){1&r&&(e.TgZ(0,"mat-cell",16)(1,"mat-form-field",17)(2,"mat-label"),e._uU(3),e.ALo(4,"transloco"),e.qZA(),e._UZ(5,"input",19),e.qZA()()),2&r&&(e.Q6J("formGroupName",l.index),e.xp6(3),e.Oqu(e.lcZ(4,2,"value")))}function D(r,l){1&r&&(e.TgZ(0,"mat-header-cell"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&r&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"private")," "))}function A(r,l){1&r&&(e.TgZ(0,"mat-cell",16),e._UZ(1,"mat-slide-toggle",20),e.ALo(2,"transloco"),e.qZA()),2&r&&(e.Q6J("formGroupName",l.index),e.xp6(1),e.uIk("aria-label",e.lcZ(2,2,"name")))}function v(r,l){if(1&r){const i=e.EpF();e.TgZ(0,"mat-header-cell")(1,"button",21),e.NdJ("click",function(){e.CHM(i);const y=e.oxw(2);return e.KtG(y.add())}),e.ALo(2,"transloco"),e._UZ(3,"fa-icon",22),e.qZA()()}if(2&r){const i=e.oxw(2);e.xp6(1),e.uIk("aria-label",e.lcZ(2,2,"newEntry")),e.xp6(2),e.Q6J("icon",i.faPlus)}}function x(r,l){if(1&r){const i=e.EpF();e.TgZ(0,"mat-cell",16)(1,"button",23),e.NdJ("click",function(){const w=e.CHM(i).index,k=e.oxw(2);return e.KtG(k.remove(w))}),e._UZ(2,"fa-icon",24),e.qZA()()}if(2&r){const i=l.index,O=e.oxw(2);e.Q6J("formGroupName",i),e.xp6(2),e.Q6J("icon",O.faTrashCan)}}function Z(r,l){1&r&&e._UZ(0,"mat-header-row")}function N(r,l){1&r&&e._UZ(0,"mat-row")}function K(r,l){1&r&&(e.TgZ(0,"tr",25)(1,"td",26),e._uU(2),e.ALo(3,"transloco"),e.qZA()()),2&r&&(e.xp6(2),e.hij(" ",e.lcZ(3,1,"lookupKeys.noKeys")," "))}function b(r,l){if(1&r&&(e.ynx(0,4)(1,5),e.TgZ(2,"mat-table",6),e.ynx(3,7),e.YNc(4,L,3,3,"mat-header-cell",8),e.YNc(5,p,6,4,"mat-cell",9),e.BQk(),e.ynx(6,10),e.YNc(7,s,3,3,"mat-header-cell",8),e.YNc(8,d,6,4,"mat-cell",9),e.BQk(),e.ynx(9,11),e.YNc(10,D,3,3,"mat-header-cell",8),e.YNc(11,A,3,4,"mat-cell",9),e.BQk(),e.ynx(12,12),e.YNc(13,v,4,4,"mat-header-cell",8),e.YNc(14,x,3,2,"mat-cell",9),e.BQk(),e.YNc(15,Z,1,0,"mat-header-row",13),e.YNc(16,N,1,0,"mat-row",14),e.YNc(17,K,4,3,"tr",15),e.qZA(),e.BQk()()),2&r){const i=e.oxw();e.Q6J("formGroup",i.rootForm),e.xp6(2),e.Q6J("dataSource",i.dataSource),e.xp6(13),e.Q6J("matHeaderRowDef",i.displayedColumns),e.xp6(1),e.Q6J("matRowDefColumns",i.displayedColumns)}}let B=((E=class{constructor(l,i){this.rootFormGroup=l,this.themeService=i,this.displayedColumns=["name","value","private","actions"],this.faTrashCan=g.Vui,this.faPlus=g.r8p,this.showAccordion=!0,this.isDarkMode=this.themeService.darkMode$}ngOnInit(){this.rootForm=this.rootFormGroup.control,this.rootFormGroup.ngSubmit.subscribe(()=>{this.lookupKeys.markAllAsTouched()}),this.lookupKeys=this.rootForm.get("lookupKeys"),this.updateDataSource()}updateDataSource(){this.lookupKeys.controls.forEach(l=>{l.get("id")?.value&&l.get("name")?.disable()}),this.dataSource=new h.by(this.lookupKeys.controls)}add(){this.lookupKeys.push(new n.cw({name:new n.NI("",n.kI.required),value:new n.NI(""),private:new n.NI(!1)})),this.updateDataSource()}remove(l){this.lookupKeys.removeAt(l),this.updateDataSource()}}).\u0275fac=function(l){return new(l||E)(e.Y36(n.sg),e.Y36(I.F))},E.\u0275cmp=e.Xpm({type:E,selectors:[["df-lookup-keys"]],inputs:{showAccordion:"showAccordion"},standalone:!0,features:[e.jDz],decls:5,vars:6,consts:[[1,"lookup-keys-accordion"],[4,"ngIf","ngIfElse"],["lookupKeys",""],[3,"ngTemplateOutlet"],[3,"formGroup"],["formArrayName","lookupKeys"],[3,"dataSource"],["matColumnDef","name"],[4,"matHeaderCellDef"],[3,"formGroupName",4,"matCellDef"],["matColumnDef","value"],["matColumnDef","private"],["matColumnDef","actions","stickyEnd",""],[4,"matHeaderRowDef"],[4,"matRowDef","matRowDefColumns"],["class","mat-row no-data-row",4,"matNoDataRow"],[3,"formGroupName"],["appearance","outline","subscriptSizing","dynamic"],["matInput","","formControlName","name"],["matInput","","formControlName","value"],["color","primary","formControlName","private"],["mat-mini-fab","","type","button",1,"save-btn",3,"click"],["size","xl",3,"icon"],["mat-icon-button","","type","button",1,"remove-btn",3,"click"],["size","xs",3,"icon"],[1,"mat-row","no-data-row"],["colspan","4",1,"mat-cell"]],template:function(l,i){if(1&l&&(e.TgZ(0,"div",0),e.ALo(1,"async"),e.YNc(2,U,10,7,"mat-accordion",1),e.YNc(3,b,18,4,"ng-template",null,2,e.W1O),e.qZA()),2&l){const O=e.MAs(4);e.Tol(e.lcZ(1,4,i.isDarkMode)?"dark-theme":""),e.xp6(2),e.Q6J("ngIf",i.showAccordion)("ngIfElse",O)}},dependencies:[n.u5,n.Fj,n.JJ,n.JL,n.UX,n.sg,n.u,n.x0,n.CE,c.O5,c.tP,m.lN,m.KE,m.hX,f.ot,f.RK,f.nh,h.p0,h.BZ,h.fO,h.as,h.w1,h.Dz,h.nj,h.ge,h.ev,h.XQ,h.Gk,h.Ee,T.c,T.Nt,t.rP,t.Rr,M.uH,M.BN,u.To,u.pp,u.ib,u.yz,u.yK,u.u4,C.Ot,c.Ov],styles:[".lookup-keys-accordion[_ngcontent-%COMP%]{padding:16px 0}.mat-column-actions[_ngcontent-%COMP%], .mat-column-private[_ngcontent-%COMP%]{max-width:10%}.mat-mdc-cell[_ngcontent-%COMP%]{padding:8px}"]}),E);B=(0,_.gn)([(0,o.c)({checkProperties:!0})],B)},2593:(R,P,a)=>{a.d(P,{e:()=>p});var u,_=a(97582),c=a(96814),n=a(56223),m=a(64170),f=a(2032),h=a(42346),T=a(78791),t=a(65879),M=a(65763);function g(s,d){1&s&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&s&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"userManagement.controls.username.errors.required")," "))}function C(s,d){1&s&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&s&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"userManagement.controls.username.errors.minLength")," "))}function o(s,d){1&s&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&s&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"userManagement.controls.email.errors.invalid")," "))}function e(s,d){1&s&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&s&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"userManagement.controls.email.errors.required")," "))}function I(s,d){1&s&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&s&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"userManagement.controls.firstName.errors.required")," "))}function E(s,d){1&s&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&s&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"userManagement.controls.lastName.errors.required")," "))}function U(s,d){1&s&&(t.TgZ(0,"mat-error"),t._uU(1),t.ALo(2,"transloco"),t.qZA()),2&s&&(t.xp6(1),t.hij(" ",t.lcZ(2,1,"userManagement.controls.displayName.errors.required")," "))}function L(s,d){1&s&&(t.TgZ(0,"mat-form-field",2)(1,"mat-label"),t._uU(2),t.ALo(3,"transloco"),t.qZA(),t._UZ(4,"input",10),t.qZA()),2&s&&(t.xp6(2),t.Oqu(t.lcZ(3,1,"userManagement.controls.phone.label")))}let p=((u=class{constructor(d,D){this.rootFormGroup=d,this.themeService=D,this.isDarkMode=this.themeService.darkMode$}ngOnInit(){this.rootForm=this.rootFormGroup.control,this.rootFormGroup.ngSubmit.subscribe(()=>{this.rootForm.markAllAsTouched()})}controlExists(d){return null!==this.rootForm.get(d)}isRequired(d){return!!this.rootForm.get(d)?.hasValidator(n.kI.required)}}).\u0275fac=function(d){return new(d||u)(t.Y36(n.sg),t.Y36(M.F))},u.\u0275cmp=t.Xpm({type:u,selectors:[["df-profile-details"]],standalone:!0,features:[t.jDz],decls:37,vars:31,consts:[["name","user-details-section",3,"formGroup"],["formGroupName","profileDetailsGroup"],["appearance","outline"],["matInput","","type","text","formControlName","username"],[4,"ngIf"],["matInput","","type","email","formControlName","email"],["matInput","","type","text","formControlName","firstName"],["matInput","","formControlName","lastName"],["matInput","","formControlName","name"],["appearance","outline",4,"ngIf"],["matInput","","formControlName","phone"]],template:function(d,D){if(1&d&&(t.ynx(0,0),t.ALo(1,"async"),t.ynx(2,1),t.TgZ(3,"mat-form-field",2)(4,"mat-label"),t._uU(5),t.ALo(6,"transloco"),t.ALo(7,"transloco"),t.qZA(),t._UZ(8,"input",3),t.YNc(9,g,3,3,"mat-error",4),t.YNc(10,C,3,3,"mat-error",4),t.qZA(),t.TgZ(11,"mat-form-field",2)(12,"mat-label"),t._uU(13),t.ALo(14,"transloco"),t.qZA(),t._UZ(15,"input",5),t.YNc(16,o,3,3,"mat-error",4),t.YNc(17,e,3,3,"mat-error",4),t.qZA(),t.TgZ(18,"mat-form-field",2)(19,"mat-label"),t._uU(20),t.ALo(21,"transloco"),t.qZA(),t._UZ(22,"input",6),t.YNc(23,I,3,3,"mat-error",4),t.qZA(),t.TgZ(24,"mat-form-field",2)(25,"mat-label"),t._uU(26),t.ALo(27,"transloco"),t.qZA(),t._UZ(28,"input",7),t.YNc(29,E,3,3,"mat-error",4),t.qZA(),t.TgZ(30,"mat-form-field",2)(31,"mat-label"),t._uU(32),t.ALo(33,"transloco"),t.qZA(),t._UZ(34,"input",8),t.YNc(35,U,3,3,"mat-error",4),t.qZA(),t.YNc(36,L,5,3,"mat-form-field",9),t.BQk()()),2&d){let A,v,x,Z,N,K,b;t.Tol(t.lcZ(1,17,D.isDarkMode)?"dark-theme":""),t.Q6J("formGroup",D.rootForm),t.xp6(5),t.AsE("",t.lcZ(6,19,"userManagement.controls.username.altLabel"),"",D.isRequired("profileDetailsGroup.username")?"":" "+t.lcZ(7,21,"userManagement.controls.username.optional"),""),t.xp6(4),t.Q6J("ngIf",null==(A=D.rootForm.get("profileDetailsGroup.username"))||null==A.errors?null:A.errors.required),t.xp6(1),t.Q6J("ngIf",null==(v=D.rootForm.get("profileDetailsGroup.username"))||null==v.errors?null:v.errors.minlength),t.xp6(3),t.hij(" ",t.lcZ(14,23,"userManagement.controls.email.label"),""),t.xp6(3),t.Q6J("ngIf",(null==(x=D.rootForm.get("profileDetailsGroup.email"))||null==x.errors?null:x.errors.email)&&!(null!=(x=D.rootForm.get("profileDetailsGroup.email"))&&null!=x.errors&&x.errors.required)),t.xp6(1),t.Q6J("ngIf",!(null!=(Z=D.rootForm.get("profileDetailsGroup.email"))&&null!=Z.errors&&Z.errors.email)&&(null==(Z=D.rootForm.get("profileDetailsGroup.email"))||null==Z.errors?null:Z.errors.required)),t.xp6(3),t.hij(" ",t.lcZ(21,25,"userManagement.controls.firstName.label"),""),t.xp6(3),t.Q6J("ngIf",null==(N=D.rootForm.get("profileDetailsGroup.firstName"))||null==N.errors?null:N.errors.required),t.xp6(3),t.Oqu(t.lcZ(27,27,"userManagement.controls.lastName.label")),t.xp6(3),t.Q6J("ngIf",null==(K=D.rootForm.get("profileDetailsGroup.lastName"))||null==K.errors?null:K.errors.required),t.xp6(3),t.Oqu(t.lcZ(33,29,"userManagement.controls.displayName.label")),t.xp6(3),t.Q6J("ngIf",null==(b=D.rootForm.get("profileDetailsGroup.name"))||null==b.errors?null:b.errors.required),t.xp6(1),t.Q6J("ngIf",D.controlExists("profileDetailsGroup.phone"))}},dependencies:[m.lN,m.KE,m.hX,m.TO,f.c,f.Nt,n.u5,n.Fj,n.JJ,n.JL,n.UX,n.sg,n.u,n.x0,h.Ot,c.O5,c.Ov],encapsulation:2}),u);p=(0,_.gn)([(0,T.c)({checkProperties:!0})],p)},31033:(R,P,a)=>{a.d(P,{U:()=>B});var E,_=a(97582),c=a(56223),n=a(32296),m=a(25313),f=a(2032),h=a(45597),T=a(3305),t=a(24630),M=a(90590),u=a(42346),g=a(96814),C=a(78791),o=a(65879),e=a(23680),I=a(64170);function U(r,l){1&r&&(o.TgZ(0,"mat-header-cell"),o._uU(1),o.ALo(2,"transloco"),o.qZA()),2&r&&(o.xp6(1),o.hij(" ",o.lcZ(2,1,"roles.app")," "))}function L(r,l){if(1&r&&(o.TgZ(0,"mat-option",18),o._uU(1),o.qZA()),2&r){const i=l.$implicit;o.Q6J("value",i.name),o.xp6(1),o.hij(" ",i.name," ")}}function p(r,l){if(1&r&&(o.TgZ(0,"mat-cell",12)(1,"mat-form-field",13)(2,"mat-label"),o._uU(3),o.ALo(4,"transloco"),o.qZA(),o._UZ(5,"input",14),o.TgZ(6,"mat-autocomplete",15,16),o.YNc(8,L,2,2,"mat-option",17),o.qZA()()()),2&r){const i=l.index,O=o.MAs(7),y=o.oxw();o.Q6J("formGroupName",i),o.xp6(3),o.Oqu(o.lcZ(4,4,"roles.app")),o.xp6(2),o.Q6J("matAutocomplete",O),o.xp6(3),o.Q6J("ngForOf",y.availableApps)}}function s(r,l){1&r&&(o.TgZ(0,"mat-header-cell"),o._uU(1),o.ALo(2,"transloco"),o.qZA()),2&r&&(o.xp6(1),o.hij(" ",o.lcZ(2,1,"roles.role")," "))}function d(r,l){if(1&r&&(o.TgZ(0,"mat-option",18),o._uU(1),o.qZA()),2&r){const i=l.$implicit;o.Q6J("value",i.name),o.xp6(1),o.hij(" ",i.name," ")}}function D(r,l){if(1&r&&(o.TgZ(0,"mat-cell",12)(1,"mat-form-field",13)(2,"mat-label"),o._uU(3),o.ALo(4,"transloco"),o.qZA(),o._UZ(5,"input",19),o.TgZ(6,"mat-autocomplete",15,16),o.YNc(8,d,2,2,"mat-option",17),o.qZA()()()),2&r){const i=l.index,O=o.MAs(7),y=o.oxw();o.Q6J("formGroupName",i),o.xp6(3),o.Oqu(o.lcZ(4,4,"roles.role")),o.xp6(2),o.Q6J("matAutocomplete",O),o.xp6(3),o.Q6J("ngForOf",y.roles)}}function A(r,l){if(1&r){const i=o.EpF();o.TgZ(0,"button",21),o.NdJ("click",function(){o.CHM(i);const y=o.oxw(2);return o.KtG(y.add())}),o.ALo(1,"transloco"),o._UZ(2,"fa-icon",22),o.qZA()}if(2&r){const i=o.oxw(2);o.uIk("aria-label",o.lcZ(1,2,"newEntry")),o.xp6(2),o.Q6J("icon",i.faPlus)}}function v(r,l){if(1&r&&(o.TgZ(0,"mat-header-cell"),o.YNc(1,A,3,4,"button",20),o.qZA()),2&r){const i=o.oxw();o.xp6(1),o.Q6J("ngIf",i.showAddButton)}}function x(r,l){if(1&r){const i=o.EpF();o.TgZ(0,"mat-cell",12)(1,"button",23),o.NdJ("click",function(){const w=o.CHM(i).index,k=o.oxw();return o.KtG(k.remove(w))}),o._UZ(2,"fa-icon",24),o.qZA()()}if(2&r){const i=l.index,O=o.oxw();o.Q6J("formGroupName",i),o.xp6(2),o.Q6J("icon",O.faTrashCan)}}function Z(r,l){1&r&&o._UZ(0,"mat-header-row")}function N(r,l){1&r&&o._UZ(0,"mat-row")}function K(r,l){1&r&&(o.TgZ(0,"tr",25)(1,"td",26),o._uU(2),o.ALo(3,"transloco"),o.qZA()()),2&r&&(o.xp6(2),o.hij(" ",o.lcZ(3,1,"roles.noRoles")," "))}const b=function(r,l){return{assigned:r,total:l}};let B=((E=class{constructor(l){this.rootFormGroup=l,this.apps=[],this.roles=[],this.displayedColumns=["app","role","actions"],this.faTrashCan=M.Vui,this.faPlus=M.r8p}ngOnInit(){this.rootForm=this.rootFormGroup.control,this.rootFormGroup.ngSubmit.subscribe(()=>{this.rootForm.markAllAsTouched()}),this.appRoles=this.rootForm.get("appRoles"),this.updateDataSource()}updateDataSource(){this.dataSource=new m.by(this.appRoles.controls)}get availableApps(){return this.apps.filter(l=>!this.appRoles.value.find(i=>i.app===l.name))}get showAddButton(){return this.appRoles.length<this.apps.length}get assignedApps(){return this.apps.length-this.appRoles.length}add(){this.appRoles.push(new c.cw({app:new c.NI("",c.kI.required),role:new c.NI("",c.kI.required)})),this.updateDataSource()}remove(l){this.appRoles.removeAt(l),this.updateDataSource()}}).\u0275fac=function(l){return new(l||E)(o.Y36(c.sg))},E.\u0275cmp=o.Xpm({type:E,selectors:[["df-user-app-roles"]],inputs:{apps:"apps",roles:"roles"},standalone:!0,features:[o.jDz],decls:25,vars:14,consts:[[1,"app-roles-keys-accordion"],[3,"formGroup"],["formArrayName","appRoles"],[3,"dataSource"],["matColumnDef","app"],[4,"matHeaderCellDef"],[3,"formGroupName",4,"matCellDef"],["matColumnDef","role"],["matColumnDef","actions"],[4,"matHeaderRowDef"],[4,"matRowDef","matRowDefColumns"],["class","mat-row",4,"matNoDataRow"],[3,"formGroupName"],["subscriptSizing","dynamic"],["matInput","","formControlName","app",3,"matAutocomplete"],["requireSelection",""],["auto","matAutocomplete"],[3,"value",4,"ngFor","ngForOf"],[3,"value"],["matInput","","formControlName","role",3,"matAutocomplete"],["mat-mini-fab","","color","primary","type","button",3,"click",4,"ngIf"],["mat-mini-fab","","color","primary","type","button",3,"click"],["size","xl",3,"icon"],["mat-icon-button","","type","button",3,"click"],["size","xs",3,"icon"],[1,"mat-row"],["colspan","4",1,"mat-cell"]],template:function(l,i){1&l&&(o.TgZ(0,"div",0)(1,"mat-accordion")(2,"mat-expansion-panel")(3,"mat-expansion-panel-header")(4,"mat-panel-title"),o._uU(5),o.ALo(6,"transloco"),o.qZA(),o.TgZ(7,"mat-panel-description"),o._uU(8),o.ALo(9,"transloco"),o.qZA()(),o.ynx(10,1)(11,2),o.TgZ(12,"mat-table",3),o.ynx(13,4),o.YNc(14,U,3,3,"mat-header-cell",5),o.YNc(15,p,9,6,"mat-cell",6),o.BQk(),o.ynx(16,7),o.YNc(17,s,3,3,"mat-header-cell",5),o.YNc(18,D,9,6,"mat-cell",6),o.BQk(),o.ynx(19,8),o.YNc(20,v,2,1,"mat-header-cell",5),o.YNc(21,x,3,2,"mat-cell",6),o.BQk(),o.YNc(22,Z,1,0,"mat-header-row",9),o.YNc(23,N,1,0,"mat-row",10),o.YNc(24,K,4,3,"tr",11),o.qZA(),o.BQk()(),o.qZA()()()),2&l&&(o.xp6(5),o.hij(" ",o.lcZ(6,6,"roles.label"),""),o.xp6(3),o.Oqu(o.xi3(9,8,"roles.appRoleAssigned",o.WLB(11,b,i.apps.length-i.availableApps.length,i.apps.length))),o.xp6(2),o.Q6J("formGroup",i.rootForm),o.xp6(2),o.Q6J("dataSource",i.dataSource),o.xp6(10),o.Q6J("matHeaderRowDef",i.displayedColumns),o.xp6(1),o.Q6J("matRowDefColumns",i.displayedColumns))},dependencies:[c.u5,c.Fj,c.JJ,c.JL,c.UX,c.sg,c.u,c.x0,c.CE,t.Bb,t.XC,e.ey,t.ZL,n.ot,n.RK,n.nh,m.p0,m.BZ,m.fO,m.as,m.w1,m.Dz,m.nj,m.ge,m.ev,m.XQ,m.Gk,m.Ee,f.c,f.Nt,I.KE,I.hX,h.uH,h.BN,T.To,T.pp,T.ib,T.yz,T.yK,T.u4,u.Ot,g.O5,g.ax],styles:[".app-roles-accordion[_ngcontent-%COMP%]{padding:16px 0}.mat-column-actions[_ngcontent-%COMP%]{max-width:10%}"]}),E);B=(0,_.gn)([(0,C.c)({checkProperties:!0})],B)},73998:(R,P,a)=>{a.d(P,{x:()=>U});var E,_=a(97582),c=a(65879),n=a(56223),m=a(92418),f=a(62651),h=a(42281),T=a(90590),t=a(78791),M=a(94664),u=a(22096),g=a(65763),C=a(81896),o=a(75911),e=a(49787),I=a(34909);let U=((E=class{constructor(p,s,d,D,A){this.fb=p,this.activatedRoute=s,this.systemConfigDataService=d,this.breakpointService=D,this.paywallService=A,this.loginAttribute="email",this.faEnvelope=T.FU$,this.type="create",this.isSmallScreen=this.breakpointService.isSmallScreen,this.alertMsg="",this.showAlert=!1,this.alertType="error",this.accessByTabs=[{control:"apps"},{control:"users"},{control:"services"},{control:"apidocs",label:"api-docs"},{control:"schema/data",label:"schema"},{control:"files"},{control:"scripts"},{control:"config"},{control:"packages",label:"package-manager"},{control:"limits"},{control:"scheduler"}],this.themeService=(0,c.f3M)(g.F),this.isDarkMode=this.themeService.darkMode$,this.userForm=this.fb.group({profileDetailsGroup:this.fb.group({username:["",n.kI.minLength(6)],email:["",n.kI.email],firstName:[""],lastName:[""],name:["",n.kI.required],phone:[""]}),isActive:[!0],tabs:this.buildTabs(),lookupKeys:this.fb.array([],[h.E]),appRoles:this.fb.array([])})}get cancelRoute(){let p=`/${f.Z.ADMIN_SETTINGS}/`;return"admins"===this.userType&&(p+=f.Z.ADMINS),"users"===this.userType&&(p+=f.Z.USERS),p}ngOnInit(){this.paywallService.activatePaywall("limit").pipe((0,M.w)(p=>p?this.paywallService.activatePaywall("service_report"):(0,u.of)(!1))).subscribe(p=>{p&&(this.accessByTabs=[])}),this.activatedRoute.data.subscribe(({type:p,data:s,apps:d,roles:D})=>{this.type=p,"users"===this.userType&&(this.apps=d.resource,this.roles=D.resource),"edit"===p?(this.currentProfile=s,this.userForm.patchValue({profileDetailsGroup:{username:s.username,email:s.email,firstName:s.firstName,lastName:s.lastName,name:s.name,phone:s.phone},isActive:s.isActive}),this.userForm.addControl("setPassword",new n.NI(!1)),this.userForm.controls.setPassword.valueChanges.subscribe(A=>{A?this.addPasswordControls():this.removePasswordControls()}),"admins"===this.userType&&(s.isRootAdmin&&this.userForm.removeControl("tabs"),s.userToAppToRoleByUserId.length>0&&(this.changeAllTabs(!1),s.role.accessibleTabs.forEach(A=>{const v=this.tabs.controls.find(x=>x.value.name===A);v&&v.patchValue({checked:!0})}))),"users"===this.userType&&s.userToAppToRoleByUserId.length>0&&s.userToAppToRoleByUserId.forEach(A=>{this.userForm.controls.appRoles.push(new n.cw({app:new n.NI(this.apps.find(v=>v.id===A.appId)?.name,[n.kI.required]),role:new n.NI(this.roles.find(v=>v.id===A.roleId)?.name,[n.kI.required])}))}),s.lookupByUserId.length>0&&s.lookupByUserId.forEach(A=>{this.userForm.controls.lookupKeys.push(new n.cw({name:new n.NI(A.name,[n.kI.required]),value:new n.NI(A.value),private:new n.NI(A.private),id:new n.NI(A.id)}))})):(this.userForm.addControl("pass-invite",new n.NI("",[n.kI.required])),this.userForm.controls["pass-invite"].valueChanges.subscribe(A=>{"password"===A?this.addPasswordControls():this.removePasswordControls()}))}),this.systemConfigDataService.environment$.subscribe(p=>{this.loginAttribute=p.authentication.loginAttribute,"username"===this.loginAttribute?this.userForm.get("profileDetailsGroup.username")?.addValidators([n.kI.required]):this.userForm.get("profileDetailsGroup.email")?.addValidators([n.kI.required])})}addPasswordControls(){this.userForm.addControl("password",new n.NI("",[n.kI.required,n.kI.minLength(6)])),this.userForm.addControl("confirmPassword",new n.NI("",[n.kI.required,(0,m.t)("password")]))}removePasswordControls(){this.userForm.removeControl("password"),this.userForm.removeControl("confirmPassword")}get tabs(){return this.userForm.controls.tabs}selectAllTabs(p){this.changeAllTabs(p.checked)}changeAllTabs(p){this.tabs.controls.forEach(s=>{s.patchValue({checked:p})})}get allTabsSelected(){return this.tabs.controls.every(p=>p.value.checked)}buildTabs(){const p=this.accessByTabs.map(s=>this.fb.group({name:s.control,title:s.label||s.control,checked:!0}));return this.fb.array(p)}triggerAlert(p,s){this.alertType=p,this.alertMsg=s,this.showAlert=!0}}).\u0275fac=function(p){return new(p||E)(c.Y36(n.qu),c.Y36(C.gz),c.Y36(o.s),c.Y36(e.y),c.Y36(I._))},E.\u0275cmp=c.Xpm({type:E,selectors:[["df-user-details"]],decls:0,vars:0,template:function(p,s){},encapsulation:2}),E);U=(0,_.gn)([(0,t.c)({checkProperties:!0})],U)},54475:(R,P,a)=>{a.d(P,{n:()=>c});const _=[{regex:/Duplicate entry '([^']+)' for key 'user_email_unique'/,message:"alerts.duplicateEmail"}];function c(n){if(!n)return"alert.genericError";const m=_.find(f=>f.regex.test(n));return m?m.message:n}},92418:(R,P,a)=>{function _(c){return n=>{const m=n.parent;if(m){const f=m.get(c);if(f&&n.value!==f.value)return{doesNotMatch:!0}}return null}}a.d(P,{t:()=>_})},42281:(R,P,a)=>{a.d(P,{E:()=>c});var _=a(56223);const c=n=>{const m=new Map,f=n;function h(t){f.at(t).get("name")?.setErrors({notUnique:!0})}return f.controls.forEach((t,M)=>{if(!(t instanceof _.cw))return;const u=t.get("name");if(!u)return;const g=u.value;g&&(m.has(g)?(h(m.get(g)??0),h(M)):(m.set(g,M),function T(t){const u=f.at(t).get("name"),g=u?.errors;g&&(delete g.notUnique,u.setErrors(Object.keys(g).length?g:null))}(M)))}),null}}}]);