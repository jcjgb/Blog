require(["jquery","slide","tab"],function($){
	$("#slideBox").slide({
		titCell:".shead ul",
		mainCell:".sbody ul",
		autoPage:true,
		effect:"left",
		autoPlay:true
	});
});