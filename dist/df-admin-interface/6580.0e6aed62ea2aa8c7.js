"use strict";(self.webpackChunkdf_admin_interface=self.webpackChunkdf_admin_interface||[]).push([[6580],{76580:(v,D,a)=>{a.r(D),a.d(D,{DfGlobalLookupKeysComponent:()=>K});var f,h=a(97582),c=a(56223),r=a(84870),g=a(42281),E=a(42346),_=a(32296),y=a(86806),p=a(78791),e=a(65879),u=a(81896);a(6625);let K=((f=class{constructor(s,m,C){this.crudService=s,this.fb=m,this.activatedRoute=C,this.lookupKeysForm=this.fb.group({lookupKeys:this.fb.array([],[g.E])})}ngOnInit(){this.activatedRoute.data.subscribe(({data:s})=>{s.resource.length>0&&s.resource.forEach(m=>{this.lookupKeysForm.controls.lookupKeys.push(new c.cw({name:new c.NI(m.name,[c.kI.required]),value:new c.NI(m.value),private:new c.NI(m.private),id:new c.NI(m.id)}))})})}save(){if(this.lookupKeysForm.invalid||this.lookupKeysForm.pristine)return;const s=[],m=[];this.lookupKeysForm.get("lookupKeys").controls.forEach(d=>{d.pristine||(d.value.id?m.push(d.value):s.push({...d.value,id:null}))}),s.length>0&&this.crudService.create({resource:s},{fields:"*",snackbarSuccess:"lookupKeys.alerts.createSuccess"}).subscribe(),m.length>0&&m.forEach(d=>{d.id&&this.crudService.update(d.id,d,{snackbarSuccess:"lookupKeys.alerts.updateSuccess"}).subscribe()})}}).\u0275fac=function(s){return new(s||f)(e.Y36(y.sC),e.Y36(c.qu),e.Y36(u.gz))},f.\u0275cmp=e.Xpm({type:f,selectors:[["df-global-lookup-keys"]],standalone:!0,features:[e.jDz],decls:8,vars:8,consts:[[3,"formGroup","ngSubmit"],["formArrayName","lookupKeys",3,"showAccordion"],["mat-flat-button","","color","primary","type","submit"]],template:function(s,m){1&s&&(e.TgZ(0,"p"),e._uU(1),e.ALo(2,"transloco"),e.qZA(),e.TgZ(3,"form",0),e.NdJ("ngSubmit",function(){return m.save()}),e._UZ(4,"df-lookup-keys",1),e.TgZ(5,"button",2),e._uU(6),e.ALo(7,"transloco"),e.qZA()()),2&s&&(e.xp6(1),e.Oqu(e.lcZ(2,4,"lookupKeys.fullDesc")),e.xp6(2),e.Q6J("formGroup",m.lookupKeysForm),e.xp6(1),e.Q6J("showAccordion",!1),e.xp6(2),e.hij(" ",e.lcZ(7,6,"save")," "))},dependencies:[r.a,c.UX,c._Y,c.JL,c.sg,c.CE,E.Ot,_.ot,_.lW]}),f);K=(0,h.gn)([(0,p.c)({checkProperties:!0})],K)},84870:(v,D,a)=>{a.d(D,{a:()=>k});var s,h=a(97582),c=a(96814),r=a(56223),g=a(64170),E=a(32296),_=a(25313),y=a(2032),p=a(82599),e=a(45597),u=a(3305),i=a(90590),f=a(42346),K=a(78791),o=a(65879);function m(t,n){if(1&t&&(o.TgZ(0,"mat-accordion")(1,"mat-expansion-panel")(2,"mat-expansion-panel-header")(3,"mat-panel-title"),o._uU(4),o.ALo(5,"transloco"),o.qZA(),o.TgZ(6,"mat-panel-description"),o._uU(7),o.ALo(8,"transloco"),o.qZA()(),o.GkF(9,3),o.qZA()()),2&t){o.oxw();const l=o.MAs(3);o.xp6(4),o.hij(" ",o.lcZ(5,3,"lookupKeys.label"),""),o.xp6(3),o.Oqu(o.lcZ(8,5,"lookupKeys.desc")),o.xp6(2),o.Q6J("ngTemplateOutlet",l)}}function C(t,n){1&t&&(o.TgZ(0,"mat-header-cell"),o._uU(1),o.ALo(2,"transloco"),o.qZA()),2&t&&(o.xp6(1),o.hij(" ",o.lcZ(2,1,"name")," "))}function d(t,n){1&t&&(o.TgZ(0,"mat-cell",16)(1,"mat-form-field",17)(2,"mat-label"),o._uU(3),o.ALo(4,"transloco"),o.qZA(),o._UZ(5,"input",18),o.qZA()()),2&t&&(o.Q6J("formGroupName",n.index),o.xp6(3),o.Oqu(o.lcZ(4,2,"name")))}function T(t,n){1&t&&(o.TgZ(0,"mat-header-cell"),o._uU(1),o.ALo(2,"transloco"),o.qZA()),2&t&&(o.xp6(1),o.hij(" ",o.lcZ(2,1,"value")," "))}function L(t,n){1&t&&(o.TgZ(0,"mat-cell",16)(1,"mat-form-field",17)(2,"mat-label"),o._uU(3),o.ALo(4,"transloco"),o.qZA(),o._UZ(5,"input",19),o.qZA()()),2&t&&(o.Q6J("formGroupName",n.index),o.xp6(3),o.Oqu(o.lcZ(4,2,"value")))}function M(t,n){1&t&&(o.TgZ(0,"mat-header-cell"),o._uU(1),o.ALo(2,"transloco"),o.qZA()),2&t&&(o.xp6(1),o.hij(" ",o.lcZ(2,1,"private")," "))}function P(t,n){1&t&&(o.TgZ(0,"mat-cell",16),o._UZ(1,"mat-slide-toggle",20),o.ALo(2,"transloco"),o.qZA()),2&t&&(o.Q6J("formGroupName",n.index),o.xp6(1),o.uIk("aria-label",o.lcZ(2,2,"name")))}function x(t,n){if(1&t){const l=o.EpF();o.TgZ(0,"mat-header-cell")(1,"button",21),o.NdJ("click",function(){o.CHM(l);const O=o.oxw(2);return o.KtG(O.add())}),o.ALo(2,"transloco"),o._UZ(3,"fa-icon",22),o.qZA()()}if(2&t){const l=o.oxw(2);o.xp6(1),o.uIk("aria-label",o.lcZ(2,2,"newEntry")),o.xp6(2),o.Q6J("icon",l.faPlus)}}function Z(t,n){if(1&t){const l=o.EpF();o.TgZ(0,"mat-cell",16)(1,"button",23),o.NdJ("click",function(){const B=o.CHM(l).index,b=o.oxw(2);return o.KtG(b.remove(B))}),o._UZ(2,"fa-icon",24),o.qZA()()}if(2&t){const l=n.index,A=o.oxw(2);o.Q6J("formGroupName",l),o.xp6(2),o.Q6J("icon",A.faTrashCan)}}function U(t,n){1&t&&o._UZ(0,"mat-header-row")}function I(t,n){1&t&&o._UZ(0,"mat-row")}function N(t,n){1&t&&(o.TgZ(0,"tr",25)(1,"td",26),o._uU(2),o.ALo(3,"transloco"),o.qZA()()),2&t&&(o.xp6(2),o.hij(" ",o.lcZ(3,1,"lookupKeys.noKeys")," "))}function R(t,n){if(1&t&&(o.ynx(0,4)(1,5),o.TgZ(2,"mat-table",6),o.ynx(3,7),o.YNc(4,C,3,3,"mat-header-cell",8),o.YNc(5,d,6,4,"mat-cell",9),o.BQk(),o.ynx(6,10),o.YNc(7,T,3,3,"mat-header-cell",8),o.YNc(8,L,6,4,"mat-cell",9),o.BQk(),o.ynx(9,11),o.YNc(10,M,3,3,"mat-header-cell",8),o.YNc(11,P,3,4,"mat-cell",9),o.BQk(),o.ynx(12,12),o.YNc(13,x,4,4,"mat-header-cell",8),o.YNc(14,Z,3,2,"mat-cell",9),o.BQk(),o.YNc(15,U,1,0,"mat-header-row",13),o.YNc(16,I,1,0,"mat-row",14),o.YNc(17,N,4,3,"tr",15),o.qZA(),o.BQk()()),2&t){const l=o.oxw();o.Q6J("formGroup",l.rootForm),o.xp6(2),o.Q6J("dataSource",l.dataSource),o.xp6(13),o.Q6J("matHeaderRowDef",l.displayedColumns),o.xp6(1),o.Q6J("matRowDefColumns",l.displayedColumns)}}let k=((s=class{constructor(n){this.rootFormGroup=n,this.displayedColumns=["name","value","private","actions"],this.faTrashCan=i.Vui,this.faPlus=i.r8p,this.showAccordion=!0}ngOnInit(){this.rootForm=this.rootFormGroup.control,this.rootFormGroup.ngSubmit.subscribe(()=>{this.lookupKeys.markAllAsTouched()}),this.lookupKeys=this.rootForm.get("lookupKeys"),this.updateDataSource()}updateDataSource(){this.lookupKeys.controls.forEach(n=>{n.get("id")?.value&&n.get("name")?.disable()}),this.dataSource=new _.by(this.lookupKeys.controls)}add(){this.lookupKeys.push(new r.cw({name:new r.NI("",r.kI.required),value:new r.NI(""),private:new r.NI(!1)})),this.updateDataSource()}remove(n){this.lookupKeys.removeAt(n),this.updateDataSource()}}).\u0275fac=function(n){return new(n||s)(o.Y36(r.sg))},s.\u0275cmp=o.Xpm({type:s,selectors:[["df-lookup-keys"]],inputs:{showAccordion:"showAccordion"},standalone:!0,features:[o.jDz],decls:4,vars:2,consts:[[1,"lookup-keys-accordion"],[4,"ngIf","ngIfElse"],["lookupKeys",""],[3,"ngTemplateOutlet"],[3,"formGroup"],["formArrayName","lookupKeys"],[3,"dataSource"],["matColumnDef","name"],[4,"matHeaderCellDef"],[3,"formGroupName",4,"matCellDef"],["matColumnDef","value"],["matColumnDef","private"],["matColumnDef","actions","stickyEnd",""],[4,"matHeaderRowDef"],[4,"matRowDef","matRowDefColumns"],["class","mat-row no-data-row",4,"matNoDataRow"],[3,"formGroupName"],["subscriptSizing","dynamic"],["matInput","","formControlName","name"],["matInput","","formControlName","value"],["formControlName","private"],["mat-mini-fab","","color","primary","type","button",3,"click"],["size","xl",3,"icon"],["mat-icon-button","","type","button",3,"click"],["size","xs",3,"icon"],[1,"mat-row","no-data-row"],["colspan","4",1,"mat-cell"]],template:function(n,l){if(1&n&&(o.TgZ(0,"div",0),o.YNc(1,m,10,7,"mat-accordion",1),o.YNc(2,R,18,4,"ng-template",null,2,o.W1O),o.qZA()),2&n){const A=o.MAs(3);o.xp6(1),o.Q6J("ngIf",l.showAccordion)("ngIfElse",A)}},dependencies:[r.u5,r.Fj,r.JJ,r.JL,r.UX,r.sg,r.u,r.x0,r.CE,c.O5,c.tP,g.lN,g.KE,g.hX,E.ot,E.RK,E.nh,_.p0,_.BZ,_.fO,_.as,_.w1,_.Dz,_.nj,_.ge,_.ev,_.XQ,_.Gk,_.Ee,y.c,y.Nt,p.rP,p.Rr,e.uH,e.BN,u.To,u.pp,u.ib,u.yz,u.yK,u.u4,f.Ot],styles:[".lookup-keys-accordion[_ngcontent-%COMP%]{padding:16px 0}.mat-column-actions[_ngcontent-%COMP%], .mat-column-private[_ngcontent-%COMP%]{max-width:10%}.mat-mdc-cell[_ngcontent-%COMP%]{padding:8px}"]}),s);k=(0,h.gn)([(0,K.c)({checkProperties:!0})],k)},42281:(v,D,a)=>{a.d(D,{E:()=>c});var h=a(56223);const c=r=>{const g=new Map,E=r;function _(p){E.at(p).get("name")?.setErrors({notUnique:!0})}return E.controls.forEach((p,e)=>{if(!(p instanceof h.cw))return;const u=p.get("name");if(!u)return;const i=u.value;i&&(g.has(i)?(_(g.get(i)??0),_(e)):(g.set(i,e),function y(p){const u=E.at(p).get("name"),i=u?.errors;i&&(delete i.notUnique,u.setErrors(Object.keys(i).length?i:null))}(e)))}),null}}}]);