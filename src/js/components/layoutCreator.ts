  import { ColsAndRowsNumber, LayoutInfo, VelocitySequence, CellDimension, SpaceAvailability } from "../../../global";

import { wsvInteractionConstants } from '../constants';

import Entity from './entity';
import Layout from './layout';
import Sorter from '../sorting/sorter';
import sortingFactoryClass from '../sorting/sortingFactoryClass';
import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';

const dl = require('../../lib/datalib.min.js');

import 'velocity-animate';
import 'velocity-ui-pack';



abstract class LayoutCreator {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _theLayout: Layout;
  _wsvsThatHaveAClone: Array<WordScaleVisualization>;
  _spaceUsableInteractively: SpaceAvailability;
  _layoutClass: string;



  constructor(aRefToText: Text) {
    this._layoutInfo = {rowAndColumnNumbers: {}};
    this._layoutInfo.cellPadding = 5;

    this._refToText = aRefToText;
    this._wsvsThatHaveAClone = []
  }


  // getter/setter
  set layoutInfo(keyValuePair) {
    this._layoutInfo[keyValuePair[0]] = keyValuePair[1];
  }
  get layoutInfo() {
    return this._layoutInfo;
  }



  abstract layoutFactory(aLayoutName: string, layoutInfo: LayoutInfo, spaceAvailability: SpaceAvailability, refToText: Text, wsvsWithoutCurrentWSV: Array<WordScaleVisualization>): Layout


  changeLayout(layoutType: string, sorting: string) {

    this._layoutClass = layoutType;

    const layoutInfo = this.layoutInfo;

    const currentEntity: Entity = this._refToText.currentEntity!;
    layoutInfo.currentEntity = currentEntity;

    const bboxCurrEntity = currentEntity._entityBbox;

    // get dimensions of cell, where a cell is a rectangle around the wsv
    layoutInfo.cellDimensions = this.getCellDimensions(this._refToText.listOfWSVs, this._layoutInfo.cellPadding);

    this._wsvsThatHaveAClone = this._refToText.listOfWSVs.filter(aWSV => aWSV != this._refToText._currentWSV);

    const sortingFactory = sortingFactoryClass(sorting, this._wsvsThatHaveAClone, this._refToText)
    this._wsvsThatHaveAClone = sortingFactory.sort();
    sortingFactory.setComparator(this._refToText.currentWSV);

    const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);

    this._refToText._listOfWSVs.forEach(aWSV => {
      // max entity provides left most extension of an entity -> diff between max entity and the entity
      aWSV._offsetEntity = maxEntityWidth - aWSV._entity._entityBbox.width;
    })


    this._wsvsThatHaveAClone.forEach(aWSV => {
      let aEntityBBox = aWSV.entity._entityBbox;
      // aWSV._aboveOrBelow = (aEntityBBox.top > bboxCurrEntity.bottom) ? 'below' : 'above';
      aWSV._aboveOrBelow = sortingFactory.compare(aWSV);

      if (wsvInteractionConstants.positionType === 'right') {
        aWSV._middleBoundOffset = bboxCurrEntity.width - aEntityBBox.width;
        aWSV._offsetWhiteLayer = layoutInfo.cellDimensions.width - aWSV._wsvBBox.width;

        // max entity provides left most extension of an entity -> diff between max entity and the entity
        // aWSV._offsetEntity = maxEntityWidth - aWSV._entity._entityBbox.width;
      }

      // aWSV._distanceToCurrEntity = bboxCurrEntity.top - aEntityBBox.top;
    });

    // // order first by above or below, then use distance to the currentEntity
    // this._wsvsThatHaveAClone.sort(dl.comparator(['+_aboveOrBelow', '-_distanceToCurrEntity']));


    // let rowAndColumnNumbers: ColsAndRowsNumber = this.spaceAvailabilityColsAndRowsNumber(currentEntity, wsvInteractionConstants.positionType, layoutType, 'middleBound', this._refToText.listOfWSVs, layoutInfo.cellDimensions, layoutInfo.cellPadding);
    //
    // layoutInfo.rowAndColumnNumbers = rowAndColumnNumbers;
    // layoutInfo = ['numberOfColumns', rowAndColumnNumbers.totalNumberOfColumns];
    this.getUsableInteractiveSpace();

    this._theLayout = this.layoutFactory(layoutType, layoutInfo, this._spaceUsableInteractively, this._refToText, this._wsvsThatHaveAClone);
    this._theLayout.applyLayout();

