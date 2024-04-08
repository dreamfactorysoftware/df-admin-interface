"use strict";(self.webpackChunkdf_admin_interface=self.webpackChunkdf_admin_interface||[]).push([[9280],{49280:(b,u,a)=>{a.r(u),a.d(u,{DfEmailTemplateDetailsComponent:()=>C});var _,t=a(97582),i=a(56223),f=a(23680),T=a(98525),m=a(2032),c=a(64170),h=a(32296),A=a(96814),Z=a(42346),n=a(86806),p=a(78791),r=a(41089),d=a(26306),g=a(58504),e=a(65879),O=a(81896),D=a(49787);function M(s,o){1&s&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&s&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"emailTemplates.templateName.error")," "))}function v(s,o){1&s&&(e.TgZ(0,"span"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&s&&(e.xp6(1),e.Oqu(e.lcZ(2,1,"update")))}function P(s,o){1&s&&(e.TgZ(0,"span"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&s&&(e.xp6(1),e.Oqu(e.lcZ(2,1,"save")))}a(6625);let C=((_=class{constructor(o,l,E,U,y){this.crudService=o,this.fb=l,this.router=E,this.breakpointService=U,this.activatedRoute=y,this.alertMsg="",this.showAlert=!1,this.alertType="error",this.emailTemplateForm=this.fb.group({name:["",i.kI.required],description:[""],to:[""],cc:[""],bcc:[""],subject:[""],attachment:[""],body:[""],senderName:[""],senderEmail:[""],replyToName:[""],replyToEmail:[""],id:[null]})}ngOnInit(){this.activatedRoute.data.subscribe(({data:o})=>{this.editApp=o}),this.editApp&&this.emailTemplateForm.patchValue({name:this.editApp.name,description:this.editApp.description,to:this.editApp.to,cc:this.editApp.cc,bcc:this.editApp.bcc,subject:this.editApp.subject,attachment:this.editApp.attachment,body:this.editApp.bodyHtml,senderName:this.editApp.fromName,senderEmail:this.editApp.fromEmail,replyToName:this.editApp.replyToName,replyToEmail:this.editApp.replyToEmail,id:this.editApp.id})}triggerAlert(o,l){this.alertType=o,this.alertMsg=l,this.showAlert=!0}goBack(){this.router.navigate(["../"],{relativeTo:this.activatedRoute})}onSubmit(){if(this.emailTemplateForm.invalid)return;const o={name:this.emailTemplateForm.value.name,description:this.emailTemplateForm.value.description,to:this.emailTemplateForm.value.to,cc:this.emailTemplateForm.value.cc,bcc:this.emailTemplateForm.value.bcc,subject:this.emailTemplateForm.value.subject,attachment:this.emailTemplateForm.value.attachment,bodyHtml:this.emailTemplateForm.value.body,fromName:this.emailTemplateForm.value.senderName,fromEmail:this.emailTemplateForm.value.senderEmail,replyToName:this.emailTemplateForm.value.replyToName,replyToEmail:this.emailTemplateForm.value.replyToEmail};this.emailTemplateForm.value.id?this.crudService.update(this.emailTemplateForm.value.id,o,{snackbarSuccess:"emailTemplates.alerts.updateSuccess"}).pipe((0,d.K)(l=>(this.triggerAlert("error",l.error.error.message),(0,g._)(()=>new Error(l))))).subscribe(()=>{this.goBack()}):this.crudService.create({resource:[o]},{snackbarSuccess:"emailTemplates.alerts.createSuccess"}).pipe((0,d.K)(l=>(this.triggerAlert("error",l.error.error.context.resource[0].message),(0,g._)(()=>new Error(l))))).subscribe(()=>{this.goBack()})}}).\u0275fac=function(o){return new(o||_)(e.Y36(n.Md),e.Y36(i.qu),e.Y36(O.F0),e.Y36(D.y),e.Y36(O.gz))},_.\u0275cmp=e.Xpm({type:_,selectors:[["df-email-template-details"]],standalone:!0,features:[e.jDz],decls:81,vars:74,consts:[[3,"showAlert","alertType","alertClosed"],[1,"email-template-details-container"],[1,"details-section",3,"formGroup","ngSubmit"],[1,"dynamic-width"],["matInput","","formControlName","name","required","",3,"placeholder"],[4,"ngIf"],["matInput","","formControlName","description",3,"placeholder"],[1,"third-width"],["matInput","","formControlName","to"],["matInput","","formControlName","cc"],["matInput","","formControlName","bcc"],["subscriptSizing","dynamic"],["matInput","","formControlName","subject",3,"placeholder"],["matInput","","formControlName","attachment",3,"placeholder"],["rows","1","matInput","","formControlName","body",1,"email-template-body"],["matInput","","formControlName","senderName",3,"placeholder"],["matInput","","formControlName","senderEmail",3,"placeholder"],["matInput","","formControlName","replyToName",3,"placeholder"],["matInput","","formControlName","replyToEmail",3,"placeholder"],[1,"full-width","action-bar"],["mat-flat-button","","type","button",3,"click"],["mat-flat-button","","color","primary"]],template:function(o,l){1&o&&(e.TgZ(0,"df-alert",0),e.NdJ("alertClosed",function(){return l.showAlert=!1}),e._uU(1),e.qZA(),e.TgZ(2,"div",1),e.ALo(3,"async"),e.TgZ(4,"form",2),e.NdJ("ngSubmit",function(){return l.onSubmit()}),e.TgZ(5,"mat-form-field",3)(6,"mat-label"),e._uU(7),e.ALo(8,"transloco"),e.qZA(),e._UZ(9,"input",4),e.ALo(10,"transloco"),e.YNc(11,M,3,3,"mat-error",5),e.qZA(),e.TgZ(12,"mat-form-field",3)(13,"mat-label"),e._uU(14),e.ALo(15,"transloco"),e.qZA(),e._UZ(16,"input",6),e.ALo(17,"transloco"),e.qZA(),e.TgZ(18,"mat-form-field",7)(19,"mat-label"),e._uU(20),e.ALo(21,"transloco"),e.qZA(),e._UZ(22,"input",8),e.qZA(),e.TgZ(23,"mat-form-field",7)(24,"mat-label"),e._uU(25),e.ALo(26,"transloco"),e.qZA(),e._UZ(27,"input",9),e.qZA(),e.TgZ(28,"mat-form-field",7)(29,"mat-label"),e._uU(30),e.ALo(31,"transloco"),e.qZA(),e._UZ(32,"input",10),e.qZA(),e.TgZ(33,"mat-form-field",11)(34,"mat-label"),e._uU(35),e.ALo(36,"transloco"),e.qZA(),e._UZ(37,"input",12),e.ALo(38,"transloco"),e.qZA(),e.TgZ(39,"mat-form-field",11)(40,"mat-label"),e._uU(41),e.ALo(42,"transloco"),e.qZA(),e._UZ(43,"input",13),e.ALo(44,"transloco"),e.qZA(),e.TgZ(45,"mat-form-field",11)(46,"mat-label"),e._uU(47),e.ALo(48,"transloco"),e.qZA(),e._UZ(49,"textarea",14),e.qZA(),e.TgZ(50,"mat-form-field",3)(51,"mat-label"),e._uU(52),e.ALo(53,"transloco"),e.qZA(),e._UZ(54,"input",15),e.ALo(55,"transloco"),e.qZA(),e.TgZ(56,"mat-form-field",3)(57,"mat-label"),e._uU(58),e.ALo(59,"transloco"),e.qZA(),e._UZ(60,"input",16),e.ALo(61,"transloco"),e.qZA(),e.TgZ(62,"mat-form-field",3)(63,"mat-label"),e._uU(64),e.ALo(65,"transloco"),e.qZA(),e._UZ(66,"input",17),e.ALo(67,"transloco"),e.qZA(),e.TgZ(68,"mat-form-field",3)(69,"mat-label"),e._uU(70),e.ALo(71,"transloco"),e.qZA(),e._UZ(72,"input",18),e.ALo(73,"transloco"),e.qZA(),e.TgZ(74,"div",19)(75,"button",20),e.NdJ("click",function(){return l.goBack()}),e._uU(76),e.ALo(77,"transloco"),e.qZA(),e.TgZ(78,"button",21),e.YNc(79,v,3,3,"span",5),e.YNc(80,P,3,3,"span",5),e.qZA()()()()),2&o&&(e.Q6J("showAlert",l.showAlert)("alertType",l.alertType),e.xp6(1),e.hij(" ",l.alertMsg,"\n"),e.xp6(1),e.ekj("x-small",e.lcZ(3,30,l.breakpointService.isXSmallScreen)),e.xp6(2),e.Q6J("formGroup",l.emailTemplateForm),e.xp6(3),e.Oqu(e.lcZ(8,32,"emailTemplates.templateName.label")),e.xp6(2),e.s9C("placeholder",e.lcZ(10,34,"emailTemplates.templateName.placeholder")),e.xp6(2),e.Q6J("ngIf",l.emailTemplateForm.controls.name.hasError("required")),e.xp6(3),e.Oqu(e.lcZ(15,36,"emailTemplates.templateDescription.label")),e.xp6(2),e.s9C("placeholder",e.lcZ(17,38,"emailTemplates.templateDescription.placeholder")),e.xp6(4),e.Oqu(e.lcZ(21,40,"emailTemplates.recipient.label")),e.xp6(5),e.Oqu(e.lcZ(26,42,"emailTemplates.cc.label")),e.xp6(5),e.Oqu(e.lcZ(31,44,"emailTemplates.bcc.label")),e.xp6(5),e.Oqu(e.lcZ(36,46,"emailTemplates.subject.label")),e.xp6(2),e.s9C("placeholder",e.lcZ(38,48,"emailTemplates.subject.placeholder")),e.xp6(4),e.Oqu(e.lcZ(42,50,"emailTemplates.attachment.label")),e.xp6(2),e.s9C("placeholder",e.lcZ(44,52,"emailTemplates.attachment.placeholder")),e.xp6(4),e.Oqu(e.lcZ(48,54,"emailTemplates.body")),e.xp6(5),e.Oqu(e.lcZ(53,56,"emailTemplates.senderName.label")),e.xp6(2),e.s9C("placeholder",e.lcZ(55,58,"emailTemplates.senderName.placeholder")),e.xp6(4),e.Oqu(e.lcZ(59,60,"emailTemplates.senderEmail.label")),e.xp6(2),e.s9C("placeholder",e.lcZ(61,62,"emailTemplates.senderEmail.placeholder")),e.xp6(4),e.Oqu(e.lcZ(65,64,"emailTemplates.replyToName.label")),e.xp6(2),e.s9C("placeholder",e.lcZ(67,66,"emailTemplates.replyToName.placeholder")),e.xp6(4),e.Oqu(e.lcZ(71,68,"emailTemplates.replyToEmail.label")),e.xp6(2),e.s9C("placeholder",e.lcZ(73,70,"emailTemplates.replyToEmail.placeholder")),e.xp6(4),e.hij(" ",e.lcZ(77,72,"cancel")," "),e.xp6(3),e.Q6J("ngIf",l.editApp),e.xp6(1),e.Q6J("ngIf",!l.editApp))},dependencies:[h.ot,h.lW,i.UX,i._Y,i.Fj,i.JJ,i.JL,i.Q7,i.sg,i.u,c.lN,c.KE,c.hX,c.TO,m.c,m.Nt,A.O5,T.LD,f.Ng,Z.Ot,A.Ov,r.v],styles:[".email-template-details-container[_ngcontent-%COMP%]   .email-template-body[_ngcontent-%COMP%]{min-height:300px}.email-template-details-container.x-small[_ngcontent-%COMP%]   .email-template-body[_ngcontent-%COMP%]{min-height:200px}"]}),_);C=(0,t.gn)([(0,p.c)({checkProperties:!0})],C)},41089:(b,u,a)=>{a.d(u,{v:()=>Z});var t=a(65879),i=a(96814),f=a(32296),T=a(45597),m=a(90590);function c(n,p){if(1&n){const r=t.EpF();t.TgZ(0,"button",5),t.NdJ("click",function(){t.CHM(r);const g=t.oxw(2);return t.KtG(g.dismissAlert())}),t.TgZ(1,"fa-icon",6),t._uU(2),t.qZA()()}if(2&n){const r=t.oxw(2);t.xp6(1),t.Q6J("icon",r.faXmark),t.xp6(1),t.Oqu("alerts.close")}}function h(n,p){if(1&n&&(t.TgZ(0,"div",1),t._UZ(1,"fa-icon",2),t.TgZ(2,"span",3),t.Hsn(3),t.qZA(),t.YNc(4,c,3,2,"button",4),t.qZA()),2&n){const r=t.oxw();t.Tol(r.alertType),t.xp6(1),t.Q6J("icon",r.icon),t.xp6(3),t.Q6J("ngIf",r.dismissible)}}const A=["*"];let Z=(()=>{class n{constructor(){this.alertType="success",this.showAlert=!1,this.dismissible=!0,this.alertClosed=new t.vpe,this.faXmark=m.g82}dismissAlert(){this.alertClosed.emit()}get icon(){switch(this.alertType){case"success":return m.f8k;case"error":return m.$9F;case"warning":return m.RLE;default:return m.sqG}}}return n.\u0275fac=function(r){return new(r||n)},n.\u0275cmp=t.Xpm({type:n,selectors:[["df-alert"]],inputs:{alertType:"alertType",showAlert:"showAlert",dismissible:"dismissible"},outputs:{alertClosed:"alertClosed"},standalone:!0,features:[t.jDz],ngContentSelectors:A,decls:1,vars:1,consts:[["class","alert-container",3,"class",4,"ngIf"],[1,"alert-container"],["aria-hidden","true",1,"alert-icon",3,"icon"],["role","alert",1,"alert-message"],["mat-icon-button","","class","dismiss-alert",3,"click",4,"ngIf"],["mat-icon-button","",1,"dismiss-alert",3,"click"],[3,"icon"]],template:function(r,d){1&r&&(t.F$t(),t.YNc(0,h,5,4,"div",0)),2&r&&t.Q6J("ngIf",d.showAlert)},dependencies:[i.O5,f.ot,f.RK,T.uH,T.BN],styles:[".alert-container[_ngcontent-%COMP%]{display:flex;flex-direction:row;align-items:center;justify-content:space-between;border:1px solid;border-radius:5px;box-shadow:0 0 5px #0003;color:#000}.alert-container[_ngcontent-%COMP%]   .alert-message[_ngcontent-%COMP%]{flex:1;padding:8px}.alert-container[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{padding:0 10px}.alert-container.success[_ngcontent-%COMP%]{border-color:#81c784;background-color:#c8e6c9}.alert-container.success[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#4caf50}.alert-container.error[_ngcontent-%COMP%]{border-color:#e57373;background-color:#ffcdd2}.alert-container.error[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#f44336}.alert-container.warning[_ngcontent-%COMP%]{border-color:#ffb74d;background-color:#ffe0b2}.alert-container.warning[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#ff9800}.alert-container.info[_ngcontent-%COMP%]{border-color:#64b5f6;background-color:#bbdefb}.alert-container.info[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#2196f3}"]}),n})()}}]);