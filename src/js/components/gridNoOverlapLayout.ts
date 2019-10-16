import { BBox, LayoutInfo, VelocitySequence } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import Layout from './layout';
import LayoutCreator from './layoutCreator';

import 'velocity-animate';
import 'velocity-ui-pack';



class GridNoOverlapLayout implements Layout {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _arrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>;


  constructor(aLayoutInfo: LayoutInfo, aRefToText: Text, anArrayOfWSVsWithouCurrentWSV: Array<WordScaleVisualization>) {
    this._layoutInfo = aLayoutInfo;
    this._refToText = aRefToText;
    this._arrayOfWSVsWithouCurrentWSV = anArrayOfWSVsWithouCurrentWSV;
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

    const currentEntity: Entity = this._refToText.currentEntity!;
    const bbox_currEntity: BBox = currentEntity._entityBbox;
    const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // update the counts variable
    layoutInfo.counts = LayoutCreator.getAboveBelowCounts(this._arrayOfWSVsWithouCurrentWSV)

    // get the paragraph of the current entity
    // const currentEntityParagraph = $(currentEntity).parent().parent();
    const currentEntityParagraph = this._refToText._currentEntity._entityElement.parentElement.parentElement;

    const spacerNode = document.createElement("div");
    spacerNode.setAttribute('id', 'spacer');

    currentEntityParagraph.parentNode.insertBefore(spacerNode, currentEntityParagraph.nextSibling);
    // currentEntityParagraph.after("<div id='spacer'></div>");

    const numTotal_rows = Math.floor(this._arrayOfWSVsWithouCurrentWSV.length/layoutInfo.numberOfColumns);

    var sizeSmallMultiples = this.getSizeOfSmallMultiple(layoutInfo.numberOfColumns, numTotal_rows, layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenCells), layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells));

    // $('#spacer').height(sizeSmallMultiples.height);
    document.getElementById('spacer').style.height = sizeSmallMultiples.height

    var shiftDown = currentEntityParagraph.getBoundingClientRect().bottom + document.body.scrollTop - (bbox_currWSV.bottom);


    const topLeftCorner_left = bbox_currEntity.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenCells)));

    let mySequence: Array<VelocitySequence> = [];
    this._arrayOfWSVsWithouCurrentWSV.forEach((aWSV, index) => {

      // cloning the wsv, and changing the position from relative to absolute
      let aClonedWSV: WordScaleVisualization;
      if (!this._refToText.isLayoutVisible) {
        aClonedWSV = aWSV.cloneWSV();
        aWSV._theClonedWSV = aClonedWSV;
        aClonedWSV._theOriginalWSV = aWSV;

        aWSV._wsv.classList.add('hasClone');
      } else {
        aClonedWSV = aWSV._theClonedWSV;
        $(aClonedWSV).removeClass('hide');
        $(aClonedWSV).children().removeClass('hide');
      }

      let newTop = bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenCells) + shiftDown + (Math.floor(index/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)));

      let newLeft = topLeftCorner_left + ((index % layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenCells))) + aWSV._middleBoundOffset;


      let whiteBackgroundElement: HTMLElement;
      if (!this._refToText.isLayoutVisible) {
        whiteBackgroundElement = LayoutCreator.addWhiteLayer((layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenCells)), (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenCells)), (aWSV.entity._entityBbox.top), (aWSV.entity._entityBbox.left));

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

      mySequence.push({e: whiteBackgroundElement, p: {left: (newLeft - layoutInfo.spaceBetweenCells - aWSV._offset_whiteLayer), top: (newTop - layoutInfo.spaceBetweenCells), opacity: 1}, o: {
          duration: 1000,
          sequenceQueue: false
        }
      });
    });

    $.Velocity.RunSequence(mySequence);

    $('.sparklificated.clonedWSV.first .entity').css('background-color', 'rgb(255, 223, 128)');
  }


  getSizeOfSmallMultiple(countCells_x: number, countCells_y: number, cellWidth: number, cellHeight: number): any {

    const result = {'width': 0, 'height': 0};

    result.width = countCells_x * cellWidth;
    result.height = countCells_y * cellHeight;

    return result;
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
