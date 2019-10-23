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

    const currentEntityBBox = layoutInfo.currentEntity._entityBbox;
    const currentWSV = layoutInfo.currentEntity._entityBelongsToWsv;

    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithoutCurrentWSV)

    // where should the aligned column be put left or right, usually right, but if not enough space left
    let topLeftCorner_left = 0;
    let topLeftCorner_top = 0;
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);
    let diffRight = document.body.getBoundingClientRect().right - layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.right;

    if (diffRight >= layoutInfo.cellDimensions.width) {

      topLeftCorner_left = (currentEntityBBox.left - currentWSV._offsetEntity - layoutInfo.cellPadding) + layoutInfo.cellDimensions.width;

    } else {

      topLeftCorner_left = (currentEntityBBox.left - currentWSV._offsetEntity - layoutInfo.cellPadding) - layoutInfo.cellDimensions.width;
    }

    // get top left cornerDiffs
    topLeftCorner_top = (layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + layoutInfo.cellPadding) - (numUsedRowsAbove * layoutInfo.cellDimensions.height);

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;

    const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);

    let mySequence: Array<VelocitySequence> = [];
    let aboveIndex = 0;
    let belowIndex = 0;
    this._wsvsWithoutCurrentWSV.forEach(aWSV => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
        aClonedWSV._offsetEntity = maxEntityWidth - aClonedWSV._entity._entityBbox.width;
      } else {
        aClonedWSV = aWSV._clonedWSV!;
        aClonedWSV.removeClassOffWSV('hide');
      }


      let newTop = 0;
      let newLeft = topLeftCorner_left + aWSV._offsetEntity + layoutInfo.cellPadding;
      if (aWSV._aboveOrBelow === 'above') {

        newTop = (topLeftCorner_top + layoutInfo.cellPadding) + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * layoutInfo.cellDimensions.height);
        // newLeft = topLeftCorner_left + aWSV._offsetEntity + layoutInfo.cellPadding;

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + layoutInfo.cellPadding + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * layoutInfo.cellDimensions.height) + layoutInfo.cellPadding;

        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }


      let backgroundElement;
      if (!this._refToText.isLayoutVisible) {
        backgroundElement = LayoutCreator.addWhiteLayer(layoutInfo.cellDimensions.width, layoutInfo.cellDimensions.height, aWSV._wsvBBox.top - layoutInfo.cellPadding, aWSV._wsvBBox.left - aWSV._offsetEntity - layoutInfo.cellPadding);

        aClonedWSV._backgroundElement = backgroundElement;
      } else {
        backgroundElement = aClonedWSV._backgroundElement;
        // the layout before might have hidden some of the whiteLayer, therefore unhide
        backgroundElement.classList.remove('hide');
      }


      mySequence.push({ e: aClonedWSV._wsv,
                        p: {left: (newLeft), top: (newTop)},
                        o: {duration: 1000,
                            sequenceQueue: false,

                            complete: () => {
                              aClonedWSV._entity.setBBoxOfEntity();
                              aClonedWSV.setBBoxOfSparkline();
                              aClonedWSV.setBBoxOfWSV();
                            }
                          }
                      });

      mySequence.push({ e: backgroundElement,
                        p: {left: (newLeft - layoutInfo.cellPadding - aWSV._offsetEntity), top: (newTop - layoutInfo.cellPadding), opacity: 1},
                        o: {duration: 1000,
                            sequenceQueue: false
                          }
                      });
    });

    $.Velocity.RunSequence(mySequence);
  }


  // based on available space around the current Entity and the layout, provide number of columns and rows to be used
  getRowAndColumnInfo(boundToWhat: string, aSpaceAvailability: SpaceAvailability): void {

    const layoutInfo = this.layoutInfo;

    if (boundToWhat === 'middleBound') {

      // is there enough space available in the column where the current entity is
      layoutInfo.rowAndColumnNumbers.currentEntityColumn = 0;

      // how many columns available to the left
      layoutInfo.rowAndColumnNumbers.leftNumbColumn = 1;

      // how many columns available to the right
      layoutInfo.rowAndColumnNumbers.rightNumbColumn = 1;

      // how many rows available above current entity
      // top position relative to viewport
      layoutInfo.rowAndColumnNumbers.aboveNumbRow = Math.floor(aSpaceAvailability.above / layoutInfo.cellDimensions.height);

      // how many rows available below current entity
      // bottom position relative to viewport
      layoutInfo.rowAndColumnNumbers.belowNumbRow = Math.floor(aSpaceAvailability.below / layoutInfo.cellDimensions.height);

      layoutInfo.numberOfColumns = 1;
    }
  }


  cleanUpAfterLayout() {
    console.log('columnPanAligned layout cleanup');

  }
}


export default ColumnPanAlignedLayout
