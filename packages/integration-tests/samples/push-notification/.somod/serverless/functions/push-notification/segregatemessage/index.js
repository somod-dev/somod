var we=Object.create;var P=Object.defineProperty;var me=Object.getOwnPropertyDescriptor;var ge=Object.getOwnPropertyNames;var Oe=Object.getPrototypeOf,je=Object.prototype.hasOwnProperty;var R=(o,c)=>()=>(c||o((c={exports:{}}).exports,c),c.exports),Se=(o,c)=>{for(var u in c)P(o,u,{get:c[u],enumerable:!0})},B=(o,c,u,l)=>{if(c&&typeof c=="object"||typeof c=="function")for(let e of ge(c))!je.call(o,e)&&e!==u&&P(o,e,{get:()=>c[e],enumerable:!(l=me(c,e))||l.enumerable});return o};var H=(o,c,u)=>(u=o!=null?we(Oe(o)):{},B(c||!o||!o.__esModule?P(u,"default",{value:o,enumerable:!0}):u,o)),Pe=o=>B(P({},"__esModule",{value:!0}),o);var K=R(v=>{"use strict";var E=v&&v.__assign||function(){return E=Object.assign||function(o){for(var c,u=1,l=arguments.length;u<l;u++){c=arguments[u];for(var e in c)Object.prototype.hasOwnProperty.call(c,e)&&(o[e]=c[e])}return o},E.apply(this,arguments)},A=v&&v.__awaiter||function(o,c,u,l){function e(t){return t instanceof u?t:new u(function(r){r(t)})}return new(u||(u=Promise))(function(t,r){function n(s){try{a(l.next(s))}catch(_){r(_)}}function i(s){try{a(l.throw(s))}catch(_){r(_)}}function a(s){s.done?t(s.value):e(s.value).then(n,i)}a((l=l.apply(o,c||[])).next())})},F=v&&v.__generator||function(o,c){var u={label:0,sent:function(){if(t[0]&1)throw t[1];return t[1]},trys:[],ops:[]},l,e,t,r;return r={next:n(0),throw:n(1),return:n(2)},typeof Symbol=="function"&&(r[Symbol.iterator]=function(){return this}),r;function n(a){return function(s){return i([a,s])}}function i(a){if(l)throw new TypeError("Generator is already executing.");for(;r&&(r=0,a[0]&&(u=0)),u;)try{if(l=1,e&&(t=a[0]&2?e.return:a[0]?e.throw||((t=e.return)&&t.call(e),0):e.next)&&!(t=t.call(e,a[1])).done)return t;switch(e=0,t&&(a=[a[0]&2,t.value]),a[0]){case 0:case 1:t=a;break;case 4:return u.label++,{value:a[1],done:!1};case 5:u.label++,e=a[1],a=[0];continue;case 7:a=u.ops.pop(),u.trys.pop();continue;default:if(t=u.trys,!(t=t.length>0&&t[t.length-1])&&(a[0]===6||a[0]===2)){u=0;continue}if(a[0]===3&&(!t||a[1]>t[0]&&a[1]<t[3])){u.label=a[1];break}if(a[0]===6&&u.label<t[1]){u.label=t[1],t=a;break}if(t&&u.label<t[2]){u.label=t[2],u.ops.push(a);break}t[2]&&u.ops.pop(),u.trys.pop();continue}a=c.call(o,u)}catch(s){a=[6,s],e=0}finally{l=t=0}if(a[0]&5)throw a[1];return{value:a[0]?a[1]:void 0,done:!0}}};v.__esModule=!0;v.getMiddlewareHandler=v.MiddlewareContext=void 0;var V=function(){function o(){var c=this.constructor;this.context={},Object.setPrototypeOf(this,c.prototype)}return o.prototype.set=function(c,u){this.context[c]=u},o.prototype.get=function(c){return this.context[c]},o}();v.MiddlewareContext=V;var Ee=function(o,c,u,l){return A(void 0,void 0,void 0,function(){var e;return F(this,function(t){switch(t.label){case 0:e=o(c,u,l),t.label=1;case 1:return typeof e?.then!="function"?[3,3]:[4,e];case 2:return e=t.sent(),[3,1];case 3:return[2,e]}})})},Te=function(o,c){return function(u,l,e){return A(void 0,void 0,void 0,function(){var t,r,n;return F(this,function(i){switch(i.label){case 0:return t=E(E({},u),{somodMiddlewareContext:new V}),r=c.length,n=function(){return A(void 0,void 0,void 0,function(){var a,s,_;return F(this,function(h){switch(h.label){case 0:return r>0?(a=c[--r],[4,a(n,t,l)]):[3,2];case 1:return s=h.sent(),[2,s];case 2:return[4,Ee(o,t,l,e)];case 3:return _=h.sent(),[2,_]}})})},[4,n()];case 1:return[2,i.sent()]}})})}};v.getMiddlewareHandler=Te});var q=R(O=>{"use strict";var De=O&&O.__createBinding||(Object.create?function(o,c,u,l){l===void 0&&(l=u);var e=Object.getOwnPropertyDescriptor(c,u);(!e||("get"in e?!c.__esModule:e.writable||e.configurable))&&(e={enumerable:!0,get:function(){return c[u]}}),Object.defineProperty(o,l,e)}:function(o,c,u,l){l===void 0&&(l=u),o[l]=c[u]});O.__esModule=!0;O.getMiddlewareHandler=void 0;var Me=K();De(O,Me,"getMiddlewareHandler")});var he=R((Ve,M)=>{var z,L,W,Y,J,Q,U,X,Z,$,x,k,ee,T,C,te,re,ne,j,ae,ie,oe,ue,ce,se,fe,le,_e,D,de,ye;(function(o){var c=typeof global=="object"?global:typeof self=="object"?self:typeof this=="object"?this:{};typeof define=="function"&&define.amd?define("tslib",["exports"],function(l){o(u(c,u(l)))}):typeof M=="object"&&typeof M.exports=="object"?o(u(c,u(M.exports))):o(u(c));function u(l,e){return l!==c&&(typeof Object.create=="function"?Object.defineProperty(l,"__esModule",{value:!0}):l.__esModule=!0),function(t,r){return l[t]=e?e(t,r):r}}})(function(o){var c=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])};z=function(e,t){if(typeof t!="function"&&t!==null)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");c(e,t);function r(){this.constructor=e}e.prototype=t===null?Object.create(t):(r.prototype=t.prototype,new r)},L=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++){t=arguments[r];for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i])}return e},W=function(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var i=0,n=Object.getOwnPropertySymbols(e);i<n.length;i++)t.indexOf(n[i])<0&&Object.prototype.propertyIsEnumerable.call(e,n[i])&&(r[n[i]]=e[n[i]]);return r},Y=function(e,t,r,n){var i=arguments.length,a=i<3?t:n===null?n=Object.getOwnPropertyDescriptor(t,r):n,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(e,t,r,n);else for(var _=e.length-1;_>=0;_--)(s=e[_])&&(a=(i<3?s(a):i>3?s(t,r,a):s(t,r))||a);return i>3&&a&&Object.defineProperty(t,r,a),a},J=function(e,t){return function(r,n){t(r,n,e)}},Q=function(e,t,r,n,i,a){function s(S){if(S!==void 0&&typeof S!="function")throw new TypeError("Function expected");return S}for(var _=n.kind,h=_==="getter"?"get":_==="setter"?"set":"value",f=!t&&e?n.static?e:e.prototype:null,d=t||(f?Object.getOwnPropertyDescriptor(f,n.name):{}),p,y=!1,b=r.length-1;b>=0;b--){var w={};for(var m in n)w[m]=m==="access"?{}:n[m];for(var m in n.access)w.access[m]=n.access[m];w.addInitializer=function(S){if(y)throw new TypeError("Cannot add initializers after decoration has completed");a.push(s(S||null))};var g=(0,r[b])(_==="accessor"?{get:d.get,set:d.set}:d[h],w);if(_==="accessor"){if(g===void 0)continue;if(g===null||typeof g!="object")throw new TypeError("Object expected");(p=s(g.get))&&(d.get=p),(p=s(g.set))&&(d.set=p),(p=s(g.init))&&i.unshift(p)}else(p=s(g))&&(_==="field"?i.unshift(p):d[h]=p)}f&&Object.defineProperty(f,n.name,d),y=!0},U=function(e,t,r){for(var n=arguments.length>2,i=0;i<t.length;i++)r=n?t[i].call(e,r):t[i].call(e);return n?r:void 0},X=function(e){return typeof e=="symbol"?e:"".concat(e)},Z=function(e,t,r){return typeof t=="symbol"&&(t=t.description?"[".concat(t.description,"]"):""),Object.defineProperty(e,"name",{configurable:!0,value:r?"".concat(r," ",t):t})},$=function(e,t){if(typeof Reflect=="object"&&typeof Reflect.metadata=="function")return Reflect.metadata(e,t)},x=function(e,t,r,n){function i(a){return a instanceof r?a:new r(function(s){s(a)})}return new(r||(r=Promise))(function(a,s){function _(d){try{f(n.next(d))}catch(p){s(p)}}function h(d){try{f(n.throw(d))}catch(p){s(p)}}function f(d){d.done?a(d.value):i(d.value).then(_,h)}f((n=n.apply(e,t||[])).next())})},k=function(e,t){var r={label:0,sent:function(){if(a[0]&1)throw a[1];return a[1]},trys:[],ops:[]},n,i,a,s;return s={next:_(0),throw:_(1),return:_(2)},typeof Symbol=="function"&&(s[Symbol.iterator]=function(){return this}),s;function _(f){return function(d){return h([f,d])}}function h(f){if(n)throw new TypeError("Generator is already executing.");for(;s&&(s=0,f[0]&&(r=0)),r;)try{if(n=1,i&&(a=f[0]&2?i.return:f[0]?i.throw||((a=i.return)&&a.call(i),0):i.next)&&!(a=a.call(i,f[1])).done)return a;switch(i=0,a&&(f=[f[0]&2,a.value]),f[0]){case 0:case 1:a=f;break;case 4:return r.label++,{value:f[1],done:!1};case 5:r.label++,i=f[1],f=[0];continue;case 7:f=r.ops.pop(),r.trys.pop();continue;default:if(a=r.trys,!(a=a.length>0&&a[a.length-1])&&(f[0]===6||f[0]===2)){r=0;continue}if(f[0]===3&&(!a||f[1]>a[0]&&f[1]<a[3])){r.label=f[1];break}if(f[0]===6&&r.label<a[1]){r.label=a[1],a=f;break}if(a&&r.label<a[2]){r.label=a[2],r.ops.push(f);break}a[2]&&r.ops.pop(),r.trys.pop();continue}f=t.call(e,r)}catch(d){f=[6,d],i=0}finally{n=a=0}if(f[0]&5)throw f[1];return{value:f[0]?f[1]:void 0,done:!0}}},ee=function(e,t){for(var r in e)r!=="default"&&!Object.prototype.hasOwnProperty.call(t,r)&&D(t,e,r)},D=Object.create?function(e,t,r,n){n===void 0&&(n=r);var i=Object.getOwnPropertyDescriptor(t,r);(!i||("get"in i?!t.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,i)}:function(e,t,r,n){n===void 0&&(n=r),e[n]=t[r]},T=function(e){var t=typeof Symbol=="function"&&Symbol.iterator,r=t&&e[t],n=0;if(r)return r.call(e);if(e&&typeof e.length=="number")return{next:function(){return e&&n>=e.length&&(e=void 0),{value:e&&e[n++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")},C=function(e,t){var r=typeof Symbol=="function"&&e[Symbol.iterator];if(!r)return e;var n=r.call(e),i,a=[],s;try{for(;(t===void 0||t-- >0)&&!(i=n.next()).done;)a.push(i.value)}catch(_){s={error:_}}finally{try{i&&!i.done&&(r=n.return)&&r.call(n)}finally{if(s)throw s.error}}return a},te=function(){for(var e=[],t=0;t<arguments.length;t++)e=e.concat(C(arguments[t]));return e},re=function(){for(var e=0,t=0,r=arguments.length;t<r;t++)e+=arguments[t].length;for(var n=Array(e),i=0,t=0;t<r;t++)for(var a=arguments[t],s=0,_=a.length;s<_;s++,i++)n[i]=a[s];return n},ne=function(e,t,r){if(r||arguments.length===2)for(var n=0,i=t.length,a;n<i;n++)(a||!(n in t))&&(a||(a=Array.prototype.slice.call(t,0,n)),a[n]=t[n]);return e.concat(a||Array.prototype.slice.call(t))},j=function(e){return this instanceof j?(this.v=e,this):new j(e)},ae=function(e,t,r){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var n=r.apply(e,t||[]),i,a=[];return i={},s("next"),s("throw"),s("return"),i[Symbol.asyncIterator]=function(){return this},i;function s(y){n[y]&&(i[y]=function(b){return new Promise(function(w,m){a.push([y,b,w,m])>1||_(y,b)})})}function _(y,b){try{h(n[y](b))}catch(w){p(a[0][3],w)}}function h(y){y.value instanceof j?Promise.resolve(y.value.v).then(f,d):p(a[0][2],y)}function f(y){_("next",y)}function d(y){_("throw",y)}function p(y,b){y(b),a.shift(),a.length&&_(a[0][0],a[0][1])}},ie=function(e){var t,r;return t={},n("next"),n("throw",function(i){throw i}),n("return"),t[Symbol.iterator]=function(){return this},t;function n(i,a){t[i]=e[i]?function(s){return(r=!r)?{value:j(e[i](s)),done:!1}:a?a(s):s}:a}},oe=function(e){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var t=e[Symbol.asyncIterator],r;return t?t.call(e):(e=typeof T=="function"?T(e):e[Symbol.iterator](),r={},n("next"),n("throw"),n("return"),r[Symbol.asyncIterator]=function(){return this},r);function n(a){r[a]=e[a]&&function(s){return new Promise(function(_,h){s=e[a](s),i(_,h,s.done,s.value)})}}function i(a,s,_,h){Promise.resolve(h).then(function(f){a({value:f,done:_})},s)}},ue=function(e,t){return Object.defineProperty?Object.defineProperty(e,"raw",{value:t}):e.raw=t,e};var u=Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t};ce=function(e){if(e&&e.__esModule)return e;var t={};if(e!=null)for(var r in e)r!=="default"&&Object.prototype.hasOwnProperty.call(e,r)&&D(t,e,r);return u(t,e),t},se=function(e){return e&&e.__esModule?e:{default:e}},fe=function(e,t,r,n){if(r==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof t=="function"?e!==t||!n:!t.has(e))throw new TypeError("Cannot read private member from an object whose class did not declare it");return r==="m"?n:r==="a"?n.call(e):n?n.value:t.get(e)},le=function(e,t,r,n,i){if(n==="m")throw new TypeError("Private method is not writable");if(n==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof t=="function"?e!==t||!i:!t.has(e))throw new TypeError("Cannot write private member to an object whose class did not declare it");return n==="a"?i.call(e,r):i?i.value=r:t.set(e,r),r},_e=function(e,t){if(t===null||typeof t!="object"&&typeof t!="function")throw new TypeError("Cannot use 'in' operator on non-object");return typeof e=="function"?t===e:e.has(t)},de=function(e,t,r){if(t!=null){if(typeof t!="object"&&typeof t!="function")throw new TypeError("Object expected.");var n;if(r){if(!Symbol.asyncDispose)throw new TypeError("Symbol.asyncDispose is not defined.");n=t[Symbol.asyncDispose]}if(n===void 0){if(!Symbol.dispose)throw new TypeError("Symbol.dispose is not defined.");n=t[Symbol.dispose]}if(typeof n!="function")throw new TypeError("Object not disposable.");e.stack.push({value:t,dispose:n,async:r})}else r&&e.stack.push({async:!0});return t};var l=typeof SuppressedError=="function"?SuppressedError:function(e,t,r){var n=new Error(r);return n.name="SuppressedError",n.error=e,n.suppressed=t,n};ye=function(e){function t(n){e.error=e.hasError?new l(n,e.error,"An error was suppressed during disposal."):n,e.hasError=!0}function r(){for(;e.stack.length;){var n=e.stack.pop();try{var i=n.dispose&&n.dispose.call(n.value);if(n.async)return Promise.resolve(i).then(r,function(a){return t(a),r()})}catch(a){t(a)}}if(e.hasError)throw e.error}return r()},o("__extends",z),o("__assign",L),o("__rest",W),o("__decorate",Y),o("__param",J),o("__esDecorate",Q),o("__runInitializers",U),o("__propKey",X),o("__setFunctionName",Z),o("__metadata",$),o("__awaiter",x),o("__generator",k),o("__exportStar",ee),o("__createBinding",D),o("__values",T),o("__read",C),o("__spread",te),o("__spreadArrays",re),o("__spreadArray",ne),o("__await",j),o("__asyncGenerator",ae),o("__asyncDelegator",ie),o("__asyncValues",oe),o("__makeTemplateObject",ue),o("__importStar",ce),o("__importDefault",se),o("__classPrivateFieldGet",fe),o("__classPrivateFieldSet",le),o("__classPrivateFieldIn",_e),o("__addDisposableResource",de),o("__disposeResources",ye)})});var Ge={};Se(Ge,{default:()=>Ie});module.exports=Pe(Ge);var be=H(q());var pe=H(he(),1),{__extends:Ke,__assign:qe,__rest:ze,__decorate:Le,__param:We,__esDecorate:Ye,__runInitializers:Je,__propKey:Qe,__setFunctionName:Ue,__metadata:Xe,__awaiter:I,__generator:G,__exportStar:Ze,__createBinding:$e,__values:xe,__read:ke,__spread:et,__spreadArrays:tt,__spreadArray:rt,__await:nt,__asyncGenerator:at,__asyncDelegator:it,__asyncValues:ot,__makeTemplateObject:ut,__importStar:ct,__importDefault:st,__classPrivateFieldGet:ft,__classPrivateFieldSet:lt,__classPrivateFieldIn:_t,__addDisposableResource:dt,__disposeResources:yt}=pe.default;var N=require("aws-sdk"),Re=new N.DynamoDB.DocumentClient({apiVersion:"2012-08-10",region:process.env.AWS_REGION}),Ae=function(o){return I(void 0,void 0,void 0,function(){var c,u;return G(this,function(l){return c=N.DynamoDB.Converter.unmarshall(((u=o.dynamodb)===null||u===void 0?void 0:u.NewImage)||{}),typeof c.message.type=="string"&&Re.put({TableName:process.env.MESSAGE_TYPE_TABLE_NAME,Item:{type:c.message.type,messageId:c.messageId}}),[2]})})},Fe=function(o){return I(void 0,void 0,void 0,function(){var c,u,l;return G(this,function(e){switch(e.label){case 0:c=0,u=o.Records,e.label=1;case 1:return c<u.length?(l=u[c],l.eventName!="INSERT"?[3,3]:[4,Ae(l)]):[3,4];case 2:e.sent(),e.label=3;case 3:return c++,[3,1];case 4:return[2]}})})},ve=Fe;var Ce=(0,be.getMiddlewareHandler)(ve,[]),Ie=Ce;0&&(module.exports={});
