import { LayoutInfo, SpaceAvailability, VelocitySequence } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
// import Entity from './entity';
import Layout from './layout';
import LayoutCreator from './layoutCreator';

import 'velocity-animate';
import 'velocity-ui-pack';



class GridNoOverlapLayout implements Layout {

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


  applyLayout() {

    const layoutInfo = this.layoutInfo;
    layoutInfo.type = 'grid-no-overlap';

    const currentEntityBBox = layoutInfo.currentEntity._entityBbox;

    // const currentEntity: Entity = this._refToText.currentEntity!;
    // const bbox_currEntity: BBox = currentEntity._entityBbox;
    // const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // get available space for columns and rows
    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithoutCurrentWSV)

    // get the paragraph of the current entity
    // const currentEntityParagraph = $(currentEntity).parent().parent();
    const currentEntityParagraph = this._refToText._currentEntity._entityElement.parentElement.parentElement;

    const spacerNode = document.createElement("div");
    spacerNode.setAttribute('id', 'spacer');

    currentEntityParagraph.parentNode.insertBefore(spacerNode, currentEntityParagraph.nextSibling);
    // currentEntityParagraph.after("<div id='spacer'></div>");

    const numTotal_rows = Math.floor(this._wsvsWithoutCurrentWSV.length/layoutInfo.numberOfColumns);

    const sizeSmallMultiples = this.getSizeOfSmallMultiple(layoutInfo.numberOfColumns, numTotal_rows, layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells), layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells));

    // $('#spacer').height(sizeSmallMultiples.height);
    document.getElementById('spacer').style.height = sizeSmallMultiples.height

    const shiftDown = currentEntityParagraph.getBoundingClientRect().bottom + document.body.scrollTop - (layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom);


    const topLeftCorner_left = currentEntityBBox.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells)));

    let mySequence: Array<VelocitySequence> = [];
    this._wsvsWithoutCurrentWSV.forEach((aWSV, index) => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
      } else {
        aClonedWSV = aWSV._clonedWSV;
        aClonedWSV.removeClassOffWSV('hide');
      }

      let newTop = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom + (2*layoutInfo.spaceBetweenCells) + shiftDown + (Math.floor(index/layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)));

      let newLeft = topLeftCorner_left + ((index % layoutInfo.numberOfColumns) * (layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells))) + aWSV._middleBoundOffset;


      let whiteBackgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cellDimensions.width + (2*layoutInfo.spaceBetweenCells)), (layoutInfo.cellDimensions.height + (2*layoutInfo.spaceBetweenCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

        aWSV._clonedWSV._backgroundElement = whiteBackgroundElement;
      } else {
        // the layout before might have hidden some of the whiteLayer, therefore unhide
        aWSV._clonedWSV._backgroundElement.classList.remove('hide');

        whiteBackgroundElement = aWSV._clonedWSV._backgroundElement;
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

      mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.spaceBetweenCells - aWSV._offsetWhiteLayer), top: (newTop - layoutInfo.spaceBetweenCells), opacity: 1}, o: {
          duration: 1000,
          sequenceQueue: false
        }
      });
    });

    $.Velocity.RunSequence(mySequence);
  }


  getSizeOfSmallMultiple(countCells_x: number, countCells_y: number, cellWidth: number, cellHeight: number): any {

    const result = {'width': 0, 'height': 0};

    result.width = countCells_x * cellWidth;
    result.height = countCells_y * cellHeight;

    return result;
  }


  // based on available space around the current Entity and the layout, provide number of columns and rows to be used
  getRowAndColumnInfo(boundToWhat: string, aSpaceAvailability: SpaceAvailability): void {

    const layoutInfo = this.layoutInfo;
    const spaceBetweenCells = layoutInfo.spaceBetweenCells;

    if (boundToWhat === 'middleBound') {

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
      layoutInfo.rowAndColumnNumbers.aboveNumbRow = Math.floor(aSpaceAvailability.above / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      // how many rows available below current entity
      // bottom position relative to viewport
      layoutInfo.rowAndColumnNumbers.belowNumbRow = Math.floor(aSpaceAvailability.below / (layoutInfo.cellDimensions.height + (2 * spaceBetweenCells)));

      layoutInfo.numberOfColumns = layoutInfo.rowAndColumnNumbers.leftNumbColumn + layoutInfo.rowAndColumnNumbers.currentEntityColumn + layoutInfo.rowAndColumnNumbers.rightNumbColumn;
    }
  }


  cleanUpAfterLayout() {
    console.log('gridNoOverlap layout cleanup');

    this.removeSpacer();
  }


  removeSpacer() {

    const spacerElement = document.getElementById('spacer');

    if (spacerElement) spacerElement.remove();

    // change the entityBbox as the spacer was removed
    // this.updateEntityBBox();
  }

}


export default GridNoOverlapLayout
