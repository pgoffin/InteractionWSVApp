import { LayoutInfo, SpaceAvailability, VelocitySequence } from "../../../global";

import * as d3 from "d3";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
// import Entity from './entity';
import Layout from './layout';
import LayoutCreator from './layoutCreator';

import 'velocity-animate';
import 'velocity-ui-pack';



class RowLayout implements Layout {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _wsvsWithouCurrentWSV: Array<WordScaleVisualization>;
  _spaceAvailability: SpaceAvailability;



  constructor(aLayoutInfo: LayoutInfo, aSpaceAvailability: SpaceAvailability, aRefToText: Text, anArrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>) {
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._wsvsWithouCurrentWSV = anArrayOfWSVsWithouCurrentWSV;
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
    layoutInfo.type = 'row';

    const currentEntityBBox = layoutInfo.currentEntity._entityBbox;

    // const currentEntity: Entity = this._refToText.currentEntity!;
    // const currentEntityBBox: BBox = currentEntity._entityBbox;
    // const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // get available space for columns and rows
    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    layoutInfo.bandLength = 0;
    layoutInfo.startOffsetRowlayout = 0;
    // layoutInfo.snapPositions = [];

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithouCurrentWSV)

    let numCells_above = layoutInfo.numberOfColumns * layoutInfo.rowAndColumnNumbers.aboveNumbRow;

