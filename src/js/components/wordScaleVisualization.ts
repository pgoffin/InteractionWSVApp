import { BBox, EventLocation, RawWsvData, RenderFunc, WsvDataObject, WsVisualizationType } from "../../../global";
import Entity from './entity';
import wsvRendererFactoryClass from './wsvRendererFactoryClass';
import Text from './text';

import { wsvInteractionConstants } from '../constants';

import * as d3 from "d3";

// to run sparklificator
require('webpack-jquery-ui/widgets');
const renderers = require('../../lib/renderers');
require('../../lib/jquery.sparklificator');


interface WordScaleVisualization {
  _entity: Entity;
  _rawWSVData: Array<RawWsvData>;
  _typeOfWSV: string;
  _renderer: RenderFunc;
}



class WordScaleVisualization implements WordScaleVisualization {

  _entity: Entity;
  _rawWSVData: Array<RawWsvData> ;

  _typeOfWSV: string;
  _positionOfWSV: string;

  _renderer: RenderFunc;

  // _transformedData: WsvDataObject;

  _rendererAsClass: string;
  _rendererString: string;

  _visualization: HTMLElement | null;
  _wsvVisualizationBBox: BBox;

  _wsv: HTMLElement;
  _wsvBBox: BBox;

  _wsvClass: WsVisualizationType;

  _refToText: Text;

  _aboveOrBelow: string;
  _middleBoundOffset: number;
  _offsetWhiteLayer: number;
  _distanceToCurrEntity: number;

  _backgroundElement: HTMLElement;
  _clonedWSV: WordScaleVisualization | null;
  _originalWSV: WordScaleVisualization | null;

  _isAClone: Boolean;



  constructor(anElement: HTMLElement, data: Array<RawWsvData>, theRenderer: string, referenceToText: Text, aIsAClone: Boolean) {
    this._refToText = referenceToText;
    this._positionOfWSV = wsvInteractionConstants.positionType;
    this.entity = new Entity(anElement, this._refToText, this, aIsAClone);

    this.rawWSVData = data;

    this._isAClone = false;

    this.renderer = renderers[theRenderer];
    this._rendererString = theRenderer;
    this._rendererAsClass = theRenderer.charAt(0).toUpperCase() + theRenderer.slice(1);

    this.wsvClass = wsvRendererFactoryClass(this._rendererAsClass, this.renderer, this.rawWSVData, this._positionOfWSV, true, true)

    $(this.entity.entityElement).sparklificator();
    $(this.entity.entityElement).sparklificator('option', this.wsvClass._settings);

    this._wsv = this.entity.entityElement.parentElement;

    if (this._wsv) {
      this._visualization = this._wsv.querySelector('span.sparkline');
    }

    this.typeOfWSV = wsvInteractionConstants.typeOfWSV;

    // bboxes
    this.setBBoxOfSparkline();
    this.setBBoxOfWSV();
  }


  // getter/setter
  set entity(value: Entity) {
      this._entity = value;
  }
  get entity(): Entity {
      return this._entity;
  }

  set rawWSVData(value: Array<RawWsvData>) {
      this._rawWSVData = value;
  }
  get rawWSVData(): Array<RawWsvData> {
      return this._rawWSVData;
  }

  set typeOfWSV(value: string) {
      this._typeOfWSV = value;
  }
  get typeOfWSV(): string {
      return this._typeOfWSV;
  }

  set renderer(value: RenderFunc) {
      this._renderer = value;
  }
  get renderer(): RenderFunc {
      return this._renderer;
  }

  set wsvClass(value: WsVisualizationType) {
      this._wsvClass = value;
  }
  get wsvClass(): WsVisualizationType {
      return this._wsvClass;
  }


  setBBoxOfWSV() {
    let theBbox = {left: 0,
                   top: 0,
                   right: 0,
                   bottom: 0,
                   width: 0,
                   height: 0};

    // adapt top and bottom to give values according to the document
    let bboxWSV
    if (this._wsv) {
      bboxWSV = this._wsv.getBoundingClientRect();
    }

    let scrollingOffset = document.body.scrollTop;

    let bboxEntity = this.entity._entityBbox;

    this.setBBoxOfSparkline();

    if (this._positionOfWSV === 'right') {
      // theBbox.left = bboxEntity.left;
      theBbox.left = bboxWSV.left;
      theBbox.top = bboxWSV.top + scrollingOffset;
      // theBbox.right = bboxSparkline.right;
      theBbox.right =  this._wsvVisualizationBBox.right;
      theBbox.bottom = bboxWSV.bottom + scrollingOffset;
      // theBbox.width = bboxSparkline.right - bboxEntity.left;
      theBbox.width = this._wsvVisualizationBBox.right - bboxEntity.left;
      theBbox.height = bboxWSV.height;

    } else {
      console.log('position type not implemented');
    }

    this._wsvBBox = theBbox
  }


