module.exports = {
  typeOfWSV: 'timeline',
  positionType: 'right',

  timelineSize: { width: 100,
                  height: 20},

  menuElement: { gridElement: '#grid',
                 closeElement: '#close',
                 orderByLastDataValueElement: '#order-by-lastDataValue',
                 orderByEntityNameElement: '#order-by-entityName',
                 orderByDocPositionElement: '#order-by-docPosition'
  },

  closeInteraction: 'close',
  closeType: 'close',

  menuIconUrls: { gridIconUrl: '',
                  closeIconUrl: './src/data/icons/close.svg'

  }
};
