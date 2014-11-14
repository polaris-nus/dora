doraServices.service('PaletteService', [
	function(){
		var palette = [
		{cssIndex: 0, color:'#B71B1B', inUse: false},
		{cssIndex: 1, color:'#FF7B11', inUse: false},
		{cssIndex: 2, color:'#FFDD49', inUse: false},
		{cssIndex: 3, color:'#B0E353', inUse: false},
		{cssIndex: 4, color:'#41B368', inUse: false},
		{cssIndex: 5, color:'#3D7C9B', inUse: false},
		{cssIndex: 6, color:'#4C55A9', inUse: false},
		{cssIndex: 7, color:'#6E46A6', inUse: false},
		{cssIndex: 8, color:'#B94395', inUse: false},
		{cssIndex: 9, color:'#E15273', inUse: false}
		]

		return {
			useNextColor: function() {
				for(index in palette) {
					if(!palette[index].inUse) {
						palette[index].inUse = true;
						var color = {
							featureColor: palette[index].color,
							buttonStyleIndex: palette[index].cssIndex
						};
						return color;
					}
				}
				return null; // all colors in use
			},
			releaseColor: function(color) {
				for(index in palette) {
					if(palette[index].color.localeCompare(color.featureColor) == 0) {
						palette[index].inUse = false;
						break;
					}
				}
			}
		}
	}
]);