    this._refToText.isLayoutVisible = true;
  }


  giveUpLayout() {

    const giveUpAnimationSequence: Array<VelocitySequence> = [];

    this._wsvsThatHaveAClone.forEach((aWSV, index) => {

      let originalWSVBBox = aWSV._wsvBBox;
      let whiteBackgroundElement = aWSV._clonedWSV._backgroundElement;

      giveUpAnimationSequence.push({e: aWSV._clonedWSV._wsv,
                                    p: {left: originalWSVBBox.left, top: originalWSVBBox.top},
                                    o: {sequenceQueue: false,
                                        duration: 800,
                                        complete: () => {
                                          aWSV._clonedWSV.removeClone()
                                        }
                                      }
                                  });

      if (Object.is(this._wsvsThatHaveAClone.length - 1, index)) {

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
                                            this._theLayout.cleanUpAfterLayout();

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

    if (giveUpAnimationSequence.length > 0) {
      $.Velocity.RunSequence(giveUpAnimationSequence);
    } else {
      this.cleanupAfterLayout();
    }
  }


  cleanupAfterLayout() {

    this._refToText._isLayoutVisible = false;

    // hide contextualMenu
    this._refToText._contextualMenu.hideContextualMenu(this._refToText._currentEntity!);

    this.layoutInfo.bandLength = 0;
    this.layoutInfo.startOffsetRowlayout = 0;
    this.layoutInfo.snapPositions = [];

    this._wsvsThatHaveAClone = [];

    // remove any trails
    // removeTrail();
  }


  // updateEntityBBox() {
  //
  //   this._wsvsThatHaveAClone.forEach(aWSV => {
  //     aWSV._clonedWSV._entity.setBBoxOfEntity();
  //
  //   });
  // }


  // static comparing2DCoordinates(oldCoordinates, newCoordinates) {
  //
  //   if ((oldCoordinates.x === newCoordinates.x) && (oldCoordinates.y === newCoordinates.y)) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }


  /**
  * A cell is where the wsv (sparkline + entity) is embedded + padding.
  * @return {object} - custom object with the height and width of the cell
  */
  getCellDimensions(arrayOfWSVs: Array<WordScaleVisualization>, padding: number): CellDimension {

    // initialize the return object
    const cellDimensions = {height: 0,
                            width: 0}

    // get the max wsv height
    cellDimensions.height = Math.max.apply(null, arrayOfWSVs.map(aWSV => aWSV._wsvBBox.height));
    cellDimensions.height = cellDimensions.height + (2 * padding);

    // get the max wsv width
    cellDimensions.width = Math.max.apply(null, arrayOfWSVs.map(aWSV => aWSV._wsvBBox.width));
    cellDimensions.width = cellDimensions.width + (2 * padding);

    return cellDimensions;
  }


  getUsableInteractiveSpace(): void {
    const layoutInfo = this.layoutInfo;
    const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);
    const maxSparklineWidth = LayoutCreator.getSparklineMaxWidth(this._refToText.listOfWSVs);

    // the width of the window
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    // these is the bbox of the text with "margin", a wsv should not go over it
    const bodyBbox = LayoutCreator.getBodyBBox();
    const leftWindowPadding = bodyBbox.left;
    const rightWindowPadding = windowWidth - bodyBbox.right;

    const currentEntityBBoxRight = layoutInfo.currentEntity._entityBbox.right;
    const currentWSVBBox = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox;

    const cellPadding = layoutInfo.cellPadding;

    // is there enough space available in the column where the current entity is
    let availableSpaceForCurrentEntityColumn_left = currentEntityBBoxRight - maxEntityWidth - leftWindowPadding;

    // how many columns available to the left
    let availableSpaceLeft = Math.max(0, (currentEntityBBoxRight - maxEntityWidth - cellPadding - leftWindowPadding));

    // how many columns available to the right
    let availableSpaceRight = Math.max(0, (windowWidth - (currentEntityBBoxRight + maxSparklineWidth + cellPadding) - rightWindowPadding));

    // how many rows available above current entity
    // top position relative to viewport
    let availableSpaceAbove = Math.max(0, (currentWSVBBox.top - document.body.scrollTop - cellPadding));

    // how many rows available below current entity
    // bottom position relative to viewport
    let availableSpaceBelow = Math.max(0, (windowHeight - (currentWSVBBox.bottom - document.body.scrollTop) - cellPadding));

    let spaceAvailability = {currentEntityColumn: availableSpaceForCurrentEntityColumn_left,
                             left: availableSpaceLeft,
                             above: availableSpaceAbove,
                             right: availableSpaceRight,
                             below: availableSpaceBelow}

    this._spaceUsableInteractively = spaceAvailability
  }


  // // Calculates the possible number of columns/rows above and below the current entity.
  // spaceAvailabilityColsAndRowsNumber(aCurrentEntity, layoutInfo, aPositionType, layoutType, boundToWhat, arrayOfWSVs, aCellDimension, cellPadding): ColsAndRowsNumber {
  //
  //   //TODO layoutTpe variable not yet used, do I need to use it
  //
  //   let colsAndRowsNumber = {leftNumbColumn: 0,
  //                           rightNumbColumn: 0,
  //                           currentEntityColumn: 1,
  //                           totalNumberOfColumns: 1,
  //                           aboveNumbRow: 0,
  //                           belowNumbRow: 0};
  //
  //   let widthAvailableForInteraction = window.innerWidth;
  //   let heightAvailableForInteraction = window.innerHeight;
  //   //
  //   // let currentEntity_rightPosition = this.get_BBox_entity(aCurrentEntity).right
  //   // let currentWSV_BboxDimensions = this.get_BBox_wsv(aCurrentEntity, aPositionType)
  //   let currentEntity_rightPosition = aCurrentEntity._entityBbox.right;
  //   let currentWSV_BboxDimensions = aCurrentEntity._entityBelongsToWsv._wsvBBox;
  //   let currentWSV_topPosition = currentWSV_BboxDimensions.top;
  //   let currentWSV_bottomPosition = currentWSV_BboxDimensions.bottom;
  //   // let currentWSV_rightPosition = currentWSV_BboxDimensions.right;
  //   let max_entityWidth = this.getEntityMaxWidth(arrayOfWSVs);
  //   let max_sparklineWidth = this.getSparklineMaxWidth(arrayOfWSVs);
  //
  //   // these is the bbox of the text, a wsv should not go over it
  //   let bodyBbox = LayoutCreator.getBodyBBox();
  //   let leftBuffer = bodyBbox.left;
  //   let rightBuffer = widthAvailableForInteraction - bodyBbox.right;
  //   // let topBuffer = bodyBbox.top;
  //   // let bottomBuffer = bodyBbox.bottom;
  //
  //
  //   let availableSpace_left = 0;
  //   let availableSpaceForCurrentEntityColumn_left = 0;
  //   let numbColumnsPossible_left = 0;
  //   let availableSpace_right = 0;
  //   let numbColumnsPossible_right = 0;
  //   let availableSpace_above = 0;
  //   let numRowsPossible_above = 0;
  //   let availableSpace_below = 0;
  //   let numRowsPossible_below = 0;
  //
  //   // set it to one because usually there is enough space
  //   let currentEntityColumn_usable = 1;
  //
  //   if (layoutType === 'GridLayout') {
  //     if (boundToWhat === 'middleBound') {
  //
  //       // is there enough space available in the column where the current entity is
  //       availableSpaceForCurrentEntityColumn_left = currentEntity_rightPosition - max_entityWidth - leftBuffer;
  //       if (availableSpaceForCurrentEntityColumn_left < 0) {
  //         currentEntityColumn_usable = 0;
  //       }
  //
  //       colsAndRowsNumber.currentEntityColumn = currentEntityColumn_usable;
  //       console.log('IS IT OK: ' + colsAndRowsNumber.currentEntityColumn);
  //
  //       // how many columns available to the left
  //       availableSpace_left = currentEntity_rightPosition - max_entityWidth - cellPadding - leftBuffer;
  //       if (availableSpace_left < 0) {
  //         availableSpace_left = 0;
  //       }
  //
  //       numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellDimension.width + (2 * cellPadding)));
  //       colsAndRowsNumber.leftNumbColumn = numbColumnsPossible_left;
  //
  //       // how many columns available to the right
  //       availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + cellPadding) - rightBuffer;
  //
  //       numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellDimension.width + (2 * cellPadding)));
  //       colsAndRowsNumber.rightNumbColumn = numbColumnsPossible_right;
  //
  //       // how many rows available above current entity
  //       // top position relative to viewport
  //       availableSpace_above = Math.max(0, (currentWSV_topPosition - document.body.scrollTop - cellPadding));
  //
  //       numRowsPossible_above = Math.floor(availableSpace_above / (aCellDimension.height + (2 * cellPadding)));
  //       colsAndRowsNumber.aboveNumbRow = numRowsPossible_above;
  //
  //       // how many rows available below current entity
  //       // bottom position relative to viewport
  //       availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - document.body.scrollTop) - cellPadding));
  //
  //       numRowsPossible_below = Math.floor(availableSpace_below / (aCellDimension.height + (2 * cellPadding)));
  //       colsAndRowsNumber.belowNumbRow = numRowsPossible_below;
  //
  //     } else if (boundToWhat === 'rightBound') {
  //       //TODO
  //     }
  //
  //   } else if (layoutType === 'ColumnLayout') {
  //     if (boundToWhat === 'middleBound') {
  //       // how many columns available to the left
  //       availableSpace_left = currentEntity_rightPosition - max_entityWidth - cellPadding;
  //       if (availableSpace_left < 0) {
  //         availableSpace_left = 0;
  //       }
  //
  //       // numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * cellPadding)));
  //       // ColsAndRowsNumber.leftNumbColumn = numbColumnsPossible_left;
  //       colsAndRowsNumber.leftNumbColumn = 0;
  //
  //       // how many columns available to the right
  //       availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + cellPadding);
  //
  //       // numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * cellPadding)));
  //       // colsAndRowsNumber.rightNumbColumn = numbColumnsPossible_right;
  //       colsAndRowsNumber.rightNumbColumn = 0;
  //
  //       // how many rows available above current entity
  //       availableSpace_above = Math.max(0, (currentWSV_topPosition - document.body.scrollTop - cellPadding));
  //
  //       numRowsPossible_above = Math.floor(availableSpace_above / (aCellDimension.height + (2 * cellPadding)));
  //       colsAndRowsNumber.aboveNumbRow = numRowsPossible_above;
  //
  //       // how many rows available below current entity
  //       availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - document.body.scrollTop) - cellPadding));
  //
  //       numRowsPossible_below = Math.floor(availableSpace_below / (aCellDimension.height + (2 * cellPadding)));
  //       colsAndRowsNumber.belowNumbRow = numRowsPossible_below;
  //
  //     } else if (boundToWhat === 'rightBound') {
  //       //TODO
  //     }
  //
  //   } else if (layoutType === 'ColumnPanAlignedLayout') {
  //     if (boundToWhat === 'middleBound') {
  //       // how many columns available to the left
  //       availableSpace_left = currentEntity_rightPosition - max_entityWidth - cellPadding;
  //       if (availableSpace_left < 0) {
  //         availableSpace_left = 0;
  //       }
  //
  //       //numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * cellPadding)));
  //       // colsAndRowsNumber.leftNumbColumn = numbColumnsPossible_left;
  //       colsAndRowsNumber.leftNumbColumn = 1;
  //
  //       // how many columns available to the right
  //       availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + cellPadding);
  //
  //       // numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * cellPadding)));
  //       // colsAndRowsNumber.rightNumbColumn = numbColumnsPossible_right;
  //       colsAndRowsNumber.rightNumbColumn = 1;
  //
  //       // how many rows available above current entity
  //       availableSpace_above = Math.max(0, (currentWSV_topPosition - document.body.scrollTop - cellPadding));
  //
  //       numRowsPossible_above = Math.floor(availableSpace_above / (aCellDimension.height + (2 * cellPadding)));
  //       colsAndRowsNumber.aboveNumbRow = numRowsPossible_above;
  //
  //       // how many rows available below current entity
  //       availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - document.body.scrollTop) - cellPadding));
  //
  //       numRowsPossible_below = Math.floor(availableSpace_below / (aCellDimension.height + (2 * cellPadding)));
  //       colsAndRowsNumber.belowNumbRow = numRowsPossible_below;
  //
  //     } else if (boundToWhat === 'rightBound') {
  //       //TODO
  //     }
  //
  //   } else if (layoutType === 'RowLayout') {
  //     if (boundToWhat === 'middleBound') {
  //       // how many columns available to the left
  //       availableSpace_left = currentEntity_rightPosition - max_entityWidth - cellPadding - leftBuffer;
  //       if (availableSpace_left < 0) {
  //         availableSpace_left = 0;
  //       }
  //
  //       numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellDimension.width + (2 * cellPadding)));
  //       colsAndRowsNumber.leftNumbColumn = numbColumnsPossible_left;
  //
  //       // how many columns available to the right
  //       availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + cellPadding) - rightBuffer;
  //
  //       numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellDimension.width + (2 * cellPadding)));
  //       colsAndRowsNumber.rightNumbColumn = numbColumnsPossible_right;
  //
  //       // how many rows available above current entity
  //       availableSpace_above = Math.max(0, (currentWSV_topPosition - document.body.scrollTop - cellPadding));
  //       numRowsPossible_above = Math.floor(availableSpace_above / (aCellDimension.height + (2 * cellPadding)));
  //
  //       availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - document.body.scrollTop) - cellPadding));
  //       numRowsPossible_below = Math.floor(availableSpace_below / (aCellDimension.height + (2 * cellPadding)));
  //
  //       if (numRowsPossible_above > 0) {
  //         colsAndRowsNumber.aboveNumbRow = 1;
  //         colsAndRowsNumber.belowNumbRow = 0;
  //       } else if (numRowsPossible_below > 0) {
  //         colsAndRowsNumber.aboveNumbRow = 0;
  //         colsAndRowsNumber.belowNumbRow = 1;
  //       }
  //
  //
  //       // how many rows available below current entity
  //
  //       // colsAndRowsNumber.belowNumbRow = numRowsPossible_below;
  //
  //     } else if (boundToWhat === 'rightBound') {
  //       //TODO
  //     }
  //
  //   } else if (layoutType === 'GridNoOverlapLayout') {
  //     if (boundToWhat === 'middleBound') {
  //       // how many columns available to the left
  //       availableSpace_left = currentEntity_rightPosition - max_entityWidth - cellPadding;
  //       if (availableSpace_left < 0) {
  //         availableSpace_left = 0;
  //       }
  //
  //       numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellDimension.width + (2 * cellPadding)));
  //       colsAndRowsNumber.leftNumbColumn = numbColumnsPossible_left;
  //
  //       // how many columns available to the right
  //       availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + cellPadding);
  //
  //       numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellDimension.width + (2 * cellPadding)));
  //       colsAndRowsNumber.rightNumbColumn = numbColumnsPossible_right;
  //
  //       // how many rows available above current entity
  //       availableSpace_above = Math.max(0, (currentWSV_topPosition - document.body.scrollTop - cellPadding));
  //
  //       numRowsPossible_above = Math.floor(availableSpace_above / (aCellDimension.height + (2 * cellPadding)));
  //       colsAndRowsNumber.aboveNumbRow = numRowsPossible_above;
  //
  //       // how many rows available below current entity
  //       availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - document.body.scrollTop) - cellPadding));
  //
  //       numRowsPossible_below = Math.floor(availableSpace_below / (aCellDimension.height + (2 * cellPadding)));
  //       colsAndRowsNumber.belowNumbRow = numRowsPossible_below;
  //
  //     } else if (boundToWhat === 'rightBound') {
  //       //TODO
  //     }
  //
  //   }
  //
  //   colsAndRowsNumber.totalNumberOfColumns = colsAndRowsNumber.leftNumbColumn + colsAndRowsNumber.rightNumbColumn + colsAndRowsNumber.currentEntityColumn;
  //
  //   return colsAndRowsNumber;
  // }


  /**
  * Gets the maximal width of the entities present in the document.
  * @return {[type]} [description]
  */
  static getEntityMaxWidth(arrayOfWSVMeasurementObjects: Array<WordScaleVisualization>): number {
    const entityMaxWidth = Math.max.apply(null, arrayOfWSVMeasurementObjects.map((aWSV: WordScaleVisualization) => {
      return aWSV.entity._entityBbox.width;
    }));

    return entityMaxWidth;
  }


  /**
  * Gets the maximum sparkline among a collection of sparklines
  * @param  {Array[objects]} arrayOfWSVMeasurementObjects [description]
  * @return {float}                              [description]
  */
  static getSparklineMaxWidth(arrayOfWSVMeasurementObjects: Array<WordScaleVisualization>): number {
    const sparklineMaxWidth = Math.max.apply(null, arrayOfWSVMeasurementObjects.map((aWSV: WordScaleVisualization) => {
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

    const textDiv = document.getElementById('text');
    if (textDiv) textDiv.append(whiteLayerDiv);

    whiteLayerDiv.style.width = width + 'px';
    whiteLayerDiv.style.height = height + 'px';

    whiteLayerDiv.style.top = oldTop + 'px';
    whiteLayerDiv.style.left = oldLeft + 'px';

    return whiteLayerDiv;
  }


}

 export default LayoutCreator
