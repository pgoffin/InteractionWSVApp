import { BBox, LayoutInfo, VelocitySequence } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
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

    const currentEntity: Entity = this._refToText.currentEntity!;
    const bbox_currEntity: BBox = currentEntity._entityBbox;
    const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithouCurrentWSV)

    // get top left cornerDiffs
    const numUsedRowsAbove = Math.ceil(layoutInfo.counts.above/layoutInfo.numberOfColumns);
    let topLeftCorner_left = 0;

    if (layoutInfo.rowAndColumnNumbers.currentEntityColumn == 0) {
      topLeftCorner_left = bbox_currEntity.left + (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells));

    } else {
      topLeftCorner_left = bbox_currEntity.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)));
    }

    let topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

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
      // if (this._layout.currentLayout == '') {
      if (!this._refToText.isLayoutVisible) {
        // aClonedWSV = Layout.cloneEntityWithWSV(aWSV.entity, aWSV._middleBoundOffset, aWSV._offset_whiteLayer, index);
        aClonedWSV = aWSV.cloneWSV();
        aWSV._theClonedWSV = aClonedWSV;
        aClonedWSV._theOriginalWSV = aWSV;

        aWSV._wsv.classList.add('hasClone');
        // aWSV.entity.entityElement.parentElement.setAttribute('opacity', '0.2');
      } else {
        aClonedWSV = aWSV._theClonedWSV;
        $(aClonedWSV).removeClass('hide');
        $(aClonedWSV).children().removeClass('hide');
        if ($('#spacer').length > 0) {
          $('#spacer').remove();
        }
      }


      let newTop = 0;
      let newLeft = 0;
      if (aWSV._aboveOrBelow === 'above') {

        newTop = topLeftCorner_top + (Math.floor(aboveIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
        newLeft = topLeftCorner_left + ((aboveIndex % layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + aWSV._middleBoundOffset;

        aboveIndex += 1;

      } else if (aWSV._aboveOrBelow === 'below') {

        newTop = (bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells)) + (Math.floor(belowIndex/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
        newLeft = topLeftCorner_left + ((belowIndex % layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + aWSV._middleBoundOffset;
        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }


      let whiteBackgroundElement: HTMLElement;
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
          aClonedWSV._entity.setBBoxOfEntity();
          aClonedWSV.setBBoxOfSparkline();
          aClonedWSV.setBBoxOfWSV();
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
