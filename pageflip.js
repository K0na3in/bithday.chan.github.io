// using picturebook
var pageElement = [];
var selifElement = [];
var draggedMousePos = 0;
var n = 0;

// picturebook all pages (from 0 to 41)
var len = 41;

// create picturebook page elements
var pagesElement = document.getElementById("pages");
var selifsElement = document.getElementById("selifs");
for(i=0;i<=len;i++){
    var section = document.createElement("section");
    section.id = "page"+i;
    pagesElement.appendChild(section);
    var selifSection = document.createElement("div");
    selifSection.id = "selif"+i;
    selifsElement.appendChild(selifSection);
}

// picture book size
var BOOK_WIDTH = 940;
var BOOK_HEIGHT = 560;
var PAGE_WIDTH = 450;
var PAGE_HEIGHT = 550;
var FLIP_LIMIT = 400;
var PAGE_Y = ( BOOK_HEIGHT - PAGE_HEIGHT ) / 2;
var CANVAS_PADDING = 10;

// initialze
var page = 0, clientX = 0, clientY = 0;

var book = document.getElementById( "book" );	
var pages = book.getElementsByTagName( "section" );

var canvas = document.getElementById( "pageflip-canvas" );
var context = canvas.getContext( "2d" );

var mouse = { x: 0, y: 0 };

var flips = [];

// Organize the depth of our pages and create the flip definitions
for( var i = 0; i < len; i++ ) {
    pages[i].style.zIndex = len - i;
    
    flips.push( {
	// Current progress of the flip (left -1 to right +1)
	progress: 1,
	// The target value towards which progress is always moving
	target: 1,
	// The page DOM element related to this flip
	page: pages[i], 
	// True while the page is being dragged
	dragging: false
    } );
}


// Resize the canvas to match the book size
canvas.width = BOOK_WIDTH + ( CANVAS_PADDING * 2 );
canvas.height = BOOK_HEIGHT + ( CANVAS_PADDING * 2 );

// Offset the canvas so that it's padding is evenly spread around the book
canvas.style.top = -CANVAS_PADDING + "px";
canvas.style.left = -CANVAS_PADDING + "px";

// Render the page flip 60 times a second
setInterval( render, 1000 / 60 );

document.addEventListener( "mousemove", mouseMoveHandler, false );
document.addEventListener( "touchmove", mouseMoveHandler, false );
document.addEventListener( "mousedown", mouseDownHandler, false );
document.addEventListener( "touchstart", mouseDownHandler, false );
document.addEventListener( "mouseup", mouseUpHandler, false );
document.addEventListener( "touchend", mouseUpHandler, false );

function mouseMoveHandler( event ) {
    // Offset mouse position so that the top of the book spine is 0,0
    clientY = event.targetTouches[0].pageY;
    clientX = event.targetTouches[0].pageX;
    mouse.x = clientX - book.offsetLeft - ( BOOK_WIDTH / 2 );
    mouse.y = clientY - book.offsetTop;
    for( var i = 0; i < len; i++ ) {
	if( flips[i].dragging ) {
	    for( var j = 0; j < len; j++ ) {
		pages[j].style.zIndex = len - j;
	    }
	}
    }

}

function mouseDownHandler( event ) {
    clientY = event.targetTouches[0].pageY;
    clientX = event.targetTouches[0].pageX;
    mouse.x = clientX - book.offsetLeft - ( BOOK_WIDTH / 2 );
    mouse.y = clientY - book.offsetTop;
    // Make sure the mouse pointer is inside of the book
    if (Math.abs(mouse.x) < PAGE_WIDTH) {
	draggedMousePos = mouse.x;
	if (mouse.x < 0 && page - 1 >= 0) {
	    // We are on the left side, drag the previous page
	    flips[page - 1].dragging = true;
	}
	else if (mouse.x > 0 && page + 1 < flips.length) {
	    // We are on the right side, drag the current page
	    flips[page].dragging = true;
	}
    }
    
    // Prevents the text selection
    event.preventDefault();
}

function mouseUpHandler( event ) {
    for( var i = 0; i < flips.length; i++ ) {
	// If this flip was being dragged, animate to its destination
	if( flips[i].dragging) {
	    // Figure out which page we should navigate to
	    if( mouse.x < 0  && draggedMousePos >= 0) {
		flips[i].target = -1;
		page = Math.min( page + 1, flips.length );
		renderCurrentPage(page);
	    }
	    else {
		if(draggedMousePos <= 0){
		    flips[i].target = 1;
		    page = Math.max( page - 1, 0 );
		    renderCurrentPage(page);
		}
	    }
	}
	
	flips[i].dragging = false;
    }
}

function render() {
    
    // Reset all pixels in the canvas
    context.clearRect( 0, 0, canvas.width, canvas.height );
    
    for( var i = 0, len = flips.length; i < len; i++ ) {
	var flip = flips[i];
	
	if( flip.dragging ) {
	    flip.target = Math.max( Math.min( mouse.x / PAGE_WIDTH, 1 ), -1 );
	}
	
	// Ease progress towards the target value 
	flip.progress += ( flip.target - flip.progress ) * 0.2;
	
	// If the flip is being dragged or is somewhere in the middle of the book, render it
	if( flip.dragging || Math.abs( flip.progress ) < 0.997 ) {
	    drawFlip( flip );
	}
	
    }
    
}

