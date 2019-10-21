import { BBox, CornerPosition, LayoutInfo, SpaceAvailability, VelocitySequence } from "../../../global";

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
  _wsvsWithoutCurrentWSV: Array<WordScaleVisualization>;
  _spaceAvailability: SpaceAvailability;
  _triangleClickListener;



  constructor(aLayoutInfo: LayoutInfo, aSpaceAvailability: SpaceAvailability, aRefToText: Text, anArrayOfwsvsWithoutCurrentWSV: Array<WordScaleVisualization>) {
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._wsvsWithoutCurrentWSV = anArrayOfwsvsWithoutCurrentWSV;
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

    // get available space for columns and rows
    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithoutCurrentWSV)

    let numCells_above = layoutInfo.numberOfColumns * layoutInfo.rowAndColumnNumbers.aboveNumbRow;

    // const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);
    // const aDiff = maxEntityWidth - currentEntityBBox.width;

    layoutInfo.topLeftCorner_left = (currentEntityBBox.left - layoutInfo.currentEntity._entityBelongsToWsv._offsetEntity - layoutInfo.cellPadding) - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding)));;

    if (numCells_above !== 0) {
      layoutInfo.topLeftCorner_top = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.top - (layoutInfo.rowAndColumnNumbers.aboveNumbRow * (layoutInfo.cellDimensions.height + (2*layoutInfo.cellPadding)));
    } else {
      layoutInfo.topLeftCorner_top = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + (2*layoutInfo.cellPadding);
    }

    // const theRestrictedDragBand = document.getElementById('restrictedDragBand');
    // if (theRestrictedDragBand) {
    //   theRestrictedDragBand.classList.remove('hide')
    //   theRestrictedDragBand.style.top = layoutInfo.topLeftCorner_top - layoutInfo.cellPadding + 'px';
    //   theRestrictedDragBand.style.left = document.body.getBoundingClientRect().left + 'px';
    //   theRestrictedDragBand.style.width = LayoutCreator.getBodyBBox().width + 'px';
    //   theRestrictedDragBand.style.height = layoutInfo.cellDimensions.height + (2*layoutInfo.cellPadding) + 'px';
    // }

    const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);

    let mySequence: Array<VelocitySequence> = [];
    this._wsvsWithoutCurrentWSV.forEach((aWSV, index) => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();

        aClonedWSV._offsetWhiteLayer = this.layoutInfo.cellDimensions.width - aClonedWSV._wsvBBox.width;
        aClonedWSV._offsetEntity = maxEntityWidth - aClonedWSV.entity._entityBbox.width;
      } else {
        aClonedWSV = aWSV._clonedWSV!;
        aClonedWSV.removeClassOffWSV('hide');
      }

      const newTop = layoutInfo.topLeftCorner_top;
      // var newLeft = layoutInfo.topLeftCorner_left + (index * (layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding))) + aWSV._middleBoundOffset;
      const newLeft = layoutInfo.topLeftCorner_left + (index * (layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding))) + layoutInfo.cellPadding + aClonedWSV._offsetEntity //(maxEntityWidth - aWSV._entity._entityBbox.width);

      let whiteBackgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cellDimensions.width + (2*layoutInfo.cellPadding)), (layoutInfo.cellDimensions.height + (2*layoutInfo.cellPadding)), (aClonedWSV.entity._entityBbox.top), (aClonedWSV.entity._entityBbox.left - layoutInfo.cellPadding - aClonedWSV._offsetEntity));

        aClonedWSV._backgroundElement = whiteBackgroundElement;
      } else {
        // the layout before might have hidden some of the whiteLayer, therefore unhide
        aClonedWSV._backgroundElement.classList.remove('hide');

        whiteBackgroundElement = aClonedWSV._backgroundElement;
      }

      aClonedWSV._positionLeftTopCorner.top = newTop;
      aClonedWSV._positionLeftTopCorner.left = newLeft;
      // console.log(aClonedWSV._entity._entityName, newLeft)

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

          if ((aClonedWSV._wsvBBox.left - layoutInfo.cellPadding - aClonedWSV._offsetEntity < document.body.getBoundingClientRect().left) || (aClonedWSV._wsvBBox.right > document.body.getBoundingClientRect().right)) {
            aClonedWSV._wsv.classList.add('hide')
            aClonedWSV._wsv.childNodes.forEach(aChildNode => {
              (aChildNode as HTMLElement).classList.add('hide')
            })

            whiteBackgroundElement.classList.add('hide');
          }
        }
      }});

      mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.cellPadding - aClonedWSV._offsetEntity), top: (newTop - layoutInfo.cellPadding), opacity: 1}, o: {
          duration: 1000,
          sequenceQueue: false
        }
      });

    });

    $.Velocity.RunSequence(mySequence);


    this._wsvsWithoutCurrentWSV.forEach((aWSV, index) => {
      let aClonedWSV = aWSV._clonedWSV;

      let nextWSVIndex = index + 1;
      if (nextWSVIndex === this._wsvsWithoutCurrentWSV.length) {
        aClonedWSV.nextWSV = this._wsvsWithoutCurrentWSV[0]._clonedWSV
      } else {
        aClonedWSV.nextWSV = this._wsvsWithoutCurrentWSV[nextWSVIndex]._clonedWSV
      }

      let previousWSVIndex = index - 1;
      if (previousWSVIndex < 0) {
        aClonedWSV.previousWSV = this._wsvsWithoutCurrentWSV[this._wsvsWithoutCurrentWSV.length-1]._clonedWSV
      } else {
        aClonedWSV.previousWSV = this._wsvsWithoutCurrentWSV[previousWSVIndex]._clonedWSV
      }

      // console.log(aClonedWSV._entity._entityName, aClonedWSV.nextWSV._entity._entityName, aClonedWSV.previousWSV._entity._entityName)
    });

    // const restrictedDragBandDiv = document.createElement("div");
    // restrictedDragBandDiv.setAttribute('id', 'restrictedDragBand');
    // // restrictedDragBandDiv.setAttribute('class', hideClass);
    // document.body.appendChild(restrictedDragBandDiv);

    const leftTriangleDiv = document.createElement("div");
    leftTriangleDiv.setAttribute('id', 'triangle_left');
    // leftTriangleDiv.setAttribute('class', hideClass);
    document.body.appendChild(leftTriangleDiv);

    const rightTriangleDiv = document.createElement("div");
    rightTriangleDiv.setAttribute('id', 'triangle_right');
    // rightTriangleDiv.setAttribute('class', hideClass);
    document.body.appendChild(rightTriangleDiv);

    this.add_SuggestedInteractivity();
    // }
  }


  preventDbclickEvent(event: Event) {
    // Prevent double-click in case of fast animation or sloppy browser.
    console.log("double-clicked but did nothing");

    event.stopPropagation();
    event.preventDefault();
  }


  triangleClickListener = (event: Event) => {
      console.log('clicked on ' + event.currentTarget.type + ' triangle');

      // so click in $(html) is not triggered
      event.stopPropagation();

      // this.set_up_dynamic_row_layout();

      if (event.currentTarget.distance >= 0) {
        // right triangle was clicked
        this.move_row_wsvs(event.currentTarget.distance, this._wsvsWithoutCurrentWSV);
      } else {
        // left triangle was clicked
        this.move_row_wsvs(event.currentTarget.distance, this._wsvsWithoutCurrentWSV.slice().reverse());
      }
  }


  add_SuggestedInteractivity() {

    const leftTriangle = document.getElementById('triangle_left');
    if (leftTriangle) {
      leftTriangle.classList.remove('hide');
      leftTriangle.style.top = this.layoutInfo.topLeftCorner_top + 'px';
      leftTriangle.style.left = document.body.getBoundingClientRect().left + 'px';

      leftTriangle.type = 'left';
      leftTriangle.distance = -(this.layoutInfo.cellDimensions.width + (2*this.layoutInfo.cellPadding));

      leftTriangle.removeEventListener('click', this.triangleClickListener);
      leftTriangle.removeEventListener('dblclick', this.preventDbclickEvent);

      leftTriangle.addEventListener('click', this.triangleClickListener);
      leftTriangle.addEventListener('dblclick', this.preventDbclickEvent);
    }

    const rightTriangle = document.getElementById('triangle_right');
    if (rightTriangle) {
      const viewportInfo = RowLayout.getViewportInfo()

      rightTriangle.classList.remove('hide');
      rightTriangle.style.top = this.layoutInfo.topLeftCorner_top + 'px';
      rightTriangle.style.left = (viewportInfo.right - 10) + 'px';

      rightTriangle.type = 'right';
      rightTriangle.distance = this.layoutInfo.cellDimensions.width + (2*this.layoutInfo.cellPadding);

      rightTriangle.removeEventListener('click', this.triangleClickListener);
      rightTriangle.removeEventListener('dblclick', this.preventDbclickEvent);

      rightTriangle.addEventListener('click', this.triangleClickListener);
      rightTriangle.addEventListener('dblclick', this.preventDbclickEvent);
    }

  }


  // set_up_dynamic_row_layout() {
  //
  //   if (this.layoutInfo.bandLength === 0 && this.layoutInfo.startOffsetRowlayout === 0) {
  //     // && this.layoutInfo.snapPositions.length === 0) {
  //
  //     // const startOffsetRowlayout = WSV_cloned[0].wsvBoxClonedObject.left - WSV_cloned[0].offset_whiteLayer;
  //     // const bandLength = WSV_cloned[WSV_cloned.length - 1].wsvBoxClonedObject.right - startOffsetRowlayout;
  //
  //     const startOffsetRowlayout = this._wsvsWithoutCurrentWSV[0]._clonedWSV._wsvBBox.left - this._wsvsWithoutCurrentWSV[0]._clonedWSV._offsetWhiteLayer;
  //     const bandLength = this._wsvsWithoutCurrentWSV[this._wsvsWithoutCurrentWSV.length - 1]._clonedWSV._wsvBBox.right - startOffsetRowlayout;
  //
  //     // const snapPositions = [];
  //     // $('.sparklificated.clonedWSV:not(.hide)').each(function() {
  //     //   let offset = d3.select(this).datum().offset_whiteLayer;
  //     //   snapPositions.push(parseFloat(d3.select(this).datum().x) - offset);
  //     // });
  //
  //     this.layoutInfo.bandLength = bandLength;
  //     this.layoutInfo.startOffsetRowlayout = startOffsetRowlayout;
  //     // this.layoutInfo.snapPositions = snapPositions;
  //   }
  // }


  move_row_wsvs(distance: number, wsvsToAlign: Array<WordScaleVisualization>) {

    // const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);

    let index0OldPosition: CornerPosition;
    let newClonedWSV_left;

    wsvsToAlign.forEach((aWSV, index) => {
      let clonedWSV = aWSV._clonedWSV!;

      let nextClonedWSV;
      if (distance >= 0) {
        nextClonedWSV = clonedWSV.nextWSV;
      } else {
        nextClonedWSV = clonedWSV.previousWSV;
      }

      // let diff = maxEntityWidth - clonedWSV._entity._entityBbox.width;

      if (index === 0) {
        // shallow copy is enough
        index0OldPosition = {...clonedWSV._positionLeftTopCorner};
      }

      // get the next element in wsv_cloned its left position
      // let nextDiff = maxEntityWidth - nextClonedWSV._entity._entityBbox.width;

      if (index === this._wsvsWithoutCurrentWSV.length - 1) {
        newClonedWSV_left = (index0OldPosition.left - nextClonedWSV._offsetEntity) + clonedWSV._offsetEntity;
      } else {
        newClonedWSV_left = (nextClonedWSV._positionLeftTopCorner.left - nextClonedWSV._offsetEntity) + clonedWSV._offsetEntity
      }

      const viewportInfo = RowLayout.getViewportInfo();

      // set the position of the cloned element
      d3.select(clonedWSV._wsv).style('left', newClonedWSV_left);
      clonedWSV._positionLeftTopCorner.left = newClonedWSV_left
      // console.log(clonedWSV._entity._entityName, newClonedWSV_left)

      // unhide wsv to get the bboxes
      clonedWSV.removeClassOffWSV('hide')

      clonedWSV._entity.setBBoxOfEntity()
      clonedWSV.setBBoxOfWSV()

      const whiteOtherBackgroundElement = clonedWSV._backgroundElement;
      d3.select(whiteOtherBackgroundElement).classed('hide', false);
      d3.select(whiteOtherBackgroundElement).style('left', (newClonedWSV_left - clonedWSV._offsetEntity - this.layoutInfo.cellPadding));


      if (!d3.select(clonedWSV._wsv).classed('hide') && ((clonedWSV._wsvBBox.left - this.layoutInfo.cellPadding - clonedWSV._offsetEntity < viewportInfo.left) || (clonedWSV._wsvBBox.right > viewportInfo.right))) {
        // is visible and just crossed left border
        clonedWSV.addClassToWSV('hide');
        d3.select(whiteOtherBackgroundElement).classed('hide', true);

      } else if (d3.select(clonedWSV._wsv).classed('hide') && (((newClonedWSV_left - this.layoutInfo.cellPadding - clonedWSV._offsetEntity < viewportInfo.right) && (newClonedWSV_left - this.layoutInfo.cellPadding - clonedWSV._offsetEntity > viewportInfo.left)) || ((clonedWSV._wsvBBox.right < viewportInfo.right) && (clonedWSV._wsvBBox.right > viewportInfo.left)))) {
        // is hidden and just crossed the left or right border

        clonedWSV.removeClassOffWSV('hide')
        d3.select(whiteOtherBackgroundElement).classed('hide', false);
      }
    });
  }


  // based on available space around the current Entity and the layout, provide number of columns and rows to be used
  getRowAndColumnInfo(boundToWhat: string, aSpaceAvailability: SpaceAvailability): void {

    const layoutInfo = this.layoutInfo;
    const cellPadding = layoutInfo.cellPadding;

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
      layoutInfo.rowAndColumnNumbers.leftNumbColumn = Math.floor(aSpaceAvailability.left / (layoutInfo.cellDimensions.width + (2 * cellPadding)));

      // how many columns available to the right
      layoutInfo.rowAndColumnNumbers.rightNumbColumn = Math.floor(aSpaceAvailability.right / (layoutInfo.cellDimensions.width + (2 * cellPadding)));

      // how many rows available above current entity
      // top position relative to viewport
      const numRowsPossibleAbove =  Math.floor(aSpaceAvailability.above / (layoutInfo.cellDimensions.height + (2 * cellPadding)));
      const numRowsPossibleBelow = Math.floor(aSpaceAvailability.below / (layoutInfo.cellDimensions.height + (2 * cellPadding)));

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

    if (triangleLeft) triangleLeft.remove();
    if (triangleRight) triangleRight.remove();

    // const dragBand = document.getElementById('restrictedDragBand');
    // if (dragBand) dragBand.remove();
  }


  static getViewportInfo(): BBox {
    return document.body.getBoundingClientRect();
  }


}


export default RowLayout
