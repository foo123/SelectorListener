/**
* https://github.com/foo123/SelectorListener
* @VERSION: 1.2.0
* adapted from https://github.com/csuwildcat/SelectorListener
**/
!function( ){
"use strict";

// dont re-add it if already loaded and added
if ( 'object' === typeof window.SelectorListener ) return;

var events = {},
    selectors = {},
    animationCount = 0,
    // IE does not work with layout-color: initial, use explicit values
    anim = '{from {outline-color:#fff;} to {outline-color:#000;}}',
    anim_dur = '0.001s',
    SL_re = /SelectorListener/g,
    el_exists_re = /(:not\s*\(\s*)?::?exists(\s*\))?\b/gi,
    el_added_re = /::?added\b/gi,
    el_removed_re = /([^, ]+?)(::?removed)\b/gi,
    class_added_re = /::?class\-added\(([^\(\)]+)\)/gi,
    class_removed_re = /::?class\-removed\(([^\(\)]+)\)/gi,
    //sl_css = document.createElement('style'),
    styles = document.createElement('style'),
    keyframes = document.createElement('style'),
    head = document.getElementsByTagName('head')[0],
    //recycleBin = document.createElement('div'),
    //recycleBin__added__ = false,
    //recycleTimeout = 1000, // 1 seconds
    startNames = ['animationstart', 'oAnimationStart', 'MSAnimationStart', 'webkitAnimationStart'],
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
    
/*sl_css.type =*/ styles.type = keyframes.type = "text/css";
//sl_css.setAttribute( 'sl__exist__', 1 );
styles.setAttribute( 'sl__exist__', 1 );
keyframes.setAttribute( 'sl__exist__', 1 );
/*sl_css.appendChild( document.createTextNode('#sl__recycle_bin__{position:absolute;max-height:0 !important;max-width:0 !important;overflow:hidden !important;}#sl__recycle_bin__>*{max-height:0 !important;max-width:0 !important;overflow:hidden !important;}') );
head.appendChild(sl_css);*/
head.appendChild(styles);
head.appendChild(keyframes);
/*recycleBin.setAttribute( 'sl__exist__', 1 );
recycleBin.setAttribute( 'style', 'position:absolute;max-height:0 !important;max-width:0 !important;overflow:hidden !important;' );
recycleBin.id = 'sl__recycle_bin__';*/

function each( x, F, i0, i1 )
{
    var len = x.length, argslen = arguments.length;
    if ( argslen < 4 ) i1 = len-1;
    if ( 0 > i1 ) i1 += len;
    if ( argslen < 3 ) i0 = 0;
    if ( i0 > i1 ) return x;
    var i, k, l=i1-i0+1, l1, lr, r, q;
    r=l&15; q=r&1;
    if ( q ) F(x[i0], i0, x);
    for (i=q; i<r; i+=2)
    { 
        k = i0+i;
        F(x[  k], k, x);
        F(x[++k], k, x);
    }
    for (i=r; i<l; i+=16)
    {
        k = i0+i;
        F(x[  k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
        F(x[++k], k, x);
    }
    return x;
}

function startEvent( event )
{
    var el = event.target,
        key = event.animationName,
        evt = events[key] || {};
    event.selector = evt.selector;
    //if ( evt.created && !!el.hasAttribute('__exist__') ) return;
    each((this.selectorListeners || {})[key] || [], function(fn){
        fn.call(/*this*/el, event);
    });
    // add a small delay
    //setTimeout(function(){
    el.sl__decorateDom( evt.attributeModified ? decorateElAndUpdateAttr : decorateEl );
    //}, 10);
    /*if ( evt.removedMutation )
    {
        // if element IS removed and IS in the recycle bin
        // remove it NOW explicitly, since any listeners have been called
        el.sl__recycled__ = 0;
        el.removeAttribute( 'sl__exist__' );
        if ( recycleBin === el.parentNode )
        {
            recycleBin.removeChild( el );
        }
    }*/
}
/*function emptyRecycleBin( )
{
    var t = new Date, d = 2*recycleTimeout;
    for(var i=recycleBin.childNodes.length-1; i>=0; i--)
    {
        var node = recycleBin.childNodes[i];
        // empty nodes that either are not recycled or expired
        if ( !node.sl__recycled__ || (t > d+node.sl__recycled__) ) recycleBin.removeChild( node );
    }
}*/
function decorateEl( el )
{
    if ( !el.hasAttribute( 'sl__exist__' ) )
    {
        if ( el.hasAttribute( 'sl__removed__' ) ) el.removeAttribute( 'sl__removed__' );
        el.setAttribute( 'sl__exist__', 1 );
        el.setAttribute( 'sl__class__', ' '+el.className+' ' );
        /*if ( !el.sl__removeChild )
        {
            el.sl__removeChild = el.removeChild;
            el.removeChild = function( child ) {
                if ( 1 === child.nodeType )
                {
                    recycleBin.appendChild( child );
                    child.sl__recycled__ = new Date;
                    child.setAttribute( 'sl__removed__', 1 );
                }
                else
                {
                    el.sl__removeChild( child );
                }
                return child;
            };
        }
        if ( !el.sl__replaceChild )
        {
            el.sl__replaceChild = el.replaceChild;
            el.replaceChild = function( newChild, oldChild ) {
                el.sl__replaceChild( newChild, oldChild );
                if ( 1 === oldChild.nodeType )
                {
                    recycleBin.appendChild( oldChild );
                    oldChild.sl__recycled__ = new Date;
                    oldChild.setAttribute( 'sl__removed__', 1 );
                }
                return oldChild;
            };
        }*/
        return true;
    }
    return false;
}
function decorateElAndUpdateAttr( el )
{
    if ( !el.hasAttribute( 'sl__exist__' ) )
    {
        if ( el.hasAttribute( 'sl__removed__' ) ) el.removeAttribute( 'sl__removed__' );
        el.setAttribute( 'sl__exist__', 1 );
        el.setAttribute( 'sl__class__', ' '+el.className+' ' );
        /*if ( !el.sl__removeChild )
        {
            el.sl__removeChild = el.removeChild;
            el.removeChild = function( child ) {
                if ( 1 === child.nodeType )
                {
                    recycleBin.appendChild( child );
                    child.sl__recycled__ = new Date;
                    child.setAttribute( 'sl__removed__', 1 );
                }
                else
                {
                    el.sl__removeChild( child );
                }
                return child;
            };
        }
        if ( !el.sl__replaceChild )
        {
            el.sl__replaceChild = el.replaceChild;
            el.replaceChild = function( newChild, oldChild ) {
                el.sl__replaceChild( newChild, oldChild );
                if ( 1 === oldChild.nodeType )
                {
                    recycleBin.appendChild( oldChild );
                    oldChild.sl__recycled__ = new Date;
                    oldChild.setAttribute( 'sl__removed__', 1 );
                }
                return oldChild;
            };
        }*/
        return true;
    }
    else
    {
        if ( el.hasAttribute( 'sl__removed__' ) ) el.removeAttribute( 'sl__removed__' );
        el.setAttribute( 'sl__class__', ' '+el.className+' ' );
        return false;
    }
}

HTMLDocument.prototype.sl__decorateDom = function( decorator ) {
    var el = this, child, l, i;
    el = el.getElementsByTagName('body')[0];
    if ( 1 !== el.nodeType ) return el;
    if ( decorator( el ) )
    {
        child = el.childNodes;
        for(i=0,l=child.length; i<l; i++) ((child[i] instanceof HTMLElement || child[i] instanceof HTMLDocument) && (1 === child[i].nodeType)) && child[i].sl__decorateDom( decorator );
    }
    return el;
};
HTMLElement.prototype.sl__decorateDom = function( decorator ) {
    var el = this, child, l, i;
    if ( 1 !== el.nodeType ) return el;
    if ( decorator( el ) )
    {
        child = el.childNodes;
        for(i=0,l=child.length; i<l; i++) ((child[i] instanceof HTMLElement || child[i] instanceof HTMLDocument) && (1 === child[i].nodeType)) && child[i].sl__decorateDom( decorator );
    }
    return el;
};
HTMLDocument.prototype.addSelectorListener = HTMLElement.prototype.addSelectorListener = function( selector, fn ){
    if ( !selector || 'function' !== typeof fn ) return;
    
    /*if ( !recycleBin__added__ )
    {
        if ( document.body.childNodes.length ) document.body.insertBefore( recycleBin, document.body.firstChild );
        else document.body.appendChild( recycleBin );
        recycleBin__added__ = true;
        setTimeout(function recycle( ){
            emptyRecycleBin( );
            setTimeout(recycle, recycleTimeout);
        }, recycleTimeout);
    }
    else if ( !recycleBin.parentNode )
    {
        if ( document.body.childNodes.length ) document.body.insertBefore( recycleBin, document.body.firstChild );
        else document.body.appendChild( recycleBin );
    }*/
    
    var has_attr_modified_sel = false,
        removed_mutation = false,
        sel = selector
            .replace(class_added_re, function( g0, g1 ){
                has_attr_modified_sel = true;
                g1 = '.' === g1.charAt(0) ? g1.slice(1) : g1;
                return '[sl__exist__]:not([sl__removed__]).'+g1+':not([sl__class__~='+g1+'])';
            })
            .replace(class_removed_re, function( g0, g1 ){
                has_attr_modified_sel = true;
                g1 = '.' === g1.charAt(0) ? g1.slice(1) : g1;
                return '[sl__exist__]:not([sl__removed__])[sl__class__~='+g1+']:not(.'+g1+')';
            })
            .replace(el_exists_re, function( g0, g1, g2 ){
                return !!g1 ? ':not([sl__exist__]):not([sl__removed__])' : '[sl__exist__]:not([sl__removed__])';
            })
            /*.replace(el_removed_re, function( g0, g1, g2 ){
                removed_mutation = true;
                return '#sl__recycle_bin__>'+g1+'[sl__exist__][sl__removed__]';
            })*/
            .replace(el_added_re, ':not([sl__exist__]):not([sl__removed__])'),
        key = selectors[sel],
        listeners = this.selectorListeners = this.selectorListeners || {};
        
    if ( key ) events[key].count++;
    else
    {
        // https://github.com/csuwildcat/SelectorListener/commit/1610d13e806e54e4d297ee54139290b938e516e5
        // Removing chance of duplicate listener IDs
        key = selectors[sel] = 'SelectorListener-' + (++animationCount)/*new Date().getTime()*/;
        var node = document.createTextNode('@'+(prefix.keyframes?prefix.css:'')+'keyframes '+key+' '+anim);
        keyframes.appendChild( node );
        styles.sheet.insertRule(sel + prefix.properties.replace(SL_re, key), 0);
        events[key] = { count: 1, selector: selector, removedMutation: removed_mutation, attributeModified: has_attr_modified_sel, keyframe: node, rule: styles.sheet.cssRules[0] };
    } 
    
    if ( listeners.count ) listeners.count++;
    else
    {
        this.sl__decorateDom( decorateEl );
        listeners.count = 1;
        startNames.forEach(function(name){
            this.addEventListener(name, startEvent, false);
        }, this);
    }
    (listeners[key] = listeners[key] || []).push(fn);
};
HTMLDocument.prototype.removeSelectorListener = HTMLElement.prototype.removeSelectorListener = function( selector, fn ){
    if ( !selector ) return;
    
    var sel = selector
            .replace(class_added_re, function( g0, g1 ){
                g1 = '.' === g1.charAt(0) ? g1.slice(1) : g1;
                return '[sl__exist__]:not([sl__removed__]).'+g1+':not([sl__class__~='+g1+'])';
            })
            .replace(class_removed_re, function( g0, g1 ){
                g1 = '.' === g1.charAt(0) ? g1.slice(1) : g1;
                return '[sl__exist__]:not([sl__removed__])[sl__class__~='+g1+']:not(.'+g1+')';
            })
            .replace(el_exists_re, function( g0, g1, g2 ){
                return !!g1 ? ':not([sl__exist__]):not([sl__removed__])' : '[sl__exist__]:not([sl__removed__])';
            })
            /*.replace(el_removed_re, function( g0, g1, g2 ){
                return '#sl__recycle_bin__>'+g1+'[sl__exist__][sl__removed__]';
            })*/
            .replace(el_added_re, ':not([sl__exist__]):not([sl__removed__])')
    ;
    
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
    
    VERSION: '1.2.0',
    
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