function drawFlip( flip ) {
    // Strength of the fold is strongest in the middle of the book
    var strength = 1 - Math.abs( flip.progress );
    
    // Width of the folded paper
    var foldWidth = ( PAGE_WIDTH * 0.5 ) * ( 1 - flip.progress );
    
    // X position of the folded paper
    var foldX = PAGE_WIDTH * flip.progress + foldWidth;
    
    // How far the page should outdent vertically due to perspective
    var verticalOutdent = 20 * strength;
    
    // The maximum width of the left and right side shadows
    var paperShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( 1 - flip.progress, 0.5 ), 0 );
    var rightShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( strength, 0.5 ), 0 );
    var leftShadowWidth = ( PAGE_WIDTH * 0.5 ) * Math.max( Math.min( strength, 0.5 ), 0 );
    
    
    // Change page element width to match the x position of the fold
    flip.page.style.width = Math.max(foldX, 0) + "px";
    
    context.save();
    context.translate( CANVAS_PADDING + ( BOOK_WIDTH / 2 ), PAGE_Y + CANVAS_PADDING );
    
    
    // Draw a sharp shadow on the left side of the page
    context.strokeStyle = 'rgba(0,0,0,'+(0.05 * strength)+')';
    context.lineWidth = 30 * strength;
    context.beginPath();
    context.moveTo(foldX - foldWidth, -verticalOutdent * 0.5);
    context.lineTo(foldX - foldWidth, PAGE_HEIGHT + (verticalOutdent * 0.5));
    context.stroke();
    
    
    // Right side drop shadow
    var rightShadowGradient = context.createLinearGradient(foldX, 0, foldX + rightShadowWidth, 0);
    rightShadowGradient.addColorStop(0, 'rgba(0,0,0,'+(strength*0.2)+')');
    rightShadowGradient.addColorStop(0.8, 'rgba(0,0,0,0.0)');
    
    context.fillStyle = rightShadowGradient;
    context.beginPath();
    context.moveTo(foldX, 0);
    context.lineTo(foldX + rightShadowWidth, 0);
    context.lineTo(foldX + rightShadowWidth, PAGE_HEIGHT);
    context.lineTo(foldX, PAGE_HEIGHT);
    context.fill();
    
    
    // Left side drop shadow
    var leftShadowGradient = context.createLinearGradient(foldX - foldWidth - leftShadowWidth, 0, foldX - foldWidth, 0);
    leftShadowGradient.addColorStop(0, 'rgba(0,0,0,0.0)');
    leftShadowGradient.addColorStop(1, 'rgba(0,0,0,'+(strength*0.15)+')');
    
    context.fillStyle = leftShadowGradient;
    context.beginPath();
    context.moveTo(foldX - foldWidth - leftShadowWidth, 0);
    context.lineTo(foldX - foldWidth, 0);
    context.lineTo(foldX - foldWidth, PAGE_HEIGHT);
    context.lineTo(foldX - foldWidth - leftShadowWidth, PAGE_HEIGHT);
    context.fill();
    
    
    // Gradient applied to the folded paper (highlights & shadows)
    var foldGradient = context.createLinearGradient(foldX - paperShadowWidth, 0, foldX, 0);
    foldGradient.addColorStop(0.35, '#fafafa');
    foldGradient.addColorStop(0.73, '#eeeeee');
    foldGradient.addColorStop(0.9, '#fafafa');
    foldGradient.addColorStop(1.0, '#e2e2e2');
    
    context.fillStyle = foldGradient;
    context.strokeStyle = 'rgba(0,0,0,0.06)';
    context.lineWidth = 0.5;
    
    // Draw the folded piece of paper
    context.beginPath();
    context.moveTo(foldX, 0);
    context.lineTo(foldX, PAGE_HEIGHT);
    context.quadraticCurveTo(foldX, PAGE_HEIGHT + (verticalOutdent * 2), foldX - foldWidth, PAGE_HEIGHT + verticalOutdent);
    context.lineTo(foldX - foldWidth, -verticalOutdent);
    context.quadraticCurveTo(foldX, -verticalOutdent * 2, foldX, 0);
    
    context.fill();
    context.stroke();
    
    
    context.restore();
}

// Render each page elements
function renderCurrentPage(page){
    React.render(React.createElement(selifElement[page]), document.getElementById("selif"+page));
    React.render(React.createElement(pageElement[page]), document.getElementById("page"+page));
}

// Unmount hidden page elements
function unMountOtherPages(page){
    for( var i = 0; i < len; i++ ) {
	if (i != page){
	    React.unmountComponentAtNode(document.getElementById('page'+i));
	    React.unmountComponentAtNode(document.getElementById('selif'+i));
	}
    }
}

