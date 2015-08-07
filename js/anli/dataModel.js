var indexId = 0;
require(["jquery","dynamicAddRow","tooltip","validate"],function($){
	var resources = {
		"user" : [
			{"name":"json1","age":20,"sex":"0","phone":"13888888888","adss":"吉林省"},
			{"name":"json2","age":21,"sex":"0","phone":"13888888888","adss":"黑龙江"},
			{"name":"json3","age":22,"sex":"0","phone":"13888888888","adss":"辽宁"},
			{"name":"json4","age":23,"sex":"0","phone":"13888888888","adss":"北京"},
			{"name":"json5","age":24,"sex":"0","phone":"13888888888","adss":"上海"},
			{"name":"json6","age":24,"sex":"0","phone":"13888888888","adss":'广州'},
			{"name":"json7","age":20,"sex":"0","phone":"13888888888","adss":"吉林省"},
			{"name":"json8","age":21,"sex":"0","phone":"13888888888","adss":"黑龙江"},
			{"name":"json9","age":22,"sex":"0","phone":"13888888888","adss":"辽宁"},
			{"name":"json10","age":23,"sex":"0","phone":"13888888888","adss":"北京"}
		]};

	var table = new DynamicAddRow("#table",{
		"tmplId"	: "#tableTmpl",		//模版id
		"tmplName"	: "tableTmpl1",		//模版name 便于查找一个table下有多个动态添加行的情况下
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
			$("#userTabke"+indexId).tooltip();
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

	$(document).on("click","#removeTbody",function(){
		table.replacement();
		indexId = 0;
	});

	$(document).on("click","#valieData",function(){
		$("#form1").valid();

	});

	$.validator.addMethod("validSelect2", function(value, element, params) {
		console.log(value);
		console.log(element);
		console.log(params);
		if(value.length == 0){
			console.log("验证失败");
			return false;
		}else{
			console.log("验证通过");
			return true;
		}
	}, "输出错误！！！");

	$(document).ready(function(){
		$("[data-toggle='tooltip']").tooltip();

		$("#form1").validate({
			ignore: ".ignore",
	        rules: {
			   validSelect2: "gggafg"
		    }
		});
	});
	
});
