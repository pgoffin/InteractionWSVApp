interface Entity {
  _entityName: string;

  _entityElement: HTMLElement;
}



class Entity implements Entity {

  _entityName: string = ''

  _entityElement: HTMLElement = null;


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



  constructor(anElement: HTMLElement) {
    this.entityName = anElement.innerText;

    this.entityElement = anElement;
  }
}

export default Entity;
