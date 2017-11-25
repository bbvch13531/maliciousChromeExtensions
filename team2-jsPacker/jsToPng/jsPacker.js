
var PNGUtil = {
  CRCTable: ( function () {
  
    var i, ii, c, table = [];
  
    for ( i = 0; i < 256; i ++ ) {
  
      c = i;
  
      for ( ii = 0; ii < 8; ii ++ ) {
  
        if ( c & 1 ) { c = 0xedb88320 ^ ( c >>> 1 ); }
        else { c = c >>> 1; }
  
      }
  
      table[ i ] = c;
    }
    
    return table;
  
  } )(),
  
  generateCRC: function( typeArray, dataArray ) {
    
    var i, l, array = [], crc = 0xffffffff, checksum;
  
    array.concat( typeArray, dataArray );
    
    for ( i = 0, l = array.length; i < l; i ++ ) {
  
      crc = PNGUtil.CRCTable[ ( crc ^ array[ i ] ) & 0xff ] ^ ( crc >>> 8 ); 
  
    }
  
    checksum = crc ^ 0xffffffff;
    return [
      ( checksum >>> 24 ) & 0xFF,
      ( checksum >>> 16 ) & 0xFF,
      ( checksum >>> 8  ) & 0xFF,
      checksum & 0xFF
    ]
  
  },
  
  generateChunk: function( type, data ) {
  
    // https://gist.github.com/jbrantly/499486 参考
  
    var i = l = 0;
    var chunk = {
  
      length: [
        ( data.length >>> 24 ) & 0xFF,
        ( data.length >>> 16 ) & 0xFF,
        ( data.length >>>  8 ) & 0xFF,
        data.length & 0xFF
      ],
    
      type: [ type[ 0 ], type[ 1 ], type[ 2 ], type[ 3 ] ],
    
      data: ( function () {
    
        var i = 0, l = data.length, array = [];
        for ( ; i < l; i ++ ) { array.push( data[ i ] ); }
        return array;
    
      } )(),
  
      crc: null
  
    }
  
    // type と data から CRC を作る
    chunk.crc = PNGUtil.generateCRC( chunk.type, chunk.data );
    return chunk;
  
  }
};
// 'use strict';
// アスキーコードは128文字
// 255色(8ビット)に収まる
// canvas要素のwidth規定値は300, height規定値は150
// chunkは |length(4byte)|type(4byte)|data|crc(4byte)| の順で構成されている
// 最初の8バイトはPNGシグネチャ, 次の25バイトはIHDRで固定されている
var convert = function ( jscode ) {
  var i, l;
  var input   = String.fromCharCode( 0x20 ) + jscode;
  var $canvas = document.createElement( 'canvas' );
  var ctx     = $canvas.getContext( '2d' );
  var pixels  = input.length;
  var width   = Math.ceil( Math.sqrt( input.length ) );
  var height  = Math.floor( Math.sqrt( input.length ) );
  var imagedata;
  $canvas.width  = width;
  $canvas.height = height;
  ctx.fillStyle = 'rgb( 32, 0, 0 )';
  ctx.fillRect( 0, 0, width, height );
  imagedata = ctx.getImageData( 0, 0, width, height );
  
  for ( i = 0, l = pixels; i < l; i ++ ) {
    
    imagedata.data[ i * 4 ] = input.charCodeAt( i );
    // console.log(input.charCodeAt( i ));
  }
  
  ctx.putImageData( imagedata, 0, 0 );
  png = window.atob($canvas.toDataURL('image/png').replace('data:image/png;base64,',''));
  
  // convert into 8bit png
  // var params = {
  //   bitDepth: 8,
  //   colourType: CanvasTool.PngEncoder.ColourType.INDEXED_COLOR
  // };
  // var png = new CanvasTool.PngEncoder( $canvas, params ).convert();
  png = insertHTMLTemplate( png, width, height );
  return png;
}
var insertHTMLTemplate = function ( png, width, height ) {
  var type = 'html';
  var template = '<canvas id=c><img onload=for(w=c.width=' + width + ',h=c.height=' + height + ',a=c.getContext(\'2d\'),a.drawImage(this,p=0,0),e=\'\',d=a.getImageData(0,0,w,h).data;t=d[p+=4];)e+=String.fromCharCode(t);(1,eval)(e) src=#>';
  var htmlChunk = PNGUtil.generateChunk( type, template );
  var htmlChunkByteStr = [
    String.fromCharCode( htmlChunk.length[ 0 ] ),
    String.fromCharCode( htmlChunk.length[ 1 ] ),
    String.fromCharCode( htmlChunk.length[ 2 ] ),
    String.fromCharCode( htmlChunk.length[ 3 ] ),
    htmlChunk.type.join( '' ),
    htmlChunk.data.join( '' ),
    String.fromCharCode( htmlChunk.crc[ 0 ] ),
    String.fromCharCode( htmlChunk.crc[ 1 ] ),
    String.fromCharCode( htmlChunk.crc[ 2 ] ),
    String.fromCharCode( htmlChunk.crc[ 3 ] )
  ].join( '' );
  var PNGSignature = [
    String.fromCharCode( 0x89 ),
    String.fromCharCode( 0x50 ),
    String.fromCharCode( 0x4e ),
    String.fromCharCode( 0x47 ),
    String.fromCharCode( 0x0d ),
    String.fromCharCode( 0x0a ),
    String.fromCharCode( 0x1a ),
    String.fromCharCode( 0x0a )
  ].join( '' );
  var IHDRStart   = png.indexOf( 'IHDR' ) - 4; // typeに先行するlength分として4バイト引く
  var IHDREnd     = IHDRStart + 25; //IHDR は 25 バイト固定 (4+4+13+4)
  var IHDR        = png.substring( IHDRStart, IHDREnd );
  var otherChunks = png.substring( IHDREnd, png.length );
  return PNGSignature + IHDR + htmlChunkByteStr + otherChunks;
}
var doit = function () {
  var value = document.getElementById( 'input' ).value;
  var png = convert( value );
  var dataUrl = 'data:image/png;base64,' + window.btoa( png );
  var $result = document.getElementById( 'result' );
  var $a      = document.createElement( 'a' );
  var $img    = new Image();
  $result.innerHTML = '';
  $a.innerHTML = 'get the image as a html';
  $a.setAttribute( 'href', dataUrl );
  $a.setAttribute( 'download', 'png.html' );
  $img.src = dataUrl;
  // console.log("$img.src = "+$img.src);
  result.appendChild( $img );
  result.appendChild( $a );
  var img=new Image();
  img.src=document.getElementById("cat111").src;
  //decode주석 시작
  $img.onload = function () {
    decode( img );
  };
  //decode 주석 끝
}
//decode주석 시작
var decode = function ( $img ) {
  var i, l;
  var ctx = document.createElement( 'canvas' ).getContext( "2d" );
  var data, code = [];
  var pixels = $img.width * $img.height;
  console.log("$img = "+$img);
  // console.log("pixels = "+pixels);
  // console.log($img.width+" "+$img.height);
  ctx.drawImage( $img, 0, 0 );
  // console.log("ctx = "+ctx.drawImage( $img, 0, 0 ));
  var data = ctx.getImageData( 0, 0, $img.width, $img.height ) .data;
  // console.log("tmp = "+tmp.data[1]);
  // data= tmp.data;
  //  console.log("data = "+data);
  for ( i = 0; i < pixels; i ++ ) {
  
    // code.push( String.fromCharCode( data[ i * 4 ] ) );
    code.push(  data[ i * 4 ]  );
  // console.log(data[ i * 4 ] );
  }
  
  debug.innerHTML = code.join(',');
  // eval( code.join( '' ) );
  //  console.log(eval( code.join( '' ) ));
}
//decode 주석 끝
button.addEventListener( 'click', doit );
