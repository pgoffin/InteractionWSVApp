import { NumberColAndRows, LayoutInfo } from "../../../global";

const constants = require('../constants');

import Text from './text';
import Measurements from '../measurements';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import layoutFactoryClass from './layoutFactoryClass';
let dl = require('../../lib/datalib.min.js');
import * as d3 from "d3";
// const _countby = require('lodash/countby');
const _cloneDeep = require('lodash/clonedeep');

import 'velocity-animate';
import 'velocity-ui-pack';

const renderers = require('../../lib/renderers');


class Layout {

    _layoutInfo: LayoutInfo;
    _currentLayout: string = '';
    _refToText: Text;
    _theLayout: Layout;
    _arryOfWSVsThatHaveAClone: Array<WordScaleVisualization>;


    constructor(theRefToText: Text) {
      this._layoutInfo = {}
      this._layoutInfo.spaceBetweenGridCells = 4;

      this._refToText = theRefToText;
    }


    // getter/setter
    get currentLayout(): string {
      return this._currentLayout;
    }
    set currentLayout(aLayout: string) {
      this._currentLayout = aLayout;
    }

    // get measurementArray() {
    //   return this._measurementArray;
    // }
    // set measurementArray(anArray) {
    //   this._measurementArray = anArray;
    // }

    set layoutInfo(keyValuePair) {
      this._layoutInfo[keyValuePair[0]] = keyValuePair[1];
    }
    get layoutInfo() {
      return this._layoutInfo;
    }


    changeLayout(layoutType: string) {
      let currentEntity: Entity = this._refToText.currentEntity;

      // // All possible falsy values in ECMA-/Javascript: null, undefined, NaN, empty string (""), 0, false.
      // if (!currentEntity) {
      //   if (this.set_closestEntityAsCurrentEntity(eventLocation)) {
      //     currentEntity = this._refToText.currentEntity
      //   } else {
      //     return false;
      //   }
      // }


      const bbox_currEntity = currentEntity._entityBbox;
      const bbox_currWSV = currentEntity._entityBelongsToWsv._wsvBBox

      this._arryOfWSVsThatHaveAClone = this._refToText.listOfWSVs.filter(aWSV => aWSV != this._refToText._currentWSV);

      const cellDimensions = this.getCellDimensions(this._arryOfWSVsThatHaveAClone);
      this.layoutInfo = ['cell_dimensions', cellDimensions];
      this.layoutInfo = ['bbox_currentWSV', bbox_currWSV];

      this._arryOfWSVsThatHaveAClone.forEach(aWSV => {
        let aEntityBBox = aWSV.entity._entityBbox;
        aWSV._aboveOrBelow = (aEntityBBox.top > bbox_currEntity.bottom) ? 'below' : 'above';

        // aWSV._docPosition = {'left': aEntityBBox.left + aEntityBBox.width/2.0,
        //                     'top': aEntityBBox.top + aEntityBBox.height/2.0};

        if (constants.positionType === 'right') {
          aWSV._middleBoundOffset = bbox_currEntity.width - aEntityBBox.width;

          aWSV._offset_whiteLayer = cellDimensions.width - aWSV._wsvVisualizationBBox.width - aEntityBBox.width;
        }

        aWSV._distanceToCurrEntity = bbox_currEntity.top - aEntityBBox.top;
      });

      // order first by above or below, then use distance to to the currentEntity
      this._arryOfWSVsThatHaveAClone.sort(dl.comparator(['+aboveOrBelow', '-distanceToCurrEntity']));


      let rowAndColumnNumbers: NumberColAndRows = Measurements.spaceAvailability_numberColAndRows(currentEntity, constants.positionType, layoutType, 'middleBound', this._refToText.listOfWSVs, this.layoutInfo.cell_dimensions.width, this.layoutInfo.cell_dimensions.height, this.layoutInfo.spaceBetweenGridCells);

      this.layoutInfo = ['rowAndColumnNumbers', rowAndColumnNumbers];
      this.layoutInfo = ['numberOfColumns', rowAndColumnNumbers.totalNumberOfColumns];

      this._theLayout = layoutFactoryClass(layoutType, this.layoutInfo, this._refToText, this._arryOfWSVsThatHaveAClone);
    }


