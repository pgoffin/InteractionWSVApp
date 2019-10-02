import { LayoutType } from "../../../global";
import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Layout from './layout';
import Entity from './entity';
import Measurements from '../measurements';


const constants = require('../constants');
const _countby = require('lodash/countby');



class GridLayout implements LayoutType {

  _layoutInfo;

  _refToText: Text;

  _layout;


  constructor(anInitialLayoutInfo, aRefToText: Text, theLayout: Layout) {
    this._layoutInfo = anInitialLayoutInfo;
    this._refToText = aRefToText;
    this._layout = theLayout;

    this.createLayout('');
  }


  // getter/setter
  get layoutInfo() {
    return this._layoutInfo;
  }
  set layoutInfo(value) {
    this._layoutInfo = value;
  }


  createLayout(why) {

    const currentEntity: Entity = this._refToText.currentEntity;
    const bbox_currEntity = currentEntity._entityBbox;
    const bbox_currWSV = currentEntity._entityBelongsToWsv._wsvBBox

    const layoutInfo = this.layoutInfo;

    layoutInfo.type = 'grid';

    layoutInfo.numberOfColumns = layoutInfo.rowAndColumnNumbers.leftNumbColumn + layoutInfo.rowAndColumnNumbers.currentEntityColumn + layoutInfo.rowAndColumnNumbers.rightNumbColumn;

    const numCells_above = layoutInfo.numberOfColumns * layoutInfo.rowAndColumnNumbers.aboveNumbRow;
    const numCells_below = layoutInfo.numberOfColumns * layoutInfo.rowAndColumnNumbers.belowNumbRow;

    // this.layoutInfo.numberOfColumns = numOfColumns;

    // update the counts variable
    const counts = _countby(this._refToText._listOfClonedWSVs, function(v: WordScaleVisualization) { return v._aboveOrBelow} );
    Layout.setUndefinedCountToZero(counts)
    layoutInfo.counts = counts

    // get top left cornerDiffs
    const numUsedRowsAbove = Math.ceil(counts.above/layoutInfo.numberOfColumns);
    let topLeftCorner_left = 0;

    if (layoutInfo.rowAndColumnNumbers.currentEntityColumn == 0) {
      topLeftCorner_left = bbox_currEntity.left + (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells));

    } else {
      topLeftCorner_left = bbox_currEntity.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)));
    }

    let topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

    layoutInfo.topLeftCorner_left = topLeftCorner_left;
    layoutInfo.topLeftCorner_top = topLeftCorner_top;


    let aboveIndex = Layout.getGridStartIndex(counts.above, layoutInfo.numberOfColumns)
    this.layoutInfo.startIndex_above = aboveIndex;

    let mySequence = [];
    let belowIndex = 0;
    layoutInfo.startIndex_below = 0;
    // let classThis = this;
    // $.each(this._refToText._listOfClonedWSVs, function(index, value) {
    this._refToText._listOfClonedWSVs.forEach((aWSV, index) => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV;
      if (this._layout.currentLayout == '') {
        // aClonedWSV = Layout.cloneEntityWithWSV(aWSV.entity, aWSV._middleBoundOffset, aWSV._offset_whiteLayer, index);
        aClonedWSV = aWSV.cloneWSV();
        aWSV.entity.entityElement.parentElement.setAttribute('opacity', '0.2');
      } else {
        aClonedWSV = this.theClonedWSV;
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


      // check if the wsv has been forced to move due to reordering
      if (why === 'dragInBetween') {
        Layout.visualizeMovedWSVs(this, {x: newLeft, y: newTop}, aClonedWSV);
      }



      let whiteBackgroundElement;
      if (this._layout.currentLayout == '') {
        whiteBackgroundElement = Layout.addWhiteLayer((layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));
      } else {
        // the layout before might have hidden some of the whiteLayer, therefore unhide
        $('.whiteLayer').removeClass('hide');

        whiteBackgroundElement = this.backgroundElement;
      }

      if (why === 'dragInBetween') {

        let old_leftTop = {x: this.wsvBoxClonedObject.left, y: this.wsvBoxClonedObject.top};
        let new_leftTop = {x: newLeft, y: newTop};
        let same = Layout.comparing2DCoordinates(old_leftTop, new_leftTop);
        if (!same) {
          mySequence.push({e: aClonedWSV, p: {left: (newLeft), top: (newTop)}, o: {
            duration: 500,

            complete: function() {
              classThis._WSV_cloned[index].backgroundElement = whiteBackgroundElement;
              classThis._WSV_cloned[index].entityBoxClonedObject = Measurements.get_BBox_entity(aClonedWSV);
              classThis._WSV_cloned[index].theClonedWSV = aClonedWSV;
              classThis._WSV_cloned[index].wsvBoxClonedObject = Measurements.get_BBox_wsv(aClonedWSV, constants.positionType);

              d3.select(aClonedWSV[0]).datum().x = classThis._WSV_cloned[index].wsvBoxClonedObject.left;
              d3.select(aClonedWSV[0]).datum().y = classThis._WSV_cloned[index].wsvBoxClonedObject.top;
              d3.select(aClonedWSV[0]).datum().middleBoundOffset = classThis._WSV_cloned[index].middleBoundOffset;
              d3.select(aClonedWSV[0]).datum().originalIndex = index;
              d3.select(aClonedWSV[0]).datum().backgroundElement = whiteBackgroundElement;
              $(aClonedWSV).removeClass('compare');
            }
          }});
        }

      } else {

        mySequence.push({e: aClonedWSV._wsv, p: {left: (newLeft), top: (newTop)}, o: {
          duration: 1000,
          sequenceQueue: false,

          complete: function() {
            aWSV._refToText._listOfClonedWSVs[index]._backgroundElement = whiteBackgroundElement;
            aWSV._refToText._listOfClonedWSVs[index]._entityBoxClonedObject = Measurements.get_BBox_entity(aClonedWSV);
            aWSV._refToText._listOfClonedWSVs[index]._theClonedWSV = aClonedWSV;
            aWSV._refToText._listOfClonedWSVs[index]._wsvBoxClonedObject = Measurements.get_BBox_wsv(aClonedWSV, constants.positionType);

            d3.select(aClonedWSV[0]).datum().x = aWSV._refToText._listOfClonedWSVs[index]._wsvBoxClonedObject.left;
            d3.select(aClonedWSV[0]).datum().y = aWSV._refToText._listOfClonedWSVs[index]._wsvBoxClonedObject.top;
            d3.select(aClonedWSV[0]).datum()._middleBoundOffset = aWSV._refToText._listOfClonedWSVs[index]._middleBoundOffset;
            d3.select(aClonedWSV[0]).datum()._originalIndex = index;
            d3.select(aClonedWSV[0]).datum()._backgroundElement = whiteBackgroundElement;
          }
        }});

        mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.spaceBetweenGridCells - aWSV._offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenGridCells), opacity: 1}, o: {
            duration: 1000,
            sequenceQueue: false

          }
        });
      }

    });

    $.Velocity.RunSequence(mySequence);

    $('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');

    // logStudyEvent('gathering', {'layout': 'grid', 'origin layout launch (entity)': $.trim($(currentEntity).text()), 'location %': topLeftCorner_top/document.body.scrollHeight});
  }
}


export default GridLayout
