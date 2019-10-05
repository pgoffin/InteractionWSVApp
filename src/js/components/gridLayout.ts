import { BBox, LayoutInfo } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import LayoutType from './layoutType';
// import Layout from './layout';

import 'velocity-animate';
import 'velocity-ui-pack';



class GridLayout extends LayoutType {

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
    layoutInfo.type = 'grid';

    const currentEntity: Entity = this._refToText.currentEntity;
    const bbox_currEntity: BBox = currentEntity._entityBbox;
    const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // layoutInfo.numberOfColumns = layoutInfo.rowAndColumnNumbers.leftNumbColumn + layoutInfo.rowAndColumnNumbers.currentEntityColumn + layoutInfo.rowAndColumnNumbers.rightNumbColumn;

    // update the counts variable
    // const counts = _countby(this._arrayOfWSVsWithouCurrentWSV, function(v: WordScaleVisualization) { return v._aboveOrBelow} );
    // Layout.setUndefinedCountToZero(counts)
    // layoutInfo.counts = counts

    // update the counts variable
    layoutInfo.counts = LayoutType.getAboveBelowCounts(this._arrayOfWSVsWithouCurrentWSV)

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

    let mySequence = [];
    let belowIndex = 0;
    layoutInfo.startIndex_below = 0;
    // let classThis = this;
    // $.each(this._refToText._listOfClonedWSVs, function(index, value) {
    this._arrayOfWSVsWithouCurrentWSV.forEach((aWSV, index) => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV;
      // if (this._layout.currentLayout == '') {
      if (!this._refToText.isLayoutVisible) {
        // aClonedWSV = Layout.cloneEntityWithWSV(aWSV.entity, aWSV._middleBoundOffset, aWSV._offset_whiteLayer, index);
        aClonedWSV = aWSV.cloneWSV();
        aWSV._theClonedWSV = aClonedWSV;

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


      let whiteBackgroundElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = GridLayout.addWhiteLayer((layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

        aWSV._theClonedWSV._backgroundElement = whiteBackgroundElement;
      } else {
        // the layout before might have hidden some of the whiteLayer, therefore unhide
        $('.whiteLayer').removeClass('hide');

        whiteBackgroundElement = aWSV._theClonedWSV._backgroundElement;
      }


      mySequence.push({e: aClonedWSV._wsv, p: {left: (newLeft), top: (newTop)}, o: {
        duration: 1000,
        sequenceQueue: false,

        complete: function(clonedWSV) {

          // aWSV._refToText._listOfClonedWSVs[index]._backgroundElement = whiteBackgroundElement;
          // aWSV._refToText._listOfClonedWSVs[index]._entityBoxClonedObject = Measurements.get_BBox_entity(aClonedWSV);
          // aWSV._refToText._listOfClonedWSVs[index]._theClonedWSV = aClonedWSV;
          // aWSV._refToText._listOfClonedWSVs[index]._wsvBoxClonedObject = Measurements.get_BBox_wsv(aClonedWSV, constants.positionType);

          // d3.select(clonedWSV[0]).datum().x = aWSV._theClonedWSV._wsvBBox.left;
          // d3.select(clonedWSV[0]).datum().y = aWSV._theClonedWSV._wsvBBox.top;

          // d3.select(aClonedWSV[0]).datum().y = aWSV._refToText._listOfClonedWSVs[index]._wsvBoxClonedObject.top;
          // d3.select(aClonedWSV[0]).datum()._middleBoundOffset = aWSV._refToText._listOfClonedWSVs[index]._middleBoundOffset;
          // d3.select(aClonedWSV[0]).datum()._originalIndex = index;
          // d3.select(aClonedWSV[0]).datum()._backgroundElement = whiteBackgroundElement;
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


  static getGridStartIndex(countsAbove: number, numberOfColumns: number): number {

    let rest = countsAbove % numberOfColumns;
    if (rest === 0) {
      rest = numberOfColumns;
    }

    return numberOfColumns - rest;
  }


}


export default GridLayout
