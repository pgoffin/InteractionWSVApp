export const wsvInteractionConstants = {
  entitySpanClass: '.entity',

  // typeOfWSV: 'timelineChart',
  typeOfWSV: 'stockLineChart',
  positionType: 'right',

  // Layout
  defaultLayout: 'GridLayout',

  // sorting
  defaultSorting: 'DocumentPositionSort',



  // time line chart constants
  timelineSize: { width: 100,
                  height: 20},

  // stock line chart constants
  numberOfMarks: 31,
  stockLineChartSize: { markWidth: 6,
                        heightWordScaleVis: 20},


  menuElement: { gridElement: '#grid',
                 columnElement: '#column',
                 closeElement: '#close',
                 columnPanAlignedElement: '#column-pan-aligned',
                 gridNoOverlapElement: '#grid-no-overlap',
                 rowElement: '#row',
                 orderByLastDataValueElement: '#order-by-lastDataValue',
                 orderByEntityNameElement: '#order-by-entityName',
                 orderByDocPositionElement: '#order-by-docPosition',
                 selector: '#selector'},

  closeInteraction: 'close',
  closeType: 'close',

  menuIconUrls: { gridIconUrl: '',
                  closeIconUrl: './src/data/icons/close.svg'},

  defaultAllowedInteractions: ['sorting','dblclickOnWSVToGetBack','lineToWSVOrigin'],
}
