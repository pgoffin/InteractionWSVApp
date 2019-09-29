import Text from './text';


interface Entity {
  _entityName: string;

  _entityElement: HTMLElement;
}



class Entity implements Entity {

  _entityName: string;
  _entityElement: HTMLElement;
  _refToText: Text;
  _isSelected: Boolean
  _isCurrentEntity: Boolean


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



  constructor(anElement: HTMLElement, refToText: Text) {
    this.entityName = anElement.innerText;
    this.entityElement = anElement;
    this._refToText = refToText;
    this._isSelected = false;
    this._isCurrentEntity = false;

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
    // only the entity get class 'currentEntity'
    this.entityElement.classList.add('currentEntity');
    this.entityElement.setAttribute('z-index', '6');

    if (this.entityElement.classList.contains('selected')) {
      this.entityElement.classList.remove('selected');
    }

    this._refToText.currentEntity = this;

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
}

export default Entity
