var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
	const components = [
		{
			tag: "road",
			label: "道路",
			iconColor: "hsl(0, 0%, 11%)",
			isDirectional: true,
		},
		{
			tag: "sidewalk",
			label: "人行道",
			iconColor: "rgb(145, 39, 39)",
			isDirectional: false,
		},
		{
			tag: "bollard",
			label: "分隔島",
			iconColor: "rgb(143, 143, 143)",
			isDirectional: false,
		},
	];

	/*
	res.render('index', { 
		title: 'Express',
		aaa: "sdasdasdasda",
		layout:"layout/layout"
	});
  */
	res.render('editor', { 
		title: 'Express',
		componentList: components,
		layout:"layout/editor_layout"
	});
});

module.exports = router;
