var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Ebola 2014 Interactive Chart Data Visualization',
                        description: 'Interactive Chart and Data for the 2014 Ebola Outbreak',
                        keywords: 'ebola, 2014, ebola 2014, chart, data, ebola charts, ebola data, outbreak, virus, graph',
                        author: 'Akinwale Wale Olaleye'});
});

module.exports = router;
