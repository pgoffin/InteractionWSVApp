import { BBox, LayoutInfo } from "../../../global";

import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import Layout from './layout';

import 'velocity-animate';
import 'velocity-ui-pack';



class GridNoOverlapLayout implements Layout {

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
    layoutInfo.type = 'grid-no-overlap';

    const currentEntity: Entity = this._refToText.currentEntity;
    const bbox_currEntity: BBox = currentEntity._entityBbox;
    const bbox_currWSV: BBox = currentEntity._entityBelongsToWsv._wsvBBox;

    // update the counts variable
    layoutInfo.counts = LayoutType.getAboveBelowCounts(this._arrayOfWSVsWithouCurrentWSV)

    // get the paragraph of the current entity
    // const currentEntityParagraph = $(currentEntity).parent().parent();
    const currentEntityParagraph = this._refToText._currentEntity._entityElement.parentElement.parentElement;

    const spacerNode = document.createElement("div");
    spacerNode.setAttribute('id', 'spacer');

    currentEntityParagraph.parentNode.insertBefore(spacerNode, currentEntityParagraph.nextSibling);
    // currentEntityParagraph.after("<div id='spacer'></div>");

    const numTotal_rows = Math.floor(this._arrayOfWSVsWithouCurrentWSV.length/layoutInfo.numberOfColumns);

    var sizeSmallMultiples = this.getSizeOfSmallMultiple(layoutInfo.numberOfColumns, numTotal_rows, layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells), layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells));

    // $('#spacer').height(sizeSmallMultiples.height);
    document.getElementById('spacer').style.height = sizeSmallMultiples.height

    var shiftDown = currentEntityParagraph.getBoundingClientRect().bottom + document.body.scrollTop - (bbox_currWSV.bottom);


    const topLeftCorner_left = bbox_currEntity.left - (layoutInfo.rowAndColumnNumbers.leftNumbColumn * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells)));

    let mySequence = [];
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

      let newTop = bbox_currWSV.bottom + (2*layoutInfo.spaceBetweenGridCells) + shiftDown + (Math.floor(index/layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.height + (2*layoutInfo.spaceBetweenGridCells)));

      let newLeft = topLeftCorner_left + ((index % layoutInfo.numberOfColumns) * (layoutInfo.cell_dimensions.width + (2*layoutInfo.spaceBetweenGridCells))) + aWSV._middleBoundOffset;


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


  getSizeOfSmallMultiple(countCells_x: number, countCells_y: number, cellWidth: number, cellHeight: number): any {

    const result = {'width': 0, 'height': 0};

    result.width = countCells_x * cellWidth;
    result.height = countCells_y * cellHeight;

    return result;
  }


}


export default GridNoOverlapLayout
