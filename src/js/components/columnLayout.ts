import { LayoutInfo, SpaceAvailability, VelocitySequence } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
// import Entity from './entity';
import LayoutCreator from './layoutCreator';
import Layout from './layout';

import 'velocity-animate';
import 'velocity-ui-pack';



class ColumnLayout implements Layout {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _wsvsWithouCurrentWSV: Array<WordScaleVisualization>;
  _spaceAvailability: SpaceAvailability;


  constructor(aLayoutInfo: LayoutInfo, aSpaceAvailability: SpaceAvailability, aRefToText: Text, aWsvsWithouCurrentWSV: Array<WordScaleVisualization>) {
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._wsvsWithouCurrentWSV = aWsvsWithouCurrentWSV;
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
    layoutInfo.type = 'column';

    // const currentEntity: Entity = this._refToText.currentEntity!;
    // const bbox_currEntity: BBox = currentEntity._entityBbox;
    // const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    const currentEntityBBox = layoutInfo.currentEntity._entityBbox;

    // const currentEntity: Entity = this._refToText.currentEntity!;
    // const bbox_currEntity: BBox = currentEntity._entityBbox;
    // const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // get available space for columns and rows
    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    // update the row and columns number
    // layoutInfo.numberOfColumns = 1;

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithouCurrentWSV)


    // get top left cornerDiffs
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);

    const topLeftCorner_left = currentEntityBBox.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells)));
    const topLeftCorner_top = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.top - (numUsedRowsAbove * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;

    const mySequence: Array<VelocitySequence> = [];
    let aboveIndex = 0;
    let belowIndex = 0;
    this._wsvsWithouCurrentWSV.forEach(aWSV => {
      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
        aWSV._theClonedWSV = aClonedWSV;
        aClonedWSV._theOriginalWSV = aWSV;

        aWSV._wsv.classList.add('hasClone');
      } else {
        aClonedWSV = aWSV._theClonedWSV;
        aClonedWSV.removeClassOffWSV('hide');
      }

      let newTop = 0;
      let newLeft = topLeftCorner_left + aWSV._middleBoundOffset;
      if (aWSV._aboveOrBelow === 'above') {

        newTop = topLeftCorner_top + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + (2*layoutInfo.spaceBetweenCells)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));

        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }

      // the wsv position is controlled over the bottom and left of the entity and not the wsv as a whole or the sparkline
      // clonedWSV is the sparklificated span, due to that have to add position plus substract the size of the sparkline

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
  }


  // based on available space around the current Entity and the layout, provide number of columns and rows to be used
  getRowAndColumnInfo(boundToWhat: string, aSpaceAvailability: SpaceAvailability): void {

    const layoutInfo = this.layoutInfo;
    const spaceBetweenCells = layoutInfo.spaceBetweenCells;

    if (boundToWhat === 'middleBound') {

      // is there enough space available in the column where the current entity is
      layoutInfo.rowAndColumnNumbers.currentEntityColumn = 1;

      // how many columns available to the left
      layoutInfo.rowAndColumnNumbers.leftNumbColumn = 0;

      // how many columns available to the right
      layoutInfo.rowAndColumnNumbers.rightNumbColumn = 0;

      // how many rows available above current entity
      // top position relative to viewport
      layoutInfo.rowAndColumnNumbers.aboveNumbRow = Math.floor(aSpaceAvailability.above / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      // how many rows available below current entity
      // bottom position relative to viewport
      layoutInfo.rowAndColumnNumbers.belowNumbRow = Math.floor(aSpaceAvailability.below / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      layoutInfo.numberOfColumns = layoutInfo.rowAndColumnNumbers.leftNumbColumn + layoutInfo.rowAndColumnNumbers.currentEntityColumn + layoutInfo.rowAndColumnNumbers.rightNumbColumn;
    }
  }


  cleanUpAfterLayout() {
    console.log('column layout cleanup');

  }




}


export default ColumnLayout
