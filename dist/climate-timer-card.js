function t(t,e,i,s){var r,n=arguments.length,o=n<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(o=(n<3?r(o):n>3?r(e,i,o):r(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),r=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:u,getPrototypeOf:p}=Object,_=globalThis,g=_.trustedTypes,f=g?g.emptyScript:"",m=_.reactiveElementPolyfillSupport,v=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},$=(t,e)=>!l(t,e),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:$};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let E=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:r}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const n=s?.call(this);r?.call(this,e),this.requestUpdate(t,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...d(t),...u(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),r=e.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const n=r.fromAttribute(e,t.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(t,e,i,s=!1,r){if(void 0!==t){const n=this.constructor;if(!1===s&&(r=this[t]),i??=n.getPropertyOptions(t),!((i.hasChanged??$)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:r},n){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),!0!==r||void 0!==n)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};E.elementStyles=[],E.shadowRootOptions={mode:"open"},E[v("elementProperties")]=new Map,E[v("finalized")]=new Map,m?.({ReactiveElement:E}),(_.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,A=t=>t,x=w.trustedTypes,C=x?x.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,R="?"+k,D=`<${R}>`,T=document,M=()=>T.createComment(""),I=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,P="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,O=/-->/g,z=/>/g,H=RegExp(`>|${P}(?:([^\\s"'>=/]+)(${P}*=${P}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,B=/"/g,L=/^(?:script|style|textarea|title)$/i,W=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),F=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),V=new WeakMap,Y=T.createTreeWalker(T,129);function G(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(e):e}const K=(t,e)=>{const i=t.length-1,s=[];let r,n=2===e?"<svg>":3===e?"<math>":"",o=N;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,h=0;for(;h<i.length&&(o.lastIndex=h,l=o.exec(i),null!==l);)h=o.lastIndex,o===N?"!--"===l[1]?o=O:void 0!==l[1]?o=z:void 0!==l[2]?(L.test(l[2])&&(r=RegExp("</"+l[2],"g")),o=H):void 0!==l[3]&&(o=H):o===H?">"===l[0]?(o=r??N,c=-1):void 0===l[1]?c=-2:(c=o.lastIndex-l[2].length,a=l[1],o=void 0===l[3]?H:'"'===l[3]?B:j):o===B||o===j?o=H:o===O||o===z?o=N:(o=H,r=void 0);const d=o===H&&t[e+1].startsWith("/>")?" ":"";n+=o===N?i+D:c>=0?(s.push(a),i.slice(0,c)+S+i.slice(c)+k+d):i+k+(-2===c?e:d)}return[G(t,n+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class X{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,n=0;const o=t.length-1,a=this.parts,[l,c]=K(t,e);if(this.el=X.createElement(l,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Y.nextNode())&&a.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=c[n++],i=s.getAttribute(t).split(k),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:o[2],strings:i,ctor:"."===o[1]?et:"?"===o[1]?it:"@"===o[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(k)&&(a.push({type:6,index:r}),s.removeAttribute(t));if(L.test(s.tagName)){const t=s.textContent.split(k),e=t.length-1;if(e>0){s.textContent=x?x.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],M()),Y.nextNode(),a.push({type:2,index:++r});s.append(t[e],M())}}}else if(8===s.nodeType)if(s.data===R)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf(k,t+1));)a.push({type:7,index:r}),t+=k.length-1}r++}}static createElement(t,e){const i=T.createElement("template");return i.innerHTML=t,i}}function J(t,e,i=t,s){if(e===F)return e;let r=void 0!==s?i._$Co?.[s]:i._$Cl;const n=I(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),void 0===n?r=void 0:(r=new n(t),r._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=r:i._$Cl=r),void 0!==r&&(e=J(t,r._$AS(t,e.values),r,s)),e}class Z{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??T).importNode(e,!0);Y.currentNode=s;let r=Y.nextNode(),n=0,o=0,a=i[0];for(;void 0!==a;){if(n===a.index){let e;2===a.type?e=new Q(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new rt(r,this,t)),this._$AV.push(e),a=i[++o]}n!==a?.index&&(r=Y.nextNode(),n++)}return Y.currentNode=T,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=J(this,t,e),I(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==F&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&I(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=X.createElement(G(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Z(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new X(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new Q(this.O(M()),this.O(M()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,r){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const r=this.strings;let n=!1;if(void 0===r)t=J(this,t,e,0),n=!I(t)||t!==this._$AH&&t!==F,n&&(this._$AH=t);else{const s=t;let o,a;for(t=r[0],o=0;o<r.length-1;o++)a=J(this,s[i+o],e,o),a===F&&(a=this._$AH[o]),n||=!I(a)||a!==this._$AH[o],a===q?t=q:t!==q&&(t+=(a??"")+r[o+1]),this._$AH[o]=a}n&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class st extends tt{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){if((t=J(this,t,e,0)??q)===F)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){J(this,t)}}const nt=w.litHtmlPolyfillSupport;nt?.(X,Q),(w.litHtmlVersions??=[]).push("3.3.3");const ot=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class at extends E{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let r=s._$litPart$;if(void 0===r){const t=i?.renderBefore??null;s._$litPart$=r=new Q(e.insertBefore(M(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}}at._$litElement$=!0,at.finalized=!0,ot.litElementHydrateSupport?.({LitElement:at});const lt=ot.litElementPolyfillSupport;lt?.({LitElement:at}),(ot.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ct=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ht={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:$},dt=(t=ht,e,i)=>{const{kind:s,metadata:r}=i;let n=globalThis.litPropertyMetadata.get(r);if(void 0===n&&globalThis.litPropertyMetadata.set(r,n=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),n.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,r,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const r=this[s];e.call(this,i),this.requestUpdate(s,r,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ut(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function pt(t){return ut({...t,state:!0,attribute:!1})}const _t=240,gt=15;function ft(t){if(!t||"string"!=typeof t)return null;const e=t.trim().toLowerCase();if(!e)return null;const i=e.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/);if(!i)return null;const s=i[1]?parseInt(i[1],10):0,r=i[2]?parseInt(i[2],10):0;if(0===s&&0===r&&!i[1]&&!i[2])return null;const n=60*s+r;return n>0?n:null}function mt(t,e,i=240,s=15){return function(t,e=240,i=15){const s=i,r=Math.round(t/i)*i;return Math.max(s,Math.min(e,r))}(t+("up"===e?s:-s),i,s)}function vt(t){const e=Math.floor(t/1e3),i=Math.floor(e/60),s=e%60;return`${String(i).padStart(2,"0")}:${String(s).padStart(2,"0")}`}function yt(t){return Math.max(0,Date.parse(t)-Date.now())}function $t(t,e){const i=function(t){const e=t.split(":");return 1e3*(3600*(parseInt(e[0],10)||0)+60*(parseInt(e[1],10)||0)+(parseInt(e[2],10)||0))}(e);if(0===i)return 1;const s=(i-Math.max(0,Date.parse(t)-Date.now()))/i;return Math.max(0,Math.min(1,s))}var bt;let Et=bt=class extends at{constructor(){super(...arguments),this.duration=30,this.disabled=!1,this.maxDuration=_t,this.stepSize=gt,this.finishesAt=null,this.durationStr="00:30:00",this.timerActive=!1,this._tick=0,this._intervalId=null,this._isDragging=!1,this._lastAngle=null,this._accumulatedRotation=0,this._touchStartY=null}updated(t){super.updated(t),t.has("timerActive")&&(this.timerActive?this._startInterval():this._stopInterval())}disconnectedCallback(){super.disconnectedCallback(),this._stopInterval()}connectedCallback(){super.connectedCallback(),this.timerActive&&this._startInterval()}_startInterval(){this._stopInterval(),this._intervalId=window.setInterval(()=>{this._tick++},1e3)}_stopInterval(){null!==this._intervalId&&(window.clearInterval(this._intervalId),this._intervalId=null)}render(){return this.timerActive&&this.finishesAt?this._renderCountdown():this._renderSelector()}_renderCountdown(){this._tick;const t=yt(this.finishesAt),e=$t(this.finishesAt,this.durationStr),i=vt(t),s=bt.CIRCUMFERENCE,r=s*(1-e);return W`
      <div class="dial-container">
        <div class="dial-wrapper active">
          <svg class="dial-svg" viewBox="0 0 180 180">
            <!-- Tick marks -->
            ${this._renderTicks()}

            <!-- Background track (full ring, dim) -->
            <circle
              class="dial-track"
              cx="${bt.CENTER}"
              cy="${bt.CENTER}"
              r="${bt.RADIUS}"
            />

            <!-- Remaining time arc (blue, transparent - shows full ring as base) -->
            <circle
              class="dial-remaining"
              cx="${bt.CENTER}"
              cy="${bt.CENTER}"
              r="${bt.RADIUS}"
              stroke-dasharray="${s}"
              stroke-dashoffset="0"
              transform="rotate(-90 ${bt.CENTER} ${bt.CENTER})"
            />

            <!-- Elapsed time arc (orange, animated - grows as time passes) -->
            <circle
              class="dial-elapsed"
              cx="${bt.CENTER}"
              cy="${bt.CENTER}"
              r="${bt.RADIUS}"
              stroke-dasharray="${s}"
              stroke-dashoffset="${r}"
              transform="rotate(-90 ${bt.CENTER} ${bt.CENTER})"
            />
          </svg>

          <!-- Center: countdown time -->
          <div class="dial-center">
            <span class="countdown-text">${i}</span>
            <span class="countdown-label">remaining</span>
          </div>
        </div>
      </div>
    `}_renderSelector(){const t=this.stepSize,e=(this.duration-t)/(this.maxDuration-t),i=bt.CIRCUMFERENCE,s=i*(1-e),r=(360*e-90)*Math.PI/180,n=bt.CENTER+bt.RADIUS*Math.cos(r),o=bt.CENTER+bt.RADIUS*Math.sin(r);return W`
      <div class="dial-container ${this.disabled?"disabled":""}">
        <div
          class="dial-wrapper"
          @mousedown=${this._handlePointerDown}
          @mousemove=${this._handlePointerMove}
          @mouseup=${this._handlePointerUp}
          @mouseleave=${this._handlePointerUp}
          @touchstart=${this._handleTouchDown}
          @touchmove=${this._handleTouchMove}
          @touchend=${this._handlePointerUp}
          @wheel=${this._handleWheel}
        >
          <svg class="dial-svg" viewBox="0 0 180 180">
            ${this._renderTicks()}

            <circle
              class="dial-track"
              cx="${bt.CENTER}"
              cy="${bt.CENTER}"
              r="${bt.RADIUS}"
            />

            <circle
              class="dial-fill"
              cx="${bt.CENTER}"
              cy="${bt.CENTER}"
              r="${bt.RADIUS}"
              stroke-dasharray="${i}"
              stroke-dashoffset="${s}"
              transform="rotate(-90 ${bt.CENTER} ${bt.CENTER})"
            />

            <circle
              class="dial-knob"
              cx="${n}"
              cy="${o}"
              r="8"
            />
          </svg>

          <div class="dial-center">
            <span class="duration-text">${a=this.duration,a<60?`${a}m`:`${Math.floor(a/60)}h ${a%60}m`}</span>
            <span class="duration-label">duration</span>
          </div>
        </div>
      </div>
    `;var a}_renderTicks(){const t=[];for(let e=0;e<24;e++){const i=(360*e/24-90)*Math.PI/180,s=e%6==0,r=s?52:56,n=62,o=bt.CENTER+r*Math.cos(i),a=bt.CENTER+r*Math.sin(i),l=bt.CENTER+n*Math.cos(i),c=bt.CENTER+n*Math.sin(i);t.push(W`<line class="tick ${s?"major":""}" x1="${o}" y1="${a}" x2="${l}" y2="${c}" />`)}return t}_getAngle(t){const e=this.shadowRoot.querySelector(".dial-wrapper").getBoundingClientRect(),i=e.left+e.width/2,s=e.top+e.height/2,r=t.clientX-i,n=t.clientY-s;return Math.atan2(n,r)*(180/Math.PI)}_handlePointerDown(t){this.disabled||(this._isDragging=!0,this._lastAngle=this._getAngle(t),this._accumulatedRotation=0)}_handlePointerMove(t){if(this.disabled||!this._isDragging||null===this._lastAngle)return;const e=this._getAngle(t);let i=e-this._lastAngle;i>180&&(i-=360),i<-180&&(i+=360),this._accumulatedRotation+=i,this._lastAngle=e;const s=bt.DEGREES_PER_STEP;for(;this._accumulatedRotation>=s;){this._accumulatedRotation-=s;const t=mt(this.duration,"up",this.maxDuration,this.stepSize);t!==this.duration&&this._fireDurationChanged(t)}for(;this._accumulatedRotation<=-s;){this._accumulatedRotation+=s;const t=mt(this.duration,"down",this.maxDuration,this.stepSize);t!==this.duration&&this._fireDurationChanged(t)}}_handlePointerUp(){this._isDragging=!1,this._lastAngle=null,this._accumulatedRotation=0}_handleTouchDown(t){this.disabled||0===t.touches.length||(this._isDragging=!0,this._lastAngle=this._getAngle(t.touches[0]),this._accumulatedRotation=0,this._touchStartY=t.touches[0].clientY)}_handleTouchMove(t){if(this.disabled||!this._isDragging||0===t.touches.length)return;t.preventDefault();const e=t.touches[0],i=this._getAngle(e);if(null===this._lastAngle)return void(this._lastAngle=i);let s=i-this._lastAngle;s>180&&(s-=360),s<-180&&(s+=360),this._accumulatedRotation+=s,this._lastAngle=i;const r=bt.DEGREES_PER_STEP;for(;this._accumulatedRotation>=r;){this._accumulatedRotation-=r;const t=mt(this.duration,"up",this.maxDuration,this.stepSize);t!==this.duration&&this._fireDurationChanged(t)}for(;this._accumulatedRotation<=-r;){this._accumulatedRotation+=r;const t=mt(this.duration,"down",this.maxDuration,this.stepSize);t!==this.duration&&this._fireDurationChanged(t)}}_handleWheel(t){if(this.disabled)return;t.preventDefault();const e=t.deltaY<0?"up":"down",i=mt(this.duration,e,this.maxDuration,this.stepSize);i!==this.duration&&this._fireDurationChanged(i)}_fireDurationChanged(t){this.dispatchEvent(new CustomEvent("duration-changed",{detail:{duration:t},bubbles:!0,composed:!0}))}};var wt;Et.MIN_DURATION=gt,Et.MAX_DURATION=_t,Et.STEP=gt,Et.DEGREES_PER_STEP=15,Et.styles=o`
    :host {
      display: block;
      user-select: none;
      -webkit-user-select: none;
    }

    .dial-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      touch-action: none;
    }

    .dial-container.disabled {
      pointer-events: none;
    }

    .dial-wrapper {
      position: relative;
      width: 180px;
      height: 180px;
      cursor: grab;
    }

    .dial-wrapper.active {
      cursor: default;
    }

    .dial-wrapper:active {
      cursor: grabbing;
    }

    .dial-wrapper.active:active {
      cursor: default;
    }

    .dial-svg {
      width: 100%;
      height: 100%;
    }

    /* Outer ring track */
    .dial-track {
      fill: none;
      stroke: var(--divider-color, rgba(0, 0, 0, 0.12));
      stroke-width: 8;
    }

    /* Filled arc showing current value proportion (idle mode) */
    .dial-fill {
      fill: none;
      stroke: var(--primary-color, #03a9f4);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.15s ease;
    }

    /* Elapsed time arc (active mode) - grows clockwise as time passes */
    .dial-elapsed {
      fill: none;
      stroke: var(--warning-color, #ff9800);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }

    /* Remaining time arc (active mode) - shrinks as time passes */
    .dial-remaining {
      fill: none;
      stroke: var(--primary-color, #03a9f4);
      stroke-width: 8;
      stroke-linecap: round;
      opacity: 0.3;
    }

    /* Tick marks around the dial */
    .tick {
      stroke: var(--secondary-text-color, #666);
      stroke-width: 1.5;
      opacity: 0.4;
    }

    .tick.major {
      stroke-width: 2;
      opacity: 0.7;
    }

    /* Knob/grip indicator */
    .dial-knob {
      fill: var(--primary-color, #03a9f4);
      filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
      transition: transform 0.15s ease;
    }

    /* Center display */
    .dial-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .duration-text {
      font-size: 1.8rem;
      font-weight: 600;
      color: var(--primary-text-color, #333);
      line-height: 1.2;
    }

    .countdown-text {
      font-size: 2rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color, #333);
      line-height: 1.2;
    }

    .duration-label {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #666);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    .countdown-label {
      font-size: 0.7rem;
      color: var(--warning-color, #ff9800);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
      font-weight: 500;
    }

    /* Rotation hint */
    .hint {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #666);
      margin-top: 8px;
      opacity: 0.6;
    }
  `,Et.RADIUS=70,Et.CENTER=90,Et.CIRCUMFERENCE=2*Math.PI*70,t([ut({type:Number})],Et.prototype,"duration",void 0),t([ut({type:Boolean})],Et.prototype,"disabled",void 0),t([ut({type:Number,attribute:"max-duration"})],Et.prototype,"maxDuration",void 0),t([ut({type:Number,attribute:"step-size"})],Et.prototype,"stepSize",void 0),t([ut({type:String,attribute:"finishes-at"})],Et.prototype,"finishesAt",void 0),t([ut({type:String,attribute:"duration-str"})],Et.prototype,"durationStr",void 0),t([ut({type:Boolean,attribute:"timer-active"})],Et.prototype,"timerActive",void 0),t([pt()],Et.prototype,"_tick",void 0),Et=bt=t([ct("timer-selector")],Et);let At=wt=class extends at{constructor(){super(...arguments),this.finishesAt=null,this.durationStr="00:30:00",this.active=!1}render(){if(!this.active||!this.finishesAt)return q;const t=yt(this.finishesAt),e=$t(this.finishesAt,this.durationStr),i=vt(t),s=wt.CIRCUMFERENCE,r=s*(1-e);return W`
      <div class="timer-display">
        <svg class="progress-ring" viewBox="0 0 100 100">
          <circle
            class="progress-ring__background"
            cx="50"
            cy="50"
            r="${wt.RADIUS}"
          />
          <circle
            class="progress-ring__progress"
            cx="50"
            cy="50"
            r="${wt.RADIUS}"
            stroke-dasharray="${s}"
            stroke-dashoffset="${r}"
          />
        </svg>
        <span class="countdown-text">${i}</span>
      </div>
    `}};At.RADIUS=44,At.CIRCUMFERENCE=2*Math.PI*wt.RADIUS,At.styles=o`
    :host {
      display: block;
    }

    .timer-display {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      max-width: 200px;
      margin: 0 auto;
    }

    .progress-ring {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .progress-ring__background {
      fill: none;
      stroke: var(--divider-color, rgba(0, 0, 0, 0.12));
      stroke-width: 4;
    }

    .progress-ring__progress {
      fill: none;
      stroke: var(--primary-color, #03a9f4);
      stroke-width: 4;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }

    .countdown-text {
      font-size: 2rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color, #212121);
      z-index: 1;
    }

    .hidden {
      display: none;
    }
  `,t([ut({type:String,attribute:"finishes-at"})],At.prototype,"finishesAt",void 0),t([ut({type:String,attribute:"duration-str"})],At.prototype,"durationStr",void 0),t([ut({type:Boolean})],At.prototype,"active",void 0),At=wt=t([ct("timer-display")],At);let xt=class extends at{constructor(){super(...arguments),this._selectedDuration=30,this._errorMessage=null,this._displayIntervalId=null}static getConfigElement(){return document.createElement("climate-timer-card-editor")}static getStubConfig(){return{type:"custom:climate-timer-card",entity:"",timer_entity:""}}setConfig(t){if(!t.entity||!t.timer_entity)throw new Error("Please define entity and timer_entity in the card configuration.");this._config=t}getCardSize(){return 3}getLayoutOptions(){return{grid_columns:2,grid_min_columns:2,grid_rows:3,grid_min_rows:2}}get _isTimerActive(){return"active"===this.hass?.states[this._config?.timer_entity]?.state}get _timerFinishesAt(){return this.hass?.states[this._config?.timer_entity]?.attributes?.finishes_at??null}get _timerDuration(){return this.hass?.states[this._config?.timer_entity]?.attributes?.duration??"00:30:00"}get _isClimateUnavailable(){const t=this._climateState;return"unavailable"===t||void 0===t}get _isTimerUnavailable(){const t=this.hass?.states[this._config?.timer_entity];return!t||"unavailable"===t.state}get _climateFriendlyName(){return this.hass?.states[this._config?.entity]?.attributes?.friendly_name||this._config?.entity||"Climate"}get _climateState(){return this.hass?.states[this._config?.entity]?.state}get _configMaxDuration(){if(this._config?.max_duration){const t=ft(this._config.max_duration);if(null!==t)return t}return _t}get _configStep(){if(this._config?.step){const t=ft(this._config.step);if(null!==t)return t}return gt}disconnectedCallback(){super.disconnectedCallback(),this._stopDisplayInterval()}connectedCallback(){super.connectedCallback(),this._isTimerActive&&this._startDisplayInterval()}updated(t){super.updated(t);const e=this.hass?.states[this._config?.timer_entity]?.state;this._previousTimerState!==e&&("active"===e&&"active"!==this._previousTimerState?this._startDisplayInterval():"active"!==e&&"active"===this._previousTimerState&&this._stopDisplayInterval(),this._previousTimerState=e);const i=this.hass?.states[this._config?.entity]?.state;this._previousClimateState!==i&&(this._isTimerActive&&"off"===i&&"off"!==this._previousClimateState&&this._handleExternalClimateOff(),!this._isTimerActive||"unavailable"!==i&&i||"unavailable"===this._previousClimateState||void 0===this._previousClimateState||this._handleClimateUnavailableDuringCountdown(),this._previousClimateState=i)}_handleExternalClimateOff(){this.hass&&this._config?.timer_entity&&(this.hass.callService("timer","cancel",{},{entity_id:this._config.timer_entity}).catch(()=>{}),this._stopDisplayInterval())}_handleClimateUnavailableDuringCountdown(){this.hass&&this._config?.timer_entity&&(this._stopDisplayInterval(),this.hass.callService("timer","cancel",{},{entity_id:this._config.timer_entity}).catch(()=>{}))}_startDisplayInterval(){this._stopDisplayInterval(),this._displayIntervalId=window.setInterval(()=>{this.requestUpdate()},1e3)}_stopDisplayInterval(){null!==this._displayIntervalId&&(window.clearInterval(this._displayIntervalId),this._displayIntervalId=null)}async _handleStart(){this._errorMessage=null;try{await this.hass.callService("climate","turn_on",{},{entity_id:this._config.entity})}catch(t){return void this._showError("Failed to turn on climate entity")}try{const t=function(t){const e=Math.max(0,Math.floor(t)),i=Math.floor(e/60),s=e%60;return`${String(i).padStart(2,"0")}:${String(s).padStart(2,"0")}:00`}(this._selectedDuration);await this.hass.callService("timer","start",{duration:t},{entity_id:this._config.timer_entity})}catch(t){try{await this.hass.callService("climate","turn_off",{},{entity_id:this._config.entity})}catch{}this._showError("Failed to start timer")}}async _handleCancel(){this._errorMessage=null;try{await this.hass.callService("timer","cancel",{},{entity_id:this._config.timer_entity})}catch(t){this._showError("Failed to cancel timer")}try{await this.hass.callService("climate","turn_off",{},{entity_id:this._config.entity})}catch(t){this._showError("Failed to turn off climate entity")}}_showError(t){this._errorMessage=t,setTimeout(()=>{this._errorMessage=null},5e3)}_handleDurationChange(t){this._selectedDuration=t.detail.duration}render(){if(!this._config)return q;if(!this._config.entity||!this._config.timer_entity)return W`
        <ha-card>
          <div class="config-message">
            Select a climate entity and timer helper to configure this card.
          </div>
        </ha-card>
      `;const t=this._config.entity.startsWith("climate."),e=this._config.timer_entity.startsWith("timer.");return t&&e?W`
      <ha-card>
        <div class="card-content" style="padding-top: ${!1!==this._config.show_name||!1!==this._config.show_state?"16px":"0"}">
          ${!1!==this._config.show_name||!1!==this._config.show_state?W`<div class="header">
                ${!1!==this._config.show_name?W`<div class="entity-name">${this._climateFriendlyName}</div>`:q}
                ${!1!==this._config.show_state?W`<div class="entity-state">${this._climateState??""}</div>`:q}
              </div>`:q}

          <timer-selector
            .duration=${this._selectedDuration}
            .disabled=${this._isTimerActive}
            .maxDuration=${this._configMaxDuration}
            .stepSize=${this._configStep}
            .finishesAt=${this._timerFinishesAt}
            .durationStr=${this._timerDuration}
            .timerActive=${this._isTimerActive}
            @duration-changed=${this._handleDurationChange}
          ></timer-selector>

          ${this._errorMessage?W`<div class="error">${this._errorMessage}</div>`:q}

          ${this._isTimerActive?W`
                <button class="cancel-btn" @click=${this._handleCancel}>
                  Cancel
                </button>
              `:W`
                <button
                  class="start-btn"
                  @click=${this._handleStart}
                  ?disabled=${this._isClimateUnavailable||this._isTimerUnavailable}
                >
                  Start
                </button>
              `}

          ${this._isClimateUnavailable?W`<div class="unavailable">Entity unavailable</div>`:q}
        </div>
      </ha-card>
    `:W`
        <ha-card>
          <div class="card-content">
            <div class="error">
              ${t?q:W`<div>Invalid entity: ${this._config.entity} is not a climate entity.</div>`}
              ${e?q:W`<div>Invalid timer entity: ${this._config.timer_entity} is not a timer entity.</div>`}
            </div>
          </div>
        </ha-card>
      `}};xt.styles=o`
    :host {
      display: block;
    }

    .card-content {
      padding: 0 16px 16px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .header {
      text-align: center;
      width: 100%;
      margin-bottom: 12px;
    }

    .entity-name {
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .entity-state {
      font-size: 0.85rem;
      color: var(--secondary-text-color);
      text-transform: capitalize;
    }

    .start-btn {
      padding: 12px 32px;
      background: var(--primary-color, #03a9f4);
      color: white;
      border-radius: 24px;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 12px;
    }

    .start-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .cancel-btn {
      padding: 12px 32px;
      background: var(--error-color, #db4437);
      color: white;
      border-radius: 24px;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 12px;
    }

    .error {
      color: var(--error-color);
      font-size: 0.85rem;
      text-align: center;
    }

    .unavailable {
      font-size: 0.8rem;
      color: var(--error-color);
      text-align: center;
    }

    .config-message {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.9rem;
    }
  `,t([ut({attribute:!1})],xt.prototype,"hass",void 0),t([pt()],xt.prototype,"_config",void 0),t([pt()],xt.prototype,"_selectedDuration",void 0),t([pt()],xt.prototype,"_errorMessage",void 0),xt=t([ct("climate-timer-card")],xt);let Ct=class extends at{setConfig(t){this._config={...t}}render(){if(!this.hass||!this._config)return W``;const t=(e=this.hass.states,Object.keys(e).filter(t=>t.startsWith("climate.")));var e;const i=function(t){return Object.keys(t).filter(t=>t.startsWith("timer."))}(this.hass.states),s=this._getEntityError(),r=this._getTimerEntityError();return W`
      <div class="editor-row">
        <label for="entity">Climate Entity</label>
        <select
          id="entity"
          .value=${this._config.entity||""}
          @change=${this._entityChanged}
        >
          <option value="">-- Select climate entity --</option>
          ${t.map(t=>W`
              <option
                value=${t}
                ?selected=${t===this._config.entity}
              >
                ${this.hass.states[t]?.attributes?.friendly_name||t}
              </option>
            `)}
        </select>
        ${s?W`<span class="error">${s}</span>`:""}
      </div>

      <div class="editor-row">
        <label for="timer_entity">Timer Entity</label>
        <select
          id="timer_entity"
          .value=${this._config.timer_entity||""}
          @change=${this._timerEntityChanged}
        >
          <option value="">-- Select timer entity --</option>
          ${i.map(t=>W`
              <option
                value=${t}
                ?selected=${t===this._config.timer_entity}
              >
                ${this.hass.states[t]?.attributes?.friendly_name||t}
              </option>
            `)}
        </select>
        ${r?W`<span class="error">${r}</span>`:""}
      </div>

      <div class="editor-row">
        <label for="max_duration">Max Duration</label>
        <input
          id="max_duration"
          type="text"
          .value=${this._config.max_duration||"4h"}
          @change=${this._maxDurationChanged}
          placeholder="4h"
        />
        <span class="help-text">e.g. "4h", "240m", "2h30m"</span>
      </div>

      <div class="editor-row">
        <label for="step">Step</label>
        <input
          id="step"
          type="text"
          .value=${this._config.step||"15m"}
          @change=${this._stepChanged}
          placeholder="15m"
        />
        <span class="help-text">e.g. "15m", "30m", "1h"</span>
      </div>

      <div class="toggle-row">
        <label>Show Name</label>
        <label class="toggle-switch">
          <input
            type="checkbox"
            .checked=${!1!==this._config.show_name}
            @change=${this._showNameChanged}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="toggle-row">
        <label>Show State</label>
        <label class="toggle-switch">
          <input
            type="checkbox"
            .checked=${!1!==this._config.show_state}
            @change=${this._showStateChanged}
          />
          <span class="toggle-slider"></span>
        </label>
      </div>

      ${this._getDurationConfigError()?W`<div class="editor-row"><span class="error">${this._getDurationConfigError()}</span></div>`:""}
    `}_getEntityError(){const t=this._config.entity;return t?this.hass.states[t]?t.startsWith("climate.")?null:`Entity "${t}" is not a climate domain entity`:`Entity "${t}" not found`:null}_getTimerEntityError(){const t=this._config.timer_entity;return t?this.hass.states[t]?t.startsWith("timer.")?null:`Entity "${t}" is not a timer domain entity`:`Entity "${t}" not found`:null}_entityChanged(t){const e=t.target.value;this._config={...this._config,entity:e},this._fireConfigChanged()}_timerEntityChanged(t){const e=t.target.value;this._config={...this._config,timer_entity:e},this._fireConfigChanged()}_maxDurationChanged(t){const e=t.target;this._config={...this._config,max_duration:e.value.trim()},this._fireConfigChanged()}_stepChanged(t){const e=t.target;this._config={...this._config,step:e.value.trim()},this._fireConfigChanged()}_showNameChanged(t){const e=t.target;this._config={...this._config,show_name:e.checked},this._fireConfigChanged()}_showStateChanged(t){const e=t.target;this._config={...this._config,show_state:e.checked},this._fireConfigChanged()}_getDurationConfigError(){return function(t,e){const i=ft(t);if(null===i)return`Invalid max duration "${t}". Use format like "4h" or "240m"`;const s=ft(e);return null===s?`Invalid step "${e}". Use format like "15m" or "1h"`:s>i?`Step (${e}) must not exceed max duration (${t})`:i<5?"Max duration must be at least 5m":s<1?"Step must be at least 1m":i>1440?"Max duration cannot exceed 24h":null}(this._config.max_duration||"4h",this._config.step||"15m")}_fireConfigChanged(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{...this._config}},bubbles:!0,composed:!0}))}};Ct.styles=o`
    :host {
      display: block;
    }

    .editor-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
    }

    label {
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--primary-text-color, #333);
    }

    select {
      padding: 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #333);
      font-size: 1rem;
    }

    .error {
      color: var(--error-color, #db4437);
      font-size: 0.85rem;
      margin-top: 4px;
    }

    input {
      padding: 8px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 4px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #333);
      font-size: 1rem;
      width: 100px;
    }

    .help-text {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #666);
      margin-top: 2px;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .toggle-row label {
      margin-bottom: 0;
    }

    .toggle-switch {
      position: relative;
      width: 40px;
      height: 22px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: var(--divider-color, #ccc);
      border-radius: 22px;
      transition: background 0.2s;
    }

    .toggle-slider::before {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background: var(--primary-color, #03a9f4);
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(18px);
    }
  `,t([ut({attribute:!1})],Ct.prototype,"hass",void 0),t([pt()],Ct.prototype,"_config",void 0),Ct=t([ct("climate-timer-card-editor")],Ct),window.customCards=window.customCards||[],window.customCards.push({type:"climate-timer-card",name:"Climate Timer Card",description:"A timer-based climate entity controller that automatically turns off after a set duration.",preview:!1});
