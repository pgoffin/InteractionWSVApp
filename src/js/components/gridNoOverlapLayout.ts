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


  applyLayout(anEventInitiatingLayoutChange) {

    const layoutInfo = this.layoutInfo;
    layoutInfo.type = 'grid-no-overlap';

    const currentEntityBBox = layoutInfo.currentEntity._entityBbox;
    const currentWSV = layoutInfo.currentEntity._entityBelongsToWsv;

    // get available space for columns and rows
    this.getRowAndColumnInfo('middleBound', this._spaceAvailability);

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._wsvsWithoutCurrentWSV)

    // get the paragraph of the current entity
    const currentEntityParagraph = this._refToText._currentEntity!._entityElement.parentElement.parentElement;

    if (anEventInitiatingLayoutChange != 'sorting') {
      const spacerNode = document.createElement("div");
      spacerNode.setAttribute('id', 'spacer');

      currentEntityParagraph.parentNode.insertBefore(spacerNode, currentEntityParagraph.nextSibling);
    }

    const numTotal_rows = Math.floor(this._wsvsWithoutCurrentWSV.length/layoutInfo.numberOfColumns);

    const sizeSmallMultiples = this.getSizeOfSmallMultiple(layoutInfo.numberOfColumns, numTotal_rows, layoutInfo.cellDimensions.width, layoutInfo.cellDimensions.height);

    document.getElementById('spacer').style.height = sizeSmallMultiples.height + 10;

    const shiftDown = currentEntityParagraph.getBoundingClientRect().bottom + document.body.scrollTop - (layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom);


    const topLeftCorner_left = (currentEntityBBox.left - currentWSV._offsetEntity - layoutInfo.cellPadding) - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * layoutInfo.cellDimensions.width);

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

      let newTop = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox.bottom  + shiftDown + (Math.floor(index/layoutInfo.numberOfColumns) * layoutInfo.cellDimensions.height) + (2 * layoutInfo.cellPadding);

      let newLeft = topLeftCorner_left + ((index % layoutInfo.numberOfColumns) * layoutInfo.cellDimensions.width) + layoutInfo.cellPadding + aClonedWSV._offsetEntity;


      let backgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        backgroundElement = LayoutCreator.addWhiteLayer(layoutInfo.cellDimensions.width, layoutInfo.cellDimensions.height, aWSV._wsvBBox.top - layoutInfo.cellPadding, aWSV._wsvBBox.left - aWSV._offsetEntity - layoutInfo.cellPadding);

        aClonedWSV._backgroundElement = backgroundElement;
      } else {
        backgroundElement = aClonedWSV._backgroundElement!;
        // the layout before might have hidden some of the whiteLayer, therefore unhide
        backgroundElement.classList.remove('hide');
      }


      mySequence.push({ e: aClonedWSV._wsv,
                        p: {left: (newLeft), top: (newTop)},
                        o: {duration: 1000,
                            sequenceQueue: false,

                            complete: () => {
                              aClonedWSV._entity.setBBoxOfEntity();
                              aClonedWSV.setBBoxOfSparkline();
                              aClonedWSV.setBBoxOfWSV();
                            }
                      }});

      mySequence.push({ e: backgroundElement,
                        p: {left: (newLeft - layoutInfo.cellPadding - aWSV._offsetEntity), top: (newTop - layoutInfo.cellPadding), opacity: 1},
                        o: {duration: 1000,
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

    if (boundToWhat === 'middleBound') {

      // is there enough space available in the column where the current entity is
      if (aSpaceAvailability.currentEntityColumn < 0) {
        layoutInfo.rowAndColumnNumbers.currentEntityColumn = 0;
      } else {
        layoutInfo.rowAndColumnNumbers.currentEntityColumn = 1;
      }

      // how many columns available to the left
      layoutInfo.rowAndColumnNumbers.leftNumbColumn = Math.floor(aSpaceAvailability.left / layoutInfo.cellDimensions.width);

      // how many columns available to the right
      layoutInfo.rowAndColumnNumbers.rightNumbColumn = Math.floor(aSpaceAvailability.right / layoutInfo.cellDimensions.width);

      // how many rows available above current entity
      // top position relative to viewport
      layoutInfo.rowAndColumnNumbers.aboveNumbRow = Math.floor(aSpaceAvailability.above / layoutInfo.cellDimensions.height);

      // how many rows available below current entity
      // bottom position relative to viewport
      layoutInfo.rowAndColumnNumbers.belowNumbRow = Math.floor(aSpaceAvailability.below / layoutInfo.cellDimensions.height);

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

  }

}


export default GridNoOverlapLayout
