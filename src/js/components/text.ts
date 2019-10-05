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
        // this._theLayout.cleanupAfterLayout();
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

        let layoutChanged = this._theLayout.changeLayout('GridLayout', dblClickLocation)
        if (layoutChanged) {
          this._theContextualMenu.showContextMenu(this._currentEntity);
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

    document.querySelectorAll(constants.entitySpanClass).forEach((value) => {

      // get data for the entity
      let entityName = this.getEntityName(value);
      let dataForEntity = this.dataForWSV[entityName]

      if (!((typeof dataForEntity == 'undefined') || (dataForEntity.length == 0))) {
        let aWSV = new WordScaleVisualization(value, dataForEntity, value.dataset.wsvRenderer, this);

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



}


export default Text
