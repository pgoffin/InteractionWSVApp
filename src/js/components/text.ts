import * as d3 from "d3";
import { contextualMenu } from './contextualMenu';
import { layout } from './layout'
import { wsvDataObject } from "../../../global";

import WordScaleVisualization from "./wordScaleVisualization";

// import historianData from "../../data/otherDataset"
const historianData = require("../../data/otherDataset")
const stockData = require("../../data/wsvDataFile")
const constants = require('../constants');

// to run sparklificator
require('webpack-jquery-ui/widgets');
const renderers = require('../../lib/renderers');
require('../../lib/jquery.sparklificator');



interface Text {
  _nameOfTextFile: string;
  _isLayoutVisible: Boolean;
  _currentWSV: WordScaleVisualization;
  _listOfWSVs: Array<WordScaleVisualization>;
  _dataForWSV: wsvDataObject;
  _currentEntity: HTMLElement;
}


class Text implements Text {

  _nameOfTextFile: string = "";

  // if there is a layout then flag should be true
  _isLayoutVisible: Boolean = false;

  _currentWSV: WordScaleVisualization = null;

  _listOfWSVs: Array<WordScaleVisualization> = [];

  _dataForWSV: wsvDataObject = {};

  _currentEntity: HTMLElement;


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

  get currentEntity(): HTMLElement {
      return this._currentEntity;
  }


  initializeText() {
    console.log('initializing some text')

    this.nameOfTextFile = this.getTextFileName();

    // TODO Can this be done better?
    this.dataForWSV = this.getDatasetUsingDocumentTag();

    this.createWSVList();

    // check if there is data for each entity if no data is available remove the entity tag
    // this.setEntitiesWithNoDataToClass('noClass');
    // this.addWSV(constants.typeOfWSV);

    layout.initializeLayout();

    contextualMenu.initializeContextualMenu(this);

    this.addEventToEntities(contextualMenu);
  }



