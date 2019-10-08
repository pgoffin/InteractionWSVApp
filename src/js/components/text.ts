import { wsvDataObject } from '../../../global';

import ContextualMenu from './contextualMenu';
import Layout from './layout'
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';

const historianData = require('../../data/otherDataset')
const stockData = require('../../data/wsvDataFile')
const constants = require('../constants');

// to run sparklificator
// require('webpack-jquery-ui/widgets');
// const renderers = require('../../lib/renderers');
// require('../../lib/jquery.sparklificator');



interface Text {
  _nameOfTextFile: string;
  _isLayoutVisible: Boolean;
  _currentWSV: WordScaleVisualization;
  _currentEntity: Entity;
  _listOfWSVs: Array<WordScaleVisualization>;
  _dataForWSV: wsvDataObject;
  _theContextualMenu: ContextualMenu;
  _theLayout: Layout;
}


class Text implements Text {

  _nameOfTextFile: string;

  // if there is a layout then flag should be true
  _isLayoutVisible: Boolean = false;

  _currentWSV: WordScaleVisualization = null;

  // only tagged entities and that have data are stored here
  _listOfWSVs: Array<WordScaleVisualization> = [];
  // _listOfClonedWSVs: Array<WordScaleVisualization>;

  _dataForWSV: wsvDataObject = {};

  _currentEntity: Entity;

  _theContextualMenu: ContextualMenu;

  _theLayout: Layout;


  // getter/setter
  set nameOfTextFile(value: string) {
      this._nameOfTextFile = value;
  }
  get nameOfTextFile(): string {
      return this._nameOfTextFile;
  }

  set isLayoutVisible(value: Boolean) {
      this._isLayoutVisible = value;
  }
  get isLayoutVisible(): Boolean {
      return this._isLayoutVisible;
  }

  set currentWSV(value: WordScaleVisualization) {
      this._currentWSV = value;
  }
  get currentWSV(): WordScaleVisualization {
      return this._currentWSV;
  }

  set dataForWSV(value: wsvDataObject) {
      this._dataForWSV = value;
  }
  get dataForWSV(): wsvDataObject {
      return this._dataForWSV;
  }

  set listOfWSVs(value: Array<WordScaleVisualization>) {
      this._listOfWSVs = value;
  }
  get listOfWSVs(): Array<WordScaleVisualization> {
      return this._listOfWSVs;
  }

  set currentEntity(value: Entity)  {
      this._currentEntity = value;
  }
  get currentEntity(): Entity {
      return this._currentEntity;
  }


  initializeText() {
    console.log('initializing some text')

    this.nameOfTextFile = this.getTextFileName();

    // TODO Can this be done better?
    this.dataForWSV = this.getDatasetUsingDocumentTag();

    this.createWSVList();

    this._theLayout = new Layout(this);

    this._theContextualMenu = new ContextualMenu(this);

    this.addEventsToDocument();
    this.addSuggestedInteractivityTags();
  }


