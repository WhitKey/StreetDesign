var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
	const components = [
		{
			tag: "road",
			label: "道路",
			iconColor: "hsl(0, 0%, 11%)",
		},
		{
			tag: "sidewalk",
			label: "人行道",
			iconColor: "rgb(145, 39, 39)",
		},
		{
			tag: "bollard",
			label: "分隔島",
			iconColor: "rgb(143, 143, 143)",
		},
		{
			tag: "shoulder",
			label: "路肩",
			iconColor: "hsl(0, 0%, 11%)",
		},
	];

	res.render('editor', { 
		title: 'Express',
		componentList: components,
		developing: true,
		layout:"layout/editor_layout"
	});
});

router.get("/entry", function(req, res, next){
	res.render('entrySettingPage', {
		title: 'Express',
		layout: "layout/entry_layout"
	});
})

module.exports = router;