  setBBoxOfSparkline() {
    let theBbox = { left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 0,
                    height: 0};

    // adapt top and bottom to give values according to the document
    let bbox = this._visualization.getBoundingClientRect();

    let scrollingOffset = document.body.scrollTop;

    theBbox.left = bbox.left;
    theBbox.top = bbox.top + scrollingOffset;
    theBbox.right = bbox.right;
    theBbox.bottom = bbox.bottom + scrollingOffset;
    theBbox.width = bbox.width;
    theBbox.height = bbox.height;

    this._wsvVisualizationBBox = theBbox;
  }


  cloneWSV(): WordScaleVisualization {

    let cloneEntityElement = this.entity.entityElement.cloneNode(true)
    let insertedClonedEntityNode = this._wsv.parentNode.insertBefore(cloneEntityElement, this._wsv.nextSibling)

    let clonedWSV = new WordScaleVisualization(insertedClonedEntityNode as HTMLElement, this._rawWSVData, this._rendererString, this._refToText, true);

    // set reference to cloned and original WSV
    this._clonedWSV = clonedWSV;
    clonedWSV._originalWSV = this;

    this._wsv.classList.add('hasClone');

    clonedWSV._isAClone = true;

    // clonedWSV.entity.entityElement.classList.add('cloned');
    // clonedWSV._wsv.classList.add('cloned');
    // clonedWSV._visualization.classList.add('cloned');
    clonedWSV.addClassToWSV('cloned')

    clonedWSV.addEventsToWSV();

    return clonedWSV;
  }


  removeClone() {
    if (this._isAClone) {
      this._wsv.remove();
      this._originalWSV._clonedWSV = null;
    }
  }


  addEventsToWSV() {

    if (this._isAClone) {
      this._wsv.addEventListener('dblclick', event => {
        console.log('dblclick on cloned wsv');

        // so dblclick in $(html) is not triggered
        event.stopPropagation();

        const animationSequence = [];

        this.drawConnectionLineTo(this._originalWSV);

        // let toBeColoredBefore;
        // let toBeColoredAfter;
        // // select the sentence parts to be colored
        // if (theEntity.parent().prev().text().slice(-1) === '.') {
        //   toBeColoredAfter = $(theEntity).parent().next().next();
        // } else {
        //   toBeColoredBefore = $(theEntity).parent().prev();
        //   toBeColoredAfter = $(theEntity).parent().next().next();
        // }

        // calculating offset depending on the distance between bottom of wsv and bottom of document
        let topWSVToWindowTop = window.innerHeight/2.0;
        let topWSVToBottomDoc = document.body.scrollHeight - this._originalWSV._wsvBBox.top + window.pageYOffset;
        if ((topWSVToBottomDoc - this._originalWSV._wsvBBox.height) < window.innerHeight/2.0) {
          topWSVToWindowTop = (this._originalWSV._wsvBBox.top + window.pageYOffset) - document.body.scrollHeight + window.innerHeight;
        }
        topWSVToWindowTop = -topWSVToWindowTop;

        // give up the layout, but exclude the dbclicked clones wsv
        const aLayoutCreator = this._refToText._layoutCreator
        aLayoutCreator._wsvsThatHaveAClone = aLayoutCreator._wsvsThatHaveAClone.filter(aWSV => aWSV !== this._originalWSV);
        aLayoutCreator.giveUpLayout();
        this._refToText.contextualMenu.cleanupContextualMenu();


        animationSequence.push({e: this._originalWSV._wsv,
                                p: "scroll",
                                o: {duration: 3500,
                                    offset: topWSVToWindowTop,
                                    easing: [ .45, 0, .45, 1 ]}
                                });

        // disappearing white background
        animationSequence.push({e: this._backgroundElement,
                                p: {opacity: 0},
                                o: {display: "none",
                                    sequenceQueue: false,
                                    duration: 1500}
                              });

        animationSequence.push({e: this._wsv,
                                p: {left: this._originalWSV._wsv.offsetLeft, top: this._originalWSV._wsv.offsetTop},
                                o: {duration: 3500,
                                    sequenceQueue: false,
                                    easing: [ .45, 0, .45, 1 ],
                                    complete: (clonedWSV: [HTMLElement]) => {
                                      console.log('animation over');
                                      clonedWSV[0].remove();
                                      this._originalWSV._clonedWSV = null;

                                      this.removeConnectionTrail();

                                      // // color the sentence parts
                                      // if (typeof toBeColoredBefore !== 'undefined') {
                                      //   toBeColoredBefore.css('background-color','#FFE0EB');
                                      //   toBeColoredBefore.css('color','#000000');
                                      // }
                                      //
                                      // if (typeof toBeColoredAfter !== 'undefined') {
                                      //   toBeColoredAfter.css('background-color','#FFE0EB');
                                      //   toBeColoredAfter.css('color','#000000');
                                      // }

                                      // remove white background
                                      this._backgroundElement.remove();
                                    }
                                }
                              });

        $.Velocity.RunSequence(animationSequence);
      });
    }
  }


