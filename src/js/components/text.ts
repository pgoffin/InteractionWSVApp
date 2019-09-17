import * as d3 from "d3";
import { contextualMenu } from './contextualMenu';
import { layout } from './layout'

// import historianData from "../../data/otherDataset"
const historianData = require("../../data/otherDataset")
const stockData = require("../../data/wsvDataFile")
const constants = require('../constants');

require('webpack-jquery-ui/widgets');
const renderers = require('../../lib/renderers');
require('../../lib/jquery.sparklificator');


class Text {

  _nameOfTextFile: string = "";

  // if there is a layout then flag should be true
  _isLayoutVisible: Boolean = false;

  _currentEntity: HTMLElement = null;



  initializeText() {
    console.log('initializing some text')

    this._nameOfTextFile = this.getTextFileName()

    // check if there is data for each entity if no data is available remove the entity tag
    this.removeEntitiesWithNoData();
    this.addWSV(constants.typeOfWSV);

    layout.initializeLayout();

    contextualMenu.initializeContextualMenu(this);

    this.addEventToEntities(contextualMenu);
  }

  get currentEntity(): HTMLElement {
    return this._currentEntity;
  }

  get isLayoutVisible() {
    return this._isLayoutVisible;
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




  /*
    remove the entity tag for tagged entities that do not have any data
   */
  private removeEntitiesWithNoData(): void {

    // const nameOfTextFile = this.getTextFileName();
    const classThis = this;

    $(constants.entitySpanClass).each(function(index, value) {
      // does entity have data available?

      let anEntity = classThis.getEntityFromDOMElement(value);
      // this.dataset.wsvType get the value from the span tag "data-wsv-type"
      let datasetType = classThis.getDataset(this.dataset.wsvType)

      if ((typeof datasetType == 'undefined') || ((typeof datasetType[classThis._nameOfTextFile][anEntity] == 'undefined') || (datasetType[classThis._nameOfTextFile][anEntity].length == 0))) {
        // console.log(anEntity)
        // no data available remove the entity tag
        $(value).contents().unwrap();
      }
    });
  }

  // add wsvs to the taggedd elements in the text
  private addWSV(aTypeOfWSV: string): void {

    const classThis = this;

    $(constants.entitySpanClass).each(function(index, value) {

      let anEntity = classThis.getEntityFromDOMElement(value);
      let datasetType = classThis.getDataset(this.dataset.wsvType);
      let entityData = datasetType[classThis._nameOfTextFile][anEntity]

      let settings;
      if (aTypeOfWSV === 'timelineChart') {

        const startPointDate = Date.parse('1 January 1850');
        // const endPointDate = Date.parse('1 January 1970');

        let dataObject = entityData;

        let startDate = Date.parse(dataObject.dates[0]);
        let endDate = Date.parse(dataObject.dates[1]);

        dataObject.numberOfDays = Math.round((endDate - startDate)/(1000*60*60*24))
        dataObject.startPoint = Math.round((startDate - startPointDate)/(1000*60*60*24))

        settings = {data: dataObject,
                    renderer: renderers.buildWikiChart,
                    position: constants.positionType,
                    paddingWidth: true,
                    paddingHeight: true,
                    width: constants.timelineSize.width,
                    height: constants.timelineSize.height };

      } else if (aTypeOfWSV === 'stockLineChart') {

        var theData;
        // anEntity = $.trim(d3.select(value).html())

        // var theDataset = eval(aDataset);
        if ((typeof entityData !== 'undefined') && (entityData.length !== 0)) {

          // sort the stockData array
          var transformedStockData = entityData.map(function(element) {
            return {close: element.changeToFirst, date: new Date(element.date)};
          });

          transformedStockData.sort(function(a, b) {
            return a.date - b.date;
          });

          // sorted data, ascending
          theData = [{id: 0, values: transformedStockData}];
        }


        settings = {data: theData,
                    renderer: renderers.stockPriceSparkline,
                    // renderer: classicSparkline,
                    position: constants.positionType,
                    paddingWidth: true,
                    paddingHeight: true,
                    width: (constants.stockLineChartSize.markWidth * constants.numberOfMarks),
                    height: constants.stockLineChartSize.heightWordScaleVis };
      }

      $(value).sparklificator();
      $(value).sparklificator('option', settings);
    });
  }


  private addEventToEntities(aContextualMenu: ContextualMenu) {

    // instead of mouseover use mouseenter and mouseleave, see http://stackoverflow.com/questions/6274495/changing-opacity-with-jquery
    $(constants.entitySpanClass).mouseenter((event) => {
      console.log('mouseenter');

      if ((this.isLayoutVisible && $(event.currentTarget).hasClass('currentEntity')) || !this.isLayoutVisible) {

        if (this.currentEntity !== event.currentTarget) {
          aContextualMenu.showContextMenu(event.currentTarget);
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
