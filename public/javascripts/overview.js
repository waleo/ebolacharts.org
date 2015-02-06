var casesColor = "#339",
    deathsColor = "#930";

var contentWidth = 930;

$('#reset').click(function () {
    dc.filterAll();
    dc.redrawAll();
});

//define charts
var casesDeathsChart = dc.compositeChart("#casesDeathsChart");
var cumulative = dc.compositeChart("#cumulative");
var mortality = dc.numberDisplay("#mortality");
var casesDeathsRowChart = dc.rowChart("#casesDeathsRowChart");
var map = dc.geoChoroplethChart("#map");
var datatable = dc.dataTable("#dc-data-table");

d3.csv("graph_data.csv", function (error, data) {

    //data pre-processing
    var countryNameRange = [];
    var parseDate = d3.time.format("%m/%_d/%Y").parse;

    data.forEach(function(d) {
      d.Date = parseDate(d.Date);

      if ($.inArray(d.Country, countryNameRange) == -1) {
          countryNameRange.push(d.Country);
      }
    });

    //crossfilter
    var ndx = crossfilter(data);
    var all = ndx.groupAll();

    var dayDimension = ndx.dimension(function (d) { return d.Date; });
    var countryDimension = ndx.dimension(function (d) { return d.Country; });
    var typeDimension = ndx.dimension(function (d) { return d.Type; });

    var typeGroup = typeDimension.group().reduceSum( function (d) {return d.Value });
    var casesGroup = dayDimension.group().reduceSum( function (d) {
        if (d.Type == "Cases") {
          return d.Value;
        }
        else {
          return 0;
        }
      });
    var deathsGroup = dayDimension.group().reduceSum( function(d) {
      if (d.Type == "Deaths") {
        return d.Value;
      }
      else {
        return 0;
      }
    });
    var countryGroup = countryDimension.group().reduceSum( function (d) {
        return d.Value;
    });
    var cumulativeCaseGroup = dayDimension.group().reduceSum( function (d) {
      if (d.Type == "Cases") {
        return d.TotalValue;
      }
      else {
        return 0;
      }
    })
    var cumulativeDeathsGroup = dayDimension.group().reduceSum( function (d) {
      if (d.Type == "Deaths") {
        return d.TotalValue;
      }
      else {
        return 0;
      }
    })

    //get the first and last day
    var minDay = dayDimension.bottom(1)[0].Date;
    var maxDay = dayDimension.top(1)[0].Date;

    var height = 198,
        shortHeight = 98;

    var lineChartWidth = contentWidth / 2;
    var rowChartWidth = contentWidth / 2;

    d3.json("locations.geojson", function (countriesJSON) {

      //mortality %
      mortality
        .valueAccessor(function(d) { return typeGroup.all()[1].value / typeGroup.all()[0].value; })
        .html({ some:"<span style=\"color:#339; font-size: 26px;\">Mortality</span><br><span style=\"color:#930; font-size: 46px;\">%number</span>" })
        .formatNumber(d3.format("%"))
        .group(typeGroup);

      //case deaths row chart
      casesDeathsRowChart
        .width(rowChartWidth - 22).height(shortHeight)
        .margins({top: 10, left: 10, right: 10, bottom: 20})
        .dimension(typeDimension)
        .group(typeGroup)
        .ordinalColors([casesColor, deathsColor])
        .label(function (d) {
          if (casesDeathsRowChart.hasFilter() && !casesDeathsRowChart.hasFilter(d.key)) {
            return d.key + " (0)";
          }
          else {
            var label = d.key;
            label += " (" + d.value + ")";
            return label;
          }
        })
        .elasticX(true)
        .labelOffsetY(17.5)
        .xAxis().ticks(3);

      //map
      map
        .width(contentWidth - 2).height(500)
        .dimension(countryDimension)
        .group(countryGroup)
        .projection(d3.geo.mercator()
          .scale((800) / Math.PI)
          .center([-25, 16]))
        .colors(d3.scale.quantize().range(["#DDD","#CCC","#BBB", "#AAA", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]))
        .colorDomain([0, typeGroup.all()[0].value])
        .colorCalculator(function (d) { return d ? map.colors()(d) : '#fff'; })
        .overlayGeoJson(countriesJSON.features, "country", function (d) {
            return d.properties.NAME;
        })
        .title(function (d) {
           return "Country: " + d.key + "\nCount: " + d.value;
        });


      //case deaths over time
      casesDeathsChart
        .width(lineChartWidth).height(197)
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .x(d3.time.scale().domain([minDay,maxDay]))
        .elasticY(true)
        .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
        .renderHorizontalGridLines(true)
        .compose([
            dc.lineChart(casesDeathsChart)
                .dimension(dayDimension)
                .colors(deathsColor)
                .renderArea(true)
                .group(deathsGroup, "Deaths Per Day"),
            dc.lineChart(casesDeathsChart)
                .dimension(dayDimension)
                .colors(casesColor)
                .group(casesGroup, "Cases Per Day")
                .renderArea(true)
        ])
        .brushOn(true)
        .mouseZoomable(true);

      //cumulative case deaths over time
      cumulative
        .width(lineChartWidth).height(197)
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .x(d3.time.scale().domain([minDay,maxDay]))
        .elasticY(true)
        .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5))
        .renderHorizontalGridLines(true)
        .compose([
            dc.lineChart(casesDeathsChart)
                .dimension(dayDimension)
                .colors(deathsColor)
                .renderArea(true)
                .group(cumulativeDeathsGroup, "Cumulative Deaths"),
            dc.lineChart(casesDeathsChart)
                .dimension(dayDimension)
                .colors(casesColor)
                .group(cumulativeCaseGroup, "Cumulative Cases")
                .renderArea(true)
        ])
        .brushOn(false);

      //data table
      datatable
        .dimension(dayDimension)
        .group(function(d) {return d.Day;})
        .columns([
            function(d) {return d.Day;},
            function(d) {return d.Country;},
            function(d) {return d.Type;},
            function(d) {return d.Value;},
            function(d) {return d.TotalValue;}
        ]);

    dc.renderAll();
  });
});
