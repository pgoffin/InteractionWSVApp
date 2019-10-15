import { BBox, LayoutInfo } from "../../../global";

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
    // super();
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._arrayOfWSVsWithouCurrentWSV = anArrayOfWSVsWithouCurrentWSV;

    this.applyLayout();
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

    const currentEntity: Entity = this._refToText.currentEntity;
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

    if (diffRight >= (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells))) {

      topLeftCorner_left = bbox_currEntity.left + (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells));

    } else {

      topLeftCorner_left = bbox_currEntity.left - (referenceWSVWidth + (2*layoutInfo.spaceBetweenGridCells));
      alignedColumnLeft = true;
    }

    // get top left cornerDiffs
    topLeftCorner_top = (bbox_currWSV.bottom + layoutInfo.spaceBetweenGridCells) - (numUsedRowsAbove * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;

    let mySequence = [];
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

        newTop = (topLeftCorner_top + layoutInfo.spaceBetweenGridCells) + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
        newLeft = topLeftCorner_left + correctionOffset;

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
        newLeft = topLeftCorner_left + correctionOffset;

        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }


      let whiteBackgroundElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

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
          aClonedWSV._entity.getBBoxOfEntity();
          aClonedWSV.getBBoxOfSparkline();
          aClonedWSV.getBBoxOfWSV();
        }
      }});

      mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.spaceBetweenGridCells - aWSV._offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells), opacity: 1}, o: {
          duration: 1000,
          sequenceQueue: false
        }
      });
    });

    $.Velocity.RunSequence(mySequence);

    $('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');

    this._refToText.isLayoutVisible = true;
  }


}


export default ColumnPanAlignedLayout
