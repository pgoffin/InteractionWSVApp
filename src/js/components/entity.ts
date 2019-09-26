import Text from './text';


interface Entity {
  _entityName: string;

  _entityElement: HTMLElement;
}



class Entity implements Entity {

  _entityName: string = ''

  _entityElement: HTMLElement = null;

  _refToText: Text;


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

    this.addEventsToEntity()
  }


  addEventsToEntity() {

    this.entityElement.addEventListener('mouseenter', e => {
      console.log('mouseenter');

      let element = e.currentTarget as HTMLElement;
      if ((this._refToText.isLayoutVisible && element.classList.contains('currentEntity')) || !this._refToText.isLayoutVisible) {
        if (this._refToText.currentEntity !== element) {
              this._refToText._theContextualMenu.showContextMenu(element);
                this._refToText.currentEntity = element
            }
      }
    });


    this.entityElement.addEventListener('mouseleave', e => {
      console.log('mouseleave');
        this._refToText._theContextualMenu.startMenuHideTimer();
    });
  }
}

export default Entity;
