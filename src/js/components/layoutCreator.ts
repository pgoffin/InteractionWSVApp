import { NumberColAndRows, LayoutInfo } from "../../../global";

import { wsvInteractionConstants } from '../constants';

import Layout from './layout';
import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
const dl = require('../../lib/datalib.min.js');

import 'velocity-animate';
import 'velocity-ui-pack';



abstract class LayoutCreator {

  _layoutInfo: LayoutInfo;
  _currentLayout: string;
  _refToText: Text;
  _theLayout: Layout;
  _arryOfWSVsThatHaveAClone: Array<WordScaleVisualization>;



  constructor(aRefToText: Text) {
    this._layoutInfo = {};
    this._layoutInfo.spaceBetweenGridCells = 4;

    this._currentLayout = '';

    this._refToText = aRefToText;
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



  abstract layoutFactory(aLayoutName: string, initialLayoutInfo: LayoutInfo, refToText: Text, arrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>): Layout


  changeLayout(layoutType: string) {
    let currentEntity: Entity = this._refToText.currentEntity;

    const bbox_currEntity = currentEntity._entityBbox;
    const bbox_currWSV = currentEntity._entityBelongsToWsv._wsvBBox

    const cellDimensions = this.getCellDimensions(this._refToText.listOfWSVs);
    this.layoutInfo = ['cell_dimensions', cellDimensions];
    this.layoutInfo = ['bbox_currentWSV', bbox_currWSV];

    this._arryOfWSVsThatHaveAClone = this._refToText.listOfWSVs.filter(aWSV => aWSV != this._refToText._currentWSV);

    this._arryOfWSVsThatHaveAClone.forEach(aWSV => {
      let aEntityBBox = aWSV.entity._entityBbox;
      aWSV._aboveOrBelow = (aEntityBBox.top > bbox_currEntity.bottom) ? 'below' : 'above';

      if (wsvInteractionConstants.positionType === 'right') {
        aWSV._middleBoundOffset = bbox_currEntity.width - aEntityBBox.width;

        aWSV._offset_whiteLayer = this.layoutInfo.cell_dimensions.width - aWSV._wsvVisualizationBBox.width - aEntityBBox.width;
      }

      aWSV._distanceToCurrEntity = bbox_currEntity.top - aEntityBBox.top;
    });

    // order first by above or below, then use distance to to the currentEntity
    this._arryOfWSVsThatHaveAClone.sort(dl.comparator(['+aboveOrBelow', '-distanceToCurrEntity']));


    let rowAndColumnNumbers: NumberColAndRows = this.spaceAvailability_numberColAndRows(currentEntity, wsvInteractionConstants.positionType, layoutType, 'middleBound', this._refToText.listOfWSVs, this.layoutInfo.cell_dimensions.width, this.layoutInfo.cell_dimensions.height, this.layoutInfo.spaceBetweenGridCells);

    this.layoutInfo = ['rowAndColumnNumbers', rowAndColumnNumbers];
    this.layoutInfo = ['numberOfColumns', rowAndColumnNumbers.totalNumberOfColumns];

    this._theLayout = this.layoutFactory(layoutType, this.layoutInfo, this._refToText, this._arryOfWSVsThatHaveAClone);

    this._theLayout.applyLayout();
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

    if ($('#spacer').length > 0) {
      this.removeSpacer();
    }
  }


  cleanupAfterLayout() {

    this._refToText._isLayoutVisible = false;

    // hide tooltip
    this._refToText._contextualMenu.hideContextualMenu(this._refToText._currentEntity);

    document.getElementById('triangle_left').classList.add('hide');
    document.getElementById('triangle_right').classList.add('hide');

    this.layoutInfo.bandLength = 0;
    this.layoutInfo.startOffsetRowlayout = 0;
    this.layoutInfo.snapPositions = [];

    // remove any trails
    // removeTrail();
  }


  removeSpacer() {
    document.getElementById('spacer').remove()

    // change the entityBbox as the spacer was removed
    // this.updateEntityBBox();
  }


  updateEntityBBox() {

    this._arryOfWSVsThatHaveAClone.forEach(aWSV => {
      aWSV._theClonedWSV._entity.getBBoxOfEntity();

    });
  }


  // static addWhiteLayer(width: number, height: number, oldTop: number, oldLeft: number) {
  //
  //   // var whiteLayerBox = $("<div class='whiteLayer'></div>");
  //   //
  //   // $('#text').append(whiteLayerBox);
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
  //   // $(whiteLayerBox).css('position', 'absolute');
  //   // $(whiteLayerBox).css('opacity', 0);
  //   // $(whiteLayerBox).width(width);
  //   // $(whiteLayerBox).height(height);
  //   // $(whiteLayerBox).offset({top: oldTop, left: oldLeft});
  //   // $(whiteLayerBox).css('z-index', 4);
  //   // $(whiteLayerBox).css('pointer-events', 'none');
  //
  //   return whiteLayerDiv;
  // }


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


  /**
  * Calculates the possible number of columns/rows above and below the current entity.
  * @param  {[type]} aCurrentEntity               [description]
  * @param  {[type]} aPositionType                [description]
  * @param  {[type]} boundToWhat                  [description]
  * @param  {[type]} arrayOfWSVMeasurementObjects [description]
  * @param  {[type]} aCellWidth                   [description]
  * @param  {[type]} aCellHeight                  [description]
  * @param  {[type]} spaceBetweenGridCells        [description]
  * @return {object}      - custom object including the number of columns to the left and right, and above and below
  */
  spaceAvailability_numberColAndRows(aCurrentEntity, aPositionType, layoutType, boundToWhat, arrayOfWSVs, aCellWidth, aCellHeight, spaceBetweenGridCells) {

    //TODO layoutTpe variable not yet used, do I need to use it

    let numberColAndRows = {leftNumbColumn: 0,
                            rightNumbColumn: 0,
                            currentEntityColumn: 1,
                            totalNumberOfColumns: 1,
                            aboveNumbRow: 0,
                            belowNumbRow: 0};

    let widthAvailableForInteraction = window.innerWidth;
    let heightAvailableForInteraction = window.innerHeight;
    //
    // let currentEntity_rightPosition = this.get_BBox_entity(aCurrentEntity).right
    // let currentWSV_BboxDimensions = this.get_BBox_wsv(aCurrentEntity, aPositionType)
    let currentEntity_rightPosition = aCurrentEntity._entityBbox.right;
    let currentWSV_BboxDimensions = aCurrentEntity._entityBelongsToWsv._wsvBBox;
    let currentWSV_topPosition = currentWSV_BboxDimensions.top;
    let currentWSV_bottomPosition = currentWSV_BboxDimensions.bottom;
    // let currentWSV_rightPosition = currentWSV_BboxDimensions.right;
    let max_entityWidth = this.get_entityMaxWidth(arrayOfWSVs);
    let max_sparklineWidth = this.get_SparklineMaxWidth(arrayOfWSVs);

    // these is the bbox of the text, a wsv should not go over it
    let bodyBbox = LayoutCreator.getBodyBBox();
    let leftBuffer = bodyBbox.left;
    let rightBuffer = widthAvailableForInteraction - bodyBbox.right;
    // let topBuffer = bodyBbox.top;
    // let bottomBuffer = bodyBbox.bottom;


    let availableSpace_left = 0;
    let availableSpaceForCurrentEntityColumn_left = 0;
    let numbColumnsPossible_left = 0;
    let availableSpace_right = 0;
    let numbColumnsPossible_right = 0;
    let availableSpace_above = 0;
    let numRowsPossible_above = 0;
    let availableSpace_below = 0;
    let numRowsPossible_below = 0;

    // set it to one because usually there is enough space
    let currentEntityColumn_usable = 1;

    if (layoutType === 'GridLayout') {
      if (boundToWhat === 'middleBound') {

        // is there enough space available in the column where the current entity is
        availableSpaceForCurrentEntityColumn_left = currentEntity_rightPosition - max_entityWidth - leftBuffer;
        if (availableSpaceForCurrentEntityColumn_left < 0) {
          currentEntityColumn_usable = 0;
        }

        numberColAndRows.currentEntityColumn = currentEntityColumn_usable;
        console.log('IS IT OK: ' + numberColAndRows.currentEntityColumn);

        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells - leftBuffer;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.leftNumbColumn = numbColumnsPossible_left;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells) - rightBuffer;

        numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.rightNumbColumn = numbColumnsPossible_right;

        // how many rows available above current entity
        // top position relative to viewport
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));

        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.aboveNumbRow = numRowsPossible_above;

        // how many rows available below current entity
        // bottom position relative to viewport
        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));

        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    } else if (layoutType === 'ColumnLayout') {
      if (boundToWhat === 'middleBound') {
        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        // numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        // numberColAndRows.leftNumbColumn = numbColumnsPossible_left;
        numberColAndRows.leftNumbColumn = 0;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells);

        // numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        // numberColAndRows.rightNumbColumn = numbColumnsPossible_right;
        numberColAndRows.rightNumbColumn = 0;

        // how many rows available above current entity
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));

        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.aboveNumbRow = numRowsPossible_above;

        // how many rows available below current entity
        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));

        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    } else if (layoutType === 'ColumnPanAlignedLayout') {
      if (boundToWhat === 'middleBound') {
        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        //numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        // numberColAndRows.leftNumbColumn = numbColumnsPossible_left;
        numberColAndRows.leftNumbColumn = 1;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells);

        // numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        // numberColAndRows.rightNumbColumn = numbColumnsPossible_right;
        numberColAndRows.rightNumbColumn = 1;

        // how many rows available above current entity
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));

        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.aboveNumbRow = numRowsPossible_above;

        // how many rows available below current entity
        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));

        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    } else if (layoutType === 'RowLayout') {
      if (boundToWhat === 'middleBound') {
        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells - leftBuffer;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.leftNumbColumn = numbColumnsPossible_left;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells) - rightBuffer;

        numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.rightNumbColumn = numbColumnsPossible_right;

        // how many rows available above current entity
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));
        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));

        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));
        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));

        if (numRowsPossible_above > 0) {
          numberColAndRows.aboveNumbRow = 1;
          numberColAndRows.belowNumbRow = 0;
        } else if (numRowsPossible_below > 0) {
          numberColAndRows.aboveNumbRow = 0;
          numberColAndRows.belowNumbRow = 1;
        }


        // how many rows available below current entity

        // numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    } else if (layoutType === 'GridNoOverlapLayout') {
      if (boundToWhat === 'middleBound') {
        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.leftNumbColumn = numbColumnsPossible_left;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells);

        numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.rightNumbColumn = numbColumnsPossible_right;

        // how many rows available above current entity
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));

        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.aboveNumbRow = numRowsPossible_above;

        // how many rows available below current entity
        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));

        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    }

    numberColAndRows.totalNumberOfColumns = numberColAndRows.leftNumbColumn + numberColAndRows.rightNumbColumn + numberColAndRows.currentEntityColumn;

    return numberColAndRows;
  }


  /**
  * Gets the maximal width of the entities present in the document.
  * @return {[type]} [description]
  */
  get_entityMaxWidth(arrayOfWSVMeasurementObjects) {
    var entityMaxWidth = Math.max.apply(null, arrayOfWSVMeasurementObjects.map((aWSV: WordScaleVisualization) => {
      return aWSV.entity._entityBbox.width;
    }));

    return entityMaxWidth;
  }


  /**
  * Gets the maximum sparkline among a collection of sparklines
  * @param  {Array[objects]} arrayOfWSVMeasurementObjects [description]
  * @return {float}                              [description]
  */
  get_SparklineMaxWidth(arrayOfWSVMeasurementObjects) {
    var sparklineMaxWidth = Math.max.apply(null, arrayOfWSVMeasurementObjects.map((aWSV: WordScaleVisualization) => {
      return aWSV._wsvVisualizationBBox.width;
    }));

    return sparklineMaxWidth;
  }


  static getBodyBBox(): DOMRect | ClientRect {

    return document.body.getBoundingClientRect();
  }


  static getAboveBelowCounts(anArrayOfWSVs: Array<WordScaleVisualization>) {
    const counts = {above: 0, below: 0}

    anArrayOfWSVs.forEach(aWSV => {
      if (aWSV._aboveOrBelow === 'above') {
        counts.above += 1;
      } else if (aWSV._aboveOrBelow === 'below') {
        counts.below += 1;
      }
    })

    return counts;
  }


  static addWhiteLayer(width: number, height: number, oldTop: number, oldLeft: number) {

    const whiteLayerDiv = document.createElement('div');
    whiteLayerDiv.classList.add('whiteLayer');
    document.getElementById('text').append(whiteLayerDiv);

    whiteLayerDiv.style.width = width + 'px';
    whiteLayerDiv.style.height = height + 'px';

    whiteLayerDiv.style.top = oldTop + 'px';
    whiteLayerDiv.style.left = oldLeft + 'px';

    return whiteLayerDiv;
  }


  // get the left, right, top and bottom borders of text div for optimal visualization of wsvs, same for every layout
  static getViewportMeasurements(aLayoutRef: Layout): LayoutInfo {

    let bodyBbox = LayoutCreator.getBodyBBox();
    let viewportDimensionsLeftRight = {left: bodyBbox.left, right: bodyBbox.right};
    let viewportDimensionsTopBottom = {top: bodyBbox.top, bottom: bodyBbox.bottom};

    let layoutInfo = {};
    if (typeof aLayoutRef !== 'undefined') {
      aLayoutRef.layoutInfo.viewportLeft = viewportDimensionsLeftRight.left;
      aLayoutRef.layoutInfo.viewportRight = viewportDimensionsLeftRight.right;
      aLayoutRef.layoutInfo.viewportTop = viewportDimensionsTopBottom.top;
      aLayoutRef.layoutInfo.viewportBottom = viewportDimensionsTopBottom.bottom;
    } else {
      console.log('PROBLEM: first create the layoutInfo object.')
    }

    return layoutInfo;
  }


  // static getBodyBBox(): DOMRect | ClientRect {
  //
  //   return document.body.getBoundingClientRect();
  // }


}

 export default LayoutCreator
