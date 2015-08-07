/**
 * [baseUrl description]
 * @type {String}
 */
require.config({
	baseUrl:"js",
　　paths: {
		"html5"			:"browser/html5shiv.min",		//支持html5
		"modernizr"		:"browser/modernizr",			//扫描浏览器
		"respond"		:"browser/respond.min",			//让ie6-ir8支持响应式
　　　　"jquery"		:"jquery/jquery.min",			//jquery
		"jquery.tmpl"   :"jquery/jquery.tmpl",			//模版插件，可用于动态添加内容上
　　　　"validate"		:"jquery/jquery.validate.all",	//验证插件
		"transition"	:"plugins/transition",			//动画效果插件 transition.getWinSize可获取浏览器窗口大小
		"modal"			:"plugins/modal",				//bootstrap弹出层插件
		"tooltip"		:"plugins/tooltip",				//bootstrap提示信息插件
		"popover"		:"plugins/popover",				//继承于tooltip白底黑字可以更大
		"tab"			:"plugins/tab",					//sheet页插件
		"slide"			:"plugins/slide",				//大图轮播插件
		"dynamicAddRow"	:"plugins/jquery.tmpl",			//动态添加行插件
		"fill"			:"plugins/jquery.fill"
　　},
	shim : {
		"validate"		:["jquery"],
		"jquery.tmpl"	:["jquery"],
		"transition"	:["jquery"],
		"modal"			:["transition"],
		"tooltip"		:["transition"],
		"popover"		:["tooltip"],
		"tab"			:["tooltip"],
		"slide"			:["jquery"],
		"fill"			:["jquery"],
		"dynamicAddRow"	:["jquery","fill"]
	}
/**
*require.config()接受一个配置对象，这个对象除了有前面说过的paths属性之外，
*还有一个shim属性，专门用来配置不兼容的模块。具体来说，
*每个模块要定义
*（1）exports值（输出的变量名），表明这个模块外部调用时的名称；
*（2）deps数组，表明该模块的依赖性。
**/
//	shim: {
// 　　　　'jquery.scroll': {
// 　　　　　　deps: ['jquery'],
// 　　　　　　exports: 'jQuery.fn.scroll'
// 　　　　}
// 　　}
});

//判断浏览器如果是IE8则加载html5插件和respond插件
if(navigator.userAgent.indexOf("MSIE 8.0")>0){
	require(["html5","respond"],function(){});
}

require(["jquery"],function($){
	/**导航**/
	$(document).on('mouseenter.bs.menu', '#nav-menu li', function(e) {
	  	var $this = $(this);
	  	var left = $this.offset().left;
	  	$this.find("dl").addClass("active").css("left", left + "px");
	});
	$(document).on('mouseleave.bs.menu', '#nav-menu li', function(e) {
	  	$(this).find("dl").removeClass("active");
	});

	$(document).ready(function() {
	  	$(".table-zebra tbody tr:odd").addClass("odd");
	  	$(".table-zebra tbody tr:even").addClass("even");
	});
});