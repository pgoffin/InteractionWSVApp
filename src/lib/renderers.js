/**
* renderers v1.0
**/

module.exports = {
	/**
	* Builds a classic sparkline (word-scale visualization) without or with interaction.
	* this.element and this.options is alvailable in the renderer if needed
	* @param {string} sparkSpan - the container where the word-scale visualization is placed
	* @param {int} width - width of the word-scale visualization
	* @param {int} height - height of the word-scale visualization
	* @param {boolean} interaction - hover interaction for this word-scale visualization or not
	* @param {array} data - word-scale visualization's array of data
	**/
	classicSparkline: function(sparkSpan, width, height, interaction, environment, data) {

		var circleRadius = 2.5;

		var o = this.options;

		var margin = { top: 3, right: 5, bottom: 3, left: 5 },
		    widthVis = width,// - margin.left - margin.right,
		    heightVis = height;// - margin.top - margin.bottom;

		var sparkContainer = d3.select(sparkSpan.get(0));

		var chart;
		if (sparkContainer.select('.lineChart').empty()) {
			chart = sparkContainer.append('svg')
				.attr('width', widthVis + 'px')
				.attr('height', heightVis + 'px')
				.attr('class', 'lineChart');
		}

		var x = d3.scale.linear()
			.domain([0, data[0].values.length-1])
		  .range([margin.left, widthVis-margin.right-margin.left]);


		var y = d3.scale.linear()
			.domain([d3.min(data[0].values, function(d) { return d.close }), d3.max(data[0].values, function(d) { return d.close })])
			//.domain([-15, 18])
			.range([heightVis-margin.top - margin.bottom, margin.bottom]);

		var color = d3.scale.ordinal()
				.domain(data.map(function(d) { return d.id; }))
				.range(["#000","#3182bd","#e6550d"]);

		var line = d3.svg.line()
			.x(function(d, i) { return x(i); })
			.y(function(d, i) {
				// console.log(d);
				return y(d.close); });

		var zeroLine = d3.svg.line()
			.x(function(d, i) { return x(i); })
			.y(function(d, i) { return y(0); });

		var voronoi = d3.geom.voronoi()
			.x(function(d) { return x(d[0]); })
			.y(function(d) { return y(d[1]); })
			.clipExtent([[-margin.left, -margin.top], [widthVis + margin.right, heightVis + margin.bottom]]);

		// select sparklificatedSPAN, as the entity might be longer than the word-scale visualization
		var entity = $(sparkSpan).closest($('.sparklificated'));
		if (interaction) {
			entity.on('mouseover', fade(1))
						.on('mouseout', fade(0.1));
		}

		// get or create graphics element for the chart
		var gChart;
	 	if (d3.select($(sparkSpan).parent().get(0)).select('.gChart').empty()) {
			gChart = chart.append('g').attr('class', 'gChart');
		} else {
			gChart = d3.select($(sparkSpan).parent().get(0)).select('.gChart')
		}
		var wsv = gChart.selectAll('.wsv').data(data, function(d) { return d.id; });

		// On enter, build up all the chart elements
		var gWsv = wsv.enter().append('g');
		gWsv.attr('class', 'wsv')
			.attr('id', function(d) { return 'ID_' + d.id });
		wsv.select('.sparkline')
			.style('stroke', function(d) { return color(d.id); });


		var zeroPath = gWsv.append('path')
			.attr('class', 'zeroLine')
			.attr('d', function(d) { return zeroLine(d.values); });

		var path = gWsv.append('path')
			.attr('class', 'sparkline')
			.attr('id', function(d) { return 'ID_' + d.id })
			.attr('d', function(d) { return line(d.values); })
			.style('fill', 'none')
			.style('stroke', function(d) { return color(d.id); })
			.style('stroke-width', '1.5px');
			// .style('stroke-width', '2.5px');

		gWsv.append('circle')
			.style('fill', '#ff0000')
			.style('stroke', 'none')
			.attr('r', circleRadius)
			.attr('cx', x(data[data.length - 1].values.length - 1))
			.attr('cy', y(data[data.length - 1].values[data[data.length - 1].values.length - 1].close));

		// circle and text label for hover
		var hoverCircle = gWsv.append('g')
			.attr('class', 'hoverCircle hide');
		hoverCircle.append('circle')
			.attr('r', 2.5);
		hoverCircle.append('text').attr("transform","translate(-10,-3)");

		// Create the voronoi group used for selection
		var voronoiGroup;
		if (gChart.select('.voronoi').empty()) {
			voronoiGroup = gChart.append('g')
				.attr('class', 'voronoi')
				.style('overflow','hidden');
		} else {
			voronoiGroup = gChart.select('.voronoi');
		}

		var thePath = voronoiGroup.selectAll('path')
			.data(voronoi(data[0].values.map(function(d, i) {
				return [i, d.close] })));

		thePath.enter().append('path')
				.attr('d', function(d) { return d ? 'M' + d.join('L') + 'Z' : null; });

		// Handle opacity to suggest interaction
		if (!interaction) {
			gChart.style('opacity', 1.0);
		} else {
			gChart.style('opacity', 0.1);
		}

		thePath.on('mouseover', mouseover)
				.on('mouseout', mouseout);


		function mouseover(d) {
			if (!action) { // if for example no diff dragging is happening brushing and linking is ok

				// Find the currently selected sparkline
				var currentSparklineSpan = this.parentElement.parentElement.parentElement.parentElement;

				if (((environment === 'not_cloned') && !d3.select(currentSparklineSpan).classed('clonedWSV')) ||
					((environment === 'only_cloned') && (d3.select(currentSparklineSpan).classed('clonedWSV') ||
						d3.select(currentSparklineSpan).classed('currentEntity')))) {

					// Iterate through all similar sparklines and apply a brushing highlight
					var theSelector = '';
					if (environment === 'not_cloned') {
						theSelector = '.sparkline:not(.clonedWSV) .lineChart';
					} else if (environment === 'only_cloned') {
						theSelector = '.sparkline.clonedWSV .lineChart, .sparkline.currentEntity .lineChart';
					}
					d3.selectAll(theSelector).each(function(a){

						var theHoverCircle = d3.select(this).selectAll('.hoverCircle');
						theHoverCircle.classed('hide', false);
						theHoverCircle.each(function(aCircle, i) {

							var theData = d3.select(this).datum();

							var newXscale = d3.scale.linear()
								.domain([0, theData.values.length-1])
								.range([margin.left, widthVis-margin.left-margin.right]);

							var newYscale = d3.scale.linear()
								.domain([d3.min(theData.values, function(d) { return d.close }), d3.max(theData.values, function(d) { return d.close })])
								//.domain([-15, 18])
								.range([heightVis-margin.top-margin.bottom, margin.bottom]);

							// Check to see if this sparkline has a matching X
							if(d.point[0] >= 0 && d.point[0] < theData.values.length){
								// Get X and Y values
								var dataX = d.point[0];
								var dataY = theData.values[d.point[0]].close;
								// Update label and reposition
								d3.select(this).selectAll("text").text(dataY.toFixed(2));
								d3.select(this).attr('transform', 'translate(' + newXscale(dataX) + ',' +
																		     newYscale(dataY) + ')');
							}
							else theHoverCircle.classed('hide', true);
						});
					});
				}
			}
		}


		function mouseout() {
			d3.selectAll('.hoverCircle').classed('hide', true);
		}


		// Returns an event handler for fading in the sparkline graph.
		function fade(opacity) {
			return function(g, i) {
				chart.select('g')
					.transition()
					.style('opacity', opacity);

				var textOpacity = 0.25;
				if (opacity == 0.1) { textOpacity = 1; }

				d3.select($(sparkSpan).siblings('.entity')[0]).style('opacity',textOpacity)
			};
		}

		// exit condition
		wsv.exit().remove();
	},

	/**
	* Builds a classic sparkline (word-scale visualization) without or with interaction.
	* this.element and this.options is alvailable in the renderer if needed
	* @param {string} sparkSpan - the container where the word-scale visualization is placed
	* @param {int} width - width of the word-scale visualization
	* @param {int} height - height of the word-scale visualization
	* @param {boolean} interaction - hover interaction for this word-scale visualization or not
	* @param {array} data - word-scale visualization's array of data
	**/
	stockPriceSparkline: function(sparkSpan, width, height, interaction, environment, data) {

		var circleRadius = 3;

		var o = this.options;

		var margin = { top: 3, right: 5, bottom: 3, left: 5 },
		    widthVis = width,// - margin.left - margin.right,
		    heightVis = height;// - margin.top - margin.bottom;

		var sparkContainer = d3.select(sparkSpan.get(0));

		var chart;
		if (sparkContainer.select('.lineChart').empty()) {
			chart = sparkContainer.append('svg')
				.attr('width', widthVis + 'px')
				.attr('height', heightVis + 'px')
				.attr('class', 'lineChart');
		}

		var x = d3.scale.linear()
			.domain([0, data[0].values.length-1])
		  	.range([margin.left, widthVis-margin.right-margin.left]);


		var y = d3.scale.linear()
			.domain([d3.min(data[0].values, function(d) { return d.close }), d3.max(data[0].values, function(d) { return d.close })])
			//.domain([-15, 18])
			.range([heightVis - margin.top - margin.bottom, margin.bottom]);

		var color = d3.scale.ordinal()
				.domain(data.map(function(d) { return d.id; }))
				.range(["#000","#3182bd","#e6550d"]);

		var line = d3.svg.line()
			.x(function(d, i) { return x(i); })
			.y(function(d, i) { return y(d.close); });

		var aboveArea = d3.svg.area()
			.x(function(d, i) { return x(i); })
			.y0(function(d, i) { return y(Math.max(d.close, 0)); })
			.y1(function(d, i) { return y(0); });

		var belowArea = d3.svg.area()
			.x(function(d, i) { return x(i); })
			.y0(function(d, i) { return y(Math.min(d.close, 0)); })
			.y1(function(d, i) { return y(0); });

		var zeroLine = d3.svg.line()
			.x(function(d, i) { return x(i); })
			.y(function(d, i) { return y(0); });

		var baseLine = d3.svg.line()
			.x(function(d, i) { return x(d.x); })
			.y(function(d, i) { return y(0); });

		var dropLine = d3.svg.line()
			.x(function(d, i) { return x(d.x); })
			.y(function(d, i) { return d.y; });

		var bottomLine = d3.svg.line()
			.x(function(d, i) { return x(d.x); })
			.y(function(d, i) { return 21; }); //FIXME: redefine in terms of heightVis & margin

		var voronoi = d3.geom.voronoi()
			.x(function(d) { return x(d[0]); })
			.y(function(d) { return y(d[1]); })
			.clipExtent([[-margin.left, -margin.top], [widthVis + margin.right, heightVis + margin.bottom]]);

		var maxX = d3.scan(data[0].values, function(a,b){return b.close - a.close});
		var maxY = d3.max(data[0].values, function(d){return d.close});
		var minX = d3.scan(data[0].values, function(a,b){return a.close - b.close});
		var minY = d3.min(data[0].values, function(d){return d.close});


		// select sparklificatedSPAN, as the entity might be longer than the word-scale visualization
		var entity = $(sparkSpan).closest($('.sparklificated'));
		if (interaction) {
			entity.on('mouseover', fade(1))
				  .on('mouseout', fade(0.1));
		}

		// get or create graphics element for the chart
		var gChart;
	 	if (d3.select($(sparkSpan).parent().get(0)).select('.gChart').empty()) {
			gChart = chart.append('g').attr('class', 'gChart');
		} else {
			gChart = d3.select($(sparkSpan).parent().get(0)).select('.gChart')
		}
		var wsv = gChart.selectAll('.wsv').data(data, function(d) { return d.id; });

		// On enter, build up all the chart elements
		var gWsv = wsv.enter().append('g');
		gWsv.attr('class', 'wsv')
			.attr('id', function(d) { return 'ID_' + d.id });
		wsv.select('.sparkline')
			.style('stroke', function(d) { return color(d.id); });

		// Shaded area above zero
		var aboveZeroArea = gWsv.append('path')
			.attr('class', 'aboveZeroArea')
			.attr('id', function(d) { return 'ID_' + d.id })
			.attr('d', function(d) { return aboveArea(d.values); });

		// Shaded area above zero
		var belowZeroArea = gWsv.append('path')
			.attr('class', 'belowZeroArea')
			.attr('id', function(d) { return 'ID_' + d.id })
			.attr('d', function(d) { return belowArea(d.values); });

		// Zero line
		var zeroPath = gWsv.append('path')
			.attr('class', 'zeroLine')
			.attr('d', function(d) {
				return baseLine([{x:0},{x:d.values.length-1}]);
			});

		// Drop lines
		var minDropLinePath = gWsv.append('path')
			.attr('class', 'dropLine')
			.attr('d', function(d) {
				return dropLine([{x:minX,y:y(minY)},{x:minX, y:22}]); //FIXME: redefine in terms of heightVis & margin
			});
		var maxDropLinePath = gWsv.append('path')
			.attr('class', 'dropLine')
			.attr('d', function(d) {
				return dropLine([{x:maxX,y:y(maxY)},{x:maxX, y:22}]); //FIXME: redefine in terms of heightVis & margin
			});

		// Highlight the range between lowest and highest points in the background
		var bottomLinePath = gWsv.append('path')
			.attr('class', 'lowestHighestLine')
			.attr('d', function(d) {
				return bottomLine([{x:minX},{x:maxX}]);
			});

		// Line chart
		var path = gWsv.append('path')
			.attr('class', 'sparkline')
			.attr('id', function(d) { return 'ID_' + d.id })
			.attr('d', function(d) { return line(d.values); })
			.style('fill', 'none')
			.style('stroke', function(d) { return color(d.id); })
			.style('stroke-width', '1.5px');

		// End circle
		gWsv.append('circle')
			.attr('class', 'endCircle')
			.attr('r', circleRadius)
			.attr('cx', x(data[data.length - 1].values.length - 1))
			.attr('cy', y(data[data.length - 1].values[data[data.length - 1].values.length - 1].close));

		// Min circle
		gWsv.append('circle')
			.attr('class', 'minCircle')
			.attr('r', circleRadius - 0.5)
			.attr('cx', x(minX))
			.attr('cy', y(minY));

		// Max circle
		gWsv.append('circle')
			.attr('class', 'maxCircle')
			.attr('r', circleRadius - 0.5)
			.attr('cx', x(maxX))
			.attr('cy', y(maxY));

		// circle and text label for hover
		var hoverCircle = gWsv.append('g')
			.attr('class', 'hoverCircle hide');
		hoverCircle.append('circle')
			.attr('r', 2.5);
		hoverCircle.append('text').attr("transform","translate(-10,-3)");

		// Create the voronoi group used for selection
		var voronoiGroup;
		if (gChart.select('.voronoi').empty()) {
			voronoiGroup = gChart.append('g')
				.attr('class', 'voronoi')
				.style('overflow','hidden');
		} else {
			voronoiGroup = gChart.select('.voronoi');
		}

		var thePath = voronoiGroup.selectAll('path')
			.data(voronoi(data[0].values.map(function(d, i) {
				return [i, d.close] })));

		thePath.enter().append('path')
				.attr('d', function(d) { return d ? 'M' + d.join('L') + 'Z' : null; });

		// Handle opacity to suggest interaction
		if (!interaction) {
			gChart.style('opacity', 1.0);
		} else {
			gChart.style('opacity', 0.1);
		}

		thePath.on('mouseover', mouseover)
				.on('mouseout', mouseout);


		function mouseover(d) {
			if (!action) { // if for example no diff dragging is happening brushing and linking is ok

				// Find the currently selected sparkline
				var currentSparklineSpan = this.parentElement.parentElement.parentElement.parentElement;

				if (((environment === 'not_cloned') && !d3.select(currentSparklineSpan).classed('clonedWSV')) ||
					((environment === 'only_cloned') && (d3.select(currentSparklineSpan).classed('clonedWSV') ||
						d3.select(currentSparklineSpan).classed('currentEntity')))) {

					// Iterate through all similar sparklines and apply a brushing highlight
					var theSelector = '';
					if (environment === 'not_cloned') {
						theSelector = '.sparkline:not(.clonedWSV) .lineChart';
					} else if (environment === 'only_cloned') {
						theSelector = '.sparkline.clonedWSV .lineChart, .sparkline.currentEntity .lineChart';
					}
					d3.selectAll(theSelector).each(function(a){

						var theHoverCircle = d3.select(this).selectAll('.hoverCircle');
						theHoverCircle.classed('hide', false);
						theHoverCircle.each(function(aCircle, i) {

							var theData = d3.select(this).datum();

							var newXscale = d3.scale.linear()
								.domain([0, theData.values.length-1])
								.range([margin.left, widthVis-margin.left-margin.right]);

							var newYscale = d3.scale.linear()
								.domain([d3.min(theData.values, function(d) { return d.close }), d3.max(theData.values, function(d) { return d.close })])
								//.domain([-15, 18])
								.range([heightVis-margin.top-margin.bottom, margin.bottom]);

							// Check to see if this sparkline has a matching X
							if(d.point[0] >= 0 && d.point[0] < theData.values.length){
								// Get X and Y values
								var dataX = d.point[0];
								var dataY = theData.values[d.point[0]].close;
								// Update label and reposition
								d3.select(this).selectAll("text").text(dataY.toFixed(2) + "%");
								d3.select(this).attr('transform', 'translate(' + newXscale(dataX) + ',' +
																		     newYscale(dataY) + ')');
							}
							else theHoverCircle.classed('hide', true);
						});
					});
				}
			}
		}


		function mouseout() {
			d3.selectAll('.hoverCircle').classed('hide', true);
		}


		// Returns an event handler for fading in the sparkline graph.
		function fade(opacity) {
			return function(g, i) {
				chart.select('g')
					.transition()
					.style('opacity', opacity);

				var textOpacity = 0.25;
				if (opacity == 0.1) { textOpacity = 1; }

				d3.select($(sparkSpan).siblings('.entity')[0]).style('opacity',textOpacity)
			};
		}

		// exit condition
		wsv.exit().remove();
	},


	/**
	* Builds a bar chart (word-scale visualization)
	* this.element and this.options is alvailable in the renderer if needed
	* @param {string} sparkSpan - the container where the word-scale visualization will be put in
	* @param {int} width - width of the word-scale visualization
	* @param {int} height - height of the word-scale visualization
	* @param {boolean} interaction - hover interaction for this word-scale visualization or not
	* @param {array} data - word-scale visualization's array of data
	**/
	barChart: function(sparkSpan, width, height, interaction, data) {

		var o = this.options;

		var margin = {top: 0, right: 0, bottom: 0, left: 0},
		    widthVis = width - margin.left - margin.right,
		    heightVis = height - margin.top - margin.bottom;

		var barWidth = 5;


		var newData = data;

		var sparkContainer = d3.select(sparkSpan.get(0));

	// !!!!! select('svg') never works check with classicSparkline to fix it, not right
		if (d3.select($(sparkSpan).parent().get(0)).select('svg').empty()) {
			sparkContainer.append('svg');
		}

		var x0 = d3.scale.ordinal()
	    	.rangeRoundBands([0, width], .1, 0);

	    x0.domain(newData.map(function(d) { return d.name; }));

		var y = d3.scale.linear()
			.domain([0, d3.max(newData[0].values, function(d) { return d })])
			.range([0, heightVis]);

	// !!!!! select('svg') never works check with classicSparkline to fix it
		var chart = sparkContainer.select('svg')
			.style('position', 'absolute')
			.attr('width', widthVis+'px')
			.attr('height', heightVis+'px')
			.attr('class', 'barChart');


		// select sparklificatedSPAN, as the entity might be longer than the word-scale visualization
		var entity = $(sparkSpan).closest($('.sparklificated'));
		if (interaction) {
			entity.on('mouseover', fade(1))
				  .on('mouseout', fade(0.1));
		}


		var wsv = chart.selectAll('.wsv')
					.data(newData);

		// update old elements
		wsv.classed('originalData', true);

		var gWsv = wsv.enter().append('g')
					.attr('class', 'wsv')
					.attr('transform', function(d) { return 'translate(' + x0(d.id) + ',0)'; });

		gWsv.classed({'newData': true})


		var gBar = gWsv.selectAll('g.bar')
				.data(function(d) {return d.values; })
			.enter().append('g')
				.attr('class', 'bar')
				.append('g')
				.attr('transform', function(d, i) { return 'translate(' + i * barWidth + ',' + (heightVis - y(d)) + ')'; });


		// gBar.classed({'newData': true});

		gBar.append('rect')
		    .attr('width', barWidth - 2)
		    .attr('height', function(d, i) { return y(d); });


		if (!interaction) {
			gBar.select('rect').style('opacity', 1.0);
		} else {
			gBar.select('rect').style('opacity', 0.1);
		}

		// bar.attr('transform', function(d, i) { return 'translate(' + i * barWidth + ',' + (heightVis - y(d.values[i])) + ')'; });
		// bar.select('rect').attr('height', function(d, i) { return y(d); });

		// bar.exit().remove();


		// Returns an event handler for fading in the sparkline graph.
		function fade(opacity) {
		    return function(g, i) {
				chart.selectAll('rect')
					.transition()
					.style('opacity', opacity);

				var textOpacity = 0.25;
				if (opacity == 0.1) { textOpacity = 1; }

				d3.select($(sparkSpan).siblings('.entity')[0]).style('opacity',textOpacity)
		    };
		}
	},


	/**
	* Builds a pie chart (word-scale visualization)
	* this.element and this.options is alvailable in the renderer if needed
	* @param {string} sparkSpan - the container where the word-scale visualization will be put in
	* @param {int} width - width of the word-scale visualization
	* @param {int} height - height of the word-scale visualization
	* @param {boolean} interaction - hover interaction for this word-scale visualization or not
	* @param {array} data - word-scale visualization's array of data
	**/
	pieChart: function(sparkSpan, width, height, interaction, data) {

		var o = this.options;

		var margin = {top: 0, right: 0, bottom: 0, left: 0},
		    widthVis = width - margin.left - margin.right,
		    heightVis = height - margin.top - margin.bottom;

		var radius = Math.min(widthVis, heightVis) / 2;

		var color = d3.scale.ordinal()
	    	.range(["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c"]);

		// clipping data array
		var newData = data;
		if (data.length > 6) {
			newData = data.slice(0,6);
		}

		var arc = d3.svg.arc()
		    .outerRadius(radius - 2)
		    .innerRadius(0);

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return d; });

		var sparkContainer = d3.select(sparkSpan.get(0));
		sparkContainer.append('svg');

		var chart = sparkContainer.select('svg')
		    .attr('width', widthVis)
		    .attr('height', heightVis);


		// select sparklificatedSPAN, as the entity might be longer than the word-scale visualization
		var entity = $(sparkSpan).closest($('.sparklificated'));
		//var entity = $(sparkSpan).siblings($('.entity'));
		if (interaction) {
			entity.on('mouseover', fade(1))
				  .on('mouseout', fade(0.1));
		}


		var gChart = chart.append('g')
		    .attr('transform', 'translate(' + widthVis / 2 + ',' + heightVis / 2 + ')');

		var g = gChart.selectAll('.arc')
				.data(pie(newData))
			.enter().append('g')
			.attr('class', 'arc');

		g.append('path')
			.attr('d', arc)
			// .style('stroke', 'black')
		 //    .style('stroke-width', '2px');
		    .style("fill", function(d, i) { return color(i); });


		if (!interaction) {
			chart.selectAll('path').style('opacity', 1.0);
		} else {
			chart.selectAll('path').style('opacity', 0.1);
		}


		// Returns an event handler for fading in the sparkline graph.
		function fade(opacity) {
		    return function(g, i) {
				chart.selectAll('path')
					.transition()
					.style('opacity', opacity);

				var textOpacity = 0.25;
				if (opacity == 0.1) { textOpacity = 1; }

				d3.select($(sparkSpan).siblings('.entity')[0]).style('opacity',textOpacity)
		    };
		}
	},

	buildWikiChart: function(sparkSpan, width, height, interaction, environment, data) {

	  const startPointDate = Date.parse('1 January 1850');
		const endPointDate = Date.parse('1 January 1970');
		const maxBarLength = Math.round((endPointDate - startPointDate)/(1000*60*60*24));

	  var dataToShow = [data.numberOfDays];
		//var maxViews = d3.max(data, function(d) {return d.numberOfDays});
		var maxViews = maxBarLength;
		var startPoint = [data.startPoint];

	  var transparencyON = true;

	  var margin = {top: 0, right: 0, bottom: 0, left: 0},
	      widthVis = width - margin.left - margin.right,
	      heightVis = height - margin.top - margin.bottom;

	  var barWidth = 10;

	  var sparkContainer = d3.select(sparkSpan.get(0));

		var chart;
		if (sparkContainer.select('.barChart').empty()) {
			chart = sparkContainer.append('svg')
				.attr('width', widthVis + 'px')
				.attr('height', heightVis + 'px')
				.attr('class', 'barChart');
		}

	  var x = d3.scaleLinear()
	      .domain([0, maxViews])
	      .range([0, widthVis]);

		var xAxis = d3.axisBottom(x)
	  // var xAxis = d3.svg.axis()
	  //     .scale(x)
	  //     .orient("bottom")
	      .ticks(1)
	      .tickFormat(function (d) { return ''; });

	  // var chart = sparkContainer.select('svg')
	  //     .attr('width', widthVis)
	  //     .attr('height', heightVis)
	  //     .attr('class', 'barChart');

	  // if (transparencyON) {
	  //     chart.on('mouseover.trpON', fade(1))
	  //         .on('mouseout.trpON', fade(0.1));
	  // }

		// get or create graphics element for the chart
		var gChart;
	 	if (d3.select($(sparkSpan).parent().get(0)).select('.gChart').empty()) {
			gChart = chart.append('g').attr('class', 'gChart');
		} else {
			gChart = d3.select($(sparkSpan).parent().get(0)).select('.gChart')
		}

		var wsv = gChart.selectAll('.wsv').data([data]);

		// On enter, build up all the chart elements
		var gWsv = wsv.enter().append('g')
									.attr('class', 'wsv');

			// .attr('id', function(d) { return 'ID_' + d.id });
		// wsv.select('.sparkline')
		// 	.style('stroke', function(d) { return color(d.id); });

	  var bar = gWsv.selectAll('g.bar')
	          .data(dataToShow);

	  var gBar = bar.enter().append('g')
	      .attr('class', 'bar')
				.append('g')
	      .attr('transform', function() { return 'translate(' + x(startPoint) + ',' + (heightVis - barWidth) + ')'; });

	  gBar.append('rect')
	      .attr('width', function(d) {
	      			var theWidth = x(d)
	      	       console.log(theWidth);
	      	       if (Math.round(theWidth) === 0) { theWidth = 1; }
	      	       return theWidth; })
	      .attr('height', barWidth)
	      .attr('fill', '#39A4DD');

	  gWsv.append('g')
	          .attr('class', 'x axis')
	          .attr('transform', 'translate(0,' + (heightVis - (barWidth/2)) + ')')
	          .call(xAxis);

	  gWsv.select('.axis path').style('stroke', '#000')
	                            .style('shape-rendering', 'crispEdges')
	                            .style('fill', 'none')
	                            .style('stroke-width', '1');

	  // bar.on('mouseover.shTxt', showText);
	  // bar.on('mouseout.shTxt', removeText);

	  // if (!transparencyON) {
	  //     gBar.select('rect').style('opacity', 1.0);
	  //     chart.select('.axis path').style('opacity', 1.0);
	  // } else {
	  //     gBar.select('rect').style('opacity', 0.1);
	  //     chart.select('.axis path').style('opacity', 0.1);
	  // }

	  // bar.attr('transform', function(d, i) { return 'translate(' + 0 + ',' + (heightVis - barWidth) + ')'; });
	  // bar.select('rect').attr('width', function(d) { return x(d); });


	  // Returns an event handler for fading in the bar graph.
	  function fade(opacity) {

	      return function() {
	          gWsv.selectAll('rect')
	               .transition()
	              .style('opacity', opacity);
	          gWsv.selectAll('.axis path')
	               .transition()
	              .style('opacity', opacity);
	        };
	  }

		wsv.exit().remove();

	  // event handler for showing the text.
	  // function showText(d) {

	  //     chart.append('text')
	  //             .attr('x', 0)
	  //             .attr('y', heightVis - barWidth - 4)
	  //             .attr('class', 'label')
	  //             //.attr('dy', '.5em')
	  //             .style('text-anchor', 'start')
	  //             .style('font-size', 7 + 'pt')
	  //             .style('font', 'Arial')
	  //             .text(d + ' visits in this month');
	  // }

	  // // event handler for removing the text.
	  // function removeText(d) {

	  //     chart.select('.label').remove();
	  // }
	}
}