  set currentEntity(anEntity: HTMLElement) {
    if (this.isCurrentEntitySet()) {
      $(this._currentEntity).removeClass('currentEntity');
    }

    this._currentEntity = anEntity;
    $(this._currentEntity).addClass('currentEntity');
    $(this._currentEntity).next('.sparkline').addClass('currentEntity');
    $(this._currentEntity).css('z-index', 6);

    if ($(this._currentEntity).hasClass('selected')) {
      $(this._currentEntity).removeClass('selected');
    }
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
  * Goes through each element tagged as entity, and creates a wsv and puts it into an array.
  **/
  private createWSVList(): void {

    document.querySelectorAll(constants.entitySpanClass).forEach((value) => {

      let aWSV = new WordScaleVisualization(value, this.dataForWSV, value.dataset.wsvRenderer);

      this.listOfWSVs.push(aWSV);
    });

  }


  // /**
  // * Adds a noData class to the entity tag for text tagged as entities but do not have any available data.
  // **/
  // private setEntitiesWithNoDataToClass(setToClass: string): void {
  //
  //   // const wsvDataForDocument: wsvDataObject = this.dataForWSV;
  //
  //   this.listOfWSVs.forEach((aWSV) => {
  //     if ((typeof aWSV.wsvData == 'undefined') || (Object.getOwnPropertyNames(aWSV.wsvData).length === 0)) {
  //       // no data available instead of removing the entity tag add
  //       // $(value).contents().unwrap();
  //       aWSV.entity.entityElement.classList.toggle(setToClass);
  //     }
  //   });
  //
  //   // document.querySelectorAll(constants.entitySpanClass).forEach((value) => {
  //   // // $(constants.entitySpanClass).forEach((value) => {
  //   //   // does entity have data available?
  //   //
  //   //   const anEntityName: string = this.getEntityFromDOMElement(value);
  //   //
  //   //   if ((typeof wsvDataForDocument == 'undefined') || ((typeof wsvDataForDocument[anEntityName] == 'undefined') || (wsvDataForDocument[anEntityName].length == 0))) {
  //   //     // no data available instead of removing the entity tag add
  //   //     // $(value).contents().unwrap();
  //   //     value.classList.toggle('noData');
  //   //   }
  //   // });
  // }


  // // add wsvs to the taggedd elements in the text
  // private addWSV(aTypeOfWSV: string): void {
  //
  //   let settings;
  //   this.listOfWSVs.forEach((aWSV) => {
  //     if (aWSV.typeOfWSV === 'stockLineChart' && aWSV.hasData) {
  //
  //       // sort the stockData array
  //       let transformedStockData = aWSV.wsvData.map((element) => {
  //         return {close: element.changeToFirst, date: new Date(element.date)};
  //       });
  //
  //       transformedStockData.sort(function(a: Object, b: Object) {
  //         return a.date - b.date;
  //       });
  //
  //       // sorted data, ascending
  //       let dataObject = [{id: 0, values: transformedStockData}];
  //
  //       settings = {data: dataObject,
  //                   renderer: renderers.stockPriceSparkline,
  //                   position: constants.positionType,
  //                   paddingWidth: true,
  //                   paddingHeight: true,
  //                   width: (constants.stockLineChartSize.markWidth * constants.numberOfMarks),
  //                   height: constants.stockLineChartSize.heightWordScaleVis };
  //     } else if (aTypeOfWSV === 'timelineChart') {
  //
  //     } else if (aTypeOfWSV === 'eyetrackingChart') {
  //
  //     }
  //   });
  //
  //
  //   $(constants.entitySpanClass).each(function(index, value) {
  //
  //     let anEntity = classThis.getEntityFromDOMElement(value);
  //     let datasetType = classThis.getDataset(this.dataset.wsvType);
  //     let entityData = datasetType[classThis._nameOfTextFile][anEntity]
  //
  //     let settings;
  //     if (aTypeOfWSV === 'timelineChart') {
  //
  //       const startPointDate = Date.parse('1 January 1850');
  //       // const endPointDate = Date.parse('1 January 1970');
  //
  //       let dataObject = entityData;
  //
  //       let startDate = Date.parse(dataObject.dates[0]);
  //       let endDate = Date.parse(dataObject.dates[1]);
  //
  //       dataObject.numberOfDays = Math.round((endDate - startDate)/(1000*60*60*24))
  //       dataObject.startPoint = Math.round((startDate - startPointDate)/(1000*60*60*24))
  //
  //       settings = {data: dataObject,
  //                   renderer: renderers.buildWikiChart,
  //                   position: constants.positionType,
  //                   paddingWidth: true,
  //                   paddingHeight: true,
  //                   width: constants.timelineSize.width,
  //                   height: constants.timelineSize.height };
  //
  //     }
  //   });
  // }


  private addEventToEntities(aContextualMenu: ContextualMenu) {

    // instead of mouseover use mouseenter and mouseleave, see http://stackoverflow.com/questions/6274495/changing-opacity-with-jquery
    $(constants.entitySpanClass).mouseenter((event) => {
      console.log('mouseenter');

      if ((this.isLayoutVisible && $(event.currentTarget).hasClass('currentEntity')) || !this.isLayoutVisible) {

        if (this.currentEntity !== event.currentTarget) {
          aContextualMenu.showContextMenu(event.currentTarget);
          this.currentEntity = event.currentTarget
        }

        // tmpCurrentEntity = this;
        this.currentEntity = event.currentTarget;
      }
    });

    $(constants.entitySpanClass).mouseleave(function() {
      console.log('mouseleave');
      aContextualMenu.startMenuHideTimer();
    });
  }


  /**
  * Returns the file name of the text where spaces are substituted with underscores
  * @returns {string}
  **/
  private getTextFileName(): string {
    return $.trim($('h2').text()).split(' ').join('_');
  }


  /**
  * Returns the dataset corresponding to the wsv type
  * @param {string} aWSVType - the DOM element
  * @returns {object}
  **/
  private getDataset(aWSVType: string): any {
    if (aWSVType == 'historianData') {
      return historianData;
    } else if (aWSVType == 'stockData') {
      return stockData;
    }
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


  /**
  * Get the entity from a DOM element
  * @param {HTMLElement} aDOMElement - the DOM element
  * @returns {string}
  **/
  private getEntityFromDOMElement(aDOMElement: HTMLElement): string {
    return $.trim(d3.select(aDOMElement).html());
  }

}


export let text = new Text()