    giveUpLayout() {

      const giveUpAnimationSequence = [];

      this._arryOfWSVsThatHaveAClone.forEach((aWSV, index) => {

        let originalWSVBBox = aWSV._wsvBBox;
        let whiteBackgroundElement = aWSV._theClonedWSV._backgroundElement;

        giveUpAnimationSequence.push({e: aWSV._theClonedWSV._wsv,
                                      p: {left: originalWSVBBox.left, top: originalWSVBBox.top},
                                      o: {sequenceQueue: false,
                                          duration: 800,
                                          complete: clonedWSV => {
                                            clonedWSV[0].remove();
                                            aWSV._theClonedWSV = null;
                                          }
                                        }
                                    });

        if (Object.is(this._arryOfWSVsThatHaveAClone.length - 1, index)) {

          giveUpAnimationSequence.push({e: whiteBackgroundElement,
                                        p: {left: originalWSVBBox.left, top: originalWSVBBox.top, opacity: 0},
                                        o: {sequenceQueue: false,
                                            duration: 800,
                                            complete: aBackgroundElement => {
                                              aBackgroundElement[0].remove();
                                              aWSV._backgroundElement = null;

                                              document.querySelectorAll('.sparklificated.hasClone').forEach(anElement => {anElement.classList.remove('hasClone')});

                                              document.querySelectorAll('.entity').forEach(anElement => {anElement.classList.remove('selected')});

                                              this.cleanupAfterLayout();

                                              // this._refToText._currentEntity.unSetAsCurrentEntity();
                                              // this._refToText._isLayoutVisible = false;

                                              // $('#text').css('color', 'rgb(51, 51, 51)');
                                              //
                                              // $('.sparklificated').css('opacity', 1);
                                              // $('.sparkline').css('opacity', 1);
                                              // $('.entity').css('opacity', 1);
                                              //
                                              // $('.entity').removeClass('selected');
                                              // $('.entity').removeClass('currentEntity');
                                              // $('.entity').removeClass('showInLayout');
                                              //
                                              // currentEntity = null;
                                              //
                                              // layoutType = null;

                                              // hideDragBand();
                                            }
                                          }
                                      });

        } else {

          giveUpAnimationSequence.push({e: whiteBackgroundElement,
                                        p: {left: originalWSVBBox.left, top: originalWSVBBox.top, opacity: 0},
                                        o: {sequenceQueue: false,
                                            duration: 800,
                                            complete: aBackgroundElement => {
                                              aBackgroundElement[0].remove();
                                              aWSV._backgroundElement = null;
                                            }
                                          }
                                      });

        }
      });

      $.Velocity.RunSequence(giveUpAnimationSequence);
    }


    cleanupAfterLayout() {
      // this._refToText._currentEntity.unSetAsCurrentEntity();
      this._refToText._isLayoutVisible = false;

      // hide tooltip
      // this._refToText._theContextualMenu.stopMenuHideTimer()
      console.log('hide cleanupAfterLayout')
      this._refToText._theContextualMenu.hideContextualMenu(this._refToText._currentEntity);

      this._refToText._theContextualMenu.unSelectIcon();

      // $('.currentSeletedLayout').removeClass('currentSeletedLayout')

      // document.getElementById('triangle_left').classList.add('hide');
      // document.getElementById('triangle_right').classList.add('hide');
      // document.getElementById('orientation_circles').classList.add('hide');


      // $('#triangle_left').addClass('hide');
      // $('#triangle_right').addClass('hide');
      // $('#orientation_circles').addClass('hide');
      // $('#orientation_circles svg').remove();
      // orientationCirclesData = [];

      // layoutInfo.bandLength = 0;
      // layoutInfo.startOffsetRowlayout = 0;
      // layoutInfo.snapPositions = [];

      // remove any trails
      // removeTrail();
    }






