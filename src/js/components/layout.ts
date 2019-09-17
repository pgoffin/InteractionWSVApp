const constants = require('../constants');

import { text } from '../components';
import Measurements from '../measurements';


class Layout {

    _layoutInfo = {type: '',
                  topLeftCorner_left: 0,
                  topLeftCorner_top: 0,
                  numberOfColumns: 0,
                  cell_dimensions: {width: 0, height: 0},
                  spaceBetweenGridCells: 0,
                  viewportLeft: 0,
                  viewportRight: 0,
                  viewportTop: 0,
                  viewportBottom: 0};

    _currentLayout: string = '';

    _measurementArray = [];


    initializeLayout() {

      this._layoutInfo.spaceBetweenGridCells = 4;
    }

    get currentLayout(): string {
      return this._currentLayout;
    }

    set currentLayout(aLayout: string) {
      this._currentLayout = aLayout;
    }

    get measurementArray() {
      return this._measurementArray;
    }

    set measurementArray(anArray) {
      this._measurementArray = anArray;
    }

    set layoutInfo(keyValuePair) {
      this._layoutInfo[keyValuePair[0]] = keyValuePair[1];
    }


    changeLayout(type, why)  {
      // getBoundingClientRect() gives position relative to the viewport
      // offset() gives and sets position relative to the document
      // offset().top - $(window).scrollTop() = getBoundingClientRect().top

      // reset animation sequence array
      let mySequence = [];

// TOBEDONE move to dbclick handler
	// // set closest entity as currentEntity if no currentEntity
	// if (currentEntity === null) {
	// 	// set_randomCurrentEntity();
  //
	// 	set_closestEntityAsCurrentEntity(dblClickLocation);
  //
	// 	if (currentEntity === null) {
	// 		// no entities in visible space of the page
	// 		alert('an entity needs to be visible to gather charts using double clicking!!');
	// 		return
	// 	}
  //
	// 	// debugging
	// 	// console.log($('.entity.currentEntity').text());
  //
	// 	if (!($('.entity.selected').length > 1)) {
	// 		$('.entity').addClass('selected');
	// 	}
	// }

      // remove_SuggestedInteractivity(type);

      let currentWSV = $(text.currentEntity).parent();

      let bbox_currEntity = Measurements.get_BBox_entity(currentWSV);
      let bbox_currWSV =  Measurements.get_BBox_wsv(currentWSV, constants.positionType);


      if (this.measurementArray.length == 0) {

        this.measurementArray = Measurements.get_allWSV_measurements(constants.positionType);
        let measurementArray_withoutCurrEntity = this.remove_currEntityfromMeasureArray(this.measurementArray);

        let cellDimensions = Measurements.get_cellDimensions(this.measurementArray);
        this.layoutInfo = ['cell_dimensions', cellDimensions]
        this.layoutInfo = ['bbox_currentWSV', bbox_currWSV]


		// add a flag if element is above or below the current entity
		measurementArray_withoutCurrEntity.each(function() {
			// aboveOrBelow decides if wsv is placed above or below the current entity
			this.aboveOrBelow = (this.entityBbox.top > bbox_currEntity.bottom) ? 'below' : 'above';

			this.docPosition = {'left': this.entityBbox.left + this.entityBbox.width/2.0, 'top': this.entityBbox.top + this.entityBbox.height/2.0}

			if (positionType === 'right') {
				this.middleBoundOffset = bbox_currEntity.width - this.entityBbox.width;

				this.offset_whiteLayer = cellDimensions.width - this.sparklineBbox.width - this.entityBbox.width;
			}

			// also check if 'selected'
			// if selected the wsv (.sparklificated) is pushed into wsv_cloned
			if ($(this.anEntity).hasClass('selected')) {
				// add a distance value between entity and currentEntity
				this.distanceToCurrEntity = bbox_currEntity.top - this.entityBbox.top;


				// push info about the data
				var wsv_data = getWSVData(this.anEntity[0]);

				if (typeof wsv_data.values != 'undefined') {

					var max_value = Math.max.apply(null, wsv_data.values.map(function(v, i) {
							return v.close;
					}));

					this.max_data_value = max_value;

					this.last_data_value = wsv_data.values[wsv_data.values.length - 1]['close']

					var min_value = Math.min.apply(null, wsv_data.values.map(function(v, i) {
							return v.close;
					}));

					this.min_data_value = min_value;

				} else {

					this.max_data_value = 0;
					this.min_data_value = 0;
				}

				this.entityName = this.anEntity.text().toLowerCase();

				WSV_cloned.push(this);
			}

		});

		// order first by above or below, then use x positioning
		// measurementArray_withoutCurrEntity.sort(dl.comparator(['+aboveOrBelow', '+wsvBbox.top']));

		// order the two arrays by their top value then by their left value
		// above_wsvArray.sort(dl.comparator(['+wsvBbox.distanceToCurrEntity', '+wsvBbox.left']));
		// below_wsvArray.sort(dl.comparator(['+wsvBbox.distanceToCurrEntity', '+wsvBbox.left']));
		// above_wsvArray.sort(dl.comparator(['+wsvBbox.distanceToCurrEntity']));
		// below_wsvArray.sort(dl.comparator(['+wsvBbox.distanceToCurrEntity']));

		// order first by above or below, then use x positioning
		WSV_cloned.sort(dl.comparator(['+aboveOrBelow', '-distanceToCurrEntity']));

	} else {
		// link to old (already calculated) cellDimensions
		var cellDimensions = layoutInfo.cell_dimensions
	}





	var rowAndColumnNumbers = spaceAvailability_numberColAndRows(currentWSV, positionType, type, 'middleBound', measurementArray, cellDimensions.width, cellDimensions.height, layoutInfo.spaceBetweenGridCells);
	layoutInfo.rowAndColumnNumbers = rowAndColumnNumbers;


// TODO need to update each layout for changes in layout!!!!!!

	var topLeftCorner_left = 0;

	switch(type) {
		case 'grid':

			layoutInfo.type = 'grid';

			var numOfColumns = rowAndColumnNumbers.leftNumbColumn + rowAndColumnNumbers.currentEntityColumn + rowAndColumnNumbers.rightNumbColumn;
			var numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
			var numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;

			layoutInfo.numberOfColumns = numOfColumns;

			// first move wsv up and down if there is not enough space above or below
			// wsv moved up or down are the ones furthest away
			// either maximising space --> overflowing wsv are either moved up or down if space permits
			// if there is no enough space to accomodate all wsv then scrolling is needed
			// var counts = _.countBy(WSV_cloned, function(v) {return v.aboveOrBelow});
			// if (counts.above > numCells_above) {
			// 	var numWsvToMoveDown = counts.above - numCells_above;
			//
			// 	// is there space below
			// 	if ((numWsvToMoveDown !== 0) && (counts.below < numCells_below)) {
			//
			// 		var emptyCellsAvailableBelow = numCells_below - counts.below;
			//
			// 		// is space below enough
			// 		if (numWsvToMoveDown <= emptyCellsAvailableBelow) {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, true, numWsvToMoveDown);
			// 			console.log(numWsvToMoveDown + ' wsvs have been moved down');
			// 		} else {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, true, emptyCellsAvailableBelow);
			// 			console.log(emptyCellsAvailableBelow + ' wsvs have been moved down');
			// 			console.log('not all overflowing wsvs from above can be moved down');
			// 		}
			//
			// 	} else {
			// 		console.log('there is no space below to move any wsv down');
			// 	}
			//
			// } else if (counts.below > numCells_below) {
			//
			// 	var numWsvToMoveUp = counts.below - numCells_below
			//
			// 	// is there space below
			// 	if ((numWsvToMoveUp !== 0) && (counts.above < numCells_above)) {
			//
			// 		var emptyCellsAvailableAbove = numCells_above - counts.above;
			//
			// 		// is space below enough
			// 		if (numWsvToMoveUp <= emptyCellsAvailableAbove) {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, false, numWsvToMoveUp);
			// 			console.log(numWsvToMoveUp + ' wsvs have been moved up');
			// 		} else {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, false, emptyCellsAvailableAbove);
			// 			console.log(emptyCellsAvailableAbove + ' wsvs have been moved up');
			// 			console.log('not all overflowing wsvs from below can be moved up');
			// 		}
			//
			// 	} else {
			// 		console.log('there is no space above to move any wsv up');
			// 	}
			// }

			// update the counts variable
			counts = _.countBy(WSV_cloned, function(v) {return v.aboveOrBelow});
			setUndefinedCountToZero(counts)
			layoutInfo.counts = counts

			// get top left cornerDiffs
			var numUsedRowsAbove = Math.ceil(counts.above/numOfColumns);
			topLeftCorner_left = 0;

			if (rowAndColumnNumbers.currentEntityColumn === 0) {
				topLeftCorner_left = bbox_currEntity.left + (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells));

			} else {
				 topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));
			}

			var topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

			layoutInfo.topLeftCorner_left = topLeftCorner_left;
			layoutInfo.topLeftCorner_top = topLeftCorner_top;

			// console.log(above_wsvArray.length);
			// console.log(rowAndColumnNumbers);
			// console.log(topLeftCorner_left);
			// console.log(topLeftCorner_top);

			// drawLine(topLeftCorner_top, 'horizontal', 'green');
			// drawLine(topLeftCorner_left, 'vertical', 'green');
			// drawLine(bbox_currEntity.left, 'vertical')
			// drawLine(bbox_currEntity.top, 'horizontal')


			// make the row above current entity full, means start with the right index
			// var rest = counts.above % numOfColumns;
			// if (rest === 0) {
			// 	rest = numOfColumns;
			// }
			// var startIndex_above = numOfColumns - rest;

			var aboveIndex = getGridStartIndex(counts.above, numOfColumns)
			layoutInfo.startIndex_above = aboveIndex;
			var belowIndex = 0;
			layoutInfo.startIndex_below = belowIndex;
			$.each(WSV_cloned, function(index, value) {

				// cloning the wsv, and changing the position from relative to absolute
				var aClonedWSV;
				if (this.currentLayout == '') {
					aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
					this.anEntity.parent().css('opacity', 0.2);
				} else {
					aClonedWSV = this.theClonedWSV;
					$(aClonedWSV).removeClass('hide');
					$(aClonedWSV).children().removeClass('hide');
					if ($('#spacer').length > 0) {
						$('#spacer').remove();
					}
				}

				// // dragging
				// if (typeOfDrag === 'swapDrag') {
				// 	d3.select(aClonedWSV[0]).call(swapDrag);
				// } else {
				// 	d3.select(aClonedWSV[0]).call(dragInBetween);
				// }


				var newTop = 0;
				var newLeft = 0;
				if (this.aboveOrBelow === 'above') {

					newTop = topLeftCorner_top + (Math.floor(aboveIndex/numOfColumns) * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
					newLeft = topLeftCorner_left + ((aboveIndex % numOfColumns) * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + this.middleBoundOffset;

					aboveIndex += 1;

				} else if (this.aboveOrBelow === 'below') {

					newTop = (bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells)) + (Math.floor(belowIndex/numOfColumns) * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
					newLeft = topLeftCorner_left + ((belowIndex % numOfColumns) * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + this.middleBoundOffset;
					belowIndex += 1;

				} else {
					console.log('error with above or below; aboveOrBelow is not defined')
				}


				// check if the wsv has been forced to move due to reordering
				if (why === 'dragInBetween') {
					visualizeMovedWSVs(this, {x: newLeft, y: newTop}, aClonedWSV);
				}



				var whiteBackgroundElement;
				if (this.currentLayout == '') {
					whiteBackgroundElement = addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
				} else {
					// the layout before might have hidden some of the whiteLayer, therefore unhide
					$('.whiteLayer').removeClass('hide');

					whiteBackgroundElement = this.backgroundElement;
					// whiteBackgroundElement.velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells)}, {
					// 	duration: 100
					// });
				}

				if (why === 'dragInBetween') {

					var old_leftTop = {x: this.wsvBoxClonedObject.left, y: this.wsvBoxClonedObject.top};
					var new_leftTop = {x: newLeft, y: newTop};
					var same = comparing2DCoordinates(old_leftTop, new_leftTop);
					if (!same) {
						mySequence.push({e: aClonedWSV, p: {left: (newLeft), top: (newTop)}, o: {
							duration: 500,

							complete: function() {
								WSV_cloned[index].backgroundElement = whiteBackgroundElement;
								WSV_cloned[index].entityBoxClonedObject = get_BBox_entity(aClonedWSV);
								WSV_cloned[index].theClonedWSV = aClonedWSV;
								WSV_cloned[index].wsvBoxClonedObject = get_BBox_wsv_NEW(aClonedWSV, positionType);

								d3.select(aClonedWSV[0]).datum().x = WSV_cloned[index].wsvBoxClonedObject.left;
								d3.select(aClonedWSV[0]).datum().y = WSV_cloned[index].wsvBoxClonedObject.top;
								d3.select(aClonedWSV[0]).datum().middleBoundOffset = WSV_cloned[index].middleBoundOffset;
								d3.select(aClonedWSV[0]).datum().originalIndex = index;
								d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;
								$(aClonedWSV).removeClass('compare');
							}
						}});
					}

				} else {

					//{ e: $element1, p: { translateX: 100 }, o: { duration: 1000 } }
					mySequence.push({e: aClonedWSV, p: {left: (newLeft), top: (newTop)}, o: {
						duration: 1000,
						sequenceQueue: false,

						complete: function() {
							WSV_cloned[index].backgroundElement = whiteBackgroundElement;
							WSV_cloned[index].entityBoxClonedObject = get_BBox_entity(aClonedWSV);
							WSV_cloned[index].theClonedWSV = aClonedWSV;
							WSV_cloned[index].wsvBoxClonedObject = get_BBox_wsv_NEW(aClonedWSV, positionType);

							d3.select(aClonedWSV[0]).datum().x = WSV_cloned[index].wsvBoxClonedObject.left;
							d3.select(aClonedWSV[0]).datum().y = WSV_cloned[index].wsvBoxClonedObject.top;
							d3.select(aClonedWSV[0]).datum().middleBoundOffset = WSV_cloned[index].middleBoundOffset;
							d3.select(aClonedWSV[0]).datum().originalIndex = index;
							d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;
						}
					}});

					mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells), opacity: 1}, o: {
						duration: 1000,
						sequenceQueue: false

						}
					});

				}

				// aClonedWSV.velocity({left: (newLeft), top: (newTop)}, {
				// 	duration: 1000,
				//
				// 	complete: function() {
				// 		WSV_cloned[index].backgroundElement = whiteBackgroundElement;
				// 		WSV_cloned[index].entityBoxClonedObject = get_BBox_entity(aClonedWSV);
				// 		WSV_cloned[index].theClonedWSV = aClonedWSV;
				// 		WSV_cloned[index].wsvBoxClonedObject = get_BBox_wsv_NEW(aClonedWSV, positionType);
				//
				// 		d3.select(aClonedWSV[0]).datum().x = WSV_cloned[index].wsvBoxClonedObject.left;
				// 		d3.select(aClonedWSV[0]).datum().y = WSV_cloned[index].wsvBoxClonedObject.top;
				// 		d3.select(aClonedWSV[0]).datum().middleBoundOffset = WSV_cloned[index].middleBoundOffset;
				// 		d3.select(aClonedWSV[0]).datum().originalIndex = index;
				// 	}
				// });
			});

			$.Velocity.RunSequence(mySequence);

			$('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');

			logStudyEvent('gathering', {'layout': 'grid', 'origin layout launch (entity)': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight});

			// window.innerHeight
			// document.body.scrollHeight

			break;


		case 'column':

			layoutInfo.type = 'column';

			var numOfColumns = 1;
			layoutInfo.numberOfColumns = numOfColumns;

			var numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
			var numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;


			// first move wsv up and down if there is not enough space above or below
			// wsv moved up or down are the ones furthest away
			// either maximising space --> overflowing wsv are either moved up or down if space permits
			// if there is no enough space to accomodate all wsv then scrolling is needed
			// var counts = _.countBy(WSV_cloned, function(v) {return v.aboveOrBelow});
			// if (counts.above > numCells_above) {
			// 	var numWsvToMoveDown = counts.above - numCells_above;
			//
			// 	// is there space below
			// 	if ((numWsvToMoveDown !== 0) && (counts.below < numCells_below)) {
			//
			// 		var emptyCellsAvailableBelow = numCells_below - counts.below;
			//
			// 		// is space below enough
			// 		if (numWsvToMoveDown <= emptyCellsAvailableBelow) {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, true, numWsvToMoveDown);
			// 			console.log(numWsvToMoveDown + ' wsvs have been moved down');
			// 		} else {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, true, emptyCellsAvailableBelow);
			// 			console.log(emptyCellsAvailableBelow + ' wsvs have been moved down');
			// 			console.log('not all overflowing wsvs from above can be moved down');
			// 		}
			//
			// 	} else {
			// 		console.log('there is no space below to move any wsv down');
			// 	}
			//
			// } else if (counts.below > numCells_below) {
			//
			// 	var numWsvToMoveUp = counts.below - numCells_below;
			//
			// 	// is there space below
			// 	if ((numWsvToMoveUp !== 0) && (counts.above < numCells_above)) {
			//
			// 		var emptyCellsAvailableAbove = numCells_above - counts.above;
			//
			// 		// is space below enough
			// 		if (numWsvToMoveUp <= emptyCellsAvailableAbove) {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, false, numWsvToMoveUp);
			// 			console.log(numWsvToMoveUp + ' wsvs have been moved up');
			// 		} else {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, false, emptyCellsAvailableAbove);
			// 			console.log(emptyCellsAvailableAbove + ' wsvs have been moved up');
			// 			console.log('not all overflowing wsvs from below can be moved up');
			// 		}
			//
			// 	} else {
			// 		console.log('there is no space above to move any wsv up');
			// 	}
			// }


			// update the counts variable
			counts = _.countBy(WSV_cloned, function(v) {return v.aboveOrBelow});
			setUndefinedCountToZero(counts)

			// get top left cornerDiffs
			var numUsedRowsAbove = Math.ceil(counts.above/numOfColumns);
			var topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));
			topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

			layoutInfo.topLeftCorner_left = topLeftCorner_left;
			layoutInfo.topLeftCorner_top = topLeftCorner_top;


			var aboveIndex = 0;
			var belowIndex = 0;
			$.each(WSV_cloned, function(index, value) {

				// cloning the wsv, and changing the position from relative to absolute
				var aClonedWSV;
				if (this.currentLayout == '') {
					//aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.aboveOrBelow, index);
					aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
					this.anEntity.parent().css('opacity', 0.2);
				} else {
					aClonedWSV = this.theClonedWSV;
					$(aClonedWSV).removeClass('hide');
					$(aClonedWSV).children().removeClass('hide');
					if ($('#spacer').length > 0) {
						$('#spacer').remove();
					}
				}

				// dragging
				// CHANGE removed dragging
				// if (typeOfDrag === 'swapDrag') {
				// 	d3.select(aClonedWSV[0]).call(swapDrag);
				// } else {
				// 	d3.select(aClonedWSV[0]).call(dragInBetween);
				// }


				var newTop = 0;
				var newLeft = topLeftCorner_left + this.middleBoundOffset;
				if (this.aboveOrBelow === 'above') {

					newTop = topLeftCorner_top + (Math.floor(aboveIndex/numOfColumns) * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

					aboveIndex += 1;

				} else if (this.aboveOrBelow === 'below') {

					newTop = (bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells)) + (Math.floor(belowIndex/numOfColumns) * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

					belowIndex += 1;

				} else {
					console.log('error with above or below; aboveOrBelow is not defined')
				}


				if (why === 'dragInBetween') {
					visualizeMovedWSVs(this, {x: newLeft, y: newTop}, aClonedWSV);
				}


				// the wsv position is controlled over the bottom and left of the entity and not the wsv as a whole or the sparkline
				// clonedWSV is the sparklificated span, due to that have to add position plus substract the size of the sparkline


				var whiteBackgroundElement;
				if (this.currentLayout == '') {
					// whiteBackgroundElement = addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (newTop - layoutInfo.spaceBetweenGridCells), (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer));
					whiteBackgroundElement = addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
				} else {
					// the layout beofre might have hidden some of the whiteLayer, therefore unhide
					$('.whiteLayer').removeClass('hide');

					whiteBackgroundElement = this.backgroundElement;
					// whiteBackgroundElement.velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells)}, {
					// 	duration: 100
					// });
				}


				aClonedWSV.velocity({left: (newLeft), top: (newTop)}, {
					duration: 1000,
					queue: false,

					complete: function() {
						WSV_cloned[index].backgroundElement = whiteBackgroundElement;
						WSV_cloned[index].entityBoxClonedObject = get_BBox_entity(aClonedWSV);
						WSV_cloned[index].theClonedWSV = aClonedWSV;
						WSV_cloned[index].wsvBoxClonedObject = get_BBox_wsv_NEW(aClonedWSV, positionType);

						d3.select(aClonedWSV[0]).datum().x = WSV_cloned[index].wsvBoxClonedObject.left;
						d3.select(aClonedWSV[0]).datum().y = WSV_cloned[index].wsvBoxClonedObject.top;
						d3.select(aClonedWSV[0]).datum().middleBoundOffset = WSV_cloned[index].middleBoundOffset;
						d3.select(aClonedWSV[0]).datum().originalIndex = index;
						d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;
					}
				});

				$(whiteBackgroundElement).velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells), opacity: 1,
				}, {
					queue: false,
					duration: 1000,
				});

			});

			$('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');

			logStudyEvent('gathering', {'layout': 'column', 'origin layout launch (entity)': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight})

			break;


		case 'column-pan-aligned':

			layoutInfo.type = 'column-pan-aligned';

			// drawLine(bbox_currEntity.left, 'vertical', 'red')

			var numOfColumns = 1;
			layoutInfo.numberOfColumns = numOfColumns;

			// above start with the wsv on the right to the current entity
			var numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
			var numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;


			// first move wsv up and down if there is not enough space above or below
			// wsv moved up or down are the ones furthest away
			// either maximising space --> overflowing wsv are either moved up or down if space permits
			// if there is no enough space to accomodate all wsv then scrolling is needed
			// var counts = _.countBy(WSV_cloned, function(v) {return v.aboveOrBelow});
			// if (counts.above > numCells_above) {
			// 	var numWsvToMoveDown = counts.above - numCells_above;
			//
			// 	// is there space below
			// 	if ((numWsvToMoveDown !== 0) && (counts.below < numCells_below)) {
			//
			// 		var emptyCellsAvailableBelow = numCells_below - counts.below;
			//
			// 		// is space below enough
			// 		if (numWsvToMoveDown <= emptyCellsAvailableBelow) {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, true, numWsvToMoveDown);
			// 			console.log(numWsvToMoveDown + ' wsvs have been moved down');
			// 		} else {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, true, emptyCellsAvailableBelow);
			// 			console.log(emptyCellsAvailableBelow + ' wsvs have been moved down');
			// 			console.log('not all overflowing wsvs from above can be moved down');
			// 		}
			//
			// 	} else {
			// 		console.log('there is no space below to move any wsv down');
			// 	}
			//
			// } else if (counts.below > numCells_below) {
			//
			// 	var numWsvToMoveUp = counts.below - numCells_below
			//
			// 	// is there space below
			// 	if ((numWsvToMoveUp !== 0) && (counts.above < numCells_above)) {
			//
			// 		var emptyCellsAvailableAbove = numCells_above - counts.above;
			//
			// 		// is space below enough
			// 		if (numWsvToMoveUp <= emptyCellsAvailableAbove) {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, false, numWsvToMoveUp);
			// 			console.log(numWsvToMoveUp + ' wsvs have been moved up');
			// 		} else {
			// 			rebalanceAboveAndBelow(WSV_cloned, counts, false, emptyCellsAvailableAbove);
			// 			console.log(emptyCellsAvailableAbove + ' wsvs have been moved up');
			// 			console.log('not all overflowing wsvs from below can be moved up');
			// 		}
			//
			// 	} else {
			// 		console.log('there is no space above to move any wsv up');
			// 	}
			// }


			// update the counts variable
			counts = _.countBy(WSV_cloned, function(v) {return v.aboveOrBelow});
			setUndefinedCountToZero(counts)
			// WSV_cloned.sort(dl.comparator(['+aboveOrBelow', '-distanceToCurrEntity']));
			// withContextSort();

			// reference for the alignement
			var referenceClonedWSV
			if (counts.above === 0) {
				// if all the wsvs are below the current entity
				referenceClonedWSV = WSV_cloned[0]
			} else {
				referenceClonedWSV = WSV_cloned[counts.above-1]
			}

			var referenceWidth = referenceClonedWSV.entityBbox.width;
			var referenceWSVWidth = referenceClonedWSV.wsvBbox.width

			// where should the aligned column be put left or right, usually right, but if not enough space left
			var topLeftCorner_left;
			var numUsedRowsAbove = Math.ceil(counts.above/numOfColumns);
			var diffRight = layoutInfo.viewportRight - bbox_currWSV.right;
			var alignedColumnLeft = false;

			if (diffRight >= (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells))) {
				// topLeftCorner_left = bbox_currEntity.left + (rowAndColumnNumbers.rightNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));
				topLeftCorner_left = bbox_currEntity.left + (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells));

			} else {
				// topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (referenceWSVWidth + (2*layoutInfo.spaceBetweenGridCells)));
				topLeftCorner_left = bbox_currEntity.left - (referenceWSVWidth + (2*layoutInfo.spaceBetweenGridCells));
				alignedColumnLeft = true;
			}


			// drawLine(topLeftCorner_left, 'vertical', 'green')

			// get top left cornerDiffs
			topLeftCorner_top = (bbox_currWSV.bottom + layoutInfo.spaceBetweenGridCells) - (numUsedRowsAbove * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

			layoutInfo.topLeftCorner_left = topLeftCorner_left;
			layoutInfo.topLeftCorner_top = topLeftCorner_top;


			var aboveIndex = 0;
			var belowIndex = 0;
			$.each(WSV_cloned, function(index, value) {

				// cloning the wsv, and changing the position from relative to absolute
				var aClonedWSV;
				if (this.currentLayout == '') {
					// aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.aboveOrBelow, index);
					aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
					this.anEntity.parent().css('opacity', 0.2);
				} else {
					aClonedWSV = this.theClonedWSV;
					$(aClonedWSV).removeClass('hide');
					$(aClonedWSV).children().removeClass('hide');
					if ($('#spacer').length > 0) {
						$('#spacer').remove();
					}
				}

				// CHANGE removed dragging
				// d3.select(aClonedWSV[0]).call(swapDrag);


				// set the correct offset depending on being aligned left or right (majority of cases)
				var correctionOffset = this.middleBoundOffset;
				if (alignedColumnLeft) {
					correctionOffset = referenceWidth - this.entityBbox.width;
				}


				var newTop = 0;
				var newLeft = 0;
				if (this.aboveOrBelow === 'above') {

					newTop = (topLeftCorner_top + layoutInfo.spaceBetweenGridCells) + (Math.floor(aboveIndex/numOfColumns) * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
					// newLeft = topLeftCorner_left + ((aboveIndex % numOfColumns) * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + correctionOffset;
					newLeft = topLeftCorner_left + correctionOffset;

					aboveIndex += 1;

				} else if (this.aboveOrBelow === 'below') {

					newTop = (bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells)) + (Math.floor(belowIndex/numOfColumns) * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
					// newLeft = topLeftCorner_left + ((belowIndex % numOfColumns) * (referenceWSVWidth + (2*layoutInfo.spaceBetweenGridCells))) + correctionOffset;
					newLeft = topLeftCorner_left + correctionOffset;


					belowIndex += 1;

				} else {
					console.log('error with above or below; aboveOrBelow is not defined')
				}


				var whiteBackgroundElement;
				if (this.currentLayout == '') {
					whiteBackgroundElement = addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
				} else {
					// the layout beofre might have hidden some of the whiteLayer, therefore unhide
					$('.whiteLayer').removeClass('hide');

					whiteBackgroundElement = this.backgroundElement;
					// whiteBackgroundElement.velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells)}, {
					// 	duration: 100
					// });
				}


				aClonedWSV.velocity({left: (newLeft), top: (newTop)}, {
					duration: 1000,

					complete: function() {
						WSV_cloned[index].backgroundElement = whiteBackgroundElement;
						WSV_cloned[index].entityBoxClonedObject = get_BBox_entity(aClonedWSV);
						WSV_cloned[index].theClonedWSV = aClonedWSV;
						WSV_cloned[index].wsvBoxClonedObject = get_BBox_wsv_NEW(aClonedWSV, positionType);

						d3.select(aClonedWSV[0]).datum().x = WSV_cloned[index].wsvBoxClonedObject.left;
						d3.select(aClonedWSV[0]).datum().y = WSV_cloned[index].wsvBoxClonedObject.top;
						d3.select(aClonedWSV[0]).datum().middleBoundOffset = WSV_cloned[index].middleBoundOffset;
						d3.select(aClonedWSV[0]).datum().originalIndex = index;
						d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;
					}
				});

				$(whiteBackgroundElement).velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells), opacity: 1,
				}, {
					queue: false,
					duration: 1000,
				});
			});

			$('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');

			logStudyEvent('gathering', {'layout': 'column-pan-aligned', 'origin layout launch (entity)': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight})

			break;


		case 'row':

			//TODO should we distinguish between entities above and below the current entity. If yes how would it be shown?

			layoutInfo.type = 'row';

			layoutInfo.bandLength = 0;
			layoutInfo.startOffsetRowlayout = 0;
			layoutInfo.snapPositions = [];


			var numOfColumns = rowAndColumnNumbers.leftNumbColumn + 1 + rowAndColumnNumbers.rightNumbColumn;
			var numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
			var numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;

			layoutInfo.numberOfColumns = numOfColumns;


			// var topLeftCorner_top;
			var topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));;
			if (numCells_above !== 0) {
				topLeftCorner_top = bbox_currWSV.top - (rowAndColumnNumbers.aboveNumbRow * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
			} else {
				topLeftCorner_top = bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells);
			}


			layoutInfo.topLeftCorner_left = topLeftCorner_left;
			layoutInfo.topLeftCorner_top = topLeftCorner_top;

			$('#restrictedDragBand').removeClass('hide')
									.css('position', 'absolute')
									.offset({top: (topLeftCorner_top - layoutInfo.spaceBetweenGridCells), left: layoutInfo.viewportLeft})
									.width(getBodyBBox().width)
									.height((cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)))
									.css('background-color', 'white');

			// d3.select('#restrictedDragBand').call(restrictedDrag);


			$.each(WSV_cloned, function(index, value) {

				// cloning the wsv, and changing the position from relative to absolute
				var aClonedWSV;
				if (this.currentLayout == '') {
					aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
					this.anEntity.parent().css('opacity', 0.2);
				} else {
					aClonedWSV = this.theClonedWSV;

					if ($('#spacer').length > 0) {
						$('#spacer').remove();
					}
				}


				// d3.select(aClonedWSV[0]).call(restrictedDrag);


				var newTop = topLeftCorner_top;
				var newLeft = topLeftCorner_left + (index * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + this.middleBoundOffset;

				var whiteBackgroundElement;
				if (this.currentLayout == '') {
					whiteBackgroundElement = addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
				} else {
					// the layout beofre might have hidden some of the whiteLayer, therefore unhide
					$('.whiteLayer').removeClass('hide');

					whiteBackgroundElement = this.backgroundElement;
					// whiteBackgroundElement.velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells)}, {
					// 	duration: 100
					// });
				}


				aClonedWSV.velocity({left: (newLeft), top: (newTop)}, {
					duration: 1000,

					complete: function() {
						WSV_cloned[index].backgroundElement = whiteBackgroundElement;

						var clonedWSV_bbox = get_BBox_wsv_NEW(aClonedWSV, positionType);
						WSV_cloned[index].entityBoxClonedObject = get_BBox_entity(aClonedWSV);
						WSV_cloned[index].theClonedWSV = aClonedWSV;
						WSV_cloned[index].wsvBoxClonedObject = clonedWSV_bbox;

						// save the left and right position for use in the row layout
						// WSV_cloned[index].rowLayoutPositioning = {'left': clonedWSV_bbox.left, 'right': clonedWSV_bbox.right};

						d3.select(aClonedWSV[0]).datum().x = clonedWSV_bbox.left;
						d3.select(aClonedWSV[0]).datum().y = clonedWSV_bbox.top;
						d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;

						// set all left and right for clonedWSV that are hidden to 0 ==> no horizontal scrolling possibl
						// inline styles takes priority over stylesheets

						if (index === 0) {
							$(aClonedWSV).addClass('first');
						// } else if (index === (numOfColumns - 1)) {
						// 	$(aClonedWSV).addClass('last');
						// }
							$(aClonedWSV).children('.entity').css('background-color', '#a6bddb');
						} else if (index === (numOfColumns - 1)) {
							$(aClonedWSV).addClass('last');
						}

						// $('.sparklificated.clonedWSV.first .entity').css('background-color', '#a6bddb');

						if ((clonedWSV_bbox.left < layoutInfo.viewportLeft) || (clonedWSV_bbox.right > layoutInfo.viewportRight)) {
						// if ((clonedWSV_bbox.left > viewportDimensionsLeftRight.x_right) || (clonedWSV_bbox.right < viewportDimensionsLeftRight.x_left)) {

							$(aClonedWSV).addClass('hide');
							$(aClonedWSV).children().addClass('hide');
							$(whiteBackgroundElement).addClass('hide');
						}
					}
				});

				$(whiteBackgroundElement).velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells), opacity: 1,
				}, {
					queue: false,
					duration: 1000,
				});

			});

			// console.log('test')
			// add_SuggestedInteractivity();

			logStudyEvent('gathering', {'layout': 'row', 'origin layout launch (entity)': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight})

			break;


		case 'grid-no-overlap':

			layoutInfo.type = 'grid-no-overlap';

			// get the paragraph of the current entity
			var currentEntityParagraph = $(currentEntity).parent().parent();
			currentEntityParagraph.after("<div id='spacer'></div>");

			var numOfColumns = rowAndColumnNumbers.leftNumbColumn + 1 + rowAndColumnNumbers.rightNumbColumn;
			// var numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
			// var numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;
			// var numTotal_rows = rowAndColumnNumbers.aboveNumbRow + rowAndColumnNumbers.belowNumbRow;

			var numTotal_rows = Math.floor(WSV_cloned.length/numOfColumns);
			layoutInfo.numberOfColumns = numOfColumns;


			var sizeSmallMultiples = getSizeOfSmallMultiple(numOfColumns, numTotal_rows, cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells), cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells));

			$('#spacer').height(sizeSmallMultiples.height);

			var shiftDown = currentEntityParagraph[0].getBoundingClientRect().bottom + $(window).scrollTop() - (bbox_currWSV.bottom);


			$.each(measurementArray, function(index, value) {
				this.wsvBbox = get_BBox_wsv_NEW($(this.anEntity).parent(), positionType);;
				this.entityBbox = get_BBox_entity($(this.anEntity).parent());
				this.sparklineBbox = get_BBox_sparkline($(this.anEntity).parent());

				var centroidEntity = {x: 0, y: 0};
				centroidEntity.x = this.entityBbox.left + (this.entityBbox.width/2.0);
				centroidEntity.y = this.entityBbox.top + (this.entityBbox.height/2.0);
				this.centroid = centroidEntity;
			});


			// first move wsv up and down if there is not enough space above or below
			// wsv moved up or down are the ones furthest away
			// either maximising space --> overflowing wsv are either moved up or down if space permits
			// if there is no enough space to accomodate all wsv then scrolling is needed



			// get top left cornerDiffs
	// TODO do I need this here. do not think so
			// var numUsedRowsAbove = Math.ceil(above_wsvArray.length/numOfColumns);
			// var topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));
			// var topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

			// layoutInfo.topLeftCorner_left = topLeftCorner_left;
			// layoutInfo.topLeftCorner_top = topLeftCorner_top;

			// console.log(above_wsvArray.length);
			// console.log(rowAndColumnNumbers);
			// console.log(topLeftCorner_left);
			// console.log(topLeftCorner_top);

			// drawLine(topLeftCorner_top, 'horizontal', 'green');
			// drawLine(topLeftCorner_left, 'vertical', 'green');
			// drawLine(bbox_currEntity.left, 'vertical')
			// drawLine(bbox_currEntity.top, 'horizontal')


			var topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));

			$.each(WSV_cloned, function(index, value) {

				// cloning the wsv, and changing the position from relative to absolute
				var aClonedWSV;
				if (this.currentLayout == '') {
					// aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, 'merged', index);
					aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
					this.anEntity.parent().css('opacity', 0.2);
				} else {
					aClonedWSV = this.theClonedWSV;
					$(aClonedWSV).removeClass('hide');
					$(aClonedWSV).children().removeClass('hide');
				}

				// CHANGE removed dragging
				// d3.select(aClonedWSV[0]).call(swapDrag);


				var newTop = bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells) + shiftDown + (Math.floor(index/numOfColumns) * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

				var newLeft = topLeftCorner_left + ((index % numOfColumns) * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + this.middleBoundOffset;

				var whiteBackgroundElement;
				if (this.currentLayout == '') {
					whiteBackgroundElement = addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
				} else {
					// the layout beofre might have hidden some of the whiteLayer, therefore unhide
					$('.whiteLayer').removeClass('hide');

					whiteBackgroundElement = this.backgroundElement;
					// whiteBackgroundElement.velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells)}, {
					// 	duration: 10
					// });
				}


				aClonedWSV.velocity({left: (newLeft), top: (newTop)}, {
					duration: 1000,

					complete: function() {
						WSV_cloned[index].backgroundElement = whiteBackgroundElement;
						WSV_cloned[index].entityBoxClonedObject = get_BBox_entity(aClonedWSV);
						WSV_cloned[index].theClonedWSV = aClonedWSV;
						WSV_cloned[index].wsvBoxClonedObject = get_BBox_wsv_NEW(aClonedWSV, positionType);

						d3.select(aClonedWSV[0]).datum().x = WSV_cloned[index].wsvBoxClonedObject.left;
						d3.select(aClonedWSV[0]).datum().y = WSV_cloned[index].wsvBoxClonedObject.top;
						d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;
					}
				});

				$(whiteBackgroundElement).velocity({left: (newLeft - layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells), opacity: 1,
				}, {
					queue: false,
					duration: 1000,
				});
			});

			$('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');

			logStudyEvent('gathering', {'layout': 'grid-no-overlap', 'origin layout launch (entity)': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight});

			break;

		default:
	 		console.log('there is an error with the layout type!!');
	}

	// set the envirnoment variable to Onnly_cloned so the brushing and linking works
	$('.entity').sparklificator('option', 'environment', 'only_cloned')

	// logging entity name and where the entity is with respect to the document in percent
	// logStudyEvent('from which entity was layout launched', {'entity': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight});
	// logStudyEvent('location of entity layout was launched', {});
}


  remove_currEntityfromMeasureArray(arrayOfWSVMeasurementObjects) {

    let measurementsArray_withoutCurrEntity = arrayOfWSVMeasurementObjects.map(function() {
      if (!$(this.anEntity).hasClass('currentEntity')) {
        return this;
      }
    });

    return measurementsArray_withoutCurrEntity;
  }


}

export let layout = new Layout()
