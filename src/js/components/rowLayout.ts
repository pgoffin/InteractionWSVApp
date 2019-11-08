import { BBox, CornerPosition, LayoutInfo, SpaceAvailability, VelocitySequence } from "../../../global";

import { select as d3Select } from 'd3-selection';

import Layout from './layout';
import LayoutCreator from './layoutCreator';
import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';

import 'velocity-animate';
import 'velocity-ui-pack';


class RowLayout implements Layout {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _wsvsWithoutCurrentWSV: Array<WordScaleVisualization>;
  _spaceAvailability: SpaceAvailability;



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


  applyLayout(anEventInitiatingLayoutChange) {

    const layoutInfo = this.layoutInfo;
    layoutInfo.type = 'row';

    const currentEntityBBox = layoutInfo.currentEntity._entityBbox;
    const currentWSV = layoutInfo.currentEntity._entityBelongsToWsv;

    // get available space for columns and rows
    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithoutCurrentWSV);

    layoutInfo.topLeftCorner_left = (currentEntityBBox.left - currentWSV._offsetEntity - layoutInfo.cellPadding) - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cellDimensions.width));

    // if at least 1 row above put row layout above else below
    if (layoutInfo.rowAndColumnNumbers.aboveNumbRow !== 0) {
      layoutInfo.topLeftCorner_top = currentWSV._wsvBBox.top - (layoutInfo.rowAndColumnNumbers.aboveNumbRow * (layoutInfo.cellDimensions.height));
    } else {
      layoutInfo.topLeftCorner_top = currentWSV._wsvBBox.bottom + layoutInfo.cellPadding;
    }

    const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);

    let mySequence: Array<VelocitySequence> = [];
    this._wsvsWithoutCurrentWSV.forEach((aWSV, index) => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
        aClonedWSV._offsetEntity = maxEntityWidth - aClonedWSV._entity._entityBbox.width;
      } else {
        aClonedWSV = aWSV._clonedWSV!;
        aClonedWSV.removeClassOffWSV('hide');
      }

      const newLeft = layoutInfo.topLeftCorner_left + (index * layoutInfo.cellDimensions.width) + layoutInfo.cellPadding + aClonedWSV._offsetEntity;

      let backgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        // use the position of the original wsv to fix position of background element
        backgroundElement = LayoutCreator.addWhiteLayer(layoutInfo.cellDimensions.width, layoutInfo.cellDimensions.height, aWSV._wsvBBox.top - layoutInfo.cellPadding, aWSV._wsvBBox.left - aWSV._offsetEntity - layoutInfo.cellPadding);

        aClonedWSV._backgroundElement = backgroundElement;
      } else {
        backgroundElement = aClonedWSV._backgroundElement;

        // the layout before might have hidden some of the whiteLayer, therefore unhide
        backgroundElement.classList.remove('hide');
      }

      aClonedWSV._positionLeftTopCorner.top = layoutInfo.topLeftCorner_top;
      aClonedWSV._positionLeftTopCorner.left = newLeft;

      mySequence.push({ e: aClonedWSV._wsv,
                        p: {left: (newLeft), top: (layoutInfo.topLeftCorner_top)},
                        o: {duration: 1000,
                            sequenceQueue: false,

                            complete: () => {
                              aClonedWSV._entity.setBBoxOfEntity();
                              aClonedWSV.setBBoxOfSparkline();
                              aClonedWSV.setBBoxOfWSV();

                              // set all left and right for clonedWSV that are hidden to 0 ==> no horizontal scrolling possible
                              // inline styles takes priority over stylesheets
                              if (index === 0) {
                                aClonedWSV._wsv.classList.add('first')
                                // $(aClonedWSV._wsv).children('.entity').css('background-color', '#a6bddb');
                              } else if (index === (this._wsvsWithoutCurrentWSV.length - 1)) {
                                aClonedWSV._wsv.classList.add('last')
                              }

                              let cellOfClonedWSV_left = aClonedWSV._wsvBBox.left - aClonedWSV._offsetEntity - layoutInfo.cellPadding;
                              let cellOfClonedWSV_right = aClonedWSV._wsvBBox.right + layoutInfo.cellPadding;
                              if ((cellOfClonedWSV_left < document.body.getBoundingClientRect().left) || (cellOfClonedWSV_right > document.body.getBoundingClientRect().right)) {
                                aClonedWSV.addClassToWSV('hide');

                                backgroundElement.classList.add('hide');
                              }
                            }
                          }
                      });

      mySequence.push({ e: backgroundElement,
                        p: {left: (newLeft - layoutInfo.cellPadding - aClonedWSV._offsetEntity), top: (layoutInfo.topLeftCorner_top - layoutInfo.cellPadding), opacity: 1},
                        o: { duration: 1000,
                            sequenceQueue: false
                          }
                      });

    });

    $.Velocity.RunSequence(mySequence);


    this._wsvsWithoutCurrentWSV.forEach((aWSV, index) => {
      let aClonedWSV = aWSV._clonedWSV;

      if (aClonedWSV) {

        let nextWSVIndex = index + 1;
        if (nextWSVIndex === this._wsvsWithoutCurrentWSV.length) {
          aClonedWSV._nextWSV = this._wsvsWithoutCurrentWSV[0]._clonedWSV
        } else {
          aClonedWSV._nextWSV = this._wsvsWithoutCurrentWSV[nextWSVIndex]._clonedWSV
        }

        let previousWSVIndex = index - 1;
        if (previousWSVIndex < 0) {
          aClonedWSV._previousWSV = this._wsvsWithoutCurrentWSV[this._wsvsWithoutCurrentWSV.length-1]._clonedWSV
        } else {
          aClonedWSV._previousWSV = this._wsvsWithoutCurrentWSV[previousWSVIndex]._clonedWSV
        }
      }
    });

    if (anEventInitiatingLayoutChange != 'sorting') {
      this.addSuggestedInteractivity();
    }
  }


  preventDbclickEvent(event: Event) {
    // Prevent double-click in case of fast animation or sloppy browser.
    console.log('double-clicked but did nothing');

    event.stopPropagation();
    event.preventDefault();
  }


  triangleClickListener = (event: Event) => {
    if (event.currentTarget) {
      console.log('clicked on ' + event.currentTarget.type + ' triangle');

      // so click in $(html) is not triggered
      event.stopPropagation();

      if (event.currentTarget.distance >= 0) {
        // right triangle was clicked
        this.moveRowWsvs(event.currentTarget.distance, this._wsvsWithoutCurrentWSV);
      } else {
        // left triangle was clicked
        this.moveRowWsvs(event.currentTarget.distance, this._wsvsWithoutCurrentWSV.slice().reverse());
      }
    }
  }


  addSuggestedInteractivity() {

    let leftTriangleDiv = document.getElementById('triangle_left');
    if (!leftTriangleDiv) {
      leftTriangleDiv = document.createElement("div");
      leftTriangleDiv.setAttribute('id', 'triangle_left');
      document.body.appendChild(leftTriangleDiv);
    }

    leftTriangleDiv.classList.remove('hide');
    leftTriangleDiv.style.top = this.layoutInfo.topLeftCorner_top + 'px';
    leftTriangleDiv.style.left = document.body.getBoundingClientRect().left + 'px';

    leftTriangleDiv.type = 'left';
    leftTriangleDiv.distance = -(this.layoutInfo.cellDimensions.width);

    leftTriangleDiv.removeEventListener('click', this.triangleClickListener);
    leftTriangleDiv.removeEventListener('dblclick', this.preventDbclickEvent);

    leftTriangleDiv.addEventListener('click', this.triangleClickListener);
    leftTriangleDiv.addEventListener('dblclick', this.preventDbclickEvent);


    let rightTriangleDiv = document.getElementById('triangle_right');
    if (!rightTriangleDiv) {
      rightTriangleDiv = document.createElement("div");
      rightTriangleDiv.setAttribute('id', 'triangle_right');
      document.body.appendChild(rightTriangleDiv);
    }

    const viewportInfo = RowLayout.getViewportInfo()

    rightTriangleDiv.classList.remove('hide');
    rightTriangleDiv.style.top = this.layoutInfo.topLeftCorner_top + 'px';
    rightTriangleDiv.style.left = (viewportInfo.right - 10) + 'px';

    rightTriangleDiv.type = 'right';
    rightTriangleDiv.distance = this.layoutInfo.cellDimensions.width;

    rightTriangleDiv.removeEventListener('click', this.triangleClickListener);
    rightTriangleDiv.removeEventListener('dblclick', this.preventDbclickEvent);

    rightTriangleDiv.addEventListener('click', this.triangleClickListener);
    rightTriangleDiv.addEventListener('dblclick', this.preventDbclickEvent);
  }


  moveRowWsvs(distance: number, wsvsToAlign: Array<WordScaleVisualization>) {

    let index0OldPosition: CornerPosition;
    let newClonedWSV_left;

    wsvsToAlign.forEach((aWSV, index) => {
      let clonedWSV = aWSV._clonedWSV!;

      let nextClonedWSV;
      if (distance >= 0) {
        nextClonedWSV = clonedWSV._nextWSV;
      } else {
        nextClonedWSV = clonedWSV._previousWSV;
      }


      if (index === 0) {
        // shallow copy is enough
        index0OldPosition = {...clonedWSV._positionLeftTopCorner};
      }

      if (nextClonedWSV) {
        // get the next element in wsv_cloned its left position
        if (index === this._wsvsWithoutCurrentWSV.length - 1) {
          newClonedWSV_left = (index0OldPosition.left - nextClonedWSV._offsetEntity) + clonedWSV._offsetEntity;
        } else {
          newClonedWSV_left = (nextClonedWSV._positionLeftTopCorner.left - nextClonedWSV._offsetEntity) + clonedWSV._offsetEntity
        }

        const viewportInfo = RowLayout.getViewportInfo();

        // set the position of the cloned element
        d3Select(clonedWSV._wsv).style('left', newClonedWSV_left);
        clonedWSV._positionLeftTopCorner.left = newClonedWSV_left

        // unhide wsv to get the bboxes
        clonedWSV.removeClassOffWSV('hide')

        clonedWSV._entity.setBBoxOfEntity()
        clonedWSV.setBBoxOfWSV()


        const backgroundElement = clonedWSV._backgroundElement;
        d3Select(backgroundElement).classed('hide', false);
        d3Select(backgroundElement).style('left', (newClonedWSV_left - clonedWSV._offsetEntity - this.layoutInfo.cellPadding));

        let cellOfClonedWSV_left = newClonedWSV_left - clonedWSV._offsetEntity - this.layoutInfo.cellPadding

        if (!d3Select(clonedWSV._wsv).classed('hide') && ((cellOfClonedWSV_left < viewportInfo.left) || (clonedWSV._wsvBBox.right > viewportInfo.right))) {
          // is visible and just crossed left border
          clonedWSV.addClassToWSV('hide');
          d3Select(backgroundElement).classed('hide', true);

        } else if (d3Select(clonedWSV._wsv).classed('hide') && (((cellOfClonedWSV_left < viewportInfo.right) && (cellOfClonedWSV_left > viewportInfo.left)) || ((clonedWSV._wsvBBox.right < viewportInfo.right) && (clonedWSV._wsvBBox.right > viewportInfo.left)))) {
          // is hidden and just crossed the left or right border

          clonedWSV.removeClassOffWSV('hide')
          d3Select(backgroundElement).classed('hide', false);
        }
      } else {
        console.log('ERROR: missing link to next WSV')
      }
    });
  }


  // based on available space around the current Entity and the layout, provide number of columns and rows to be used
  getRowAndColumnInfo(boundToWhat: string, aSpaceAvailability: SpaceAvailability): void {

    const layoutInfo = this.layoutInfo;
    const cellPadding = layoutInfo.cellPadding;

    if (boundToWhat === 'middleBound') {

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

    this._refToText.listOfWSVs.forEach(aWSV => {
      if (aWSV._nextWSV) aWSV._nextWSV = null;
      if (aWSV._previousWSV) aWSV._previousWSV = null;
    });

    // const dragBand = document.getElementById('restrictedDragBand');
    // if (dragBand) dragBand.remove();
  }


  static getViewportInfo(): BBox {
    return document.body.getBoundingClientRect();
  }


}


export default RowLayout