    OLD_changeLayout(layoutType: string, why)  {
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

      // let currentWSV = this._refToText
      // let currentWSV = $(text.currentEntity).parent();

      // let bbox_currEntity = Measurements.get_BBox_entity(currentWSV);
      let bbox_currEntity = this._refToText.currentEntity.getBBoxOfEntity();

      let bbox_currWSV =  Measurements.get_BBox_wsv(currentWSV, constants.positionType);


      if (this.measurementArray.length == 0) {

        this.measurementArray = Measurements.get_allWSV_measurements(constants.positionType);
        let measurementArray_withoutCurrEntity = this.constructor.remove_currEntityfromMeasureArray(this.measurementArray);

        let cellDimensions = Measurements.get_cellDimensions(this.measurementArray);
        this.layoutInfo = ['cell_dimensions', cellDimensions];
        this.layoutInfo = ['bbox_currentWSV', bbox_currWSV];

        let classThis = this;
        // add a flag if element is above or below the current entity
        measurementArray_withoutCurrEntity.each(function() {
          // aboveOrBelow decides if wsv is placed above or below the current entity
          this.aboveOrBelow = (this.entityBbox.top > bbox_currEntity.bottom) ? 'below' : 'above';

          this.docPosition = {'left': this.entityBbox.left + this.entityBbox.width/2.0,
                              'top': this.entityBbox.top + this.entityBbox.height/2.0}

          if (constants.positionType === 'right') {
            this.middleBoundOffset = bbox_currEntity.width - this.entityBbox.width;

            this.offset_whiteLayer = cellDimensions.width - this.sparklineBbox.width - this.entityBbox.width;
          }

          // also check if 'selected'
          // if selected the wsv (.sparklificated) is pushed into wsv_cloned
          if ($(this.anEntity).hasClass('selected')) {
            // add a distance value between entity and currentEntity
            this.distanceToCurrEntity = bbox_currEntity.top - this.entityBbox.top;

            // push info about the data
            let wsv_data = Layout.getWSVData(this.anEntity[0]);

            if (typeof wsv_data.values != 'undefined') {

            let max_value = Math.max.apply(null, wsv_data.values.map(function(v, i) {
              return v.close;
            }));

            this.max_data_value = max_value;

            this.last_data_value = wsv_data.values[wsv_data.values.length - 1]['close']

            let min_value = Math.min.apply(null, wsv_data.values.map(function(v, i) {
              return v.close;
            }));

            this.min_data_value = min_value;

            } else {

              this.max_data_value = 0;
              this.min_data_value = 0;
            }

            this.entityName = this.anEntity.text().toLowerCase();

            classThis._WSV_cloned.push(this);
          }
        });

        // order first by above or below, then use distance to to the currentEntity
        this._WSV_cloned.sort(dl.comparator(['+aboveOrBelow', '-distanceToCurrEntity']));

      } else {
        // link to old (already calculated) cellDimensions
        let cellDimensions = this.layoutInfo.cell_dimensions;
      }



      let rowAndColumnNumbers = Measurements.spaceAvailability_numberColAndRows(currentWSV, constants.positionType, layoutType, 'middleBound', this.measurementArray, this.layoutInfo.cell_dimensions.width, this.layoutInfo.cell_dimensions.height, this.layoutInfo.spaceBetweenGridCells);

      this.layoutInfo = ['rowAndColumnNumbers', rowAndColumnNumbers];


      // TODO need to update each layout for changes in layout!!!!!!

      let topLeftCorner_left = 0;
      let numOfColumns: number;
      let numCells_above: number;
      let numCells_below: number;
      let numUsedRowsAbove: number;
      let aboveIndex: number;
      let belowIndex: number;

      let theLayout = layoutFactoryClass(layoutType, this.layoutInfo, );


      switch(type) {
        case '#grid':

          this.layoutInfo.type = 'grid';

          numOfColumns = rowAndColumnNumbers.leftNumbColumn + rowAndColumnNumbers.currentEntityColumn + rowAndColumnNumbers.rightNumbColumn;
          numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
          numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;

          this.layoutInfo.numberOfColumns = numOfColumns;

          // update the counts variable
          let counts = _countby(this._WSV_cloned, function(v) { return v.aboveOrBelow} );
          Layout.setUndefinedCountToZero(counts)
          this.layoutInfo.counts = counts

          // get top left cornerDiffs
          numUsedRowsAbove = Math.ceil(counts.above/numOfColumns);
          topLeftCorner_left = 0;

          if (rowAndColumnNumbers.currentEntityColumn == 0) {
            topLeftCorner_left = bbox_currEntity.left + (this.layoutInfo.cell_dimensions.width + (2*this.layoutInfo.spaceBetweenGridCells));

          } else {
            topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (this.layoutInfo.cell_dimensions.width + (2*this.layoutInfo.spaceBetweenGridCells)));
          }

          let topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (this.layoutInfo.cell_dimensions.height + (2*this.layoutInfo.spaceBetweenGridCells)));

          this.layoutInfo.topLeftCorner_left = topLeftCorner_left;
          this.layoutInfo.topLeftCorner_top = topLeftCorner_top;


          aboveIndex = Layout.getGridStartIndex(counts.above, numOfColumns)
          this.layoutInfo.startIndex_above = aboveIndex;