  addEventsToDocument() {

    document.addEventListener('keydown', event => {
      if (this._isLayoutVisible && (event.keyCode === 27 || event.charCode == 27)) {
        // ESC
        event.preventDefault();

        console.log('event: click (give up layout)');

        // if ($('#spacer').length > 0) {
        //   removeSpacer();
        // }

        this._theLayout.giveUpLayout();
        this._theContextualMenu.cleanupAfterLayout();
      }
    });

    // if ($('#spacer').length > 0) {
    //   removeSpacer();
    // }
    //
    // giveUpLayout();
    // startMenuHideTimer();
    // cleanupAfterLayout();
    // clearSelection();
    // // resetLayoutIcon();
    //
    // if (condition !== study2) {
    //   hideCloseIcon();
    // }
    //
    // addUsabilityToMenu(tmpCurrentEntity);

    document.addEventListener('dblclick', event => {
      this.clearSelection();

      if (this._isLayoutVisible) {

        console.log('event: click (give up layout)');

        // if ($('#spacer').length > 0) {
        //  removeSpacer();
        // }

        this._theLayout.giveUpLayout();
        this._theContextualMenu.cleanupAfterLayout();

        // clearSelection();
        // // resetLayoutIcon();
        //
        // if (condition !== study2) {
        // hideCloseIcon();
        // }
        //
        // addUsabilityToMenu(tmpCurrentEntity);
      } else {
        // summon grid layout when dblclicking somewhere on the canvas
        console.log("event: dblclick (create layout)");

        const dblClickLocation = {};
        dblClickLocation.x = event.pageX;
        dblClickLocation.y = event.pageY;

        if (this.chooseCurrentEntity(dblClickLocation)) {
          this._theLayout.changeLayout('GridLayout')
          this._theContextualMenu.showContextMenu(this._currentEntity);
        } else {
          console.log('no current entity was found')
        }

        // unSelectIcon();
        //
        // let iconName = grid_layout;
        // if (condition === study2) {
        //   iconName = previousLayout;
        // }
        //
        // // dblClickLocation.x = event.clientX;
        // // dblClickLocation.y = event.clientY;
        // dblClickLocation.x = event.pageX;
        // dblClickLocation.y = event.pageY;
        //
        // changeLayout(iconName);
        //
        // layoutFlag = true;
        //
        // if (currentEntity !== null) {
        //   // currentEntity has to be set here by changeLayout, if not don't go on
        //   tmpCurrentEntity = $(currentEntity)[0]
        //
        //   setLayoutType(iconName, 'newLayout');
        //
        //   $('#' + iconName).addClass('currentSeletedLayout');
        //   console.log('layout set to "' + iconName + '"')
        //
        //
        //   add_SuggestedInteractivity();
        //
        //   makeSelectable('sorting');
        //   makeNotSelectable('selection');
        //
        //   showContextMenu(tmpCurrentEntity);
        //   // to make close icon appear
        //   hideLayoutIcon();
      }
    });
  }


  addSuggestedInteractivityTags() {

    var hideClass = 'hide';

    const orientaionCircleDiv = document.createElement("div");
    orientaionCircleDiv.setAttribute('id', 'orientation_circles');
    orientaionCircleDiv.setAttribute('class', hideClass);
    document.body.appendChild(orientaionCircleDiv);

    const restrictedDragBandDiv = document.createElement("div");
    restrictedDragBandDiv.setAttribute('id', 'restrictedDragBand');
    restrictedDragBandDiv.setAttribute('class', hideClass);
    document.body.appendChild(restrictedDragBandDiv);

    const leftTriangleDiv = document.createElement("div");
    leftTriangleDiv.setAttribute('id', 'triangle_left');
    leftTriangleDiv.setAttribute('class', hideClass);
    document.body.appendChild(leftTriangleDiv);

    const rightTriangleDiv = document.createElement("div");
    rightTriangleDiv.setAttribute('id', 'triangle_right');
    rightTriangleDiv.setAttribute('class', hideClass);
    document.body.appendChild(rightTriangleDiv);
  }



  // check if currentEntity is set
  isCurrentEntitySet(): Boolean {
    if (this.currentEntity != null) {
      return true;
    } else {
      return false;
    }
  }


  /**
  * Goes through each element tagged as entity and that has data, and creates a wsv and puts it into an array.
  **/
  private createWSVList(): void {

    document.querySelectorAll(constants.entitySpanClass).forEach((entityElement) => {

      // get data for the entity
      let entityName = this.getEntityName(entityElement);
      let dataForEntity = this.dataForWSV[entityName]

      if (!((typeof dataForEntity == 'undefined') || (dataForEntity.length == 0))) {
        let aWSV = new WordScaleVisualization(entityElement, dataForEntity, entityElement.dataset.wsvRenderer, this, false);

        this.listOfWSVs.push(aWSV);
      }
    });

  }


  private getEntityName(aHTMLElement: HTMLElement): string {
    return aHTMLElement.innerText.trim()
  }


  /**
  * Returns the file name of the text where spaces are substituted with underscores
  * @returns {string}
  **/
  private getTextFileName(): string {
    return $.trim($('h2').text()).split(' ').join('_');
  }


  private getDatasetUsingDocumentTag() {
    let docDiv = document.getElementById('document');
    let whatData = docDiv.dataset.wsvType
    let aTextTitle = this.nameOfTextFile;

    if (whatData == 'historianData') {
      return historianData[aTextTitle];
    } else if (whatData == 'stockData') {
      return stockData[aTextTitle];
    }
  }


  // from here http://stackoverflow.com/questions/880512/prevent-text-selection-after-double-click
  clearSelection() {
    if (document.getSelection() && document.getSelection().empty) {
      document.getSelection().empty();
    } else if (window.getSelection) {
      let sel = window.getSelection();
      sel.removeAllRanges();
    }
  }


