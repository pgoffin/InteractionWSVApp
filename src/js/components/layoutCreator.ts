  import { LayoutInfo, VelocitySequence, CellDimension, SpaceAvailability } from "../../../global";

import { wsvInteractionConstants } from '../constants';

import Entity from './entity';
import Layout from './layout';
// import Sorter from '../sorting/sorter';
import sortingFactoryClass from '../sorting/sortingFactoryClass';
import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';

import 'velocity-animate';
import 'velocity-ui-pack';



abstract class LayoutCreator {

  _layoutInfo: LayoutInfo;
  _refToText: Text;
  _theLayout: Layout;
  _wsvsThatHaveAClone: Array<WordScaleVisualization>;
  _spaceUsableInteractively: SpaceAvailability;
  _layoutClass: string;



  constructor(aRefToText: Text) {
    this._layoutInfo = {rowAndColumnNumbers: {}};
    this._layoutInfo.cellPadding = 5;

    this._refToText = aRefToText;
    this._wsvsThatHaveAClone = []
  }


  // getter/setter
  set layoutInfo(keyValuePair) {
    this._layoutInfo[keyValuePair[0]] = keyValuePair[1];
  }
  get layoutInfo() {
    return this._layoutInfo;
  }



  abstract layoutFactory(aLayoutName: string, layoutInfo: LayoutInfo, spaceAvailability: SpaceAvailability, refToText: Text, wsvsWithoutCurrentWSV: Array<WordScaleVisualization>): Layout


  changeLayout(layoutType: string, sorting: string, eventInitiatingLayoutChange: string) {

    this._layoutClass = layoutType;

    const layoutInfo = this.layoutInfo;

    const currentEntity: Entity = this._refToText.currentEntity!;
    layoutInfo.currentEntity = currentEntity;

    // get dimensions of cell, where a cell is a rectangle around the wsv
    layoutInfo.cellDimensions = this.getCellDimensions();

    this._wsvsThatHaveAClone = this._refToText.listOfWSVs.filter(aWSV => aWSV != this._refToText._currentWSV);

    const sortingFactory = sortingFactoryClass(sorting, this._wsvsThatHaveAClone, this._refToText)
    this._wsvsThatHaveAClone = sortingFactory.sort();

    if (eventInitiatingLayoutChange === 'sorting') sortingFactory.sortBackgroundElements();

    const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);

    this._refToText._listOfWSVs.forEach(aWSV => {
      // max entity provides left most extension of an entity -> diff between max entity and the entity
      aWSV._offsetEntity = maxEntityWidth - aWSV._entity._entityBbox.width;
    });


    this._wsvsThatHaveAClone.forEach(aWSV => {
      aWSV._aboveOrBelow = sortingFactory.compareToCurrentWSV(aWSV);
    });

    this.getUsableInteractiveSpace();

    this._theLayout = this.layoutFactory(layoutType, layoutInfo, this._spaceUsableInteractively, this._refToText, this._wsvsThatHaveAClone);
    this._theLayout.applyLayout(eventInitiatingLayoutChange);