    layoutInfo.topLeftCorner_left = currentEntityBBox.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells)));;
    if (numCells_above !== 0) {
      layoutInfo.topLeftCorner_top = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.top - (layoutInfo.rowAndColumnNumbers.aboveNumbRow * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));
    } else {
      layoutInfo.topLeftCorner_top = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + (2*layoutInfo.spaceBetweenCells);
    }

    const theRestrictedDragBand = document.getElementById('restrictedDragBand');
    if (theRestrictedDragBand) {
      theRestrictedDragBand.classList.remove('hide')
      theRestrictedDragBand.style.top = layoutInfo.topLeftCorner_top - layoutInfo.spaceBetweenCells + 'px';
      theRestrictedDragBand.style.left = document.body.getBoundingClientRect().left + 'px';
      theRestrictedDragBand.style.width = LayoutCreator.getBodyBBox().width + 'px';
      theRestrictedDragBand.style.height = layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells) + 'px';
    }


    let mySequence: Array<VelocitySequence> = [];
    this._wsvsWithouCurrentWSV.forEach((aWSV, index) => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
        aWSV._theClonedWSV = aClonedWSV;
        aClonedWSV._theOriginalWSV = aWSV;
        aClonedWSV._offsetWhiteLayer = this.layoutInfo.cellDimensions.width - aClonedWSV._wsvVisualizationBBox.width - aClonedWSV.entity._entityBbox.width;

        aWSV._wsv.classList.add('hasClone');
      } else {
        aClonedWSV = aWSV._theClonedWSV!;
        aClonedWSV.removeClassOffWSV('hide');

      }

      var newTop = layoutInfo.topLeftCorner_top;
      var newLeft = layoutInfo.topLeftCorner_left + (index * (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells))) + aWSV._middleBoundOffset;

      let whiteBackgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells)), (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

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

          // set all left and right for clonedWSV that are hidden to 0 ==> no horizontal scrolling possibl
          // inline styles takes priority over stylesheets
          if (index === 0) {
            aClonedWSV._wsv.classList.add('first')
            $(aClonedWSV).children('.entity').css('background-color', '#a6bddb');
          } else if (index === (layoutInfo.numberOfColumns - 1)) {
            aClonedWSV._wsv.classList.add('last')
          }

          if ((aClonedWSV._wsvBBox.left < document.body.getBoundingClientRect().left) || (aClonedWSV._wsvBBox.right > document.body.getBoundingClientRect().right)) {
            aClonedWSV._wsv.classList.add('hide')
            aClonedWSV._wsv.childNodes.forEach(aChildNode => {
              (aChildNode as HTMLElement).classList.add('hide')
            })

            whiteBackgroundElement.classList.add('hide');
          }
        }
      }});

      mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.spaceBetweenCells - aWSV._offsetWhiteLayer), top: (newTop - layoutInfo.spaceBetweenCells), opacity: 1}, o: {
          duration: 1000,
          sequenceQueue: false
        }
      });

    });

    $.Velocity.RunSequence(mySequence);

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
  }


  add_SuggestedInteractivity() {

    const leftTriangle = document.getElementById('triangle_left');
    if (leftTriangle) {
      leftTriangle.classList.remove('hide');
      leftTriangle.style.top = this.layoutInfo.topLeftCorner_top + 'px';
      leftTriangle.style.left = document.body.getBoundingClientRect().left + 'px';

      leftTriangle.type = 'left';
      leftTriangle.distance = -(this.layoutInfo.cellDimensions.width + (2*this.layoutInfo.spaceBetweenCells));

      leftTriangle.removeEventListener('click', this.triangleClickListener);
      leftTriangle.removeEventListener('dbclick', this.preventDbclickEvent);

      leftTriangle.addEventListener('click', this.triangleClickListener);
      leftTriangle.addEventListener('dbclick', this.preventDbclickEvent);
    }

    const rightTriangle = document.getElementById('triangle_right');
    if (rightTriangle) {
      const viewportInfo = this._refToText.getViewportInfo()

      rightTriangle.classList.remove('hide');
      rightTriangle.style.top = this.layoutInfo.topLeftCorner_top + 'px';
      rightTriangle.style.left = (viewportInfo.right - 10) + 'px';

      rightTriangle.type = 'right';
      rightTriangle.distance = this.layoutInfo.cellDimensions.width + (2*this.layoutInfo.spaceBetweenCells);

      rightTriangle.removeEventListener('click', this.triangleClickListener);
      rightTriangle.removeEventListener('dbclick', this.preventDbclickEvent);

      rightTriangle.addEventListener('click', this.triangleClickListener);
      rightTriangle.addEventListener('dbclick', this.preventDbclickEvent);
    }

  }


  set_up_dynamic_row_layout() {

    if (this.layoutInfo.bandLength === 0 && this.layoutInfo.startOffsetRowlayout === 0) {
      // && this.layoutInfo.snapPositions.length === 0) {

      // const startOffsetRowlayout = WSV_cloned[0].wsvBoxClonedObject.left - WSV_cloned[0].offset_whiteLayer;
      // const bandLength = WSV_cloned[WSV_cloned.length - 1].wsvBoxClonedObject.right - startOffsetRowlayout;

      const startOffsetRowlayout = this._wsvsWithouCurrentWSV[0]._theClonedWSV._wsvBBox.left - this._wsvsWithouCurrentWSV[0]._theClonedWSV._offsetWhiteLayer;
      const bandLength = this._wsvsWithouCurrentWSV[this._wsvsWithouCurrentWSV.length - 1]._theClonedWSV._wsvBBox.right - startOffsetRowlayout;

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

    this._wsvsWithouCurrentWSV.forEach((aWSV, index) => {
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
          initialLeftPos = clonedWSV._wsvBBox.left - clonedWSV._offsetWhiteLayer;
        }

        let nextIndex = index + 1;

        if (nextIndex == this._wsvsWithouCurrentWSV.length) {
          nextIndex = 0
          nextWSVsLeftPosition = initialLeftPos + clonedWSV._offsetWhiteLayer;
        } else {
          // nextWSVsLeftPosition = d3.select(WSV_cloned[nextIndex].theClonedWSV[0]).datum().x - d3.select(WSV_cloned[nextIndex].theClonedWSV[0]).datum().offset_whiteLayer;
          // nextWSVsLeftPosition = nextWSVsLeftPosition + d3_otherWSV_data.offset_whiteLayer;
          let nextClonedWSV = this._wsvsWithouCurrentWSV[nextIndex]._theClonedWSV;
          nextWSVsLeftPosition = nextClonedWSV._wsvBBox.left - nextClonedWSV._offsetWhiteLayer + clonedWSV._offsetWhiteLayer
        }
      } else {
        // left triangle was hit
        let previousIndex = index - 1;

        if (previousIndex < 0) {
          previousIndex = this._wsvsWithouCurrentWSV.length - 1;
          let previousClonedWSV = this._wsvsWithouCurrentWSV[previousIndex]._theClonedWSV;

          // nextWSVsLeftPosition = d3.select(WSV_cloned[previousIndex].theClonedWSV[0]).datum().x - d3.select(WSV_cloned[previousIndex].theClonedWSV[0]).datum().offset_whiteLayer;
          // nextWSVsLeftPosition = nextWSVsLeftPosition + d3_otherWSV_data.offset_whiteLayer;

          nextWSVsLeftPosition = previousClonedWSV._wsvBBox.left - previousClonedWSV._offsetWhiteLayer + clonedWSV._offsetWhiteLayer;

        } else {
          // nextWSVsLeftPosition = tmpLeftPosition
          // nextWSVsLeftPosition = nextWSVsLeftPosition + d3_otherWSV_data.offset_whiteLayer;

          nextWSVsLeftPosition = tmpLeftPosition + clonedWSV._offsetWhiteLayer

        }

        // tmpLeftPosition = clonedWSV_left - d3_otherWSV_data.offset_whiteLayer;
        tmpLeftPosition = clonedWSV._wsvBBox.left - clonedWSV._offsetWhiteLayer;
      }

      let newClonedWSV_left = nextWSVsLeftPosition;


      // d3.select(currentWSV).datum().x = newClonedWSV_left;
      const viewportInfo = this._refToText.getViewportInfo();

      // set the position of the cloned element
      d3.select(clonedWSV._wsv).style('left', newClonedWSV_left);

      // unhide wsv to get the bboxes
      d3.select(clonedWSV._wsv).classed('hide', false);
      d3.select(clonedWSV._wsv.children[0]).classed('hide', false);
      d3.select(clonedWSV._wsv.children[1]).classed('hide', false);

      clonedWSV._entity.setBBoxOfEntity()
      clonedWSV.setBBoxOfWSV()

      // this.entityBoxClonedObject = get_BBox_entity($(currentWSV));
      // const bboxClonedWSV = get_BBox_wsv_NEW($(currentWSV), positionType);


      var whiteOtherBackgroundElement = clonedWSV._backgroundElement;
      d3.select(whiteOtherBackgroundElement).classed('hide', false);
      d3.select(whiteOtherBackgroundElement).style('left', (newClonedWSV_left - clonedWSV._offsetWhiteLayer));


      if (!d3.select(clonedWSV._wsv).classed('hide') && ((clonedWSV._wsvBBox.left < viewportInfo.left) || (clonedWSV._wsvBBox.right > viewportInfo.right))) {
        // is visible and just crossed left border

        d3.select(clonedWSV._wsv).classed('hide', true);
        d3.select(clonedWSV._wsv).selectAll('.cloned').classed('hide', true);
        d3.select(whiteOtherBackgroundElement).classed('hide', true);

      } else if (d3.select(clonedWSV._wsv).classed('hide') && (((newClonedWSV_left < viewportInfo.right) && (newClonedWSV_left > viewportInfo.left)) || ((clonedWSV._wsvBBox.right < viewportInfo.right) && (clonedWSV._wsvBBox.right > viewportInfo.left)))) {
        // is hidden and just crossed the left or right border

        d3.select(clonedWSV._wsv).classed('hide', false);
        d3.select(clonedWSV._wsv).selectAll('.cloned').classed('hide', false);
        d3.select(whiteOtherBackgroundElement).classed('hide', false);
      }

      // update the entity bbox measurements for the trail functionality
      // this.entityBoxClonedObject = get_BBox_entity($(currentWSV));
      clonedWSV._entity.setBBoxOfEntity()

    });
  }


  // based on available space around the current Entity and the layout, provide number of columns and rows to be used
  getRowAndColumnInfo(boundToWhat: string, aSpaceAvailability: SpaceAvailability): void {

    const layoutInfo = this.layoutInfo;
    const spaceBetweenCells = layoutInfo.spaceBetweenCells;

    if (boundToWhat === 'middleBound') {

      // if (numRowsPossible_above > 0) {
      //   colsAndRowsNumber.aboveNumbRow = 1;
      //   colsAndRowsNumber.belowNumbRow = 0;
      // } else if (numRowsPossible_below > 0) {
      //   colsAndRowsNumber.aboveNumbRow = 0;
      //   colsAndRowsNumber.belowNumbRow = 1;
      // }

      // is there enough space available in the column where the current entity is
      if (aSpaceAvailability.currentEntityColumn < 0) {
        layoutInfo.rowAndColumnNumbers.currentEntityColumn = 0;
      } else {
        layoutInfo.rowAndColumnNumbers.currentEntityColumn = 1;
      }

      // how many columns available to the left
      layoutInfo.rowAndColumnNumbers.leftNumbColumn = Math.floor(aSpaceAvailability.left / (layoutInfo.cellDimensions.width + (2 * spaceBetweenCells)));

      // how many columns available to the right
      layoutInfo.rowAndColumnNumbers.rightNumbColumn = Math.floor(aSpaceAvailability.right / (layoutInfo.cellDimensions.width + (2 * spaceBetweenCells)));

      // how many rows available above current entity
      // top position relative to viewport
      const numRowsPossibleAbove =  Math.floor(aSpaceAvailability.above / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));
      const numRowsPossibleBelow = Math.floor(aSpaceAvailability.below / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      if (numRowsPossibleAbove > 0) {
        layoutInfo.rowAndColumnNumbers.aboveNumbRow = 1;
        layoutInfo.rowAndColumnNumbers.belowNumbRow = 0;
      } else if (numRowsPossibleBelow > 0) {
        layoutInfo.rowAndColumnNumbers.aboveNumbRow = 0;
        layoutInfo.rowAndColumnNumbers.belowNumbRow = 1;
      }

      layoutInfo.numberOfColumns = layoutInfo.rowAndColumnNumbers.leftNumbColumn + layoutInfo.rowAndColumnNumbers.currentEntityColumn + layoutInfo.rowAndColumnNumbers.rightNumbColumn;
    }
  }


  cleanUpAfterLayout() {
    console.log('row layout cleanup');

    const triangleLeft = document.getElementById('triangle_left');
    const triangleRight = document.getElementById('triangle_right');

    if (triangleLeft) triangleLeft.classList.add('hide');
    if (triangleRight) triangleRight.classList.add('hide');

    const dragBand = document.getElementById('restrictedDragBand');
    if (dragBand) dragBand.classList.add('hide');
  }





}


export default RowLayout