// Picture book contents
var nn = 0;
selifElement[0] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(n);
    },
    componentDidMount: function(){
	console.log(n);
	unMountOtherPages(n);
    },
    render: function(){
	return (
		<div>
		</div>
	);
    }
});

// 各ReactElementごとの挙動を記載
pageElement[0]= React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(n);
    },
    componentDidMount: function(){
	unMountOtherPages(n);
    },
    render: function(){
	return (
		<div className="caption" id="title">
		   Birthday Card
	    </div>
	);
    }
});

selifElement[1] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap2-1">
		ゆうちゃん
	    </div>
		<div className="caption cap2-2">
		お誕生日おめでとう
	    </div>
		</div>
	);
    }
});

pageElement[1] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(1);
    },
    componentDidMount: function(){
	unMountOtherPages(1);
    },
    render: function(){
	return (
		<div>
		<div className="sky">
		<div className="house">
		<div className="window">
		</div>
		<div className="chimney"></div>
		<div className="smokecontainer"><span className="smoke"></span>
		</div>
		</div>
		</div>    
		<div className="hill"></div>
		</div>
	);
    }
});

selifElement[2] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		明日はご馳走と
	    </div>
		<div className="caption cap3-2">
		たくさんの愛情を用意して
	    </div>
		<div className="caption cap3-3">
		お待ちしています
	    </div>
		</div>
	);
    }
});
pageElement[2] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(2);
    },
    componentDidMount: function(){
	unMountOtherPages(2);
    },
    render: function(){
	return (
		<div>
		<div>
		<div className="refrect" id="sheep-family1">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>

		<div  id="sheep-family2">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>

		<div className="sheep-mother refrect">
		<div className="sheep-head">
		<div className="leyelash1 eyelash"></div>
		<div className="leyelash2 eyelash"></div>
		<div className="leyelash3 eyelash"></div>
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black"></div>
		</div>
		<div className="reyelash1 eyelash"></div>
		<div className="reyelash2 eyelash"></div>
		<div className="reyelash3 eyelash"></div>
		<div className="rt-eye">
		<div className="black"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>
		<div className="sheep-body"></div>
		<div className="fur fur-1"></div>
		<div className="fur fur-2"></div>
		<div className="fur fur-3"></div>
		<div className="fur fur-4"></div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>
		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>
		</div>
		</div>
	);
    }
});

selifElement[3] = React.createClass({
    render: function(){
	return (
		<div>
		<div className="caption cap3-1">
		最高の思い出を
	    </div>
		<div className="caption cap3-2">
		一緒に作ろうね
	    </div>
		<div className="caption cap3-3">
		大好きです
	    </div>
		</div>
	);
    }
});

pageElement[3] = React.createClass({
    componentDidUpdate: function(){
	unMountOtherPages(3);
    },
    componentDidMount: function(){
	unMountOtherPages(3);
    },
    render: function(){
	return (
		<div>
		<div className="sheep-cutted">
		<div className="sheep-head">
		<div className="lt-ear"></div>
		<div className="lt-round-ear"></div>
		<div className="rt-ear"></div>
		<div className="rt-round-ear"></div>
		<div className="lt-eye">
		<div className="black-crying-lt"></div>
		</div>
		<div className="rt-eye">
		<div className="black-crying-rt"></div>
		</div>
		<div className="lt-nose"></div>
		<div className="rt-nose"></div>
		</div>

		<div className="sheep-body"></div>
		<div className="sheep-body-cutted1">
		</div>
		<div className="sheep-body-cutted2">
		</div>
		<div className="fur fur-5"></div>
		<div className="fur fur-7"></div>
		<div className="fur fur-8"></div>
		<div className="fur fur-9"></div>
		<div className="fur fur-10"></div>
		<div className="fur fur-11"></div>
		<div className="fur fur-13"></div>
		<div className="fur fur-14"></div>
		<div className="fur fur-00"></div>
		<div className="fur fur-15"></div>
		<div className="fur fur-16"></div>
		<div className="fur fur-17"></div>

		<div className="leg-lt"></div>
		<div className="leg-lt-shadow"></div>
		<div className="foot-lt"></div>
		<div className="foot-lt-shadow"></div>
		<div className="leg-rt"></div>
		<div className="leg-rt-shadow"></div>
		<div className="foot-rt"></div>
		<div className="foot-rt-shadow"></div>
		</div>
		<div id="r-arm">
		<div id="arm">
		</div>
		<div id="hand">
		</div>
		<div id="finger1">
		</div>
		<div id="finger2">
		</div>
		<div id="finger3">
		</div>
		<div id="finger4">
		</div>
		<div id="finger5">
		</div>
		<div id="clipper">
		<div id="clipper-body">
		</div>
		<div id="cutter1">
		</div>
		<div id="cutter2">
		</div>
		<div id="cutter3">
		</div>
		<div id="cutter4">
		</div>
		<div id="cutter5">
		</div>
		</div>
		</div>
		</div>
	);
    }
});

renderCurrentPage(page);
