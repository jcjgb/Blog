/*!
 * jQuery Templates Plugin
 * http://github.com/jquery/jquery-tmpl
 *
 * Copyright Software Freedom Conservancy, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */
(function( jQuery, undefined ){
	var oldManip = jQuery.fn.domManip, tmplItmAtt = "_tmplitem", htmlExpr = /^[^<]*(<[\w\W]+>)[^>]*$|\{\{\! /,
		newTmplItems = {}, wrappedItems = {}, appendToTmplItems, topTmplItem = { key: 0, data: {} }, itemKey = 0, cloneIndex = 0, stack = [];

	function newTmplItem( options, parentItem, fn, data ) {
		// Returns a template item data structure for a new rendered instance of a template (a 'template item').
		// The content field is a hierarchical array of strings and nested items (to be
		// removed and replaced by nodes field of dom elements, once inserted in DOM).

		var newItem = {
			data: data || (parentItem ? parentItem.data : {}),
			_wrap: parentItem ? parentItem._wrap : null,
			tmpl: null,
			parent: parentItem || null,
			nodes: [],
			calls: tiCalls,
			nest: tiNest,
			wrap: tiWrap,
			html: tiHtml,
			update: tiUpdate
		};
		if ( options ) {
			jQuery.extend( newItem, options, { nodes: [], parent: parentItem } );
		}
		if ( fn ) {
			// Build the hierarchical content to be used during insertion into DOM
			newItem.tmpl = fn;
			newItem._ctnt = newItem._ctnt || newItem.tmpl( jQuery, newItem );
			newItem.key = ++itemKey;
			// Keep track of new template item, until it is stored as jQuery Data on DOM element
			(stack.length ? wrappedItems : newTmplItems)[itemKey] = newItem;
		}
		return newItem;
	}

	// Override appendTo etc., in order to provide support for targeting multiple elements. (This code would disappear if integrated in jquery core).
	jQuery.each({
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function( name, original ) {
		jQuery.fn[ name ] = function( selector ) {
			var ret = [], insert = jQuery( selector ), elems, i, l, tmplItems,
				parent = this.length === 1 && this[0].parentNode;

			appendToTmplItems = newTmplItems || {};
			if ( parent && parent.nodeType === 11 && parent.childNodes.length === 1 && insert.length === 1 ) {
				insert[ original ]( this[0] );
				ret = this;
			} else {
				for ( i = 0, l = insert.length; i < l; i++ ) {
					cloneIndex = i;
					elems = (i > 0 ? this.clone(true) : this).get();
					jQuery.fn[ original ].apply( jQuery(insert[i]), elems );
					ret = ret.concat( elems );
				}
				cloneIndex = 0;
				ret = this.pushStack( ret, name, insert.selector );
			}
			tmplItems = appendToTmplItems;
			appendToTmplItems = null;
			jQuery.tmpl.complete( tmplItems );
			return ret;
		};
	});

	jQuery.fn.extend({
		// Use first wrapped element as template markup.
		// Return wrapped set of template items, obtained by rendering template against data.
		tmpl: function( data, options, parentItem ) {
			return jQuery.tmpl( this[0], data, options, parentItem );
		},

		// Find which rendered template item the first wrapped DOM element belongs to
		tmplItem: function() {
			return jQuery.tmplItem( this[0] );
		},

		tmplElement: function() {
			return jQuery.tmplElement( this[0] );
		},

		// Consider the first wrapped element as a template declaration, and get the compiled template or store it as a named template.
		template: function( name ) {
			return jQuery.template( name, this[0] );
		},

		domManip: function( args, table, callback, options ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			if ( args[0] && args[0].nodeType ) {
				var dmArgs = jQuery.makeArray( arguments ), argsLength = args.length, i = 0, tmplItem;
				while ( i < argsLength && !(tmplItem = jQuery.data( args[i++], "tmplItem" ))) {}
				if ( argsLength > 1 ) {
					dmArgs[0] = [jQuery.makeArray( args )];
				}
				if ( tmplItem && cloneIndex ) {
					dmArgs[2] = function( fragClone ) {
						// Handler called by oldManip when rendered template has been inserted into DOM.
						jQuery.tmpl.afterManip( this, fragClone, callback );
					};
				}
				oldManip.apply( this, dmArgs );
			} else {
				oldManip.apply( this, arguments );
			}
			cloneIndex = 0;
			if ( !appendToTmplItems ) {
				jQuery.tmpl.complete( newTmplItems );
			}
			return this;
		}
	});

	jQuery.extend({
		// Return wrapped set of template items, obtained by rendering template against data.
		tmpl: function( tmpl, data, options, parentItem ) {
			var ret, topLevel = !parentItem;
			if ( topLevel ) {
				// This is a top-level tmpl call (not from a nested template using {{tmpl}})
				parentItem = topTmplItem;
				if ( typeof tmpl != "function" )
  				tmpl = jQuery.template[tmpl] || jQuery.template( null, tmpl );
				wrappedItems = {}; // Any wrapped items will be rebuilt, since this is top level
			} else if ( !tmpl ) {
				// The template item is already associated with DOM - this is a refresh.
				// Re-evaluate rendered template for the parentItem
				tmpl = parentItem.tmpl;
				newTmplItems[parentItem.key] = parentItem;
				parentItem.nodes = [];
				if ( parentItem.wrapped ) {
					updateWrapped( parentItem, parentItem.wrapped );
				}
				// Rebuild, without creating a new template item
				return jQuery( build( parentItem, null, parentItem.tmpl( jQuery, parentItem ) ));
			}
			if ( !tmpl ) {
				return []; // Could throw...
			}
			if ( typeof data === "function" ) {
				data = data.call( parentItem || {} );
			}
			if ( options && options.wrapped ) {
				updateWrapped( options, options.wrapped );
			}
			ret = jQuery.isArray( data ) ?
				jQuery.map( data, function( dataItem ) {
					return dataItem ? newTmplItem( options, parentItem, tmpl, dataItem ) : null;
				}) :
				[ newTmplItem( options, parentItem, tmpl, data ) ];
			return topLevel ? jQuery( build( parentItem, null, ret ) ) : ret;
		},

		// Return rendered template item for an element.
		tmplItem: function( elem ) {
			var tmplItem;
			if ( elem instanceof jQuery ) {
				elem = elem[0];
			}
			while ( elem && elem.nodeType === 1 && !(tmplItem = jQuery.data( elem, "tmplItem" )) && (elem = elem.parentNode) ) {}
			return tmplItem || topTmplItem;
		},

		tmplElement: function( elem ) {
			var tmplItem;
			if ( elem instanceof jQuery ) {
				elem = elem[0];
			}
			while ( elem && elem.nodeType === 1 && !jQuery.data( elem, "tmplItem" ) && (elem = elem.parentNode) ) {}
			return elem;
		},

		// Set:
		// Use $.template( name, tmpl ) to cache a named template,
		// where tmpl is a template string, a script element or a jQuery instance wrapping a script element, etc.
		// Use $( "selector" ).template( name ) to provide access by name to a script block template declaration.

		// Get:
		// Use $.template( name ) to access a cached template.
		// Also $( selectorToScriptBlock ).template(), or $.template( null, templateString )
		// will return the compiled template, without adding a name reference.
		// If templateString includes at least one HTML tag, $.template( templateString ) is equivalent
		// to $.template( null, templateString )
		template: function( name, tmpl ) {
			if (tmpl) {
				// Compile template and associate with name
				if ( typeof tmpl === "string" ) {
					// This is an HTML string being passed directly in.
					tmpl = buildTmplFn( tmpl )
				} else if ( tmpl instanceof jQuery ) {
					tmpl = tmpl[0] || {};
				}
				if ( tmpl.nodeType ) {
					// If this is a template block, use cached copy, or generate tmpl function and cache.
					tmpl = jQuery.data( tmpl, "tmpl" ) || jQuery.data( tmpl, "tmpl", buildTmplFn( tmpl.innerHTML ));
				}
				return typeof name === "string" ? (jQuery.template[name] = tmpl) : tmpl;
			}
			// Return named compiled template
			return name ? (typeof name !== "string" ? jQuery.template( null, name ):
				(jQuery.template[name] ||
					// If not in map, treat as a selector. (If integrated with core, use quickExpr.exec)
					jQuery.template( null, htmlExpr.test( name ) ? name : jQuery( name )))) : null;
		},

		encode: function( text ) {
			// Do HTML encoding replacing < > & and ' and " by corresponding entities.
			return ("" + text).split("<").join("&lt;").split(">").join("&gt;").split('"').join("&#34;").split("'").join("&#39;");
		}
	});

	jQuery.extend( jQuery.tmpl, {
		tag: {
			"tmpl": {
				_default: { $2: "null" },
				open: "if($notnull_1){_=_.concat($item.nest($1,$2));}"
				// tmpl target parameter can be of type function, so use $1, not $1a (so not auto detection of functions)
				// This means that {{tmpl foo}} treats foo as a template (which IS a function).
				// Explicit parens can be used if foo is a function that returns a template: {{tmpl foo()}}.
			},
			"wrap": {
				_default: { $2: "null" },
				open: "$item.calls(_,$1,$2);_=[];",
				close: "call=$item.calls();_=call._.concat($item.wrap(call,_));"
			},
			"each": {
				_default: { $2: "$index, $value" },
				open: "if($notnull_1){$.each($1a,function($2){with(this){",
				close: "}});}"
			},
			"if": {
				open: "if(($notnull_1) && $1a){",
				close: "}"
			},
			"else": {
				_default: { $1: "true" },
				open: "}else if(($notnull_1) && $1a){"
			},
			"html": {
				// Unecoded expression evaluation.
				open: "if($notnull_1){_.push($1a);}"
			},
			"=": {
				// Encoded expression evaluation. Abbreviated form is ${}.
				_default: { $1: "$data" },
				open: "if($notnull_1){_.push($.encode($1a));}"
			},
			"!": {
				// Comment tag. Skipped by parser
				open: ""
			}
		},

		// This stub can be overridden, e.g. in jquery.tmplPlus for providing rendered events
		complete: function( items ) {
			newTmplItems = {};
		},

		// Call this from code which overrides domManip, or equivalent
		// Manage cloning/storing template items etc.
		afterManip: function afterManip( elem, fragClone, callback ) {
			// Provides cloned fragment ready for fixup prior to and after insertion into DOM
			var content = fragClone.nodeType === 11 ?
				jQuery.makeArray(fragClone.childNodes) :
				fragClone.nodeType === 1 ? [fragClone] : [];

			// Return fragment to original caller (e.g. append) for DOM insertion
			callback.call( elem, fragClone );

			// Fragment has been inserted:- Add inserted nodes to tmplItem data structure. Replace inserted element annotations by jQuery.data.
			storeTmplItems( content );
			cloneIndex++;
		}
	});

	//========================== Private helper functions, used by code above ==========================

	function build( tmplItem, nested, content ) {
		// Convert hierarchical content into flat string array
		// and finally return array of fragments ready for DOM insertion
		var frag, ret = content ? jQuery.map( content, function( item ) {
			return (typeof item === "string") ?
				// Insert template item annotations, to be converted to jQuery.data( "tmplItem" ) when elems are inserted into DOM.
				(tmplItem.key ? item.replace( /(<\w+)(?=[\s>])(?![^>]*_tmplitem)([^>]*)/g, "$1 " + tmplItmAtt + "=\"" + tmplItem.key + "\" $2" ) : item) :
				// This is a child template item. Build nested template.
				build( item, tmplItem, item._ctnt );
		}) :
		// If content is not defined, insert tmplItem directly. Not a template item. May be a string, or a string array, e.g. from {{html $item.html()}}.
		tmplItem;
		if ( nested ) {
			return ret;
		}

		// top-level template
		ret = ret.join("");

		// Support templates which have initial or final text nodes, or consist only of text
		// Also support HTML entities within the HTML markup.
		ret.replace( /^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/, function( all, before, middle, after) {
			frag = jQuery( middle ).get();

			storeTmplItems( frag );
			if ( before ) {
				frag = unencode( before ).concat(frag);
			}
			if ( after ) {
				frag = frag.concat(unencode( after ));
			}
		});
		return frag ? frag : unencode( ret );
	}

	function unencode( text ) {
		// Use createElement, since createTextNode will not render HTML entities correctly
		var el = document.createElement( "div" );
		el.innerHTML = text;
		return jQuery.makeArray(el.childNodes);
	}

	// Generate a reusable function that will serve to render a template against data
	function buildTmplFn( markup ) {
		return new Function("jQuery","$item",
			"var $=jQuery,call,_=[],$data=$item.data;" +

			// Introduce the data as local variables using with(){}
			"with($data){_.push('" +

			// Convert the template into pure JavaScript
			jQuery.trim(markup)
				.replace( /([\\'])/g, "\\$1" )
				.replace( /[\r\t\n]/g, " " )
				.replace( /\$\{([^\}]*)\}/g, "{{= $1}}" )
				.replace( /\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\(((?:[^\}]|\}(?!\}))*?)\))?\s*\}\}/g,
				function( all, slash, type, fnargs, target, parens, args ) {
					var tag = jQuery.tmpl.tag[ type ], def, expr, exprAutoFnDetect;
					if ( !tag ) {
						throw "Template command not found: " + type;
					}
					def = tag._default || [];
					if ( parens && !/\w$/.test(target)) {
						target += parens;
						parens = "";
					}
					if ( target ) {
						target = unescape( target );
						args = args ? ("," + unescape( args ) + ")") : (parens ? ")" : "");
						// Support for target being things like a.toLowerCase();
						// In that case don't call with template item as 'this' pointer. Just evaluate...
						expr = parens ? (target.indexOf(".") > -1 ? target + parens : ("(" + target + ").call($data" + args)) : target;
						exprAutoFnDetect = parens ? expr : "(typeof(" + target + ")==='function'?(" + target + ").call($item):(" + target + "))";
					} else {
						exprAutoFnDetect = expr = def.$1 || "null";
					}
					fnargs = unescape( fnargs );
					return "');" +
						tag[ slash ? "close" : "open" ]
							.split( "$notnull_1" ).join( target ? "typeof(" + target + ")!=='undefined' && (" + target + ")!=null" : "true" )
							.split( "$1a" ).join( exprAutoFnDetect )
							.split( "$1" ).join( expr )
							.split( "$2" ).join( fnargs ?
								fnargs.replace( /\s*([^\(]+)\s*(\((.*?)\))?/g, function( all, name, parens, params ) {
									params = params ? ("," + params + ")") : (parens ? ")" : "");
									return params ? ("(" + name + ").call($item" + params) : all;
								})
								: (def.$2||"")
							) +
						"_.push('";
				}) +
			"');}return _;"
		);
	}
	function updateWrapped( options, wrapped ) {
		// Build the wrapped content.
		options._wrap = build( options, true,
			// Suport imperative scenario in which options.wrapped can be set to a selector or an HTML string.
			jQuery.isArray( wrapped ) ? wrapped : [htmlExpr.test( wrapped ) ? wrapped : jQuery( wrapped ).html()]
		).join("");
	}

	function unescape( args ) {
		return args ? args.replace( /\\'/g, "'").replace(/\\\\/g, "\\" ) : null;
	}
	function outerHtml( elem ) {
		var div = document.createElement("div");
		div.appendChild( elem.cloneNode(true) );
		return div.innerHTML;
	}

	// Store template items in jQuery.data(), ensuring a unique tmplItem data data structure for each rendered template instance.
	function storeTmplItems( content ) {
		var keySuffix = "_" + cloneIndex, elem, elems, newClonedItems = {}, i, l, m;
		for ( i = 0, l = content.length; i < l; i++ ) {
			if ( (elem = content[i]).nodeType !== 1 ) {
				continue;
			}
			elems = elem.getElementsByTagName("*");
			for ( m = elems.length - 1; m >= 0; m-- ) {
				processItemKey( elems[m] );
			}
			processItemKey( elem );
		}
		function processItemKey( el ) {
			var pntKey, pntNode = el, pntItem, tmplItem, key;
			// Ensure that each rendered template inserted into the DOM has its own template item,
			if ( (key = el.getAttribute( tmplItmAtt ))) {
				while ( pntNode.parentNode && (pntNode = pntNode.parentNode).nodeType === 1 && !(pntKey = pntNode.getAttribute( tmplItmAtt ))) { }
				if ( pntKey !== key ) {
					// The next ancestor with a _tmplitem expando is on a different key than this one.
					// So this is a top-level element within this template item
					// Set pntNode to the key of the parentNode, or to 0 if pntNode.parentNode is null, or pntNode is a fragment.
					pntNode = pntNode.parentNode ? (pntNode.nodeType === 11 ? 0 : (pntNode.getAttribute( tmplItmAtt ) || 0)) : 0;
					if ( !(tmplItem = newTmplItems[key]) ) {
						// The item is for wrapped content, and was copied from the temporary parent wrappedItem.
						tmplItem = wrappedItems[key];
						tmplItem = newTmplItem( tmplItem, newTmplItems[pntNode]||wrappedItems[pntNode], null, true );
						tmplItem.key = ++itemKey;
						newTmplItems[itemKey] = tmplItem;
					}
					if ( cloneIndex ) {
						cloneTmplItem( key );
					}
				}
				el.removeAttribute( tmplItmAtt );
			} else if ( cloneIndex && (tmplItem = jQuery.data( el, "tmplItem" )) ) {
				// This was a rendered element, cloned during append or appendTo etc.
				// TmplItem stored in jQuery data has already been cloned in cloneCopyEvent. We must replace it with a fresh cloned tmplItem.
				cloneTmplItem( tmplItem.key );
				newTmplItems[tmplItem.key] = tmplItem;
				pntNode = jQuery.data( el.parentNode, "tmplItem" );
				pntNode = pntNode ? pntNode.key : 0;
			}
			if ( tmplItem ) {
				pntItem = tmplItem;
				// Find the template item of the parent element.
				// (Using !=, not !==, since pntItem.key is number, and pntNode may be a string)
				while ( pntItem && pntItem.key != pntNode ) {
					// Add this element as a top-level node for this rendered template item, as well as for any
					// ancestor items between this item and the item of its parent element
					pntItem.nodes.push( el );
					pntItem = pntItem.parent;
				}
				// Delete content built during rendering - reduce API surface area and memory use, and avoid exposing of stale data after rendering...
				delete tmplItem._ctnt;
				delete tmplItem._wrap;
				// Store template item as jQuery data on the element
				jQuery.data( el, "tmplItem", tmplItem );
			}
			function cloneTmplItem( key ) {
				key = key + keySuffix;
				tmplItem = newClonedItems[key] =
					(newClonedItems[key] || newTmplItem( tmplItem, newTmplItems[tmplItem.parent.key + keySuffix] || tmplItem.parent, null, true ));
			}
		}
	}

	//---- Helper functions for template item ----

	function tiCalls( content, tmpl, data, options ) {
		if ( !content ) {
			return stack.pop();
		}
		stack.push({ _: content, tmpl: tmpl, item:this, data: data, options: options });
	}

	function tiNest( tmpl, data, options ) {
		// nested template, using {{tmpl}} tag
		return jQuery.tmpl( jQuery.template( tmpl ), data, options, this );
	}

	function tiWrap( call, wrapped ) {
		// nested template, using {{wrap}} tag
		var options = call.options || {};
		options.wrapped = wrapped;
		// Apply the template, which may incorporate wrapped content,
		return jQuery.tmpl( jQuery.template( call.tmpl ), call.data, options, call.item );
	}

	function tiHtml( filter, textOnly ) {
		var wrapped = this._wrap;
		return jQuery.map(
			jQuery( jQuery.isArray( wrapped ) ? wrapped.join("") : wrapped ).filter( filter || "*" ),
			function(e) {
				return textOnly ?
					e.innerText || e.textContent :
					e.outerHTML || outerHtml(e);
			});
	}

	function tiUpdate() {
		var coll = this.nodes;
		jQuery.tmpl( null, null, null, this).insertBefore( coll[0] );
		jQuery( coll ).remove();
	}
})( jQuery );

/**
 * [Class 自定义类库]
 * @param {[type]} parent [description]
 */
var Class = function (parent) {
    var klass = function () {
    	//console.log(this);
        this.init.apply(this,arguments);
    }
    //添加继承功能
    if(parent){
        var subclass = function(){}
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
    }

    klass.prototype.init = function () {}

    klass.fn = klass.prototype;

    klass.fn.parent = klass;
    //将当前继承原型对象赋值给父类原型 __proto__和 prototype类似
    klass._super = klass.__proto__;
    /**
     * proxy函数
     * @param    func              函数不带有括号
     * @returns {Function}         执行当前传入的这个参数this指向调用时上下文
     * @example
     *    var Button = new Class;
     *    Button.include({
     *        init : function(element){
     *            this.element = jQuery(element);
     *            //代理了这个click函数
     *            this.element.click(this.proxy(this.click));
     *        },
     *        click : function (){ //具体代码执行内容 }
     *    });
     **/
    klass.proxy = function (func) {
        var self = this;
        return (function(){
            return func.apply(self,arguments);
        });
    }
    klass.fn.proxy = klass.proxy;

    /**
     * 添加静态方法
     * @param     obj 需要添加的方法或属性
     * @example
     *  使用extend()函数来生成一个类，这个函数的参数是一个对象。
     *  通过迭代将对象的属性直接复制到类上。
     *
     *  var Person = new Class;
     *  person.extend({
     *      find   : function(){},
     *      exists : function(){}
     *  });
     *
     *  使用extend函数添加的属性或方法可以直接调用
     *  例如: var obj = Person.find()
     */
    klass.extend = function (obj) {
        var extended = obj.extended;
        for (var i in obj) {
            klass[i] = obj[i];
        }
        //触发回调函数
        if (extended) extended(klass);
    }
    /**
     * 添加原型方法
     * @param     obj
     * @example
     *   include()的工作原理和extend()的一样只是它把复制到类的原型当中
     *   换句话说这里的属性是类实例的属性，而不是静态类的属性
     *
     *   var Person = new Class;
     *   person.extend({
     *      find   : function(){},
     *      exists : function(){}
     *   });
     *
     *  使用include函数添加的属性或方法需要实例化后可以调用
     *  例如: var person = new Person;
     *        person.find()
     */
    klass.include = function (obj) {
        var included = obj.included;
        for (var i in obj) {
            klass.fn[i] = obj[i];
        }
        if (included) included(klass);
    }
    return klass;
}
//调用时直接用到类名称时不要使用()
var Tables = new Class;
Tables.include({
    init : function (element,option) {
        this.$element = $(element);
        this.option   = $.extend({},this.DEFAULT,option);
        if(this.$element.length){
        	this.isRow  = !0;
	        this.addClickLine();
	        this.deleteLine();
	        this.echoListLine();
        }else{
        	throw Error("初始化时table id 未获取到...");
        }
    },
    DEFAULT : {
        lineStor  : "tr [data-table='row']",
        tParams   : null,
        callback  : null,
        echoList  : null,
        deflutOne : true,
        showDelete: !1,
        addLineNum: 0,
        deleteLast: true
    },
    /**
     * 添加一行
     * @param obj           新添加行位置
     * @param y             模版标识
     * @param template      模版
     */
    addLine : function (obj,y,template) {
        //为当前模版添加个标识，添加行时判断最后一行用
        template.addClass(y);
        //为当前模版下的删除按钮指定name为当前模版标识
        if(this.option.showDelete){
        	template.find("td:last").append("<span class='fa fa-cross delete' name='"+y+"'></span>");
        }
        $(obj).after(template);
        this.option.addLineNum++;
        //检查是否含有跨列
        if(this.isRow) this.addRowspan(this.getAddTr(y));
        //检查回调函数 如果为function就执行，并将当前this传入函数上下文
        if(typeof this.option.tParams[y].callback === "function"){
            this.option.tParams[y].callback.call(this,arguments);
        }
        //调用初始化日期插件
        //$(".datepicker-input").datepicker();
        
        //$("[data-toggle=tooltip]").tooltip();
        //调用水印插件
        //iePlaceholderPatch();
    },
    /**
     * 在需要绑定事件的元素中添加 data-table='row' 自定义属性
     * 向下添加一行，内容重置，默认只清空 (文本框，单选框，复选框，文本域)
     */
    addClickLine : function () {
        var that = this;
        that.$element.on("click",that.option.lineStor, function (e) {
            if($(this).hasClass("delete"))return false;
            var y = $(this).attr("name");
            if(that.option.tParams == null || y == undefined){
                throw Error("请检查模版参数设置！！ name | id");
                return false;
            }
            //获取模版对象
            var template = $(that.option.tParams[y].id).tmpl((that.option.tParams[y].params)?that.option.tParams[y].params:"");
            var obj = that.$element.find("."+y);
            
            if(obj.length === 0) {
                obj = that.getAddTr(y);
            }
            that.addLine(obj[obj.length-1],y,template);
            return false;
        });
    },
    /**
     * 回显数据调用
     */
    echoListLine : function(){
    	if(this.option.echoList != null){
    		for(var i in this.option.echoList){
	            this.addEchoLine(i,this.option.echoList[i]);
	        }
    		
    	}
    	this.addOneLine();
    },
    /**
     * 回显数据赋值
     * @param y             模版标识
     * @param echo          回显数据
     */
    addEchoLine : function(y,echo){
        var that = this;
    	if(that.option.tParams == null || y == undefined){
            throw Error("回显数据格式错误 -- >  "+e);
            return false;
        }
        if(echo.length){
            for(var i = 0;i < echo.length;i++){
                that.insertData(echo[i],y);
            }
        }
    },
    reEchoList : function(params){
    	try{
            for(var i in params){
            	this.replacement(i);
	            this.addEchoLine(i,params[i]);
	        }
        }catch (e){
            throw Error("回显数据格式错误 -- >  "+e);
        }
    },
    /**
     * @param data          回显数据
     * @param y             模版标识
     */
    insertData : function (data,y) {
        //获取模版对象
        var template = $(this.option.tParams[y].id).tmpl((this.option.tParams[y].params)?this.option.tParams[y].params:"");
        var temp = template.find("td");
        try{
            for(var i = 0;i < temp.length;i++){
            	if(data[i] != undefined){
                var tds = $(temp[i]).find("input[type=text],input[type=radio],input[type=checkbox],textarea,select");
                for(var j = 0;j < tds.length;j++){
                    switch (tds[j].nodeName.toLowerCase()){
                        case "input":
                            var tff = tds[j].getAttribute("type");
                            if(tff == "text"){
                                if(data[i].input){
                                    tds[j].value = data[i].input;
                                }
                            }else if(tff == "radio"){
                                if(tds[j].value == data[i].radio){
                                    tds[j].checked = true;
                                }
                            }else if(tff == "checkbox"){
                                if(tds[j].value == data[i].checkbox){
                                    tds[j].checked = true;
                                }
                            }
                            break;
                        case "textarea":
                            if(data[i].textarea){
                                tds[j].value = data[i].textarea;
                            }
                            break;
                        default :
                            break;
                    }
                    if(typeof data[i].func === "function"){
                        data[i].func.call(tds[j],tds[j]);
                    }
                }
            	}
            }
        }catch (e){
            throw Error("回显数据格式错误 -- >  "+e);
        }
        var trs = this.$element.find("."+y);
        var trlen = trs.length;
        var obj = (trlen)?trs[trlen-1]:this.getAddTr(y);
        this.addLine(obj,y,template);
    },
    replacement : function(y){
    	var that = this;
		var trs = this.$element.find("."+y);
		if(trs.length){
			for(var j = 0;j < trs.length;j++){
				$(trs[j]).remove();
				that.minusRowspan(that.getAddTr(y));
			}
		}
    },
    /**
     * 针对一个table单个动态添加行，只添加在最后面，参数是对象不是数组
     */
    addLastLine : function(){
    	for(var i in this.option.tParams){
    		var template = $(this.option.tParams[i].id).tmpl((this.option.tParams[i].params)?this.option.tParams[i].params:"");
    		this.isRow = !1;
    		this.addLine(this.$element.find("tr:last"),i,template);
    	}
    },
    addOneLine : function () {
    	//迭代echoList就不报错了，解决new多个对象问题也不报错
    	if(this.option.deflutOne){
    		for(var i in this.option.tParams){
                if(this.option.tParams[i].params){
                	var template = $(this.option.tParams[i].id).tmpl((this.option.tParams[i].params)?this.option.tParams[i].params:"");
    		        var obj = this.getAddTr(i);
                	if(this.option.echoList != null){
                		if(this.option.echoList[i] == undefined){
    		                this.addLine(obj,i,template);
    		            }
                	}else{
                		this.addLine(obj,i,template);
                	}
                }
            }
    	}
    },
    getAddTr : function(obj){
    	var tr = this.$element.find(this.option.tParams[obj].addId);
    	if(tr.length === 0){
    		tr = $(document.getElementsByName(obj)[0]).closest("tr").attr("id",obj);
    	}
    	return tr;
    },
    //删除当前行，第一行不执行事件
    deleteLine : function () {
        var that = this;
        that.$element.on("click",".delete", function (e) {
            var id = $(this).attr("name");
            var deleteID = $(this).attr("id");
            if(id){
            	if(that.option.addLineNum == 1){
            		if(!that.option.deleteLast){
            			if(typeof that.option.tParams[id].dropback === "function"){
		                	that.option.tParams[id].dropback.call(that,that.$element.find("."+id).length,deleteID);
		                }
		                return;
            		}
            	}
            	that.minusRowspan(that.getAddTr(id));
                $(this).closest("tr").remove();
                that.option.addLineNum--;
                if(typeof that.option.tParams[id].dropback === "function"){
                	that.option.tParams[id].dropback.call(that,that.$element.find("."+id).length,deleteID);
                }
            }else{
            	throw Error("删除按钮未添加对应模版的name属性...");
            }
            return false;
        });
    },
    addRowspan : function (obj) {
    	var falg = false;
    	if(obj.attr("row")){
    		obj = obj;
    		falg = true;
    	}else{
    		if(obj.prev().attr("row")){
        		obj = obj.prev();
        		falg = true;
        	}
    	}
    	if(falg){
	        var tds = obj.children();
	        tds[0].setAttribute("rowspan",(parseInt(tds[0].getAttribute("rowspan"),10)+1));
    	}
    },
    minusRowspan : function (obj) {
    	var falg = false;
    	if(obj.attr("row")){
    		obj = obj;
    		falg = true;
    	}else{
    		if(obj.prev().attr("row")){
        		obj = obj.prev();
        		falg = true;
        	}
    	}
    	if(falg){
	        var tds = obj.children();
	        tds[0].setAttribute("rowspan",(parseInt(tds[0].getAttribute("rowspan"),10)-1));
    	}
    }
});