          belowIndex = 0;
          this.layoutInfo.startIndex_below = belowIndex;
          let classThis = this;
          $.each(this._WSV_cloned, function(index, value) {

            // cloning the wsv, and changing the position from relative to absolute
            let aClonedWSV;
            if (classThis.currentLayout == '') {
              aClonedWSV = Layout.cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
              this.anEntity.parent().css('opacity', 0.2);
            } else {
              aClonedWSV = this.theClonedWSV;
              $(aClonedWSV).removeClass('hide');
              $(aClonedWSV).children().removeClass('hide');
              if ($('#spacer').length > 0) {
                $('#spacer').remove();
              }
            }


            let newTop = 0;
            let newLeft = 0;
            if (this.aboveOrBelow === 'above') {

              newTop = topLeftCorner_top + (Math.floor(aboveIndex/numOfColumns) * (classThis.layoutInfo.cell_dimensions.height + (2*classThis.layoutInfo.spaceBetweenGridCells)));
              newLeft = topLeftCorner_left + ((aboveIndex % numOfColumns) * (classThis.layoutInfo.cell_dimensions.width + (2*classThis.layoutInfo.spaceBetweenGridCells))) + this.middleBoundOffset;

              aboveIndex += 1;

            } else if (this.aboveOrBelow === 'below') {

              newTop = (bbox_currWSV.bottom + (2*classThis.layoutInfo.spaceBetweenGridCells)) + (Math.floor(belowIndex/numOfColumns) * (classThis.layoutInfo.cell_dimensions.height + (2*classThis.layoutInfo.spaceBetweenGridCells)));
              newLeft = topLeftCorner_left + ((belowIndex % numOfColumns) * (classThis.layoutInfo.cell_dimensions.width + (2*classThis.layoutInfo.spaceBetweenGridCells))) + this.middleBoundOffset;
              belowIndex += 1;

            } else {
              console.log('error with above or below; aboveOrBelow is not defined')
            }


            // check if the wsv has been forced to move due to reordering
            if (why === 'dragInBetween') {
              Layout.visualizeMovedWSVs(this, {x: newLeft, y: newTop}, aClonedWSV);
            }



            let whiteBackgroundElement;
            if (classThis.currentLayout == '') {
              whiteBackgroundElement = Layout.addWhiteLayer((classThis.layoutInfo.cell_dimensions.width + (2*classThis.layoutInfo.spaceBetweenGridCells)), (classThis.layoutInfo.cell_dimensions.height + (2*classThis.layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
            } else {
              // the layout before might have hidden some of the whiteLayer, therefore unhide
              $('.whiteLayer').removeClass('hide');

              whiteBackgroundElement = this.backgroundElement;
            }

            if (why === 'dragInBetween') {

              let old_leftTop = {x: this.wsvBoxClonedObject.left, y: this.wsvBoxClonedObject.top};
              let new_leftTop = {x: newLeft, y: newTop};
              let same = Layout.comparing2DCoordinates(old_leftTop, new_leftTop);
              if (!same) {
                mySequence.push({e: aClonedWSV, p: {left: (newLeft), top: (newTop)}, o: {
                  duration: 500,

                  complete: function() {
                    classThis._WSV_cloned[index].backgroundElement = whiteBackgroundElement;
                    classThis._WSV_cloned[index].entityBoxClonedObject = Measurements.get_BBox_entity(aClonedWSV);
                    classThis._WSV_cloned[index].theClonedWSV = aClonedWSV;
                    classThis._WSV_cloned[index].wsvBoxClonedObject = Measurements.get_BBox_wsv(aClonedWSV, constants.positionType);

                    d3.select(aClonedWSV[0]).datum().x = classThis._WSV_cloned[index].wsvBoxClonedObject.left;
                    d3.select(aClonedWSV[0]).datum().y = classThis._WSV_cloned[index].wsvBoxClonedObject.top;
                    d3.select(aClonedWSV[0]).datum().middleBoundOffset = classThis._WSV_cloned[index].middleBoundOffset;
                    d3.select(aClonedWSV[0]).datum().originalIndex = index;
                    d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;
                    $(aClonedWSV).removeClass('compare');
                  }
                }});
              }

            } else {

              mySequence.push({e: aClonedWSV, p: {left: (newLeft), top: (newTop)}, o: {
                duration: 1000,
                sequenceQueue: false,

                complete: function() {
                  classThis._WSV_cloned[index].backgroundElement = whiteBackgroundElement;
                  classThis._WSV_cloned[index].entityBoxClonedObject = Measurements.get_BBox_entity(aClonedWSV);
                  classThis._WSV_cloned[index].theClonedWSV = aClonedWSV;
                  classThis._WSV_cloned[index].wsvBoxClonedObject = Measurements.get_BBox_wsv(aClonedWSV, constants.positionType);

                  d3.select(aClonedWSV[0]).datum().x = classThis._WSV_cloned[index].wsvBoxClonedObject.left;
                  d3.select(aClonedWSV[0]).datum().y = classThis._WSV_cloned[index].wsvBoxClonedObject.top;
                  d3.select(aClonedWSV[0]).datum().middleBoundOffset = classThis._WSV_cloned[index].middleBoundOffset;
                  d3.select(aClonedWSV[0]).datum().originalIndex = index;
                  d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;
                }
              }});

              mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - classThis.layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - classThis.layoutInfo.spaceBetweenGridCells), opacity: 1}, o: {
                  duration: 1000,
                  sequenceQueue: false

                }
              });
            }

          });

          $.Velocity.RunSequence(mySequence);

          $('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');

          // logStudyEvent('gathering', {'layout': 'grid', 'origin layout launch (entity)': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight});

          break;

