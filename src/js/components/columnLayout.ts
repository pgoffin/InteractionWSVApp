import { BBox, LayoutInfo } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import LayoutType from './layoutType';
// import Layout from './layout';

import 'velocity-animate';
import 'velocity-ui-pack';



class ColumnLayout extends LayoutType {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _arrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>;


  constructor(aLayoutInfo: LayoutInfo, aRefToText: Text, anArrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>) {
    super();
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._arrayOfWSVsWithouCurrentWSV = anArrayOfWSVsWithouCurrentWSV;

    this.createLayout();
  }


  // getter/setter
  get layoutInfo() {
    return this._layoutInfo;
  }
  set layoutInfo(value) {
    this._layoutInfo = value;
  }


  createLayout() {

    const layoutInfo = this.layoutInfo;
    layoutInfo.type = 'column';

    const currentEntity: Entity = this._refToText.currentEntity;
    const bbox_currEntity: BBox = currentEntity._entityBbox;
    const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // update the row and columns number
    layoutInfo.numberOfColumns = 1;

    // update the counts variable
    layoutInfo.counts = LayoutType.getAboveBelowCounts(this._arrayOfWSVsWithouCurrentWSV)


    // get top left cornerDiffs
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);

    const topLeftCorner_left = bbox_currEntity.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)));
    const topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;

    const mySequence = [];
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

        newTop = topLeftCorner_top + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }

      // the wsv position is controlled over the bottom and left of the entity and not the wsv as a whole or the sparkline
      // clonedWSV is the sparklificated span, due to that have to add position plus substract the size of the sparkline

      let whiteBackgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = ColumnLayout.addWhiteLayer((layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

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


export default ColumnLayout
