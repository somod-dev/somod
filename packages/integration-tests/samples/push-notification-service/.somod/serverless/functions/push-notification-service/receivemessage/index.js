var st=Object.create;var R=Object.defineProperty;var dt=Object.getOwnPropertyDescriptor;var _t=Object.getOwnPropertyNames;var vt=Object.getPrototypeOf,yt=Object.prototype.hasOwnProperty;var y=(e,i)=>()=>(i||e((i={exports:{}}).exports,i),i.exports),pt=(e,i)=>{for(var f in i)R(e,f,{get:i[f],enumerable:!0})},ce=(e,i,f,r)=>{if(i&&typeof i=="object"||typeof i=="function")for(let t of _t(i))!yt.call(e,t)&&t!==f&&R(e,t,{get:()=>i[t],enumerable:!(r=dt(i,t))||r.enumerable});return e};var Z=(e,i,f)=>(f=e!=null?st(vt(e)):{},ce(i||!e||!e.__esModule?R(f,"default",{value:e,enumerable:!0}):f,e)),ht=e=>ce(R({},"__esModule",{value:!0}),e);var de=y(g=>{"use strict";var A=g&&g.__assign||function(){return A=Object.assign||function(e){for(var i,f=1,r=arguments.length;f<r;f++){i=arguments[f];for(var t in i)Object.prototype.hasOwnProperty.call(i,t)&&(e[t]=i[t])}return e},A.apply(this,arguments)},k=g&&g.__awaiter||function(e,i,f,r){function t(n){return n instanceof f?n:new f(function(a){a(n)})}return new(f||(f=Promise))(function(n,a){function o(s){try{u(r.next(s))}catch(d){a(d)}}function l(s){try{u(r.throw(s))}catch(d){a(d)}}function u(s){s.done?n(s.value):t(s.value).then(o,l)}u((r=r.apply(e,i||[])).next())})},ee=g&&g.__generator||function(e,i){var f={label:0,sent:function(){if(n[0]&1)throw n[1];return n[1]},trys:[],ops:[]},r,t,n,a;return a={next:o(0),throw:o(1),return:o(2)},typeof Symbol=="function"&&(a[Symbol.iterator]=function(){return this}),a;function o(u){return function(s){return l([u,s])}}function l(u){if(r)throw new TypeError("Generator is already executing.");for(;a&&(a=0,u[0]&&(f=0)),f;)try{if(r=1,t&&(n=u[0]&2?t.return:u[0]?t.throw||((n=t.return)&&n.call(t),0):t.next)&&!(n=n.call(t,u[1])).done)return n;switch(t=0,n&&(u=[u[0]&2,n.value]),u[0]){case 0:case 1:n=u;break;case 4:return f.label++,{value:u[1],done:!1};case 5:f.label++,t=u[1],u=[0];continue;case 7:u=f.ops.pop(),f.trys.pop();continue;default:if(n=f.trys,!(n=n.length>0&&n[n.length-1])&&(u[0]===6||u[0]===2)){f=0;continue}if(u[0]===3&&(!n||u[1]>n[0]&&u[1]<n[3])){f.label=u[1];break}if(u[0]===6&&f.label<n[1]){f.label=n[1],n=u;break}if(n&&f.label<n[2]){f.label=n[2],f.ops.push(u);break}n[2]&&f.ops.pop(),f.trys.pop();continue}u=i.call(e,f)}catch(s){u=[6,s],t=0}finally{r=n=0}if(u[0]&5)throw u[1];return{value:u[0]?u[1]:void 0,done:!0}}};g.__esModule=!0;g.getMiddlewareHandler=g.MiddlewareContext=void 0;var se=function(){function e(){var i=this.constructor;this.context={},Object.setPrototypeOf(this,i.prototype)}return e.prototype.set=function(i,f){this.context[i]=f},e.prototype.get=function(i){return this.context[i]},e}();g.MiddlewareContext=se;var gt=function(e,i,f,r){return k(void 0,void 0,void 0,function(){var t;return ee(this,function(n){switch(n.label){case 0:t=e(i,f,r),n.label=1;case 1:return typeof(t==null?void 0:t.then)!="function"?[3,3]:[4,t];case 2:return t=n.sent(),[3,1];case 3:return[2,t]}})})},mt=function(e,i){return function(f,r,t){return k(void 0,void 0,void 0,function(){var n,a,o;return ee(this,function(l){switch(l.label){case 0:return n=A(A({},f),{somodMiddlewareContext:new se}),a=i.length,o=function(){return k(void 0,void 0,void 0,function(){var u,s,d;return ee(this,function(c){switch(c.label){case 0:return a>0?(u=i[--a],[4,u(o,n,r)]):[3,2];case 1:return s=c.sent(),[2,s];case 2:return[4,gt(e,n,r,t)];case 3:return d=c.sent(),[2,d]}})})},[4,o()];case 1:return[2,l.sent()]}})})}};g.getMiddlewareHandler=mt});var _e=y(x=>{"use strict";var wt=x&&x.__createBinding||(Object.create?function(e,i,f,r){r===void 0&&(r=f);var t=Object.getOwnPropertyDescriptor(i,f);(!t||("get"in t?!i.__esModule:t.writable||t.configurable))&&(t={enumerable:!0,get:function(){return i[f]}}),Object.defineProperty(e,r,t)}:function(e,i,f,r){r===void 0&&(r=f),e[r]=i[f]});x.__esModule=!0;x.getMiddlewareHandler=void 0;var bt=de();wt(x,bt,"getMiddlewareHandler")});var Be=y((Gr,N)=>{var ve,ye,pe,he,ge,me,we,be,Oe,Pe,Me,Se,qe,U,te,xe,De,Ie,D,je,Te,Ee,Re,Ae,Ue,Ce,Ne,Fe,C;(function(e){var i=typeof global=="object"?global:typeof self=="object"?self:typeof this=="object"?this:{};typeof define=="function"&&define.amd?define("tslib",["exports"],function(r){e(f(i,f(r)))}):typeof N=="object"&&typeof N.exports=="object"?e(f(i,f(N.exports))):e(f(i));function f(r,t){return r!==i&&(typeof Object.create=="function"?Object.defineProperty(r,"__esModule",{value:!0}):r.__esModule=!0),function(n,a){return r[n]=t?t(n,a):a}}})(function(e){var i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(r,t){r.__proto__=t}||function(r,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(r[n]=t[n])};ve=function(r,t){if(typeof t!="function"&&t!==null)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");i(r,t);function n(){this.constructor=r}r.prototype=t===null?Object.create(t):(n.prototype=t.prototype,new n)},ye=Object.assign||function(r){for(var t,n=1,a=arguments.length;n<a;n++){t=arguments[n];for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(r[o]=t[o])}return r},pe=function(r,t){var n={};for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&t.indexOf(a)<0&&(n[a]=r[a]);if(r!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,a=Object.getOwnPropertySymbols(r);o<a.length;o++)t.indexOf(a[o])<0&&Object.prototype.propertyIsEnumerable.call(r,a[o])&&(n[a[o]]=r[a[o]]);return n},he=function(r,t,n,a){var o=arguments.length,l=o<3?t:a===null?a=Object.getOwnPropertyDescriptor(t,n):a,u;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")l=Reflect.decorate(r,t,n,a);else for(var s=r.length-1;s>=0;s--)(u=r[s])&&(l=(o<3?u(l):o>3?u(t,n,l):u(t,n))||l);return o>3&&l&&Object.defineProperty(t,n,l),l},ge=function(r,t){return function(n,a){t(n,a,r)}},me=function(r,t,n,a,o,l){function u(I){if(I!==void 0&&typeof I!="function")throw new TypeError("Function expected");return I}for(var s=a.kind,d=s==="getter"?"get":s==="setter"?"set":"value",c=!t&&r?a.static?r:r.prototype:null,_=t||(c?Object.getOwnPropertyDescriptor(c,a.name):{}),h,v=!1,w=n.length-1;w>=0;w--){var P={};for(var M in a)P[M]=M==="access"?{}:a[M];for(var M in a.access)P.access[M]=a.access[M];P.addInitializer=function(I){if(v)throw new TypeError("Cannot add initializers after decoration has completed");l.push(u(I||null))};var S=(0,n[w])(s==="accessor"?{get:_.get,set:_.set}:_[d],P);if(s==="accessor"){if(S===void 0)continue;if(S===null||typeof S!="object")throw new TypeError("Object expected");(h=u(S.get))&&(_.get=h),(h=u(S.set))&&(_.set=h),(h=u(S.init))&&o.push(h)}else(h=u(S))&&(s==="field"?o.push(h):_[d]=h)}c&&Object.defineProperty(c,a.name,_),v=!0},we=function(r,t,n){for(var a=arguments.length>2,o=0;o<t.length;o++)n=a?t[o].call(r,n):t[o].call(r);return a?n:void 0},be=function(r){return typeof r=="symbol"?r:"".concat(r)},Oe=function(r,t,n){return typeof t=="symbol"&&(t=t.description?"[".concat(t.description,"]"):""),Object.defineProperty(r,"name",{configurable:!0,value:n?"".concat(n," ",t):t})},Pe=function(r,t){if(typeof Reflect=="object"&&typeof Reflect.metadata=="function")return Reflect.metadata(r,t)},Me=function(r,t,n,a){function o(l){return l instanceof n?l:new n(function(u){u(l)})}return new(n||(n=Promise))(function(l,u){function s(_){try{c(a.next(_))}catch(h){u(h)}}function d(_){try{c(a.throw(_))}catch(h){u(h)}}function c(_){_.done?l(_.value):o(_.value).then(s,d)}c((a=a.apply(r,t||[])).next())})},Se=function(r,t){var n={label:0,sent:function(){if(l[0]&1)throw l[1];return l[1]},trys:[],ops:[]},a,o,l,u;return u={next:s(0),throw:s(1),return:s(2)},typeof Symbol=="function"&&(u[Symbol.iterator]=function(){return this}),u;function s(c){return function(_){return d([c,_])}}function d(c){if(a)throw new TypeError("Generator is already executing.");for(;u&&(u=0,c[0]&&(n=0)),n;)try{if(a=1,o&&(l=c[0]&2?o.return:c[0]?o.throw||((l=o.return)&&l.call(o),0):o.next)&&!(l=l.call(o,c[1])).done)return l;switch(o=0,l&&(c=[c[0]&2,l.value]),c[0]){case 0:case 1:l=c;break;case 4:return n.label++,{value:c[1],done:!1};case 5:n.label++,o=c[1],c=[0];continue;case 7:c=n.ops.pop(),n.trys.pop();continue;default:if(l=n.trys,!(l=l.length>0&&l[l.length-1])&&(c[0]===6||c[0]===2)){n=0;continue}if(c[0]===3&&(!l||c[1]>l[0]&&c[1]<l[3])){n.label=c[1];break}if(c[0]===6&&n.label<l[1]){n.label=l[1],l=c;break}if(l&&n.label<l[2]){n.label=l[2],n.ops.push(c);break}l[2]&&n.ops.pop(),n.trys.pop();continue}c=t.call(r,n)}catch(_){c=[6,_],o=0}finally{a=l=0}if(c[0]&5)throw c[1];return{value:c[0]?c[1]:void 0,done:!0}}},qe=function(r,t){for(var n in r)n!=="default"&&!Object.prototype.hasOwnProperty.call(t,n)&&C(t,r,n)},C=Object.create?function(r,t,n,a){a===void 0&&(a=n);var o=Object.getOwnPropertyDescriptor(t,n);(!o||("get"in o?!t.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(r,a,o)}:function(r,t,n,a){a===void 0&&(a=n),r[a]=t[n]},U=function(r){var t=typeof Symbol=="function"&&Symbol.iterator,n=t&&r[t],a=0;if(n)return n.call(r);if(r&&typeof r.length=="number")return{next:function(){return r&&a>=r.length&&(r=void 0),{value:r&&r[a++],done:!r}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")},te=function(r,t){var n=typeof Symbol=="function"&&r[Symbol.iterator];if(!n)return r;var a=n.call(r),o,l=[],u;try{for(;(t===void 0||t-- >0)&&!(o=a.next()).done;)l.push(o.value)}catch(s){u={error:s}}finally{try{o&&!o.done&&(n=a.return)&&n.call(a)}finally{if(u)throw u.error}}return l},xe=function(){for(var r=[],t=0;t<arguments.length;t++)r=r.concat(te(arguments[t]));return r},De=function(){for(var r=0,t=0,n=arguments.length;t<n;t++)r+=arguments[t].length;for(var a=Array(r),o=0,t=0;t<n;t++)for(var l=arguments[t],u=0,s=l.length;u<s;u++,o++)a[o]=l[u];return a},Ie=function(r,t,n){if(n||arguments.length===2)for(var a=0,o=t.length,l;a<o;a++)(l||!(a in t))&&(l||(l=Array.prototype.slice.call(t,0,a)),l[a]=t[a]);return r.concat(l||Array.prototype.slice.call(t))},D=function(r){return this instanceof D?(this.v=r,this):new D(r)},je=function(r,t,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var a=n.apply(r,t||[]),o,l=[];return o={},u("next"),u("throw"),u("return"),o[Symbol.asyncIterator]=function(){return this},o;function u(v){a[v]&&(o[v]=function(w){return new Promise(function(P,M){l.push([v,w,P,M])>1||s(v,w)})})}function s(v,w){try{d(a[v](w))}catch(P){h(l[0][3],P)}}function d(v){v.value instanceof D?Promise.resolve(v.value.v).then(c,_):h(l[0][2],v)}function c(v){s("next",v)}function _(v){s("throw",v)}function h(v,w){v(w),l.shift(),l.length&&s(l[0][0],l[0][1])}},Te=function(r){var t,n;return t={},a("next"),a("throw",function(o){throw o}),a("return"),t[Symbol.iterator]=function(){return this},t;function a(o,l){t[o]=r[o]?function(u){return(n=!n)?{value:D(r[o](u)),done:!1}:l?l(u):u}:l}},Ee=function(r){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var t=r[Symbol.asyncIterator],n;return t?t.call(r):(r=typeof U=="function"?U(r):r[Symbol.iterator](),n={},a("next"),a("throw"),a("return"),n[Symbol.asyncIterator]=function(){return this},n);function a(l){n[l]=r[l]&&function(u){return new Promise(function(s,d){u=r[l](u),o(s,d,u.done,u.value)})}}function o(l,u,s,d){Promise.resolve(d).then(function(c){l({value:c,done:s})},u)}},Re=function(r,t){return Object.defineProperty?Object.defineProperty(r,"raw",{value:t}):r.raw=t,r};var f=Object.create?function(r,t){Object.defineProperty(r,"default",{enumerable:!0,value:t})}:function(r,t){r.default=t};Ae=function(r){if(r&&r.__esModule)return r;var t={};if(r!=null)for(var n in r)n!=="default"&&Object.prototype.hasOwnProperty.call(r,n)&&C(t,r,n);return f(t,r),t},Ue=function(r){return r&&r.__esModule?r:{default:r}},Ce=function(r,t,n,a){if(n==="a"&&!a)throw new TypeError("Private accessor was defined without a getter");if(typeof t=="function"?r!==t||!a:!t.has(r))throw new TypeError("Cannot read private member from an object whose class did not declare it");return n==="m"?a:n==="a"?a.call(r):a?a.value:t.get(r)},Ne=function(r,t,n,a,o){if(a==="m")throw new TypeError("Private method is not writable");if(a==="a"&&!o)throw new TypeError("Private accessor was defined without a setter");if(typeof t=="function"?r!==t||!o:!t.has(r))throw new TypeError("Cannot write private member to an object whose class did not declare it");return a==="a"?o.call(r,n):o?o.value=n:t.set(r,n),n},Fe=function(r,t){if(t===null||typeof t!="object"&&typeof t!="function")throw new TypeError("Cannot use 'in' operator on non-object");return typeof r=="function"?t===r:r.has(t)},e("__extends",ve),e("__assign",ye),e("__rest",pe),e("__decorate",he),e("__param",ge),e("__esDecorate",me),e("__runInitializers",we),e("__propKey",be),e("__setFunctionName",Oe),e("__metadata",Pe),e("__awaiter",Me),e("__generator",Se),e("__exportStar",qe),e("__createBinding",C),e("__values",U),e("__read",te),e("__spread",xe),e("__spreadArrays",De),e("__spreadArray",Ie),e("__await",D),e("__asyncGenerator",je),e("__asyncDelegator",Te),e("__asyncValues",Ee),e("__makeTemplateObject",Re),e("__importStar",Ae),e("__importDefault",Ue),e("__classPrivateFieldGet",Ce),e("__classPrivateFieldSet",Ne),e("__classPrivateFieldIn",Fe)})});var ne=y(re=>{"use strict";Object.defineProperty(re,"__esModule",{value:!0});re.default=Mt;var Ot=Pt(require("crypto"));function Pt(e){return e&&e.__esModule?e:{default:e}}var B=new Uint8Array(256),F=B.length;function Mt(){return F>B.length-16&&(Ot.default.randomFillSync(B),F=0),B.slice(F,F+=16)}});var Ke=y(L=>{"use strict";Object.defineProperty(L,"__esModule",{value:!0});L.default=void 0;var St=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;L.default=St});var j=y(G=>{"use strict";Object.defineProperty(G,"__esModule",{value:!0});G.default=void 0;var qt=xt(Ke());function xt(e){return e&&e.__esModule?e:{default:e}}function Dt(e){return typeof e=="string"&&qt.default.test(e)}var It=Dt;G.default=It});var E=y(T=>{"use strict";Object.defineProperty(T,"__esModule",{value:!0});T.default=void 0;T.unsafeStringify=Ve;var jt=Tt(j());function Tt(e){return e&&e.__esModule?e:{default:e}}var p=[];for(let e=0;e<256;++e)p.push((e+256).toString(16).slice(1));function Ve(e,i=0){return(p[e[i+0]]+p[e[i+1]]+p[e[i+2]]+p[e[i+3]]+"-"+p[e[i+4]]+p[e[i+5]]+"-"+p[e[i+6]]+p[e[i+7]]+"-"+p[e[i+8]]+p[e[i+9]]+"-"+p[e[i+10]]+p[e[i+11]]+p[e[i+12]]+p[e[i+13]]+p[e[i+14]]+p[e[i+15]]).toLowerCase()}function Et(e,i=0){let f=Ve(e,i);if(!(0,jt.default)(f))throw TypeError("Stringified UUID is invalid");return f}var Rt=Et;T.default=Rt});var ze=y(H=>{"use strict";Object.defineProperty(H,"__esModule",{value:!0});H.default=void 0;var At=Ct(ne()),Ut=E();function Ct(e){return e&&e.__esModule?e:{default:e}}var Je,ae,ie=0,ue=0;function Nt(e,i,f){let r=i&&f||0,t=i||new Array(16);e=e||{};let n=e.node||Je,a=e.clockseq!==void 0?e.clockseq:ae;if(n==null||a==null){let c=e.random||(e.rng||At.default)();n==null&&(n=Je=[c[0]|1,c[1],c[2],c[3],c[4],c[5]]),a==null&&(a=ae=(c[6]<<8|c[7])&16383)}let o=e.msecs!==void 0?e.msecs:Date.now(),l=e.nsecs!==void 0?e.nsecs:ue+1,u=o-ie+(l-ue)/1e4;if(u<0&&e.clockseq===void 0&&(a=a+1&16383),(u<0||o>ie)&&e.nsecs===void 0&&(l=0),l>=1e4)throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");ie=o,ue=l,ae=a,o+=122192928e5;let s=((o&268435455)*1e4+l)%4294967296;t[r++]=s>>>24&255,t[r++]=s>>>16&255,t[r++]=s>>>8&255,t[r++]=s&255;let d=o/4294967296*1e4&268435455;t[r++]=d>>>8&255,t[r++]=d&255,t[r++]=d>>>24&15|16,t[r++]=d>>>16&255,t[r++]=a>>>8|128,t[r++]=a&255;for(let c=0;c<6;++c)t[r+c]=n[c];return i||(0,Ut.unsafeStringify)(t)}var Ft=Nt;H.default=Ft});var fe=y(K=>{"use strict";Object.defineProperty(K,"__esModule",{value:!0});K.default=void 0;var Bt=Lt(j());function Lt(e){return e&&e.__esModule?e:{default:e}}function Gt(e){if(!(0,Bt.default)(e))throw TypeError("Invalid UUID");let i,f=new Uint8Array(16);return f[0]=(i=parseInt(e.slice(0,8),16))>>>24,f[1]=i>>>16&255,f[2]=i>>>8&255,f[3]=i&255,f[4]=(i=parseInt(e.slice(9,13),16))>>>8,f[5]=i&255,f[6]=(i=parseInt(e.slice(14,18),16))>>>8,f[7]=i&255,f[8]=(i=parseInt(e.slice(19,23),16))>>>8,f[9]=i&255,f[10]=(i=parseInt(e.slice(24,36),16))/1099511627776&255,f[11]=i/4294967296&255,f[12]=i>>>24&255,f[13]=i>>>16&255,f[14]=i>>>8&255,f[15]=i&255,f}var Ht=Gt;K.default=Ht});var oe=y(q=>{"use strict";Object.defineProperty(q,"__esModule",{value:!0});q.URL=q.DNS=void 0;q.default=Wt;var Kt=E(),Vt=Jt(fe());function Jt(e){return e&&e.__esModule?e:{default:e}}function zt(e){e=unescape(encodeURIComponent(e));let i=[];for(let f=0;f<e.length;++f)i.push(e.charCodeAt(f));return i}var We="6ba7b810-9dad-11d1-80b4-00c04fd430c8";q.DNS=We;var Ye="6ba7b811-9dad-11d1-80b4-00c04fd430c8";q.URL=Ye;function Wt(e,i,f){function r(t,n,a,o){var l;if(typeof t=="string"&&(t=zt(t)),typeof n=="string"&&(n=(0,Vt.default)(n)),((l=n)===null||l===void 0?void 0:l.length)!==16)throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");let u=new Uint8Array(16+t.length);if(u.set(n),u.set(t,n.length),u=f(u),u[6]=u[6]&15|i,u[8]=u[8]&63|128,a){o=o||0;for(let s=0;s<16;++s)a[o+s]=u[s];return a}return(0,Kt.unsafeStringify)(u)}try{r.name=e}catch{}return r.DNS=We,r.URL=Ye,r}});var $e=y(V=>{"use strict";Object.defineProperty(V,"__esModule",{value:!0});V.default=void 0;var Yt=$t(require("crypto"));function $t(e){return e&&e.__esModule?e:{default:e}}function Qt(e){return Array.isArray(e)?e=Buffer.from(e):typeof e=="string"&&(e=Buffer.from(e,"utf8")),Yt.default.createHash("md5").update(e).digest()}var Xt=Qt;V.default=Xt});var Xe=y(J=>{"use strict";Object.defineProperty(J,"__esModule",{value:!0});J.default=void 0;var Zt=Qe(oe()),kt=Qe($e());function Qe(e){return e&&e.__esModule?e:{default:e}}var er=(0,Zt.default)("v3",48,kt.default),tr=er;J.default=tr});var Ze=y(z=>{"use strict";Object.defineProperty(z,"__esModule",{value:!0});z.default=void 0;var rr=nr(require("crypto"));function nr(e){return e&&e.__esModule?e:{default:e}}var ar={randomUUID:rr.default.randomUUID};z.default=ar});var tt=y(W=>{"use strict";Object.defineProperty(W,"__esModule",{value:!0});W.default=void 0;var ke=et(Ze()),ir=et(ne()),ur=E();function et(e){return e&&e.__esModule?e:{default:e}}function fr(e,i,f){if(ke.default.randomUUID&&!i&&!e)return ke.default.randomUUID();e=e||{};let r=e.random||(e.rng||ir.default)();if(r[6]=r[6]&15|64,r[8]=r[8]&63|128,i){f=f||0;for(let t=0;t<16;++t)i[f+t]=r[t];return i}return(0,ur.unsafeStringify)(r)}var or=fr;W.default=or});var rt=y(Y=>{"use strict";Object.defineProperty(Y,"__esModule",{value:!0});Y.default=void 0;var lr=cr(require("crypto"));function cr(e){return e&&e.__esModule?e:{default:e}}function sr(e){return Array.isArray(e)?e=Buffer.from(e):typeof e=="string"&&(e=Buffer.from(e,"utf8")),lr.default.createHash("sha1").update(e).digest()}var dr=sr;Y.default=dr});var at=y($=>{"use strict";Object.defineProperty($,"__esModule",{value:!0});$.default=void 0;var _r=nt(oe()),vr=nt(rt());function nt(e){return e&&e.__esModule?e:{default:e}}var yr=(0,_r.default)("v5",80,vr.default),pr=yr;$.default=pr});var it=y(Q=>{"use strict";Object.defineProperty(Q,"__esModule",{value:!0});Q.default=void 0;var hr="00000000-0000-0000-0000-000000000000";Q.default=hr});var ut=y(X=>{"use strict";Object.defineProperty(X,"__esModule",{value:!0});X.default=void 0;var gr=mr(j());function mr(e){return e&&e.__esModule?e:{default:e}}function wr(e){if(!(0,gr.default)(e))throw TypeError("Invalid UUID");return parseInt(e.slice(14,15),16)}var br=wr;X.default=br});var ft=y(m=>{"use strict";Object.defineProperty(m,"__esModule",{value:!0});Object.defineProperty(m,"NIL",{enumerable:!0,get:function(){return qr.default}});Object.defineProperty(m,"parse",{enumerable:!0,get:function(){return jr.default}});Object.defineProperty(m,"stringify",{enumerable:!0,get:function(){return Ir.default}});Object.defineProperty(m,"v1",{enumerable:!0,get:function(){return Or.default}});Object.defineProperty(m,"v3",{enumerable:!0,get:function(){return Pr.default}});Object.defineProperty(m,"v4",{enumerable:!0,get:function(){return Mr.default}});Object.defineProperty(m,"v5",{enumerable:!0,get:function(){return Sr.default}});Object.defineProperty(m,"validate",{enumerable:!0,get:function(){return Dr.default}});Object.defineProperty(m,"version",{enumerable:!0,get:function(){return xr.default}});var Or=O(ze()),Pr=O(Xe()),Mr=O(tt()),Sr=O(at()),qr=O(it()),xr=O(ut()),Dr=O(j()),Ir=O(E()),jr=O(fe());function O(e){return e&&e.__esModule?e:{default:e}}});var Nr={};pt(Nr,{default:()=>Cr});module.exports=ht(Nr);var ct=Z(_e());var Le=Z(Be(),1),{__extends:Hr,__assign:Kr,__rest:Vr,__decorate:Jr,__param:zr,__esDecorate:Wr,__runInitializers:Yr,__propKey:$r,__setFunctionName:Qr,__metadata:Xr,__awaiter:Ge,__generator:He,__exportStar:Zr,__createBinding:kr,__values:en,__read:tn,__spread:rn,__spreadArrays:nn,__spreadArray:an,__await:un,__asyncGenerator:fn,__asyncDelegator:on,__asyncValues:ln,__makeTemplateObject:cn,__importStar:sn,__importDefault:dn,__classPrivateFieldGet:_n,__classPrivateFieldSet:vn,__classPrivateFieldIn:yn}=Le.default;var le=require("aws-sdk");var b=Z(ft(),1),ot=b.default.v1,Rn=b.default.v3,An=b.default.v4,Un=b.default.v5,Cn=b.default.NIL,Nn=b.default.version,Fn=b.default.validate,Bn=b.default.stringify,Ln=b.default.parse;var Tr=new le.DynamoDB({apiVersion:"2012-08-10",region:process.env.AWS_REGION}),Er=process.env.TABLE_NAME,Rr=process.env.API_KEY,Ar=function(e){return Ge(void 0,void 0,void 0,function(){var i,f,r,t;return He(this,function(n){switch(n.label){case 0:return e.headers.authorization!==Rr?[2,{statusCode:401}]:(i=JSON.parse(e.body||"{}"),(i==null?void 0:i.message)===void 0||(i==null?void 0:i.audience)===void 0?[2,{statusCode:400,body:JSON.stringify({error:"must have 'message' and 'audience' properties in the body"}),headers:{"Content-Type":"application/json"}}]:((r=i.audience)===null||r===void 0?void 0:r.userId)===void 0&&((t=i.audience)===null||t===void 0?void 0:t.groupId)===void 0?[2,{statusCode:400,body:JSON.stringify({error:"audience property must have 'userId' or 'groupId'"}),headers:{"Content-Type":"application/json"}}]:(f=ot(),[4,Tr.putItem({TableName:Er,Item:le.DynamoDB.Converter.marshall({messageId:f,message:i.message,audience:i.audience})}).promise()]));case 1:return n.sent(),[2,{statusCode:200,body:JSON.stringify({messageId:f}),headers:{"Content-Type":"application/json"}}]}})})},lt=Ar;var Ur=(0,ct.getMiddlewareHandler)(lt,[]),Cr=Ur;0&&(module.exports={});