// CONTINUE FROM HERE
		case 'column':

			layoutInfo.type = 'column';

			numOfColumns = 1;
			layoutInfo.numberOfColumns = numOfColumns;

			numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
			numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;


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
			numUsedRowsAbove = Math.ceil(counts.above/numOfColumns);
			topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));
			topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

			layoutInfo.topLeftCorner_left = topLeftCorner_left;
			layoutInfo.topLeftCorner_top = topLeftCorner_top;


			aboveIndex = 0;
			belowIndex = 0;
			$.each(WSV_cloned, function(index, value) {

				// cloning the wsv, and changing the position from relative to absolute
				var aClonedWSV;
				if (this.currentLayout == '') {
					//aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.aboveOrBelow, index);
					aClonedWSV = Layout.cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
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
					whiteBackgroundElement = Layout.addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
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

			numOfColumns = 1;
			this.layoutInfo.numberOfColumns = numOfColumns;

			// above start with the wsv on the right to the current entity
			numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
			numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;


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
			// var topLeftCorner_left;
			numUsedRowsAbove = Math.ceil(counts.above/numOfColumns);
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


			aboveIndex = 0;
			belowIndex = 0;
			$.each(WSV_cloned, function(index, value) {

				// cloning the wsv, and changing the position from relative to absolute
				var aClonedWSV;
				if (this.currentLayout == '') {
					// aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.aboveOrBelow, index);
					aClonedWSV = Layout.cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
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
					whiteBackgroundElement = Layout.addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
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


			numOfColumns = rowAndColumnNumbers.leftNumbColumn + 1 + rowAndColumnNumbers.rightNumbColumn;
			numCells_above = numOfColumns * rowAndColumnNumbers.aboveNumbRow;
			numCells_below = numOfColumns * rowAndColumnNumbers.belowNumbRow;

			layoutInfo.numberOfColumns = numOfColumns;


			// var topLeftCorner_top;
			topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));;
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
					aClonedWSV = Layout.cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
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
					whiteBackgroundElement = Layout.addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
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

			numOfColumns = rowAndColumnNumbers.leftNumbColumn + 1 + rowAndColumnNumbers.rightNumbColumn;
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


			topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)));

			$.each(WSV_cloned, function(index, value) {

				// cloning the wsv, and changing the position from relative to absolute
				var aClonedWSV;
				if (this.currentLayout == '') {
					// aClonedWSV = cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, 'merged', index);
					aClonedWSV = Layout.cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
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
					whiteBackgroundElement = Layout.addWhiteLayer((cellDimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (cellDimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
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

	// set the envirnoment variable to Only_cloned so the brushing and linking works
	$('.entity').sparklificator('option', 'environment', 'only_cloned')

	// logging entity name and where the entity is with respect to the document in percent
	// logStudyEvent('from which entity was layout launched', {'entity': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight});
	// logStudyEvent('location of entity layout was launched', {});
}


  static cloneEntityWithWSV(theEntity, theMiddleBoundOffset, theOffset_whitelayer, originalIndex) {

    let theData;
    let settings;

    if (constants.typeOfWSV === 'barChart') {

      theData = d3.select(theEntity[0].parentElement).selectAll('g.wsv').data();

      settings = {data: theData,
                  renderer: renderers.barChart,
                  position: constants.positionType,
                  paddingWidth: true,
                  paddingHeight: true,
                  width: (widthMarkLineChart*numberOfMarks),
                  height: heightWordScaleVis };

    } else if (constants.typeOfWSV === 'stockLineChart') {

      // theData = d3.select(element.wsv).selectAll('g path').data()[0];
      theData = d3.select(theEntity._entityBelongsToWsv._wsv).selectAll('g.wsv').data()

      settings = {data: theData,
                  renderer: renderers.stockPriceSparkline,
                  position: constants.positionType,
                  paddingWidth: true,
                  paddingHeight: true,
                  width: (constants.stockLineChartSize.markWidth * constants.numberOfMarks),
                  height: constants.stockLineChartSize.heightWordScaleVis };

    } else if (constants.typeOfWSV === 'timeline') {

      theData = d3.select(theEntity[0].parentElement).selectAll('g.wsv').data()[0];

      settings = {data: theData,
                  renderer: renderers.buildWikiChart,
                  position: constants.positionType,
                  paddingWidth: true,
                  paddingHeight: true,
                  width: constants.timelineSize.width,
                  height: constants.timelineSize.height };

    } else if (constants.typeOfWSV === 'eyetracking') {

      //!!!!! to fix
      theData = d3.select(theEntity[0].parentElement).selectAll('g.wsv').data()

      settings = {data: theData,
                  renderer: renderers.stockPriceSparkline,
                  position: constants.positionType,
                  paddingWidth: true,
                  paddingHeight: true,
                  // width: (widthMarkLineChart*numberOfMarks*theData.length),
                  width: (widthMarkLineChart*numberOfMarks),
                  height: heightWordScaleVis };
    }

    // let clonedEntity = theEntity.clone();
    let clonedEntity = _cloneDeep(theEntity).entityElement
    theEntity._entityBelongsToWsv._wsv.parentNode.insertBefore(clonedEntity, theEntity._entityBelongsToWsv._wsv.nextSibling)
    // clonedEntity.insertAfter(theEntity._entityBelongsToWsv._wsv);
    clonedEntity.addClass('clonedWSV');

    clonedEntity.sparklificator();
    clonedEntity.sparklificator('option', settings);

    let clonedSparklificated = clonedEntity.parent();

    clonedSparklificated.css('z-index', 6);


    // the values for x_value and y_value are all 'auto' because they are not yet positioned
    let x_value = d3.select(clonedSparklificated[0]).style('left');
    let y_value = d3.select(clonedSparklificated[0]).style('top');
    let theZindex = d3.select(clonedSparklificated[0]).style('z-index');

    let measurements = {x: x_value, y: y_value, middleBoundOffset: theMiddleBoundOffset, offset_whiteLayer: theOffset_whitelayer, originalIndex: originalIndex, zIndex: theZindex};


    // add the centroid to the data attribute of clonedSparklificated
    d3.select(clonedSparklificated[0])
      .datum(measurements);

    clonedSparklificated.addClass('clonedWSV');

    clonedSparklificated.children('.sparkline').addClass('clonedWSV');

    if (constants.defaultAllowedInteractions.includes('lineToWSVOrigin')) {
      // changed the hover from sparklificated to the entity
      clonedSparklificated.children('.entity.clonedWSV').hover(function(element) {

        console.log('mouseenter event triggered');

        draw_connection_line('hoveringTrail', clonedSparklificated, null)

        // logStudyEvent('hovering', {'interaction_type': 'hover over entity', 'entity': clonedSparklificated[0].textContent.trim().split(' ')[0].trim()});

      }, function() {
        removeTrail();
      });


      // when hoverin over an entity in the layout but then do a mouse down (first part of click) the trail has to be removed
      clonedSparklificated.children('.entity.clonedWSV').mousedown(function() {
        console.log('element has been clicked');

        removeTrail();
      });
    }

    // adding mouseenter event to clonedwsv sparkline
    clonedSparklificated.children('.sparkline.clonedWSV').mouseenter(function() {
      console.log('clonedWSV: brushing and linking possibly started');

      let entityOfBrushing = $(this).parent().children('.entity').text().trim();
      // logStudyEvent('brushing and linking', {'interaction_type': 'started a possible brushing and linking interaction', 'where': 'on gathered wsv', 'entity': entityOfBrushing});
    });

    // adding mouseenter event to clonedwsv sparkline
    clonedSparklificated.children('.sparkline.clonedWSV').mouseleave(function() {
      console.log('clonedWSV: brushing and linking possibly ended');

      let entityOfBrushing = $(this).parent().children('.entity').text().trim();
      // logStudyEvent('brushing and linking', {'interaction_type': 'terminated a possible brushing and linking interaction', 'where': 'on gathered wsv', 'entity': entityOfBrushing});
    });


    if (constants.defaultAllowedInteractions.includes('dblclickOnWSVToGetBack')) {
      clonedSparklificated.dblclick(function(event) {

        // so dblclick in $(html) is not triggered
        event.stopPropagation();

        let doubleClickedElementWhiteBackground = d3.select($(this)[0]).datum().backgroundElement[0];

        let animationSequence = [];

        // remove the spacer, only for grid-no-overlap
        if ($('#spacer').length > 0) {
          $('#spacer').remove();

          // change the entityBbox as the spacer was removed
          $.each(WSV_cloned, function(index, d) {

            d.entityBbox = get_BBox_entity(d.anEntity.parent())

          });
        }

        draw_connection_line('connectorLine', $(this), null);

        let toBeColoredBefore;
        let toBeColoredAfter;
        // select the sentence parts to be colored
        if (theEntity.parent().prev().text().slice(-1) === '.') {
          toBeColoredAfter = $(theEntity).parent().next().next();
        } else {
          toBeColoredBefore = $(theEntity).parent().prev();
          toBeColoredAfter = $(theEntity).parent().next().next();
        }

        // calculating offset depending on the distance between bottom of wsv and bottom of document
        let topWSVToWindowTop = window.innerHeight/2.0;
        let topWSVToBottomDoc = document.body.scrollHeight - $(theEntity).parent()[0].getBoundingClientRect().top + window.pageYOffset;
        if ((topWSVToBottomDoc - heightWordScaleVis) < window.innerHeight/2.0) {
          topWSVToWindowTop = ($(theEntity).parent()[0].getBoundingClientRect().top + window.pageYOffset) - document.body.scrollHeight + window.innerHeight;
        }
        topWSVToWindowTop = -topWSVToWindowTop;

        // give up the layout, but exclude the dbclicked clones wsv
        goingBackAnimationRunning = true;
        giveUpLayout($(this)[0]);

        let thePracticeIframe = window.parent.document.getElementById('practice_article');
        if (thePracticeIframe !== null) {

          let hack = theEntity[0].getBoundingClientRect().top - currentEntity.getBoundingClientRect().top;

          animationSequence.push({e: $(theEntity),
                                  p: "scroll",
                                  o: {duration: 3500,
                                      offset: hack,
                                      container: window.parent.document.getElementsByTagName('body')[0],
                                      easing: [ .45, 0, .45, 1 ]}
                                })
        } else {

          animationSequence.push({e: $(theEntity),
                                  p: "scroll",
                                  o: {duration: 3500,
                                      offset: topWSVToWindowTop,
                                      easing: [ .45, 0, .45, 1 ]}
                                })
        }

        // disappearing white background
        animationSequence.push({e: $(doubleClickedElementWhiteBackground),
                                p: {opacity: 0},
                                o: {display: "none",
                                    sequenceQueue: false,
                                    duration: 1500}
                              });

        animationSequence.push({e: $(theEntity).parent().next(),
                                p: {left: $(theEntity).parent().offset().left, top: $(theEntity).parent().offset().top},
                                o: {// queue: false,
                                    // offset: topWSVToWindowTop,
                                    duration: 3500,
                                    sequenceQueue: false,
                                    easing: [ .45, 0, .45, 1 ],
                                    complete: function() {
                                      console.log('animation over');

                                      removeConnectorLine();

                                      $(theEntity).parent().next().children().remove();

                                      // color the sentence parts
                                      if (typeof toBeColoredBefore !== 'undefined') {
                                        toBeColoredBefore.css('background-color','#FFE0EB');
                                        toBeColoredBefore.css('color','#000000');
                                      }

                                      if (typeof toBeColoredAfter !== 'undefined') {
                                        toBeColoredAfter.css('background-color','#FFE0EB');
                                        toBeColoredAfter.css('color','#000000');
                                      }

                                      // remove white background
                                      doubleClickedElementWhiteBackground.remove();

                                      cleanupAfterLayout();

                                      goingBackAnimationRunning = false;

                                      // logStudyEvent('navigation', {'interaction_type': 'back to original entity', 'entity': theEntity[0].textContent.trim()});
                                    }
                                  }
                              });

        $.Velocity.RunSequence(animationSequence);

        if (typeof toBeColoredBefore !== 'undefined') {
          toBeColoredBefore.click(function() {
            toBeColoredBefore.css('background-color','#FFFFFF');
            if (typeof toBeColoredAfter !== 'undefined') {
              toBeColoredAfter.css('background-color','#FFFFFF');
            }
          });
        }

        if (typeof toBeColoredAfter !== 'undefined') {
          toBeColoredAfter.click(function() {
            toBeColoredAfter.css('background-color','#FFFFFF');
            if (typeof toBeColoredBefore !== 'undefined') {
              toBeColoredBefore.css('background-color','#FFFFFF');
            }
          });
        }

        layoutFlag = false;

      });
    }

    return clonedSparklificated;
  }


  static remove_currEntityfromMeasureArray(arrayOfWSVMeasurementObjects) {

    let measurementsArray_withoutCurrEntity = arrayOfWSVMeasurementObjects.map(function() {
      if (!$(this.anEntity).hasClass('currentEntity')) {
        return this;
      }
    });

    return measurementsArray_withoutCurrEntity;
  }


  // get the data visualized in the sparkline that belongs to anEntity
  static getWSVData(anEntity) {
    let wsv_data = d3.select(anEntity.nextSibling).selectAll('g.wsv').datum();

    // if (wsv_data.length === 2) {
    //   console.log('PROBLEM: data has two data arrays, case not handled yet!!!')
    // }

    return wsv_data
  }


  static setUndefinedCountToZero(theCounts) {

    if (theCounts.above === undefined) {
      theCounts.above = 0;
    }

    if (theCounts.below === undefined) {
      theCounts.below = 0;
    }
  }


  static getGridStartIndex(countsAbove, numberOfColumns) {

    var rest = countsAbove % numberOfColumns;
    if (rest === 0) {
      rest = numberOfColumns;
    }

    return numberOfColumns - rest;
  }


  static addWhiteLayer(width: number, height: number, oldTop: number, oldLeft: number) {

    // var whiteLayerBox = $("<div class='whiteLayer'></div>");
    //
    // $('#text').append(whiteLayerBox);

    const whiteLayerDiv = document.createElement('div');
    whiteLayerDiv.classList.add('whiteLayer');
    document.getElementById('text').append(whiteLayerDiv);

    whiteLayerDiv.style.width = width + 'px';
    whiteLayerDiv.style.height = height + 'px';

    whiteLayerDiv.style.top = oldTop + 'px';
    whiteLayerDiv.style.left = oldLeft + 'px';

    // $(whiteLayerBox).css('position', 'absolute');
    // $(whiteLayerBox).css('opacity', 0);
    // $(whiteLayerBox).width(width);
    // $(whiteLayerBox).height(height);
    // $(whiteLayerBox).offset({top: oldTop, left: oldLeft});
    // $(whiteLayerBox).css('z-index', 4);
    // $(whiteLayerBox).css('pointer-events', 'none');

    return whiteLayerDiv;
  }


  static visualizeMovedWSVs(WSVCloned_element, new_leftTop, theClonedWSV) {
    // store old positioning
    var old_leftTop = {x: WSVCloned_element.wsvBoxClonedObject.left, y: WSVCloned_element.wsvBoxClonedObject.top};

    var comparison = Layout.comparing2DCoordinates(old_leftTop, new_leftTop);


    if (!comparison) {
      // $(theClonedWSV).css('border-style', 'solid');
      // $(theClonedWSV).css('border-color', 'green');
      // $(theClonedWSV).css('border-width', '2px');

      $(theClonedWSV).addClass('compare');


      // var svgContainer;
      //
      // // added the svg to the root body and not the text div, will make calculation easier
      // if (d3.select('html svg.dragMovements').empty()) {
      // 	svgContainer = d3.select('html').insert('svg', ':first-child')
      // 						.attr('width', $('html').width())
      // 						.attr('height', $('html').height())
      // 						.attr('class', 'dragMovements');
      // } else {
      //
      // 	svgContainer = d3.select('html svg.dragMovements');
      // }
      //
      //
      // svgContainer.style('position', 'absolute');
      // // svg can be clicked through
      // svgContainer.style('pointer-events', 'none');
      // svgContainer.style('z-index', 15);
      //
      //
      // var movement = [{'x': old_leftTop.x, 'y': old_leftTop.y}, {'x': new_leftTop.x, 'y': new_leftTop.y}];
      //
      //
      // svgContainer.append('line')
      // 	.attr('x1', movement[0].x)
      // 	.attr('y1', movement[0].y)
      // 	.attr('x2', movement[1].x)
      // 	.attr('y2', movement[1].y)
      // 	.attr('class', 'wsvMovement');
    }
  }


  static comparing2DCoordinates(oldCoordinates, newCoordinates) {

    if ((oldCoordinates.x === newCoordinates.x) && (oldCoordinates.y === newCoordinates.y)) {
      return true;
    } else {
      return false;
    }
  }


  /**
  * A cell is where the wsv (sparkline + entity) is embedded.
  * The cell might have some padding, but the margin is not added (hidden) here
  * @return {object} - custom object with the height and width of the cell
  */
  getCellDimensions(arrayOfWSVs: Array<WordScaleVisualization>): object {

    // initialize the return object
    const cellDimensions = {height: 0,
                            width: 0}

    // get the max wsv height
    cellDimensions.height = Math.max.apply(null, arrayOfWSVs.map(aWSV => aWSV._wsvBBox.height));

    // get the max wsv width
    cellDimensions.width = Math.max.apply(null, arrayOfWSVs.map(aWSV => aWSV._wsvBBox.width));

    return cellDimensions;
  }








  // static addWhiteLayer(width: number, height: number, oldTop: number, oldLeft: number) {
  //
  //   const whiteLayerDiv = document.createElement('div');
  //   whiteLayerDiv.classList.add('whiteLayer');
  //   document.getElementById('text').append(whiteLayerDiv);
  //
  //   whiteLayerDiv.style.width = width + 'px';
  //   whiteLayerDiv.style.height = height + 'px';
  //
  //   whiteLayerDiv.style.top = oldTop + 'px';
  //   whiteLayerDiv.style.left = oldLeft + 'px';
  //
  //   return whiteLayerDiv;
  // }

}

export default Layout
