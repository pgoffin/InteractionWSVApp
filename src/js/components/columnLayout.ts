import { BBox, LayoutInfo, VelocitySequence } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import LayoutCreator from './layoutCreator';
import Layout from './layout';

import 'velocity-animate';
import 'velocity-ui-pack';



class ColumnLayout implements Layout {

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
    layoutInfo.type = 'column';

    const currentEntity: Entity = this._refToText.currentEntity!;
    const bbox_currEntity: BBox = currentEntity._entityBbox;
    const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // update the row and columns number
    layoutInfo.numberOfColumns = 1;

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._arrayOfWSVsWithouCurrentWSV)


    // get top left cornerDiffs
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);

    const topLeftCorner_left = bbox_currEntity.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenCells)));
    const topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;

    const mySequence: Array<VelocitySequence> = [];
    let aboveIndex = 0;
    let belowIndex = 0;
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

      let newTop = 0;
      let newLeft = topLeftCorner_left + aWSV._middleBoundOffset;
      if (aWSV._aboveOrBelow === 'above') {

        newTop = topLeftCorner_top + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)));

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenCells)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)));

        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }

      // the wsv position is controlled over the bottom and left of the entity and not the wsv as a whole or the sparkline
      // clonedWSV is the sparklificated span, due to that have to add position plus substract the size of the sparkline

      let whiteBackgroundElement: HTMLElement;
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
    console.log('column layout cleanup');

  }




}


export default ColumnLayout
