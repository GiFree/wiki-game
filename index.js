( function() {
	document.addEventListener( 'DOMContentLoaded', () => {
		const randomFromTab = true;
		const gameContainer = document.querySelector( '#game' );
		const infoDiv = document.querySelector( '#info-div' );
		const startBtn = document.querySelector( '#start-btn' );
		const searchField = document.getElementById( 'search' );
		const historyObject = document.getElementById( 'history' );
		const titlesTable = [];
		const ends = [ 
			'Powiat cieszyński',	'Cieszyn',	 	'Fryderyk Chopin',
			'I wojna światowa',		'Portugalia', 	'La Manche', 
			'Wojna Secesyjna',		'Facebook', 	'Google',
			'Donald Trump',			'Andrzej Duda', 'Wikipedia',
			'Ocean Spokojny', 		'Szachy',		'Łacina' ,
			'Treny',				'Wisła'
		];
		const fetchJSON = ( function() {
			const that = {};

			that.send = function( src, options ) {
				const callback_name = options.callbackName || 'callback',
					on_success = options.onSuccess || function() {};

				window[ callback_name ] = function( data ) {

					on_success( data );
				};

				const script = document.createElement( 'script' );
				script.type = 'text/javascript';
				script.async = true;
				script.src = src;

				document.getElementsByTagName( 'head' )[ 0 ].appendChild( script );
			};

			return that;
		} () );

		randomTitles();

		let startingTitle = '';
		let titleToFind = '';
		let points = -1;

		searchField.addEventListener( 'input', () => {
			buttons.reload( searchField.value.toLowerCase() );
		} );

		startBtn.addEventListener( 'click', () => {
			enter( startingTitle );
			startBtn.inactive = true;
		} );

		historyObject.addEventListener( 'change', () => {
			enter( historyObject.options[ historyObject.selectedIndex ].value );
		} );

		const buttons = ( () => {
			const that = {};
			const butts = [];
			that.create = ( obj ) => {
				const butt = {};
				butt.title = obj.title;
				butt.id = encodeURI( obj.title );
				butt.event = function() {
					enter( butt.id );
				};
				butt.html = `<button id="btn-${butt.id}">${butt.title}</button>`;
				butts.push( butt );
			};

			that.reload = ( keyword = undefined ) => {
				gameContainer.innerHTML = '';

				if ( keyword ) {
					for ( const button of butts ) {
						if ( encodeURI( button.title.toLowerCase() ).indexOf( encodeURI( keyword ) ) >= 0 ) {
							gameContainer.insertAdjacentHTML( 'beforeend', button.html );
							document.getElementById( `btn-${button.id}` ).addEventListener( 'click', button.event );
						}
					}
				} else {
					for ( const button of butts ) {
						gameContainer.insertAdjacentHTML( 'beforeend', button.html );
						document.getElementById( `btn-${button.id}` ).addEventListener( 'click', button.event );
					}
				}

			};

			that.clear = () => {
				while ( butts.length > 0 ) {
					butts.pop();
				}
				that.reload();
			};

			return that;
		} )();

		const history = ( () => {
			const that = {};
			let histArr = [];

			that.update = () => {
				let htmlContent = '';

				historyObject.innerHTML = '';
				for ( el of histArr ) {
					htmlContent += `<option value="${encodeURI( el )}">${el}</option>`;
				}
				historyObject.insertAdjacentHTML( 'beforeend', htmlContent );
			};

			that.add = ( title ) => {
				histArr = histArr.filter( ( item ) => {
					return item !== title;
				} ); // wyczyść z tablicy tytuł ktory juz odwiedziliśmy
				histArr.push( title );
			};

			return that;
		} )();

		function updatePoints() {
			document.querySelector( '#points' ).insertAdjacentText( 'beforeend', `Current points: ${points}` );
		}

		function enter( title ) {
			const url = `https://pl.wikipedia.org/w/api.php?action=parse&page=${title.split( ' ' ).join( '_' )}&format=json&prop=links&utf8`;

			fetchJSON.send( `${url}&callback=handleStuff`, {
				callbackName: 'handleStuff',
				onSuccess( json ) {
					handleResponse( json );
				}

			} );

		}

		function addPoints( point ) {
			points += point;

			const htmlContent = `
            Ruchy: ${points}
        `;

			infoDiv.insertAdjacentHTML( 'afterbegin', htmlContent );

		}

		function handleResponse( data ) {

			const pattern = /[^a-zA-ZńŃćĆóÓśŚłŁęĘźŹżŻ()_\d\s]/i;

			if ( data && data.parse && data.parse.links && step( 1, data.parse.title ) ) {

				for ( title of data.parse.links ) {
					if ( pattern.test( title[ '*' ] ) === false ) {
						buttons.create( {
							title: title[ '*' ]
						} );
					}
				}
				buttons.reload();
			} else {
				console.log( 'Brak strony polskiej dla tego linku.' );
			}

		}

		function step( value, title ) {
			infoDiv.innerHTML = '';
			buttons.clear();
			history.add( title );
			history.update();
			addPoints( value );
			if ( updateTitle( title ) ) {
				return false;
			}
			return true;

		}

		function updateTitle( title ) {
			infoDiv.insertAdjacentHTML( 'beforeend', `<div id="current-site">Obecna strona: <a target="_blank" href="https://pl.wikipedia.org/wiki/${title.split( ' ' ).join( '_' )}">${title}</a>.</div>` );
			if ( checkWin( title ) ) {
				onWin( title );
				return true;
			}
			return false;
		}

		function checkWin( title ) {
			if ( title.toLowerCase() === titleToFind.toLowerCase() ) {
				return true;
			}
			return false;
		}

		function onWin( title ) {
			gameContainer.innerHTML = `<h1>Brawo udało cie się znaleźć artykuł ${title} w ${points} ruchach zaczynając od ${startingTitle}!!!</h1>
            
        <h3>Odśwież aby zacząć od nowa!</h3>`;
			startBtn.disabled = true;
			searchField.disabled = true;
			historyObject.disabled = true;
		}

		function randomTitles() {
			fetchJSON.send( 'https://pl.wikipedia.org/w/api.php?action=query&list=random&format=json&rnlimit=100&callback=handleStuff', {
				callbackName: 'handleStuff',
				onSuccess: ( data ) => {
					const vals = data.query.random;

					for ( val of vals ) {
						if ( val.ns === 0 ) {
							titlesTable.push( val.title );
						}
					}

					startingTitle = titlesTable[ Math.floor( Math.random() * titlesTable.length ) ];

					if( randomFromTab ) {
						titleToFind = ends[ Math.floor( Math.random() * ends.length ) ];
					} else {
						do {
							titleToFind = titlesTable[ Math.floor( Math.random() * titlesTable.length ) ];
						} while ( titleToFind !== startingTitle );
					}

					document.querySelector( '#title' ).insertAdjacentHTML( 'beforeend', `<text id="to-find">Szukaj: 
                <a target="_blank" href="https://pl.wikipedia.org/wiki/${titleToFind.split( ' ' ).join( '_' )}">
                ${titleToFind}
                </a>
                </text>` );
				}

			} );

		}

	} );
} () );
