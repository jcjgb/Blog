require(["jquery","modal","popover"],function($){

	//验证大于1 最多2位小数
	function getReg(o){
		var reg = /^[1-9]+(.|(.[0-9]{1,2}))?$/;
		alert(reg.test(o));
	}

	function addTable(){
		var stg = $("#addTa").clone();
		$("#addTa").after(stg);
	}

	$(document).ready(function() {
	  	$(".table-zebra tbody tr:odd").addClass("odd");
	  	$(".table-zebra tbody tr:even").addClass("even");

	  	$('[data-toggle="tooltip"]').tooltip();
		$('[data-toggle="popover"]').popover();
	});
});