    this._refToText.isLayoutVisible = true;
  }


  giveUpLayout() {

    const giveUpAnimationSequence: Array<VelocitySequence> = [];

    this._wsvsThatHaveAClone.forEach((aWSV, index) => {

      let clonedWSV = aWSV._clonedWSV;

      if (clonedWSV) {
        let originalWSVBBox = aWSV._wsvBBox;
        let backgroundElement = clonedWSV._backgroundElement;

        giveUpAnimationSequence.push({e: clonedWSV._wsv,
                                      p: {left: originalWSVBBox.left, top: originalWSVBBox.top},
                                      o: {sequenceQueue: false,
                                          duration: 800,
                                          complete: () => {
                                            if (clonedWSV) {
                                              clonedWSV.removeClone()
                                            } else {
                                              console.log('ERROR: missing cloned wsv')
                                            }
                                          }
                                        }
                                    });


        if (Object.is(this._wsvsThatHaveAClone.length - 1, index)) {
          giveUpAnimationSequence.push({e: backgroundElement,
                                        p: {left: originalWSVBBox.left, top: originalWSVBBox.top, opacity: 0},
                                        o: {sequenceQueue: false,
                                            duration: 800,
                                            complete: aBackgroundElement => {
                                              aBackgroundElement[0].remove();
                                              aWSV._backgroundElement = null;

                                              document.querySelectorAll('.sparklificated.hasClone').forEach(anElement => {anElement.classList.remove('hasClone')});

                                              document.querySelectorAll('.entity').forEach(anElement => {anElement.classList.remove('selected')});

                                              this.cleanupAfterLayout();
                                              this._theLayout.cleanUpAfterLayout();
                                            }
                                          }
                                      });

        } else {

          giveUpAnimationSequence.push({e: backgroundElement,
                                        p: {left: originalWSVBBox.left, top: originalWSVBBox.top, opacity: 0},
                                        o: {sequenceQueue: false,
                                            duration: 800,
                                            complete: aBackgroundElement => {
                                              aBackgroundElement[0].remove();
                                              aWSV._backgroundElement = null;
                                            }
                                          }
                                      });

        }
      }
    });

    if (giveUpAnimationSequence.length > 0) {
      $.Velocity.RunSequence(giveUpAnimationSequence);
    } else {
      this.cleanupAfterLayout();
    }
  }


  cleanupAfterLayout() {

    this._refToText._isLayoutVisible = false;

    this._refToText._contextualMenu.hideContextualMenu(this._refToText._currentEntity!);

    // this.layoutInfo.bandLength = 0;
    // this.layoutInfo.startOffsetRowlayout = 0;
    // this.layoutInfo.snapPositions = [];

    this._wsvsThatHaveAClone = [];
  }


  /**
  * A cell is where the wsv (sparkline + entity) is embedded + padding.
  * @return {object} - custom object with the height and width of the cell
  */
  getCellDimensions(): CellDimension {

    // initialize the return object
    const cellDimensions = {height: 0,
                            width: 0}

    // get the max wsv height
    cellDimensions.height = Math.max.apply(null, this._refToText.listOfWSVs.map(aWSV => aWSV._wsvBBox.height));
    cellDimensions.height = cellDimensions.height + (2 * this._layoutInfo.cellPadding);

    // get the max wsv width
    cellDimensions.width = Math.max.apply(null, this._refToText.listOfWSVs.map(aWSV => aWSV._wsvBBox.width));
    cellDimensions.width = cellDimensions.width + (2 * this._layoutInfo.cellPadding);

    return cellDimensions;
  }


  getUsableInteractiveSpace(): void {
    const layoutInfo = this.layoutInfo;
    const maxEntityWidth = LayoutCreator.getEntityMaxWidth(this._refToText.listOfWSVs);
    const maxSparklineWidth = LayoutCreator.getSparklineMaxWidth(this._refToText.listOfWSVs);

    // the width of the window
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    // these is the bbox of the text with "margin", a wsv should not go over it
    const bodyBbox = LayoutCreator.getBodyBBox();
    const leftWindowPadding = bodyBbox.left;
    const rightWindowPadding = windowWidth - bodyBbox.right;

    const currentEntityBBoxRight = layoutInfo.currentEntity._entityBbox.right;
    const currentWSVBBox = layoutInfo.currentEntity._entityBelongsToWsv._wsvBBox;

    const cellPadding = layoutInfo.cellPadding;

    // is there enough space available in the column where the current entity is
    let availableSpaceForCurrentEntityColumn_left = currentEntityBBoxRight - maxEntityWidth - leftWindowPadding;

    // how many columns available to the left
    let availableSpaceLeft = Math.max(0, (currentEntityBBoxRight - maxEntityWidth - cellPadding - leftWindowPadding));

    // how many columns available to the right
    let availableSpaceRight = Math.max(0, (windowWidth - (currentEntityBBoxRight + maxSparklineWidth + cellPadding) - rightWindowPadding));

    // how many rows available above current entity
    // top position relative to viewport
    let availableSpaceAbove = Math.max(0, (currentWSVBBox.top - document.body.scrollTop - cellPadding));

    // how many rows available below current entity
    // bottom position relative to viewport
    let availableSpaceBelow = Math.max(0, (windowHeight - (currentWSVBBox.bottom - document.body.scrollTop) - cellPadding));

    let spaceAvailability = {currentEntityColumn: availableSpaceForCurrentEntityColumn_left,
                             left: availableSpaceLeft,
                             above: availableSpaceAbove,
                             right: availableSpaceRight,
                             below: availableSpaceBelow}

    this._spaceUsableInteractively = spaceAvailability
  }


  /**
  * Gets the maximal width of the entities present in the document.
  * @return {[type]} [description]
  */
  static getEntityMaxWidth(arrayOfWSVMeasurementObjects: Array<WordScaleVisualization>): number {
    const entityMaxWidth = Math.max.apply(null, arrayOfWSVMeasurementObjects.map((aWSV: WordScaleVisualization) => {
      return aWSV.entity._entityBbox.width;
    }));

    return entityMaxWidth;
  }


  /**
  * Gets the maximum sparkline among a collection of sparklines
  * @param  {Array[objects]} arrayOfWSVMeasurementObjects [description]
  * @return {float}                              [description]
  */
  static getSparklineMaxWidth(arrayOfWSVMeasurementObjects: Array<WordScaleVisualization>): number {
    const sparklineMaxWidth = Math.max.apply(null, arrayOfWSVMeasurementObjects.map((aWSV: WordScaleVisualization) => {
      return aWSV._wsvVisualizationBBox.width;
    }));

    return sparklineMaxWidth;
  }


  static getBodyBBox(): DOMRect | ClientRect {

    return document.body.getBoundingClientRect();
  }


  static getAboveBelowCounts(anArrayOfWSVs: Array<WordScaleVisualization>) {
    const counts = {above: 0, below: 0}

    anArrayOfWSVs.forEach(aWSV => {
      if (aWSV._aboveOrBelow === 'above') {
        counts.above += 1;
      } else if (aWSV._aboveOrBelow === 'below') {
        counts.below += 1;
      }
    })

    return counts;
  }


  static addWhiteLayer(width: number, height: number, oldTop: number, oldLeft: number) {

    const textDiv = document.getElementById('text');

    let backgroundLayerDiv = document.getElementById('backgroundLayer');
    if (!backgroundLayerDiv) {
      backgroundLayerDiv = document.createElement('div');
      backgroundLayerDiv.id = 'backgroundLayer';

      if (textDiv) textDiv.append(backgroundLayerDiv)
    }

    const whiteLayerDiv = document.createElement('div');
    whiteLayerDiv.classList.add('whiteLayer');

    backgroundLayerDiv.append(whiteLayerDiv);

    whiteLayerDiv.style.width = width + 'px';
    whiteLayerDiv.style.height = height + 'px';

    whiteLayerDiv.style.top = oldTop + 'px';
    whiteLayerDiv.style.left = oldLeft + 'px';

    return whiteLayerDiv;
  }


}

 export default LayoutCreator
