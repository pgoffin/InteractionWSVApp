import Text from './text';
import WordScaleVisualization from './wordScaleVisualization';

interface Entity {
  _entityName: string;

  _entityElement: HTMLElement;
}



class Entity implements Entity {

  _entityName: string;
  _entityElement: HTMLElement;
  _refToText: Text;
  _isSelected: Boolean;
  _isCurrentEntity: Boolean;

  _entityBbox;

  _entityBelongsToWsv;


  // getter/setter
  set entityName(value: string) {
      this._entityName = value;
  }
  get entityName(): string {
      return this._entityName;
  }

  set entityElement(value: HTMLElement) {
      this._entityElement = value;
  }
  get entityElement(): HTMLElement {
      return this._entityElement;
  }



  constructor(anElement: HTMLElement, refToText: Text, theWSV: WordScaleVisualization) {
    this.entityName = anElement.innerText;
    this.entityElement = anElement;
    this._refToText = refToText;
    this._isSelected = false;
    this._isCurrentEntity = false;

    this._entityBelongsToWsv = theWSV;

    this._entityBbox = this.getBBoxOfEntity();

    this.addEventsToEntity()
  }


  addEventsToEntity() {
    // instead of mouseover use mouseenter and mouseleave, see http://stackoverflow.com/questions/6274495/changing-opacity-with-jquery
    this.entityElement.addEventListener('mouseenter', () => {
      console.log('mouseenter');

      // let element = e.currentTarget as HTMLElement;
      if (!this._refToText.isLayoutVisible) {

      // if ((this._refToText.isLayoutVisible && element.classList.contains('currentEntity')) || !this._refToText.isLayoutVisible) {
      //
      //   if (this._refToText.currentEntity !== element) {
      //
        this._refToText._theContextualMenu.showContextMenu(this.entityElement);

        this.setAsCurrentEntity()
            // }
      }
    });


    this.entityElement.addEventListener('mouseleave', () => {
      console.log('mouseleave');
        this._refToText._theContextualMenu.startMenuHideTimer(this);
    });
  }

  setAsCurrentEntity() {
    // only the entity gets class 'currentEntity'
    this.entityElement.classList.add('currentEntity');
    this.entityElement.setAttribute('z-index', '6');

    if (this.entityElement.classList.contains('selected')) {
      this.entityElement.classList.remove('selected');
    }

    this._refToText.currentEntity = this;
    this._refToText.currentWSV = this._entityBelongsToWsv;

    this._isCurrentEntity = true;
  }

  unSetAsCurrentEntity() {
    this.entityElement.classList.remove('currentEntity')

    this._refToText.currentEntity = null;

    this._isCurrentEntity = false;
  }

  setAsSelected() {
    this.entityElement.classList.add('selected');

    this._isSelected = true
  }

  // measurements
  getBBoxOfEntity() {

    let theBbox = { left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 0,
                    height: 0};


    // adapt top and bottom to give values according to the document
    let bbox = this.entityElement.getBoundingClientRect();

    // let scrollingOffset = $(window).scrollTop();
    let scrollingOffset = document.body.scrollTop;

    theBbox.left = bbox.left;
    theBbox.top = bbox.top + scrollingOffset;
    theBbox.right = bbox.right;
    theBbox.bottom = bbox.bottom + scrollingOffset;
    theBbox.width = bbox.width;
    theBbox.height = bbox.height;

    return theBbox;
  }



}

export default Entity
