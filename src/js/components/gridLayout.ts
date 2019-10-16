import { LayoutInfo, VelocitySequence } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
// import Entity from './entity';
import Layout from './layout';
import LayoutCreator from './layoutCreator'

import 'velocity-animate';
import 'velocity-ui-pack';



class GridLayout implements Layout {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _wsvsWithouCurrentWSV: Array<WordScaleVisualization>;


  constructor(aLayoutInfo: LayoutInfo, aRefToText: Text, anArrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>) {
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._wsvsWithouCurrentWSV = anArrayOfWSVsWithouCurrentWSV;
  }


  // getter/setter
  get layoutInfo() {
    return this._layoutInfo;
  }
  set layoutInfo(value) {
    this._layoutInfo = value;
  }


  applyLayout() {

    const layoutInfo = this.layoutInfo;
    layoutInfo.type = 'grid';

    const currentEntityBBox = layoutInfo.currentEntity._entityBbox;

    // const currentEntity: Entity = this._refToText.currentEntity!;
    // const bbox_currEntity: BBox = currentEntity._entityBbox;
    // const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // get available space for columns and rows
    this.getRowAndColumnInfo('middleBound');

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithouCurrentWSV)

    // get top left cornerDiffs
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);
    let topLeftCorner_left = 0;

    if (layoutInfo.rowAndColumnNumbers.currentEntityColumn == 0) {
      topLeftCorner_left = currentEntityBBox.left + (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells));

    } else {
      topLeftCorner_left = currentEntityBBox.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells)));
    }

    let topLeftCorner_top = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.top - (numUsedRowsAbove * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;


    let aboveIndex = GridLayout.getGridStartIndex(layoutInfo.counts.above, layoutInfo.numberOfColumns)
    layoutInfo.startIndex_above = aboveIndex;

    let mySequence: Array<VelocitySequence> = [];
    let belowIndex = 0;
    layoutInfo.startIndex_below = 0;

    this._wsvsWithouCurrentWSV.forEach(aWSV => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
        aWSV._theClonedWSV = aClonedWSV;
        aClonedWSV._theOriginalWSV = aWSV;

        aWSV._wsv.classList.add('hasClone');
      } else {
        aClonedWSV = aWSV._theClonedWSV!;

        aClonedWSV._wsv.classList.remove('hide');

        $(aClonedWSV).children().removeClass('hide');
      }


      let newTop = 0;
      let newLeft = 0;
      if (aWSV._aboveOrBelow === 'above') {

        newTop = topLeftCorner_top + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));
        newLeft = topLeftCorner_left + ((aboveIndex % layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells))) + aWSV._middleBoundOffset;

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + (2*layoutInfo.spaceBetweenCells)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));
        newLeft = topLeftCorner_left + ((belowIndex % layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells))) + aWSV._middleBoundOffset;
        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }


      let whiteBackgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells)), (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

        aWSV._theClonedWSV._backgroundElement = whiteBackgroundElement;
      } else {
        // the layout before might have hidden some of the whiteLayer, therefore unhide
        aWSV._theClonedWSV._backgroundElement.classList.remove('hide');

        whiteBackgroundElement = aWSV._theClonedWSV._backgroundElement;
      }


      mySequence.push({e: aClonedWSV._wsv, p: {left: (newLeft), top: (newTop)}, o: {
        duration: 1000,
        sequenceQueue: false,

        complete: () => {
          aClonedWSV._entity.setBBoxOfEntity();
          aClonedWSV.setBBoxOfSparkline();
          aClonedWSV.setBBoxOfWSV();
        }
      }});

      mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.spaceBetweenCells - aWSV._offsetWhiteLayer), top: (newTop - layoutInfo.spaceBetweenCells), opacity: 1}, o: {
          duration: 1000,
          sequenceQueue: false
        }
      });

    });

    $.Velocity.RunSequence(mySequence);

    $('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');
  }


  getRowAndColumnInfo(boundToWhat: string): void {

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

    const spaceBetweenCells = layoutInfo.spaceBetweenCells;


    if (boundToWhat === 'middleBound') {

      // is there enough space available in the column where the current entity is
      let availableSpaceForCurrentEntityColumn_left = currentEntityBBoxRight - maxEntityWidth - leftWindowPadding;

      if (availableSpaceForCurrentEntityColumn_left < 0) {
        layoutInfo.rowAndColumnNumbers.currentEntityColumn = 0;
      } else {
        layoutInfo.rowAndColumnNumbers.currentEntityColumn = 1;
      }
      // console.log('IS IT OK: ' + colsAndRowsNumber.currentEntityColumn);

      // how many columns available to the left
      let availableSpaceLeft = Math.max(0, (currentEntityBBoxRight - maxEntityWidth - spaceBetweenCells - leftWindowPadding));
      // if (availableSpaceLeft < 0) {
      //   colsAndRowsNumber.leftNumbColumn = 0;
      // }

      layoutInfo.rowAndColumnNumbers.leftNumbColumn = Math.floor(availableSpaceLeft / (layoutInfo.cellDimensions.width + (2 * spaceBetweenCells)));

      // how many columns available to the right
      let availableSpaceRight = Math.max(0, (windowWidth - (currentEntityBBoxRight + maxSparklineWidth + spaceBetweenCells) - rightWindowPadding));
      // if (availableSpaceRight < 0) {
      //   colsAndRowsNumber.rightNumbColumn = 0;
      // }

      layoutInfo.rowAndColumnNumbers.rightNumbColumn = Math.floor(availableSpaceRight / (layoutInfo.cellDimensions.width + (2 * spaceBetweenCells)));

      // how many rows available above current entity
      // top position relative to viewport
      let availableSpaceAbove = Math.max(0, (currentWSVBBox.top - document.body.scrollTop - spaceBetweenCells));

      layoutInfo.rowAndColumnNumbers.aboveNumbRow = Math.floor(availableSpaceAbove / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      // how many rows available below current entity
      // bottom position relative to viewport
      let availableSpaceBelow = Math.max(0, (windowHeight - (currentWSVBBox.bottom - document.body.scrollTop) - spaceBetweenCells));

      layoutInfo.rowAndColumnNumbers.belowNumbRow = Math.floor(availableSpaceBelow / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      layoutInfo.numberOfColumns = layoutInfo.rowAndColumnNumbers.leftNumbColumn + layoutInfo.rowAndColumnNumbers.currentEntityColumn + layoutInfo.rowAndColumnNumbers.rightNumbColumn;
    }
  }


  static getGridStartIndex(countsAbove: number, numberOfColumns: number): number {

    let rest = countsAbove % numberOfColumns;
    if (rest === 0) {
      rest = numberOfColumns;
    }

    return numberOfColumns - rest;
  }


  cleanUpAfterLayout() {
    console.log('grid layout cleanup');

  }


}


export default GridLayout
