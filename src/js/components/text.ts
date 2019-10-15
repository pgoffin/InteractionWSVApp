import { WsvDataObject, EventLocation, BBox } from '../../../global';

import ContextualMenu from './contextualMenu';
import WordScaleVisualization from './wordScaleVisualization';
import Entity from './entity';
import LayoutCreator from './layoutCreator';
import ConcreteLayoutCreator from './concreteLayoutCreator';

const historianData = require('../../data/otherDataset')
const stockData = require('../../data/wsvDataFile')

import { wsvInteractionConstants } from '../constants';



interface Text {
  _nameOfTextFile: string;
  _isLayoutVisible: Boolean;
  _currentWSV: WordScaleVisualization | null;
  _currentEntity: Entity | null;
  _listOfWSVs: Array<WordScaleVisualization>;
  _dataForWSV: WsvDataObject;
  _contextualMenu: ContextualMenu;
  _layoutCreator: LayoutCreator;
}



class Text implements Text {

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

  set currentWSV(value: WordScaleVisualization | null) {
      this._currentWSV = value;
  }
  get currentWSV(): WordScaleVisualization | null {
      return this._currentWSV;
  }

  set dataForWSV(value: WsvDataObject) {
      this._dataForWSV = value;
  }
  get dataForWSV(): WsvDataObject {
      return this._dataForWSV;
  }

  set listOfWSVs(value: Array<WordScaleVisualization>) {
      this._listOfWSVs = value;
  }
  get listOfWSVs(): Array<WordScaleVisualization> {
      return this._listOfWSVs;
  }

  set currentEntity(value: Entity | null)  {
      this._currentEntity = value;
  }
  get currentEntity(): Entity | null {
      return this._currentEntity;
  }

  set layoutCreator(value: LayoutCreator)  {
      this._layoutCreator = value;
  }
  get layoutCreator(): LayoutCreator {
      return this._layoutCreator;
  }

  set contextualMenu(value: ContextualMenu)  {
      this._contextualMenu = value;
  }
  get contextualMenu(): ContextualMenu {
      return this._contextualMenu;
  }



  constructor() {
    console.log('initializing some text')

    this.nameOfTextFile = this.getTextFileName();
    this.isLayoutVisible = false;

    // TODO Can this be done better?
    const theData = this.getDatasetUsingDocumentTag()
    if (theData !== null) {
      this.dataForWSV = theData;

      this.createWSVList();

      this.layoutCreator = new ConcreteLayoutCreator(this)

      this._contextualMenu = new ContextualMenu(this);

      this.addEventsToDocument();
      this.addSuggestedInteractivityTags();
    } else {
      console.log('ERROR: check why there is no dataset for this text');
    }

  }


  addEventsToDocument() {

    document.addEventListener('keydown', event => {
      if (this._isLayoutVisible && (event.keyCode === 27 || event.charCode == 27)) {
        // ESC
        event.preventDefault();

        console.log('event: click (give up layout)');

        this.layoutCreator.giveUpLayout();
        this.contextualMenu.cleanupTooltip();
      }
    });

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

        this.layoutCreator.giveUpLayout();
        this.contextualMenu.cleanupTooltip();

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

        const dblClickLocation: EventLocation = {x: event.pageX,
                                                 y: event.pageY};

        this.chooseCurrentEntity(dblClickLocation)
        if (this.isCurrentEntitySet()) {
          this.contextualMenu.showContextMenu(this._currentEntity!);
          this.layoutCreator.changeLayout('GridLayout')
        } else {
          console.log('no current entity was found')
        }

        // if (this.chooseCurrentEntity(dblClickLocation)) {
        //   this.contextualMenu.showContextMenu(this._currentEntity);
        //   this.layoutCreator.changeLayout('GridLayout')
        // } else {
        //   console.log('no current entity was found')
        // }

        // unSelectIcon();
        //
        // let iconName = grid_layout;
        // if (condition === study2) {
        //   iconName = previousLayout;
        // }

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

    // const orientaionCircleDiv = document.createElement("div");
    // orientaionCircleDiv.setAttribute('id', 'orientation_circles');
    // orientaionCircleDiv.setAttribute('class', hideClass);
    // document.body.appendChild(orientaionCircleDiv);

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
    if (this.currentEntity) {
      return true;
    } else {
      return false;
    }
  }


  /**
  * Goes through each element tagged as entity and that has data, and creates a wsv and puts it into an array.
  **/
  private createWSVList(): void {

    const tmpWSVList: Array<WordScaleVisualization> = [];

    document.querySelectorAll(wsvInteractionConstants.entitySpanClass).forEach(anElement => {

      // get data for the entity
      let anHTMLElement = anElement as HTMLElement;

      let entityName = this.getEntityName(anHTMLElement);
      let dataForEntity = this.dataForWSV[entityName]

      if (!((typeof dataForEntity == 'undefined') || (dataForEntity.length == 0))) {
        if (anHTMLElement.dataset.wsvRenderer) {
          let aWSV = new WordScaleVisualization(anHTMLElement, dataForEntity, anHTMLElement.dataset.wsvRenderer, this, false);

          tmpWSVList.push(aWSV);
        } else {
          console.log('ERROR: wsv has no renderer assigned through data attribute data-wsv-renderer')
        }
      }
    });

    this.listOfWSVs = tmpWSVList;
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
    const docDiv = document.getElementById('document');

    if (docDiv !== null) {
      const whatData = docDiv.dataset.wsvType
      const aTextTitle = this.nameOfTextFile;

      if (whatData == 'historianData') {
        return historianData[aTextTitle];
      } else if (whatData == 'stockData') {
        return stockData[aTextTitle];
      }
    } else {
      alert('There is no div element with id "document"');
      return null;
    }
  }


  // from here http://stackoverflow.com/questions/880512/prevent-text-selection-after-double-click
  clearSelection() {
    if (document.getSelection() && document.getSelection().empty) {
      document.getSelection().empty();
    } else if (window.getSelection) {
      let sel = window.getSelection();

      if (sel) {
        sel.removeAllRanges();
      }
    }
  }


  chooseCurrentEntity(anEventLocation: EventLocation) {
    let aCurrentEntity = this.currentEntity;

    // All possible falsy values in ECMA-/Javascript: null, undefined, NaN, empty string (""), 0, false.
    if (!aCurrentEntity) {
      const choosenEntity: Entity | null = this.getClosestEntityAsCurrentEntity(anEventLocation)
      if (choosenEntity) {
        choosenEntity.setAsCurrentEntity();
      } else {
        alert('an entity needs to be visible to gather charts using double clicking!!');
      }
    } else {
      console.log('ERROR: a currentEntity has already been choose');
    }
  }


  // get the closest entity to the dbclicked location
  getClosestEntityAsCurrentEntity(anEventLocation: EventLocation): Entity | null {

    let closestVisibleEntity: Entity | null = null;
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

    return closestVisibleEntity;
  }


  /**
  * Gets the shortest distance between a point and the closest poinnt on the bbox of the wsv
  * @param  {[type]} point  [description]
  * @param  {[type]} entity [description]
  * @return {number}        shortest ditance between the corner closest to the point and the point
  */
  getDistancePointClosestWSVCorner(point: EventLocation, entity: Entity): number {
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


  getViewportInfo(): BBox {

    const viewPortDimension = document.body.getBoundingClientRect();

    return viewPortDimension;
  }


}


export default Text
