import { LayoutType } from "../../../global";

const constants = require('../constants');
const _countby = require('lodash/countby');



class GridLayout implements LayoutType {

  _layoutInfo;


  constructor(anInitialLayoutInfo) {
    this._layoutInfo = anInitialLayoutInfo;

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

    this.layoutInfo.type = 'grid';

    this.layoutInfo.numberOfColumns = this.layoutInfo.rowAndColumnNumbers.leftNumbColumn + this.layoutInfo.rowAndColumnNumbers.currentEntityColumn + this.layoutInfo.rowAndColumnNumbers.rightNumbColumn;

    let numCells_above = this.layoutInfo.numberOfColumns * this.layoutInfo.rowAndColumnNumbers.aboveNumbRow;
    let numCells_below = this.layoutInfo.numberOfColumns * this.layoutInfo.rowAndColumnNumbers.belowNumbRow;

    // this.layoutInfo.numberOfColumns = numOfColumns;

    // update the counts variable
    let counts = _countby(this._WSV_cloned, function(v) { return v.aboveOrBelow} );
    Layout.setUndefinedCountToZero(counts)
    this.layoutInfo.counts = counts

    // get top left cornerDiffs
    numUsedRowsAbove = Math.ceil(counts.above/numOfColumns);
    topLeftCorner_left = 0;

    if (rowAndColumnNumbers.currentEntityColumn == 0) {
      topLeftCorner_left = bbox_currEntity.left + (this.layoutInfo.cell_dimensions.width + (2*this.layoutInfo.spaceBetweenGridCells));

    } else {
      topLeftCorner_left = bbox_currEntity.left - (rowAndColumnNumbers.leftNumbColumn * (this.layoutInfo.cell_dimensions.width + (2*this.layoutInfo.spaceBetweenGridCells)));
    }

    let topLeftCorner_top = bbox_currWSV.top - (numUsedRowsAbove * (this.layoutInfo.cell_dimensions.height + (2*this.layoutInfo.spaceBetweenGridCells)));

    this.layoutInfo.topLeftCorner_left = topLeftCorner_left;
    this.layoutInfo.topLeftCorner_top = topLeftCorner_top;


    aboveIndex = Layout.getGridStartIndex(counts.above, numOfColumns)
    this.layoutInfo.startIndex_above = aboveIndex;

    belowIndex = 0;
    this.layoutInfo.startIndex_below = belowIndex;
    let classThis = this;
    $.each(this._WSV_cloned, function(index, value) {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV;
      if (classThis.currentLayout == '') {
        aClonedWSV = Layout.cloneEntityWithWSV(this.anEntity, this.middleBoundOffset, this.offset_whiteLayer, index);
        this.anEntity.parent().css('opacity', 0.2);
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
      if (this.aboveOrBelow === 'above') {

        newTop = topLeftCorner_top + (Math.floor(aboveIndex/numOfColumns) * (classThis.layoutInfo.cell_dimensions.height + (2*classThis.layoutInfo.spaceBetweenGridCells)));
        newLeft = topLeftCorner_left + ((aboveIndex % numOfColumns) * (classThis.layoutInfo.cell_dimensions.width + (2*classThis.layoutInfo.spaceBetweenGridCells))) + this.middleBoundOffset;

        aboveIndex += 1;

      } else if (this.aboveOrBelow === 'below') {

        newTop = (bbox_currWSV.bottom + (2*classThis.layoutInfo.spaceBetweenGridCells)) + (Math.floor(belowIndex/numOfColumns) * (classThis.layoutInfo.cell_dimensions.height + (2*classThis.layoutInfo.spaceBetweenGridCells)));
        newLeft = topLeftCorner_left + ((belowIndex % numOfColumns) * (classThis.layoutInfo.cell_dimensions.width + (2*classThis.layoutInfo.spaceBetweenGridCells))) + this.middleBoundOffset;
        belowIndex += 1;

      } else {
        console.log('error with above or below; aboveOrBelow is not defined')
      }


      // check if the wsv has been forced to move due to reordering
      if (why === 'dragInBetween') {
        Layout.visualizeMovedWSVs(this, {x: newLeft, y: newTop}, aClonedWSV);
      }



      let whiteBackgroundElement;
      if (classThis.currentLayout == '') {
        whiteBackgroundElement = Layout.addWhiteLayer((classThis.layoutInfo.cell_dimensions.width + (2*classThis.layoutInfo.spaceBetweenGridCells)), (classThis.layoutInfo.cell_dimensions.height + (2*classThis.layoutInfo.spaceBetweenGridCells)), (this.entityBbox.top), (this.entityBbox.left));
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

        mySequence.push({e: aClonedWSV, p: {left: (newLeft), top: (newTop)}, o: {
          duration: 1000,
          sequenceQueue: false,

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
          }
        }});

        mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - classThis.layoutInfo.spaceBetweenGridCells - this.offset_whiteLayer), top: (newTop - classThis.layoutInfo.spaceBetweenGridCells), opacity: 1}, o: {
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
