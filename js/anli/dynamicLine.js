var indexId = 0;
require(["jquery","dynamicAddRow","tooltip"],function($){
	var resources = {
		"student": [{
			"name": "json",
			"age": 20,
			"grade": "101"
		}, {
			"name": "mrak",
			"age": 21,
			"grade": "102"
		}, {
			"name": "xiao",
			"age": 22,
			"grade": "108"
		}, {
			"name": "gang",
			"age": 23,
			"grade": "203"
		}, {
			"name": "wuhan",
			"age": 24,
			"grade": "305"
		}]
	};
;
	var table = new DynamicAddRow("#testTable",{
		"tmplId"	: "#table2Tmpl",	//模版id
		"tmplName"	: "tableTmpl2",		//模版name 便于查找一个table下有多个动态添加行的情况下
		"addId"		: "#addId",			//在此参数的id下追加新的行
		"params"	: {					//tmpl模版参数
			"id"    : "auto-tr-id",
            "klass" : "auto-tr-class",
            "tds"   : {
                "id"     : "auto-td",
                "name"   : "auto-td-name"
            }
		},
		"deflutOne" : false,			//是否默认添加一行		默认true
		"deleteLast": false,			//是否可以删除最后一行  默认true
		echoList	: resources,		//回显参数，注意*需要按照一定的格式
		/**
		 * [callback 添加行回调函数]
		 */
		callback	: function(){
			$("#user2Tabke"+indexId).tooltip();
			indexId++;
			//console.log("当前共有"+indexId+"行");
		},
		/**
		 * [dropback 删除行回调函数]
		 * @param  {[type]} num [剩余行数]
		 * @param  {[type]} aid [删除按钮的id]
		 */
		dropback	: function(num,aid){
			//console.log(num);
			//console.log(aid);
		}
	});
	$(document).ready(function(){
		$("[data-toggle='tooltip']").tooltip();
	});
});