  addClassToWSV(aClass: string): void {
    this._wsv.classList.add(aClass);

    const childrenOfClonedWSV = this._wsv.children;
    for (let i = 0; i < childrenOfClonedWSV.length; i++) {
      childrenOfClonedWSV[i].classList.add(aClass);
    }
  }


  removeClassOffWSV(aClass: string): void {
    this._wsv.classList.remove(aClass);

    const childrenOfClonedWSV = this._wsv.children;
    for (let i = 0; i < childrenOfClonedWSV.length; i++) {
      childrenOfClonedWSV[i].classList.remove(aClass)
    }
  }


  drawConnectionLineTo(target: WordScaleVisualization) {
    let svgContainer;

    // added the svg to the root body and not the text div, will make calculation easier
    if (d3.select('#bodyOverlay').empty()) {
      const height = Number(d3.select('body').style('height').slice(0, -2))
      const width = Number(d3.select('body').style('width').slice(0, -2))

      svgContainer = d3.select('body').insert('svg', ':first-child')
                                      .attr('width', width)
                                      .attr('height', height)
                                      .attr('id', 'bodyOverlay');
    } else {
      svgContainer = d3.select('#bodyOverlay');
    }

    const bboxText = $('#text').offset();
    const bboxBody = $('body').offset();

    const sourceElementBBox: BBox = this._wsvBBox;
    const targetElementBBox: BBox = target._wsvBBox;


    const xSource = sourceElementBBox.left + (sourceElementBBox.width/2.0) - bboxBody.left;
    const ySource = sourceElementBBox.top + (sourceElementBBox.height/2.0) - bboxBody.top;

    const xTarget = targetElementBBox.left + (targetElementBBox.width/2.0) - bboxBody.left;
    const yTarget = targetElementBBox.top + (targetElementBBox.height/2.0) - bboxText.top;

    // based on this http://stackoverflow.com/questions/15007877/how-to-use-the-d3-diagonal-function-to-draw-curved-lines
    const s = {x: xSource, y: ySource};
    const t = {x: xTarget, y: yTarget};


    const lineEndpoints = [s, t];

    const connectionLine = d3.line()
                             .x(function(d) { return d.x; })
                             .y(function(d) { return d.y; });

    // svgContainer.append('path')
    //             .attr('d', line(lineEndpoints))
    //             .attr('class', 'hoveringTrail');

    let theLine = svgContainer.selectAll('connectionTrail')
                              .data([lineEndpoints]);

    theLine.attr('d', connectionLine(lineEndpoints));

    theLine.enter().append('path')
                   .attr('class', 'connectionTrail')
                   .attr('d', function(d) {return connectionLine(d)})

    theLine.exit().remove();
  }


  removeConnectionTrail() {
    d3.select('.connectionTrail').remove();
  }


  /**
  * Gets the shortest distance between a point and the closest point on the bbox of the wsv
  */
  getDistancePointClosestWSVCorner(point: EventLocation): number {
    // entities are DOM elements
    const wsvBBox = this._wsvBBox;

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
      const distanceToSegmentTop = Math.abs(point.y - wsvBBox.top);
      const distanceToSegmentBottom = Math.abs(point.y - (wsvBBox.top + wsvBBox.height));

      const distanceToSegmentTop_squared = distanceToSegmentTop * distanceToSegmentTop;
      if (distanceToSegmentTop_squared < squaredDistance) {
        squaredDistance = distanceToSegmentTop_squared;
      }

      const distanceToSegmentBottom_squared = distanceToSegmentBottom * distanceToSegmentBottom;
      if (distanceToSegmentBottom_squared < squaredDistance) {
        squaredDistance = distanceToSegmentBottom_squared;
      }

    } else if (point.y > wsvBBox.top && point.y < wsvBBox.top + wsvBBox.height) {
      const distanceToSegmentLeft = Math.abs(point.x - wsvBBox.left);
      const distanceToSegmentRight = Math.abs(point.x - (wsvBBox.left + wsvBBox.width));

      const distanceToSegmentLeft_squared = distanceToSegmentLeft * distanceToSegmentLeft;
      if (distanceToSegmentLeft_squared < squaredDistance) {
        squaredDistance = distanceToSegmentLeft_squared;
      }

      const distanceToSegmentRight_squared = distanceToSegmentRight * distanceToSegmentRight;
      if (distanceToSegmentRight_squared < squaredDistance) {
        squaredDistance = distanceToSegmentRight_squared;
      }
    }

    return squaredDistance;
  }




}

export default WordScaleVisualization
