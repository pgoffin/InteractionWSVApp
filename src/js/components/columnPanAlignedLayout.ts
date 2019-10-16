import { BBox, LayoutInfo, VelocitySequence } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import Layout from './layout';
import LayoutCreator from './layoutCreator';

import 'velocity-animate';
import 'velocity-ui-pack';



class ColumnPanAlignedLayout implements Layout {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _arrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>;


  constructor(aLayoutInfo: LayoutInfo, aRefToText: Text, anArrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>) {
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._arrayOfWSVsWithouCurrentWSV = anArrayOfWSVsWithouCurrentWSV;
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

    const currentEntity: Entity = this._refToText.currentEntity!;
    const bbox_currEntity: BBox = currentEntity._entityBbox;
    const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // update the row and columns number
    layoutInfo.numberOfColumns = 1;

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._arrayOfWSVsWithouCurrentWSV)

    // reference for the alignement
    let referenceClonedWSV
    if (layoutInfo.counts.above === 0) {
      // if all the wsvs are below the current entity
      referenceClonedWSV = this._arrayOfWSVsWithouCurrentWSV[0]
    } else {
      referenceClonedWSV = this._arrayOfWSVsWithouCurrentWSV[layoutInfo.counts.above-1]
    }

    const referenceWidth = referenceClonedWSV._entity._entityBbox.width;
    const referenceWSVWidth = referenceClonedWSV._wsvBBox.width

    // where should the aligned column be put left or right, usually right, but if not enough space left
    let topLeftCorner_left = 0;
    let topLeftCorner_top = 0;
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);
    let diffRight = layoutInfo.viewportRight - bbox_currWSV.right;
    let alignedColumnLeft = false;

    if (diffRight >= (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenCells))) {

      topLeftCorner_left = bbox_currEntity.left + (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenCells));

    } else {

      topLeftCorner_left = bbox_currEntity.left - (referenceWSVWidth + (2*layoutInfo.spaceBetweenCells));
      alignedColumnLeft = true;
    }

    // get top left cornerDiffs
    topLeftCorner_top = (bbox_currWSV.bottom + layoutInfo.spaceBetweenCells) - (numUsedRowsAbove * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;

    let mySequence: Array<VelocitySequence> = [];
    let aboveIndex = 0;
    let belowIndex = 0;
    // $.each(WSV_cloned, function(index, value) {
    this._arrayOfWSVsWithouCurrentWSV.forEach(aWSV => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
        aWSV._theClonedWSV = aClonedWSV;
        aClonedWSV._theOriginalWSV = aWSV;

        aWSV._wsv.classList.add('hasClone');
      } else {
        aClonedWSV = aWSV._theClonedWSV;
        $(aClonedWSV).removeClass('hide');
        $(aClonedWSV).children().removeClass('hide');
        if ($('#spacer').length > 0) {
          $('#spacer').remove();
        }
      }

      // set the correct offset depending on being aligned left or right (majority of cases)
      let correctionOffset = aWSV._middleBoundOffset;
      if (alignedColumnLeft) {
        correctionOffset = referenceWidth - aWSV._entity._entityBbox.width;
      }


      let newTop = 0;
      let newLeft = 0;
      if (aWSV._aboveOrBelow === 'above') {

        newTop = (topLeftCorner_top + layoutInfo.spaceBetweenCells) + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)));
        newLeft = topLeftCorner_left + correctionOffset;

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenCells)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)));
        newLeft = topLeftCorner_left + correctionOffset;

        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }


      let whiteBackgroundElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenCells)), (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

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

      mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.spaceBetweenCells - aWSV._offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenCells), opacity: 1}, o: {
          duration: 1000,
          sequenceQueue: false
        }
      });
    });

    $.Velocity.RunSequence(mySequence);

    $('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');
  }


  cleanUpAfterLayout() {
    console.log('columnPanAligned layout cleanup');

  }
}


export default ColumnPanAlignedLayout
