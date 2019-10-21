import { LayoutInfo, SpaceAvailability, VelocitySequence } from "../../../global";

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
  _wsvsWithoutCurrentWSV: Array<WordScaleVisualization>;
  _spaceAvailability: SpaceAvailability;


  constructor(aLayoutInfo: LayoutInfo, aSpaceAvailability: SpaceAvailability, aRefToText: Text, anArrayOfwsvsWithoutCurrentWSV: Array<WordScaleVisualization>) {
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._wsvsWithoutCurrentWSV = anArrayOfwsvsWithoutCurrentWSV;
    this._spaceAvailability = aSpaceAvailability;
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
    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithoutCurrentWSV)

    // get top left cornerDiffs
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);

    let topLeftCorner_left = 0;
    if (layoutInfo.rowAndColumnNumbers.currentEntityColumn == 0) {
      topLeftCorner_left = currentEntityBBox.left + (layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding));

    } else {
      topLeftCorner_left = currentEntityBBox.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding)));
    }

    let topLeftCorner_top = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.top - (numUsedRowsAbove * (layoutInfo.cellDimensions.height + (2*layoutInfo.cellPadding)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;


    let aboveIndex = GridLayout.getGridStartIndex(layoutInfo.counts.above, layoutInfo.numberOfColumns)
    layoutInfo.startIndex_above = aboveIndex;

    let mySequence: Array<VelocitySequence> = [];
    let belowIndex = 0;
    layoutInfo.startIndex_below = 0;

    this._wsvsWithoutCurrentWSV.forEach(aWSV => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
      } else {
        aClonedWSV = aWSV._clonedWSV!;
        aClonedWSV.removeClassOffWSV('hide');
      }


      let newTop = 0;
      let newLeft = 0;
      if (aWSV._aboveOrBelow === 'above') {

        newTop = topLeftCorner_top + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.cellPadding)));
        newLeft = topLeftCorner_left + ((aboveIndex % layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding))) + aWSV._middleBoundOffset;

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + (2*layoutInfo.cellPadding)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.cellPadding)));
        newLeft = topLeftCorner_left + ((belowIndex % layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding))) + aWSV._middleBoundOffset;
        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }


      let whiteBackgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding)), (layoutInfo.cellDimensions.height + (2*layoutInfo.cellPadding)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

        aWSV._clonedWSV._backgroundElement = whiteBackgroundElement;
      } else {
        // the layout before might have hidden some of the whiteLayer, therefore unhide
        aWSV._clonedWSV._backgroundElement.classList.remove('hide');

        whiteBackgroundElement = aWSV._clonedWSV._backgroundElement;
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

      mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.cellPadding - aWSV._offsetWhiteLayer), top: (newTop - layoutInfo.cellPadding), opacity: 1}, o: {
          duration: 1000,
          sequenceQueue: false
        }
      });

    });

    $.Velocity.RunSequence(mySequence);
  }

  // based on available space around the current Entity and the layout, provide number of columns and rows to be used
  getRowAndColumnInfo(boundToWhat: string, aSpaceAvailability: SpaceAvailability): void {

    const layoutInfo = this.layoutInfo;
    const cellPadding = layoutInfo.cellPadding;

    if (boundToWhat === 'middleBound') {

      // is there enough space available in the column where the current entity is
      if (aSpaceAvailability.currentEntityColumn < 0) {
        layoutInfo.rowAndColumnNumbers.currentEntityColumn = 0;
      } else {
        layoutInfo.rowAndColumnNumbers.currentEntityColumn = 1;
      }

      // how many columns available to the left
      layoutInfo.rowAndColumnNumbers.leftNumbColumn = Math.floor(aSpaceAvailability.left / (layoutInfo.cellDimensions.width + (2 * cellPadding)));

      // how many columns available to the right
      layoutInfo.rowAndColumnNumbers.rightNumbColumn = Math.floor(aSpaceAvailability.right / (layoutInfo.cellDimensions.width + (2 * cellPadding)));

      // how many rows available above current entity
      // top position relative to viewport
      layoutInfo.rowAndColumnNumbers.aboveNumbRow = Math.floor(aSpaceAvailability.above / (layoutInfo.cellDimensions.height + (2 * cellPadding)));

      // how many rows available below current entity
      // bottom position relative to viewport
      layoutInfo.rowAndColumnNumbers.belowNumbRow = Math.floor(aSpaceAvailability.below / (layoutInfo.cellDimensions.height + (2 * cellPadding)));

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
