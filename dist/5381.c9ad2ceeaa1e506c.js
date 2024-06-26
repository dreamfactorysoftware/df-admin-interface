"use strict";(self.webpackChunkdf_admin_interface=self.webpackChunkdf_admin_interface||[]).push([[5381],{55381:(T,p,n)=>{n.r(p),n.d(p,{DfPasswordResetComponent:()=>D});var P,t=n(97582),l=n(56223),u=n(96814),f=n(92418),_=n(94664),h=n(26306),A=n(58504),w=n(41089),M=n(32296),c=n(2032),d=n(64170),i=n(26385),g=n(95195),E=n(42346),x=n(78791),e=n(65879),Z=n(31303),R=n(75911),I=n(99496),v=n(81896);function U(o,a){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"userManagement.controls.email.errors.invalid")," "))}function b(o,a){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"userManagement.controls.email.errors.required")," "))}function L(o,a){if(1&o&&(e.TgZ(0,"mat-form-field",5)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e._UZ(4,"input",11),e.YNc(5,U,3,3,"mat-error",7),e.YNc(6,b,3,3,"mat-error",7),e.qZA()),2&o){const r=e.oxw();let s,m;e.xp6(2),e.hij(" ",e.lcZ(3,3,"userManagement.controls.email.label"),""),e.xp6(3),e.Q6J("ngIf",(null==(s=r.passwordResetForm.get("email"))||null==s.errors?null:s.errors.email)&&!(null!=(s=r.passwordResetForm.get("email"))&&null!=s.errors&&s.errors.required)),e.xp6(1),e.Q6J("ngIf",!(null!=(m=r.passwordResetForm.get("email"))&&null!=m.errors&&m.errors.email)&&(null==(m=r.passwordResetForm.get("email"))||null==m.errors?null:m.errors.required))}}function y(o,a){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"userManagement.controls.username.errors.required")," "))}function K(o,a){if(1&o&&(e.TgZ(0,"mat-form-field",5)(1,"mat-label"),e._uU(2),e.ALo(3,"transloco"),e.qZA(),e._UZ(4,"input",12),e.YNc(5,y,3,3,"mat-error",7),e.qZA()),2&o){const r=e.oxw();let s;e.xp6(2),e.Oqu(e.lcZ(3,2,"userManagement.controls.username.altLabel")),e.xp6(3),e.Q6J("ngIf",null==(s=r.passwordResetForm.get("username"))||null==s.errors?null:s.errors.required)}}function B(o,a){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"userManagement.controls.confirmationCode.errors.required")," "))}function W(o,a){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"userManagement.controls.password.errors.required")," "))}function N(o,a){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"userManagement.controls.password.errors.length")," "))}function F(o,a){1&o&&(e.TgZ(0,"mat-error"),e._uU(1),e.ALo(2,"transloco"),e.qZA()),2&o&&(e.xp6(1),e.hij(" ",e.lcZ(2,1,"userManagement.controls.confirmPassword.errors.match")," "))}let D=((P=class{constructor(a,r,s,m,C,O,q){this.fb=a,this.location=r,this.passwordResetService=s,this.systemConfigDataService=m,this.authService=C,this.router=O,this.route=q,this.user={email:"",username:"",code:"",admin:""},this.alertMsg="",this.showAlert=!1,this.alertType="error",this.loginAttribute="email",this.type="reset",this.passwordResetForm=this.fb.group({username:["",[l.kI.required]],email:["",[l.kI.required,l.kI.email]],code:["",[l.kI.required]],newPassword:["",[l.kI.required,l.kI.minLength(6)]],confirmPassword:["",[l.kI.required,(0,f.t)("newPassword")]]})}ngOnInit(){this.route.queryParams&&this.route.queryParams.subscribe(a=>{this.user={code:a.code,email:a.email,username:a.username,admin:a.admin},this.passwordResetForm.patchValue({email:this.user.email,username:this.user.username,code:this.user.code})}),this.systemConfigDataService.environment$.subscribe(a=>{this.loginAttribute=a.authentication.loginAttribute}),this.route.data.subscribe(a=>{"type"in a&&(this.type=a.type)})}get isAdmin(){return"1"===this.user.admin}resetPassword(){if(this.passwordResetForm.invalid)return;const{confirmPassword:a,...r}=this.passwordResetForm.value;this.passwordResetService.resetPassword(r,this.isAdmin).pipe((0,_.w)(()=>{const s={password:r.newPassword};return"email"===this.loginAttribute?s.email=r.email:s.username=r.username,this.authService.login(s)}),(0,h.K)(s=>(this.alertMsg=s.error.error.message,this.showAlert=!0,(0,A._)(()=>new Error(s))))).subscribe(()=>{this.showAlert=!1,this.router.navigate(["/"])})}}).\u0275fac=function(a){return new(a||P)(e.Y36(l.qu),e.Y36(u.Ye),e.Y36(Z.B),e.Y36(R.s),e.Y36(I.i),e.Y36(v.F0),e.Y36(v.gz))},P.\u0275cmp=e.Xpm({type:P,selectors:[["df-password-reset"]],standalone:!0,features:[e.jDz],decls:35,vars:25,consts:[[1,"user-management-card-container"],[1,"user-management-card"],[3,"showAlert","alertType","alertClosed"],["name","reset-password-form",3,"formGroup","ngSubmit"],["appearance","outline",4,"ngIf"],["appearance","outline"],["matInput","","type","text","formControlName","code"],[4,"ngIf"],["matInput","","type","password","formControlName","newPassword"],["matInput","","type","password","formControlName","confirmPassword"],["mat-flat-button","","color","primary","type","submit"],["matInput","","type","email","formControlName","email"],["matInput","","type","text","formControlName","username"]],template:function(a,r){if(1&a&&(e.TgZ(0,"div",0)(1,"mat-card",1)(2,"df-alert",2),e.NdJ("alertClosed",function(){return r.showAlert=!1}),e._uU(3),e.qZA(),e.TgZ(4,"mat-card-header")(5,"mat-card-title"),e._uU(6),e.ALo(7,"transloco"),e.qZA()(),e._UZ(8,"mat-divider"),e.TgZ(9,"mat-card-content")(10,"form",3),e.NdJ("ngSubmit",function(){return r.resetPassword()}),e.YNc(11,L,7,5,"mat-form-field",4),e.YNc(12,K,6,4,"mat-form-field",4),e.TgZ(13,"mat-form-field",5)(14,"mat-label"),e._uU(15),e.ALo(16,"transloco"),e.qZA(),e._UZ(17,"input",6),e.YNc(18,B,3,3,"mat-error",7),e.qZA(),e.TgZ(19,"mat-form-field",5)(20,"mat-label"),e._uU(21),e.ALo(22,"transloco"),e.qZA(),e._UZ(23,"input",8),e.YNc(24,W,3,3,"mat-error",7),e.YNc(25,N,3,3,"mat-error",7),e.qZA(),e.TgZ(26,"mat-form-field",5)(27,"mat-label"),e._uU(28),e.ALo(29,"transloco"),e.qZA(),e._UZ(30,"input",9),e.YNc(31,F,3,3,"mat-error",7),e.qZA(),e.TgZ(32,"button",10),e._uU(33),e.ALo(34,"transloco"),e.qZA()()()()()),2&a){let s,m,C,O;e.xp6(2),e.Q6J("showAlert",r.showAlert)("alertType",r.alertType),e.xp6(1),e.Oqu(r.alertMsg),e.xp6(3),e.hij(" ",e.lcZ(7,15,"userManagement."+("reset"===r.type?"resetPassword":"register"===r.type?"registrationConfirmation":"invitatonConfirmation"))," "),e.xp6(4),e.Q6J("formGroup",r.passwordResetForm),e.xp6(1),e.Q6J("ngIf","email"===r.loginAttribute),e.xp6(1),e.Q6J("ngIf","username"===r.loginAttribute),e.xp6(3),e.hij(" ",e.lcZ(16,17,"userManagement.controls.confirmationCode.label"),""),e.xp6(3),e.Q6J("ngIf",null==(s=r.passwordResetForm.get("code"))||null==s.errors?null:s.errors.required),e.xp6(3),e.Oqu(e.lcZ(22,19,"userManagement.controls.password."+("reset"===r.type?"label":"altLabel"))),e.xp6(3),e.Q6J("ngIf",null==(m=r.passwordResetForm.get("newPassword"))||null==m.errors?null:m.errors.required),e.xp6(1),e.Q6J("ngIf",null==(C=r.passwordResetForm.get("newPassword"))||null==C.errors?null:C.errors.minlength),e.xp6(3),e.Oqu(e.lcZ(29,21,"userManagement.controls.confirmPassword."+("reset"===r.type?"label":"altLabel"))),e.xp6(3),e.Q6J("ngIf",null==(O=r.passwordResetForm.get("confirmPassword"))?null:O.hasError("doesNotMatch")),e.xp6(2),e.hij(" ",e.lcZ(34,23,"reset"===r.type?"userManagement.resetPassword":"userManagement.confirmUser")," ")}},dependencies:[g.QW,g.a8,g.dn,g.dk,g.n5,w.v,i.t,i.d,l.UX,l._Y,l.Fj,l.JJ,l.JL,l.sg,l.u,u.O5,d.lN,d.KE,d.hX,d.TO,c.c,c.Nt,M.ot,M.lW,E.Ot],styles:[".user-management-card-container[_ngcontent-%COMP%]{display:flex;flex-direction:column;justify-content:center;height:100%}.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]{padding:16px;margin:0 auto;min-width:300px;max-width:445px;box-shadow:var(--mdc-elevated-card-container-elevation);--mdc-elevated-card-container-shape: 4px;--mdc-outlined-card-container-shape: 4px;--mdc-outlined-card-outline-width: 1px}.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-header[_ngcontent-%COMP%]{padding-bottom:16px}.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]{padding-top:16px}.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%]{padding-top:32px}.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-card-content[_ngcontent-%COMP%]   .services-section[_ngcontent-%COMP%]   .services-container[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;padding-top:16px;gap:16px}.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   mat-form-field[_ngcontent-%COMP%], .user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]{width:100%}.user-management-card-container[_ngcontent-%COMP%]   .user-management-card[_ngcontent-%COMP%]   .action-links[_ngcontent-%COMP%]{display:flex;justify-content:flex-end}.user-management-card-container[_ngcontent-%COMP%]{margin-top:20vh}.user-management-card-container.dark-theme[_ngcontent-%COMP%]{background-color:#1e1e1e;color:#fff}"]}),P);D=(0,t.gn)([(0,x.c)({checkProperties:!0})],D)},41089:(T,p,n)=>{n.d(p,{v:()=>M});var t=n(65879),l=n(96814),u=n(32296),f=n(45597),_=n(90590);function h(c,d){if(1&c){const i=t.EpF();t.TgZ(0,"button",5),t.NdJ("click",function(){t.CHM(i);const E=t.oxw(2);return t.KtG(E.dismissAlert())}),t.TgZ(1,"fa-icon",6),t._uU(2),t.qZA()()}if(2&c){const i=t.oxw(2);t.xp6(1),t.Q6J("icon",i.faXmark),t.xp6(1),t.Oqu("alerts.close")}}function A(c,d){if(1&c&&(t.TgZ(0,"div",1),t._UZ(1,"fa-icon",2),t.TgZ(2,"span",3),t.Hsn(3),t.qZA(),t.YNc(4,h,3,2,"button",4),t.qZA()),2&c){const i=t.oxw();t.Tol(i.alertType),t.xp6(1),t.Q6J("icon",i.icon),t.xp6(3),t.Q6J("ngIf",i.dismissible)}}const w=["*"];let M=(()=>{class c{constructor(){this.alertType="success",this.showAlert=!1,this.dismissible=!0,this.alertClosed=new t.vpe,this.faXmark=_.g82}dismissAlert(){this.alertClosed.emit()}get icon(){switch(this.alertType){case"success":return _.f8k;case"error":return _.$9F;case"warning":return _.RLE;default:return _.sqG}}}return c.\u0275fac=function(i){return new(i||c)},c.\u0275cmp=t.Xpm({type:c,selectors:[["df-alert"]],inputs:{alertType:"alertType",showAlert:"showAlert",dismissible:"dismissible"},outputs:{alertClosed:"alertClosed"},standalone:!0,features:[t.jDz],ngContentSelectors:w,decls:1,vars:1,consts:[["class","alert-container",3,"class",4,"ngIf"],[1,"alert-container"],["aria-hidden","true",1,"alert-icon",3,"icon"],["role","alert",1,"alert-message"],["mat-icon-button","","class","dismiss-alert",3,"click",4,"ngIf"],["mat-icon-button","",1,"dismiss-alert",3,"click"],[3,"icon"]],template:function(i,g){1&i&&(t.F$t(),t.YNc(0,A,5,4,"div",0)),2&i&&t.Q6J("ngIf",g.showAlert)},dependencies:[l.O5,u.ot,u.RK,f.uH,f.BN],styles:[".alert-container[_ngcontent-%COMP%]{display:flex;flex-direction:row;align-items:center;justify-content:space-between;border:1px solid;border-radius:5px;box-shadow:0 0 5px #0003;color:#000}.alert-container[_ngcontent-%COMP%]   .alert-message[_ngcontent-%COMP%]{flex:1;padding:8px}.alert-container[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{padding:0 10px}.alert-container.success[_ngcontent-%COMP%]{border-color:#81c784;background-color:#c8e6c9}.alert-container.success[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#4caf50}.alert-container.error[_ngcontent-%COMP%]{border-color:#e57373;background-color:#ffcdd2}.alert-container.error[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#f44336}.alert-container.warning[_ngcontent-%COMP%]{border-color:#ffb74d;background-color:#ffe0b2}.alert-container.warning[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#ff9800}.alert-container.info[_ngcontent-%COMP%]{border-color:#64b5f6;background-color:#bbdefb}.alert-container.info[_ngcontent-%COMP%]   .alert-icon[_ngcontent-%COMP%]{color:#2196f3}"]}),c})()},92418:(T,p,n)=>{function t(l){return u=>{const f=u.parent;if(f){const _=f.get(l);if(_&&u.value!==_.value)return{doesNotMatch:!0}}return null}}n.d(p,{t:()=>t})}}]);