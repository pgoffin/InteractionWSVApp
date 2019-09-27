module.exports = {
  entitySpanClass: '.entity',

  // typeOfWSV: 'timelineChart',
  typeOfWSV: 'stockLineChart',
  positionType: 'right',

  // time line chart constants
  timelineSize: { width: 100,
                  height: 20},

  // stock line chart constants
  numberOfMarks: 31,
  stockLineChartSize: { markWidth: 6,
                        heightWordScaleVis: 20},


  menuElement: { gridElement: '#grid',
                 closeElement: '#close',
                 orderByLastDataValueElement: '#order-by-lastDataValue',
                 orderByEntityNameElement: '#order-by-entityName',
                 orderByDocPositionElement: '#order-by-docPosition'},

  closeInteraction: 'close',
  closeType: 'close',

  menuIconUrls: { gridIconUrl: '',
                  closeIconUrl: './src/data/icons/close.svg'},

  defaultAllowedInteractions: ['sorting','dblclickOnWSVToGetBack','lineToWSVOrigin'],
}
