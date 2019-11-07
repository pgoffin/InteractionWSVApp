import { WsvDataObject, EventLocation, BBox } from '../../../global';
import { wsvInteractionConstants } from '../constants';

import ConcreteLayoutCreator from './concreteLayoutCreator';
import ContextualMenu from './contextualMenu';
import Entity from './entity';
import LayoutCreator from './layoutCreator';
import WordScaleVisualization from './wordScaleVisualization';

const historianData = require('../../data/otherDataset')
const stockData = require('../../data/wsvDataFile')


interface Text {
  _nameOfTextFile: string | null;
  _isLayoutVisible: Boolean;
  _currentWSV: WordScaleVisualization | null;
  _currentEntity: Entity | null;
  _listOfWSVs: Array<WordScaleVisualization>;
  _dataForWSV: WsvDataObject;
  _contextualMenu: ContextualMenu;
  _layoutCreator: LayoutCreator;
}



class Text implements Text {

  constructor() {
    console.log('initializing some text')

    this.nameOfTextFile = this.getTextFileName();
    this.isLayoutVisible = false;

    // TODO Can this be done better?
    const theData = this.getDatasetUsingDocumentTag()
    if (theData) {
      this.dataForWSV = theData;

      this.createWSVList();

      this.layoutCreator = new ConcreteLayoutCreator(this)

      this.contextualMenu = new ContextualMenu(this);

      this.addEventsToDocument();
      // Text.addSuggestedInteractivityTags();
      this.addBackgroundDiv();
    } else {
      console.log('ERROR: check why there is no dataset for this text');
    }
  }


  // getter/setter
  set nameOfTextFile(value: string | null) {
      this._nameOfTextFile = value;
  }
  get nameOfTextFile(): string | null {
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


  addEventsToDocument(): void {

    document.addEventListener('keydown', event => {
      if (this._isLayoutVisible && (event.keyCode === 27 || event.charCode == 27)) {
        // ESC
        event.preventDefault();

        console.log('event: click (give up layout)');

        this.layoutCreator.giveUpLayout();
        this.contextualMenu.cleanupContextualMenu();
      }
    });


    document.addEventListener('dblclick', event => {
      Text.clearSelection();

      if (this._isLayoutVisible) {

        console.log('event: click (give up layout)');

        this.layoutCreator.giveUpLayout();
        this.contextualMenu.cleanupContextualMenu();

      } else {
        // summon grid layout when dblclicking somewhere on the canvas
        console.log("event: dblclick (create layout)");

        const dblClickLocation: EventLocation = {x: event.pageX,
                                                 y: event.pageY};

        this.chooseCurrentEntity(dblClickLocation)

        if (this.isCurrentEntitySet()) {
          this.contextualMenu.showContextMenu(this._currentEntity!);
          this.layoutCreator.changeLayout(wsvInteractionConstants.defaultLayout, wsvInteractionConstants.defaultSorting)
        } else {
          console.log('no current entity was found')
        }
      }
    });
  }


  // static addSuggestedInteractivityTags(): void {
  //
  //   const hideClass = 'hide';
  //
  //   const restrictedDragBandDiv = document.createElement("div");
  //   restrictedDragBandDiv.setAttribute('id', 'restrictedDragBand');
  //   restrictedDragBandDiv.setAttribute('class', hideClass);
  //   document.body.appendChild(restrictedDragBandDiv);
  //
  //   const leftTriangleDiv = document.createElement("div");
  //   leftTriangleDiv.setAttribute('id', 'triangle_left');
  //   leftTriangleDiv.setAttribute('class', hideClass);
  //   document.body.appendChild(leftTriangleDiv);
  //
  //   const rightTriangleDiv = document.createElement("div");
  //   rightTriangleDiv.setAttribute('id', 'triangle_right');
  //   rightTriangleDiv.setAttribute('class', hideClass);
  //   document.body.appendChild(rightTriangleDiv);
  // }


  // check if currentEntity is set
  isCurrentEntitySet(): Boolean {
    if (this.currentEntity) {
      return true;
    } else {
      return false;
    }
  }


  sanitizeWSVspan(anElement: HTMLElement) {
    let sanitizedTextContent = anElement.innerHTML.trim()
    anElement.innerText = '';
    anElement.innerText = sanitizedTextContent;
  }


  /**
  * Goes through each element tagged as entity and that has data, and creates a wsv and puts it into an array.
  **/
  private createWSVList(): void {

    const tmpWSVList: Array<WordScaleVisualization> = [];

    document.querySelectorAll(wsvInteractionConstants.entitySpanClass).forEach(anElement => {

      // get data for the entity
      let anHTMLElement = anElement as HTMLElement;

      this.sanitizeWSVspan(anHTMLElement)

      let entityName = Text.getEntityName(anHTMLElement);
      let dataForEntity = this.dataForWSV[entityName]

      if (!((typeof dataForEntity == 'undefined') || (dataForEntity.length == 0))) {
        if (anHTMLElement.dataset.wsvRenderer) {
          let aWSV = new WordScaleVisualization(anHTMLElement, dataForEntity, anHTMLElement.dataset.wsvRenderer, this, false, false);

          tmpWSVList.push(aWSV);
        } else {
          console.log('ERROR: wsv has no renderer assigned through data attribute data-wsv-renderer')
        }
      } else {
        // no data for this entity -> keep tag but remove background color
        anHTMLElement.classList.add('nodataForWSV');
      }
    });

    this.listOfWSVs = tmpWSVList;
  }


  private static getEntityName(aHTMLElement: HTMLElement): string {
    return aHTMLElement.innerText.trim()
  }


  /**
  * Returns the file name of the text where spaces are substituted with underscores
  **/
  private getTextFileName(): string | null {
    const title = document.getElementById('articleTitle');
    if (title && title.textContent) {
      return title.textContent.trim().split(' ').join('_');
    } else {
      return null;
    }
  }


  private getDatasetUsingDocumentTag() {
    const docDiv = document.getElementById('document');

    if (docDiv) {
      const whatData = docDiv.dataset.wsvType
      const aTextTitle = this.nameOfTextFile;

      if (whatData == 'historianData' && aTextTitle) {
        return historianData[aTextTitle];
      } else if (whatData == 'stockData' && aTextTitle) {
        return stockData[aTextTitle];
      }
    } else {
      alert('There is no div element with id "document"');
      return null;
    }
  }


  // from here http://stackoverflow.com/questions/880512/prevent-text-selection-after-double-click
  static clearSelection() {
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
      if (aWSV._wsvBBox.top >= document.body.scrollTop && aWSV._wsvBBox.top < (document.body.scrollTop + window.innerHeight)) {
        // wsv is visible
        let distance = aWSV.getDistancePointClosestWSVCorner(anEventLocation);

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


  static getViewportInfo(): BBox {
    return document.body.getBoundingClientRect();
  }


  addBackgroundDiv() {
    const textDiv = document.getElementById('text');

    let backgroundLayerDiv = document.getElementById('backgroundLayer');
    if (!backgroundLayerDiv) {
      backgroundLayerDiv = document.createElement('div');
      backgroundLayerDiv.id = 'backgroundLayer';

      if (textDiv) textDiv.append(backgroundLayerDiv)
    }
  }


}


export default Text