  chooseCurrentEntity(anEventLocation): Boolean {
    let aCurrentEntity = this.currentEntity;

    // All possible falsy values in ECMA-/Javascript: null, undefined, NaN, empty string (""), 0, false.
    if (!aCurrentEntity) {
      const choosenEntity: Entity = this.set_closestEntityAsCurrentEntity(anEventLocation)
      if (choosenEntity) {
        choosenEntity.setAsCurrentEntity();
      } else {
        alert('an entity needs to be visible to gather charts using double clicking!!');
        return false;
      }
    }

    return true;
  }


  // get the closest entity to the dbclicked location
  set_closestEntityAsCurrentEntity(anEventLocation): Entity {

    let closestVisibleEntity: Entity = null;
    let closestDistance: number = 1000000;

    this.listOfWSVs.forEach(aWSV => {

      // if (aWSV._wsvBBox.top > 0 && aWSV._wsvBBox.top < window.innerHeight) {
      if (aWSV._wsvBBox.top >= document.body.scrollTop && aWSV._wsvBBox.top < (document.body.scrollTop + window.innerHeight)) {
        // wsv is visible
        let distance = this.getDistancePointClosestWSVCorner(anEventLocation, aWSV._entity);

        if (distance < closestDistance) {
          closestVisibleEntity = aWSV._entity;
          closestDistance = distance;
        }
      }
    });

    if (!closestVisibleEntity) {
      // no entities in visible space of the page
      return null;
    }

    // closestVisibleEntity.setAsCurrentEntity();
    return closestVisibleEntity;
  }


  /**
  * Gets the shortest distance between a point and the closest poinnt on the bbox of the wsv
  * @param  {[type]} point  [description]
  * @param  {[type]} entity [description]
  * @return {number}        shortest ditance between the corner closest to the point and the point
  */
  getDistancePointClosestWSVCorner(point, entity: Entity) {
    // entities are DOM elements
    const wsvBBox = entity._entityBelongsToWsv._wsvBBox;

    // does not matter which corner --> array of corner and not object
    const wsvCorners = [{'left': wsvBBox.left, 'top': wsvBBox.top},
                        {'left': wsvBBox.left + wsvBBox.width, 'top': wsvBBox.top},
                        {'left': wsvBBox.left, 'top': wsvBBox.top + wsvBBox.height},
                        {'left': wsvBBox.left + wsvBBox.width, 'top': wsvBBox.top + wsvBBox.height}];

    let squaredDistance = 10000000;
    wsvCorners.forEach(aCorner => {
      let newSquaredDistance = ((point.x - aCorner.left) * (point.x - aCorner.left)) + ((point.y - aCorner.top) * (point.y - aCorner.top));

      if (newSquaredDistance < squaredDistance) {
        squaredDistance = newSquaredDistance
      }
    });

    if (point.x > wsvBBox.left && point.x < wsvBBox.left + wsvBBox.width) {
      var distanceToSegmentTop = Math.abs(point.y - wsvBBox.top);
      var distanceToSegmentBottom = Math.abs(point.y - (wsvBBox.top + wsvBBox.height));

      var distanceToSegmentTop_squared = distanceToSegmentTop * distanceToSegmentTop;
      if (distanceToSegmentTop_squared < squaredDistance) {
        squaredDistance = distanceToSegmentTop_squared;
      }

      var distanceToSegmentBottom_squared = distanceToSegmentBottom * distanceToSegmentBottom;
      if (distanceToSegmentBottom_squared < squaredDistance) {
        squaredDistance = distanceToSegmentBottom_squared;
      }

    } else if (point.y > wsvBBox.top && point.y < wsvBBox.top + wsvBBox.height) {
      var distanceToSegmentLeft = Math.abs(point.x - wsvBBox.left);
      var distanceToSegmentRight = Math.abs(point.x - (wsvBBox.left + wsvBBox.width));

      var distanceToSegmentLeft_squared = distanceToSegmentLeft * distanceToSegmentLeft;
      if (distanceToSegmentLeft_squared < squaredDistance) {
        squaredDistance = distanceToSegmentLeft_squared;
      }

      var distanceToSegmentRight_squared = distanceToSegmentRight * distanceToSegmentRight;
      if (distanceToSegmentRight_squared < squaredDistance) {
        squaredDistance = distanceToSegmentRight_squared;
      }
    }

    return squaredDistance;
  }



}


export default Text
