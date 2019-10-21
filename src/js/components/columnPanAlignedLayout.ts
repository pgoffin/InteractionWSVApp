import { LayoutInfo, SpaceAvailability, VelocitySequence } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
// import Entity from './entity';
import Layout from './layout';
import LayoutCreator from './layoutCreator';

import 'velocity-animate';
import 'velocity-ui-pack';



class ColumnPanAlignedLayout implements Layout {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _wsvsWithoutCurrentWSV: Array<WordScaleVisualization>;
  _spaceAvailability: SpaceAvailability;


  constructor(aLayoutInfo: LayoutInfo, aSpaceAvailability: SpaceAvailability, aRefToText: Text, awsvsWithoutCurrentWSV: Array<WordScaleVisualization>) {
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._wsvsWithoutCurrentWSV = awsvsWithoutCurrentWSV;
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
    layoutInfo.type = 'column-pan-aligned';

    // const currentEntity: Entity = this._refToText.currentEntity!;
    // const bbox_currEntity: BBox = currentEntity._entityBbox;
    // const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    const currentEntityBBox = layoutInfo.currentEntity._entityBbox;

    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    // update the row and columns number
    // layoutInfo.numberOfColumns = 1;

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithoutCurrentWSV)

    // reference for the alignement
    let referenceClonedWSV
    if (layoutInfo.counts.above === 0) {
      // if all the wsvs are below the current entity
      referenceClonedWSV = this._wsvsWithoutCurrentWSV[0]
    } else {
      referenceClonedWSV = this._wsvsWithoutCurrentWSV[layoutInfo.counts.above-1]
    }

    const referenceWidth = referenceClonedWSV._entity._entityBbox.width;
    const referenceWSVWidth = referenceClonedWSV._wsvBBox.width

    // where should the aligned column be put left or right, usually right, but if not enough space left
    let topLeftCorner_left = 0;
    let topLeftCorner_top = 0;
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);
    let diffRight = document.body.getBoundingClientRect().right - layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.right;
    let alignedColumnLeft = false;

    if (diffRight >= (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells))) {

      topLeftCorner_left = currentEntityBBox.left + (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells));

    } else {

      topLeftCorner_left = currentEntityBBox.left - (referenceWSVWidth + (2*layoutInfo.spaceBetweenCells));
      alignedColumnLeft = true;
    }

    // get top left cornerDiffs
    topLeftCorner_top = (layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + layoutInfo.spaceBetweenCells) - (numUsedRowsAbove * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;

    let mySequence: Array<VelocitySequence> = [];
    let aboveIndex = 0;
    let belowIndex = 0;
    this._wsvsWithoutCurrentWSV.forEach(aWSV => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
      } else {
        aClonedWSV = aWSV._clonedWSV;
        aClonedWSV.removeClassOffWSV('hide');
      }

      // set the correct offset depending on being aligned left or right (majority of cases)
      let correctionOffset = aWSV._middleBoundOffset;
      if (alignedColumnLeft) {
        correctionOffset = referenceWidth - aWSV._entity._entityBbox.width;
      }


      let newTop = 0;
      let newLeft = 0;
      if (aWSV._aboveOrBelow === 'above') {

        newTop = (topLeftCorner_top + layoutInfo.spaceBetweenCells) + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));
        newLeft = topLeftCorner_left + correctionOffset;

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + (2*layoutInfo.spaceBetweenCells)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));
        newLeft = topLeftCorner_left + correctionOffset;

        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }


      let whiteBackgroundElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells)), (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

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
      layoutInfo.rowAndColumnNumbers.currentEntityColumn = 0;

      // how many columns available to the left
      layoutInfo.rowAndColumnNumbers.leftNumbColumn = 1;

      // how many columns available to the right
      layoutInfo.rowAndColumnNumbers.rightNumbColumn = 1;

      // how many rows available above current entity
      // top position relative to viewport
      layoutInfo.rowAndColumnNumbers.aboveNumbRow = Math.floor(aSpaceAvailability.above / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      // how many rows available below current entity
      // bottom position relative to viewport
      layoutInfo.rowAndColumnNumbers.belowNumbRow = Math.floor(aSpaceAvailability.below / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      layoutInfo.numberOfColumns = 1;
    }
  }


  cleanUpAfterLayout() {
    console.log('columnPanAligned layout cleanup');

  }
}


export default ColumnPanAlignedLayout
