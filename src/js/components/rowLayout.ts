import { BBox, LayoutInfo } from "../../../global";

import * as d3 from "d3";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import Layout from './layout';
// import Layout from './layout';

import 'velocity-animate';
import 'velocity-ui-pack';



class RowLayout implements Layout {

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
    layoutInfo.type = 'row';

    const currentEntity: Entity = this._refToText.currentEntity;
    const bbox_currEntity: BBox = currentEntity._entityBbox;
    const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    layoutInfo.bandLength = 0;
    layoutInfo.startOffsetRowlayout = 0;
    // layoutInfo.snapPositions = [];

    // update the counts variable
    layoutInfo.counts = LayoutType.getAboveBelowCounts(this._arrayOfWSVsWithouCurrentWSV)

    let numCells_above = layoutInfo.numberOfColumns * layoutInfo.rowAndColumnNumbers.aboveNumbRow;

    layoutInfo.topLeftCorner_left = bbox_currEntity.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)));;
    if (numCells_above !== 0) {
      layoutInfo.topLeftCorner_top = bbox_currWSV.top - (layoutInfo.rowAndColumnNumbers.aboveNumbRow * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));
    } else {
      layoutInfo.topLeftCorner_top = bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells);
    }

    const theRestrictedDragBand = document.getElementById('restrictedDragBand');
    theRestrictedDragBand.classList.remove('hide')
    theRestrictedDragBand.style.top = layoutInfo.topLeftCorner_top - layoutInfo.spaceBetweenGridCells + 'px';
    theRestrictedDragBand.style.left = layoutInfo.viewportLeft + 'px';
    theRestrictedDragBand.style.width = LayoutType.getBodyBBox().width + 'px';
    theRestrictedDragBand.style.height = layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells) + 'px';


    let mySequence = [];
    this._arrayOfWSVsWithouCurrentWSV.forEach((aWSV, index) => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
        aWSV._theClonedWSV = aClonedWSV;
        aClonedWSV._theOriginalWSV = aWSV;
        aClonedWSV._offset_whiteLayer = this.layoutInfo.cell_dimensions.width - aClonedWSV._wsvVisualizationBBox.width - aClonedWSV.entity._entityBbox.width;

        aWSV._wsv.classList.add('hasClone');
      } else {
        aClonedWSV = aWSV._theClonedWSV;
        $(aClonedWSV).removeClass('hide');
        $(aClonedWSV).children().removeClass('hide');

        if ($('#spacer').length > 0) {
          $('#spacer').remove();
        }
      }

      var newTop = layoutInfo.topLeftCorner_top;
      var newLeft = layoutInfo.topLeftCorner_left + (index * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + aWSV._middleBoundOffset;

      let whiteBackgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutType.addWhiteLayer((layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)), (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

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

          // set all left and right for clonedWSV that are hidden to 0 ==> no horizontal scrolling possibl
          // inline styles takes priority over stylesheets
          if (index === 0) {
            aClonedWSV._wsv.classList.add('first')
            $(aClonedWSV).children('.entity').css('background-color', '#a6bddb');
          } else if (index === (layoutInfo.numberOfColumns - 1)) {
            aClonedWSV._wsv.classList.add('last')
          }

          if ((aClonedWSV._wsvBBox.left < layoutInfo.viewportLeft) || (aClonedWSV._wsvBBox.right > layoutInfo.viewportRight)) {
            aClonedWSV._wsv.classList.add('hide')
            aClonedWSV._wsv.childNodes.forEach(aChildNode => {
              (aChildNode as HTMLElement).classList.add('hide')
            })

            whiteBackgroundElement.classList.add('hide');
          }
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
    this.add_SuggestedInteractivity();
  }

  triangleClickListener = (event: Event) => {
    console.log('clicked on ' + event.currentTarget.type + ' triangle');

    // so click in $(html) is not triggered
    event.stopPropagation();

    this.set_up_dynamic_row_layout();
    this.move_row_wsvs(event.currentTarget.distance);
  }


  preventDbclickEvent = (event: Event) => {
    /**
    * Prevent double-click in case of fast animation or sloppy browser.
    */
    console.log("double-clicked but did nothing");

    event.stopPropagation();
    event.preventDefault();
    // return false;
  }

  add_SuggestedInteractivity() {

    const leftTriangle = document.getElementById('triangle_left');
    leftTriangle.classList.remove('hide');
    leftTriangle.style.top = this.layoutInfo.topLeftCorner_top + 'px';
    leftTriangle.style.left = this.layoutInfo.viewportLeft + 'px';

    const rightTriangle = document.getElementById('triangle_right');
    rightTriangle.classList.remove('hide');
    rightTriangle.style.top = this.layoutInfo.topLeftCorner_top + 'px';
    rightTriangle.style.left = (this.layoutInfo.viewportRight - 10) + 'px';


    leftTriangle.type = 'left';
    leftTriangle.distance = -(this.layoutInfo.cell_dimensions.width + (2*this.layoutInfo.spaceBetweenGridCells));

    leftTriangle.removeEventListener('click', this.triangleClickListener);
    leftTriangle.removeEventListener('dbclick', this.preventDbclickEvent);

    leftTriangle.addEventListener('click', this.triangleClickListener);
    leftTriangle.addEventListener('dbclick', this.preventDbclickEvent);


    rightTriangle.type = 'right';
    rightTriangle.distance = this.layoutInfo.cell_dimensions.width + (2*this.layoutInfo.spaceBetweenGridCells);

    rightTriangle.removeEventListener('click', this.triangleClickListener);
    rightTriangle.removeEventListener('dbclick', this.preventDbclickEvent);

    rightTriangle.addEventListener('click', this.triangleClickListener);
    rightTriangle.addEventListener('dbclick', this.preventDbclickEvent);
  }


  set_up_dynamic_row_layout() {

    if (this.layoutInfo.bandLength === 0 && this.layoutInfo.startOffsetRowlayout === 0) {
      // && this.layoutInfo.snapPositions.length === 0) {

      // const startOffsetRowlayout = WSV_cloned[0].wsvBoxClonedObject.left - WSV_cloned[0].offset_whiteLayer;
      // const bandLength = WSV_cloned[WSV_cloned.length - 1].wsvBoxClonedObject.right - startOffsetRowlayout;

      const startOffsetRowlayout = this._arrayOfWSVsWithouCurrentWSV[0]._theClonedWSV._wsvBBox.left - this._arrayOfWSVsWithouCurrentWSV[0]._theClonedWSV._offset_whiteLayer;
      const bandLength = this._arrayOfWSVsWithouCurrentWSV[this._arrayOfWSVsWithouCurrentWSV.length - 1]._theClonedWSV._wsvBBox.right - startOffsetRowlayout;

      // const snapPositions = [];
      // $('.sparklificated.clonedWSV:not(.hide)').each(function() {
      //   let offset = d3.select(this).datum().offset_whiteLayer;
      //   snapPositions.push(parseFloat(d3.select(this).datum().x) - offset);
      // });

      this.layoutInfo.bandLength = bandLength;
      this.layoutInfo.startOffsetRowlayout = startOffsetRowlayout;
      // this.layoutInfo.snapPositions = snapPositions;
    }
  }


  move_row_wsvs(distance: number) {

    let initialLeftPos: number;
    let tmpLeftPosition: number = 0;

    this._arrayOfWSVsWithouCurrentWSV.forEach((aWSV, index) => {
      let clonedWSV = aWSV._theClonedWSV;

      let nextWSVsLeftPosition;

    // $.each(WSV_cloned, function(index, value) {
      // const currentWSV = this.theClonedWSV[0];
      // const d3_otherWSV_data = d3.select(currentWSV).datum();
      // const clonedWSV_left = d3.select(currentWSV).datum().x;

      if (distance > 0) {
        // get the next element in wsv_cloned its left position
        if (index == 0) {
          // initialLeftPos = clonedWSV_left - d3_otherWSV_data.offset_whiteLayer;
          initialLeftPos = clonedWSV._wsvBBox.left - clonedWSV._offset_whiteLayer;
        }

        let nextIndex = index + 1;

        if (nextIndex == this._arrayOfWSVsWithouCurrentWSV.length) {
          nextIndex = 0
          nextWSVsLeftPosition = initialLeftPos + clonedWSV._offset_whiteLayer;
        } else {
          // nextWSVsLeftPosition = d3.select(WSV_cloned[nextIndex].theClonedWSV[0]).datum().x - d3.select(WSV_cloned[nextIndex].theClonedWSV[0]).datum().offset_whiteLayer;
          // nextWSVsLeftPosition = nextWSVsLeftPosition + d3_otherWSV_data.offset_whiteLayer;
          let nextClonedWSV = this._arrayOfWSVsWithouCurrentWSV[nextIndex]._theClonedWSV;
          nextWSVsLeftPosition = nextClonedWSV._wsvBBox.left - nextClonedWSV._offset_whiteLayer + clonedWSV._offset_whiteLayer
        }
      } else {
        // left triangle was hit
        let previousIndex = index - 1;

        if (previousIndex < 0) {
          previousIndex = this._arrayOfWSVsWithouCurrentWSV.length - 1;
          let previousClonedWSV = this._arrayOfWSVsWithouCurrentWSV[previousIndex]._theClonedWSV;

          // nextWSVsLeftPosition = d3.select(WSV_cloned[previousIndex].theClonedWSV[0]).datum().x - d3.select(WSV_cloned[previousIndex].theClonedWSV[0]).datum().offset_whiteLayer;
          // nextWSVsLeftPosition = nextWSVsLeftPosition + d3_otherWSV_data.offset_whiteLayer;

          nextWSVsLeftPosition = previousClonedWSV._wsvBBox.left - previousClonedWSV._offset_whiteLayer + clonedWSV._offset_whiteLayer;

        } else {
          // nextWSVsLeftPosition = tmpLeftPosition
          // nextWSVsLeftPosition = nextWSVsLeftPosition + d3_otherWSV_data.offset_whiteLayer;

          nextWSVsLeftPosition = tmpLeftPosition + clonedWSV._offset_whiteLayer


        }

        // tmpLeftPosition = clonedWSV_left - d3_otherWSV_data.offset_whiteLayer;
        tmpLeftPosition = clonedWSV._wsvBBox.left - clonedWSV._offset_whiteLayer;
      }

      let newClonedWSV_left = nextWSVsLeftPosition;


      // d3.select(currentWSV).datum().x = newClonedWSV_left;

      // set the position of the cloned element
      d3.select(clonedWSV._wsv).style('left', newClonedWSV_left);

      // unhide wsv to get the bboxes
      d3.select(clonedWSV._wsv).classed('hide', false);
      d3.select(clonedWSV._wsv.children[0]).classed('hide', false);
      d3.select(clonedWSV._wsv.children[1]).classed('hide', false);

      clonedWSV._entity.getBBoxOfEntity()
      clonedWSV.getBBoxOfWSV()

      // this.entityBoxClonedObject = get_BBox_entity($(currentWSV));
      // const bboxClonedWSV = get_BBox_wsv_NEW($(currentWSV), positionType);


      var whiteOtherBackgroundElement = clonedWSV._backgroundElement;
      d3.select(whiteOtherBackgroundElement).classed('hide', false);
      d3.select(whiteOtherBackgroundElement).style('left', (newClonedWSV_left - clonedWSV._offset_whiteLayer));


      if (!d3.select(clonedWSV._wsv).classed('hide') && ((clonedWSV._wsvBBox.left < this.layoutInfo.viewportLeft) || (clonedWSV._wsvBBox.right > this.layoutInfo.viewportRight))) {
        // is visible and just crossed left border

        d3.select(clonedWSV._wsv).classed('hide', true);
        d3.select(clonedWSV._wsv).selectAll('.cloned').classed('hide', true);
        d3.select(whiteOtherBackgroundElement).classed('hide', true);

      } else if (d3.select(clonedWSV._wsv).classed('hide') && (((newClonedWSV_left < this.layoutInfo.viewportRight) && (newClonedWSV_left > this.layoutInfo.viewportLeft)) || ((clonedWSV._wsvBBox.right < this.layoutInfo.viewportRight) && (clonedWSV._wsvBBox.right > this.layoutInfo.viewportLeft)))) {
        // is hidden and just crossed the left or right border

        d3.select(clonedWSV._wsv).classed('hide', false);
        d3.select(clonedWSV._wsv).selectAll('.cloned').classed('hide', false);
        d3.select(whiteOtherBackgroundElement).classed('hide', false);
      }

      // update the entity bbox measurements for the trail functionality
      // this.entityBoxClonedObject = get_BBox_entity($(currentWSV));
      clonedWSV._entity.getBBoxOfEntity()

    });
  }



}


export default RowLayout
