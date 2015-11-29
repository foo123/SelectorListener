// adapted from https://github.com/csuwildcat/SelectorListener
// https://github.com/foo123/SelectorListener
!function( ){
"use strict";

if ( !!window.SelectorListener ) return;

var events = {},
    selectors = {},
    // IE does not work with layout-color: initial, use explicit values
    anim = '{from {outline-color:#fff;} to {outline-color:#000;}}',
    anim_dur = '0.001s',
    exists_re = /::?exists\b/gi,
    added_re = /::?added\b/gi,
    styles = document.createElement('style'),
    keyframes = document.createElement('style'),
    head = document.getElementsByTagName('head')[0],
    startNames = ['animationstart', 'oAnimationStart', 'MSAnimationStart', 'webkitAnimationStart'],
    startEvent = function(event){
        var el = event.target,
            key = event.animationName,
            evt = events[key] || {};
        event.selector = evt.selector;
        //if ( evt.created && !!el.getAttribute('__existing__') ) return;
        ((this.selectorListeners || {})[key] || []).forEach(function(fn){
            fn.call(/*this*/el, event);
        });
        // add a small delay
        //setTimeout(function(){
            el._decorateDom('__existing__', 1);
        //}, 10);
    },
    prefix = (function() {
        var duration = 'animation-duration: '+anim_dur+';',
            name = 'animation-name: SelectorListener !important;',
            computed = window.getComputedStyle(document.documentElement, ''),
            pre = (Array.prototype.slice.call(computed).join('').match(/moz|webkit|ms/)||(computed.OLink===''&&['o']))[0];
        return {
            css: '-' + pre + '-',
            properties: '{' + duration + name + '-' + pre + '-' + duration + '-' + pre + '-' + name + '}',
            keyframes: !!(window.CSSKeyframesRule || window[('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1] + 'CSSKeyframesRule'])
        };
    })();
    
styles.type = keyframes.type = "text/css";
head.appendChild(styles);
head.appendChild(keyframes);

HTMLDocument.prototype._decorateDom = function( prop, val ) {
    var el = this, attr, child, l, i;
    el = el.getElementsByTagName('body')[0];
    if ( 1 !== el.nodeType ) return el;
    attr = el.getAttribute( prop );
    if ( !attr || val !== attr )
    {
        el.setAttribute( prop, val );
        child = el.childNodes;
        for(i=0,l=child.length; i<l; i++) (1 === child[i].nodeType) && child[i]._decorateDom( prop, val );
    }
    return el;
};
HTMLElement.prototype._decorateDom = function( prop, val ) {
    var el = this, attr, child, l, i;
    if ( 1 !== el.nodeType ) return el;
    attr = el.getAttribute( prop );
    if ( !attr || val !== attr )
    {
        el.setAttribute( prop, val );
        child = el.childNodes;
        for(i=0,l=child.length; i<l; i++) (1 === child[i].nodeType) && child[i]._decorateDom( prop, val );
    }
    return el;
};
HTMLDocument.prototype.addSelectorListener = HTMLElement.prototype.addSelectorListener = function( selector, fn ){
    if ( !selector || 'function' !== typeof fn ) return;
    
    var sel = selector.replace(exists_re, '[__existing__]').replace(added_re, ':not([__existing__])'),
        key = selectors[sel],
        listeners = this.selectorListeners = this.selectorListeners || {};
        
    if ( key ) events[key].count++;
    else
    {
        key = selectors[sel] = 'SelectorListener-' + new Date().getTime();
        var node = document.createTextNode('@'+(prefix.keyframes?prefix.css:'')+'keyframes '+key+' '+anim);
        keyframes.appendChild(node);
        styles.sheet.insertRule(sel + prefix.properties.replace(/SelectorListener/g, key), 0);
        events[key] = { count: 1, selector: selector, keyframe: node, rule: styles.sheet.cssRules[0] };
    } 
    
    if ( listeners.count ) listeners.count++;
    else
    {
        this._decorateDom( '__existing__', 1 );
        listeners.count = 1;
        startNames.forEach(function(name){
            this.addEventListener(name, startEvent, false);
        }, this);
    }
    (listeners[key] = listeners[key] || []).push(fn);
};
HTMLDocument.prototype.removeSelectorListener = HTMLElement.prototype.removeSelectorListener = function( selector, fn ){
    if ( !selector ) return;
    
    var sel = selector.replace(exists_re, '[__existing__]').replace(added_re, ':not([__existing__])');
    
    if ( !selectors.hasOwnProperty(sel) ) return;
    
    var listeners = this.selectorListeners || {},
        key = selectors[sel],
        listener = listeners[key] || [],
        event = events[ key ];
        
    if ( 'function' === typeof fn )
    {
        var index = listener.indexOf( fn );
        if ( -1 < index )
        {
            event.count--;
            if ( !event.count )
            {
                styles.sheet.deleteRule(styles.sheet.cssRules.item(event.rule));
                keyframes.removeChild(event.keyframe);
                delete events[key];
                delete selectors[sel];
                delete listeners[key];
            }
            
            listeners.count--;
            listener.splice( index, 1 );
            if ( !listeners.count )
                startNames.forEach(function(name) {
                    this.removeEventListener(name, startEvent, false);
                }, this);
        }
    }
    else if ( arguments.length < 2 ) // remove all
    {
        styles.sheet.deleteRule(styles.sheet.cssRules.item(event.rule));
        keyframes.removeChild(event.keyframe);
        delete events[key];
        delete selectors[sel];
        if ( listeners.hasOwnProperty(key) ) delete listeners[key];
        
        listeners.count--;
        if ( !listeners.count )
            startNames.forEach(function(name) {
                this.removeEventListener(name, startEvent, false);
            }, this);
    }
};

window.SelectorListener = {
    
    VERSION: '1.0',
    
    jquery: function( $ ) {
        if ( 'function' === typeof $.fn.onSelector ) return;
        $.fn.onSelector = function( sel, fn ) {
            if ( !!sel && 'function' === typeof fn )
            {
                this.each(function( ){
                    this.addSelectorListener( sel, fn );
                });
            }
            return this;
        };
        $.fn.offSelector = function( sel, fn ) {
            if ( 'function' === typeof fn )
            {
                this.each(function( ){
                    this.removeSelectorListener( sel, fn );
                });
            }
            else
            {
                this.each(function( ){
                    this.removeSelectorListener( sel );
                });
            }
            return this;
        };
    }
};
// add it now as a plugin to jQuery
if ( 'undefined' !== typeof jQuery ) window.SelectorListener.jquery( jQuery );

}( );
