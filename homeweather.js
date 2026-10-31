	/*
	1. If Search button is clicked, call localize() to initialize 
	2. When a Place is initialized:
		a. Check to see if fc_area is defined
			b. if not, call Place.getWxLocation
		b. Get forecast (getWx())


	Properties of the window:

	Properties of the location:


	*/
	//var resultsDiv = document.getElementById('nwsHiLo');
	var forecast;
	var alerts;
	var wx_area;
	//var fc_area;
	var fc_zone;
	var alert_url;
	var Places;
	var currentPlace = null;
	
	function onloadRoutines(){
		var n = getSavedLocations();
		loadLastLocation();
		if(n==0){
			saveLocation();
		}
	}
	
	function loadLastLocation(){
			var date = new Date();
			document.getElementById("date").innerText = date.toDateString();
			currentPlace = JSON.parse(localStorage.getItem('currentPlace'));
			renderWait();
			getWx(currentPlace);
			/*if(currentPlace){
				document.getElementById('loc_name').innerHTML = currentPlace.displayName;
				renderWait();
				getWx(currentPlace);
			}else if(currentPlace == null){
				getLocation();
				saveLocation();
			}*/
	}
	
	class Place {
		constructor(displayName, id, lat, lon, order=99){
            this.uuid = globalThis.crypto.randomUUID();
			this.displayName = displayName;
			this.order = order;
			this.id = id;
			this.lat = lat;
			this.lon = lon;
			this.getWxLocation();
		}

		getWxLocation(){	//retrieve nws points object, populate Place.fc_area
			alerts = null;
			this.fc_area = null;
			var fc_area;
			renderWait();
			const url = 'https://api.weather.gov/points/'+this.lat+','+this.lon;
			//var fc_area;
			console.log('getWxLocation() :: getting forecast info - url: ' + url);
			fetch(url)
			.then(res => {
					return res.json();
				})
			.then(data => {
					return data.properties; 
				})
			.then(fc_area => {
					console.log(fc_area);
					this.fc_area = fc_area;
					localStorage.setItem('currentPlace',JSON.stringify(this));
					//console.log(currentPlace.fc_area);
					getWx(currentPlace);
					saveLocation();
					getSavedLocations();
					return currentPlace.fc_area;
				})
		}
		
	};
	
	function loadPlace(i){
	//get the i-th place object in local storage, set the display name and getWx
		currentPlace = Places[i];
		localStorage.setItem('currentPlace',JSON.stringify(currentPlace));
		//document.getElementById('loc_name').innerHTML = currentPlace.displayName;
        //var cards = document.getElementsByClassName('loc_card');
        const cards = document.querySelectorAll('.loc_card');
        
        cards.forEach(element => {element.classList='loc_card';});

		const card = document.getElementById(currentPlace.uuid)
        card.classList.add('selected');
        console.log(cards.classList.value);
		renderWait();
		getWx(currentPlace);
		//document.getElementById('Locations').style.display = 'none';
	}

	function addPlace(){
		var newPlace = prompt('Search: ');
		if(newPlace){
			localize(newPlace);
		}
	}
	
	function getSavedLocations(){
		var myLocations 
		try{
			Places = JSON.parse(localStorage.getItem('myLocations'));
			}
		catch{
			//No locations in storage, use current location
			getLocation();
			//Places = null
		};
		if (Places == null){localStorage.setItem('myLocations','[]')}
		const myLocationsDiv = document.getElementById('myLocations');
		var locs = '';
		if(Places){
			Places.sort((a,b) => a.order - b.order);			
			for (let i = 0; i<Places.length; i++) {
				//locs = locs + '<button onClick="loadPlace(' + i +')">' + Places[i].displayName + '</button><button onClick="removeLocation('+i+')">X</button><button onClick="renameLocation('+i+')">(e)</button></br>';
				/*locs = locs + '<div class="loc_card" onClick="loadPlace('+ i +')" id="lc'+ i + '">\
					<h1 class="lc">'
					+Places[i].displayName+'</h1>\
					<button onClick="removeLocation('+i+')">(X)</button>\
					<button onClick="renameLocation('+i+')">(e)</button><br>\
					<input style="width: 2em;" type="number" size="2" value="'+Places[i].order+'" onChange="reorderLocation('+i+', this.value)"></input>\
					<br></div>'*/
				locs = locs + '<div class="loc_card" id="' + Places[i].uuid + '" onClick="loadPlace('+ i + ');">'+
					Places[i].displayName + '\
					<br><button onClick="removeLocation('+i+')">(X)</button>\
					<button onClick="renameLocation('+i+')">(e)</button></div>';
			}
			locs = locs + '<div class="loc_card" id="addPlace" onClick="addPlace()">+</div>';
			myLocationsDiv.innerHTML = locs;
		}
		return Places.length;
	}

	function reorderLocation(i, val){
		val = parseFloat(val);
		console.log(val);
		if(Number.isInteger(val)){
			console.log('changing order');
			Places[i].order = val;
			localStorage.setItem('myLocations',JSON.stringify(Places));
			getSavedLocations();
		}else{
			getSavedLocations();
		}
	}
	
	function removeLocation(i){
		var userResponse = window.confirm('Delete ' + Places[i].displayName + '?');
		if(userResponse){
			Places.splice(i,1);
			localStorage.setItem('myLocations',JSON.stringify(Places));
			getSavedLocations();}
			else{ return}
	}
	
	function renameLocation(i=null){
		
		var newName = window.prompt('New Place Name: ');
		if(newName){
			if(i==null){
				currentPlace.displayName = newName;
				document.getElementById('loc_name').innerHTML=currentPlace.displayName;
			}else{
				Places[i].displayName = newName;
			}
			localStorage.setItem('myLocations',JSON.stringify(Places));
			getSavedLocations();
		}
	}
	
	function saveLocation(){
	//adds current forecast info to myLocations
		if(currentPlace.fc_area == null){
			return;
		}
		var myLocations = JSON.parse(localStorage.getItem('myLocations'));
		var ids = myLocations.map(locn => locn.id);
		//Add sortOrder if it does not exist
		for(i=0; i++; myLocations.length){
			if(!myLocations[i].order){
				myLocations.order=i;
			}
		}
		if(ids.indexOf(currentPlace.id)==-1){
			var newLocations = myLocations;
			newLocations.push(currentPlace);
			localStorage.setItem('myLocations',JSON.stringify(newLocations));
			getSavedLocations();
		}else{
			console.log('Location already Saved');
		}
	}

	function nwsAlert(){
		alerts=null;
		alert_url = 'https://api.weather.gov/alerts/active?zone=' + fc_zone;
		fetch(alert_url)
                .then(res => {return res.json()})
                .then(out => {alerts = out.features})
                .then(signalAlert)
				return;
                //.catch(err => alert(err));
	}

	function signalAlert(){
		var alertIcon = document.getElementById("alert");
		if(alerts[0]){
			alertIcon.style.display = 'inline-block';
		}else{
			alertIcon.style.display = 'none';
		}
	}

	function showAlert(){
		if(alerts){
			var alertText = alerts[0].properties.headline + "\n\n" + alerts[0].properties.description;
			showModal(alertText);
		}
	}

	function showRadar(){
		if(currentPlace.fc_area.radarStation){
			showModal('<center><img src="https://radar.weather.gov/ridge/standard/'+currentPlace.fc_area.radarStation+'_loop.gif"></center>');
		}
		// use radarStation in this url ^^
	}

	function showModal(content){
		// Get the modal
		var modal = document.getElementById("modal");
		var modalContent = document.getElementById("modal-content");
		modalContent.innerHTML = content;
		 modal.style.display = "block";
	}

	window.onclick = function(event) {
		if (event.target == modal) {
		    modal.style.display = "none";
		}
	} 

	function showForecast(period){
		showModal('<b>Day:</b> <br>' + forecast.periods[period].detailedForecast + '<br><br><b>Evening:</b> <br>'+ forecast.periods[period+1].detailedForecast);
	}

	/*function drawWind(){
	        var windSpeed = $current.windSpeed.format('%2d', add_label=False);
		var gustSpeed = $current.windGust.format('%2d', add_label=False);
		#if $current.windDir.raw
			var windDir = $current.windDir.raw;     //N = 0
		#else
			var windDir = 0;
		#end if
	        var centerX = 150;
		var centerY = 150;
	        var arrowHt = 40;
		var c = document.getElementById("wind");
		var rp = document.getElementById("rightPane");
		var R = centerY*0.8;
		
		var ctx = c.getContext("2d");
		if(isNight()){
			ctx.strokeStyle = 'silver';
			ctx.fillStyle = 'silver';
		}else{ 
			ctx.strokeStyle = 'black';
			ctx.fillStyle = 'black';
		}
		ctx.font = '10vh "Open Sans"';
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillText(windSpeed + ' / G' + gustSpeed, centerX, centerY);
		ctx.translate(centerX, centerY);
		ctx.rotate((Math.PI/180)*windDir);
		ctx.translate(-centerX, -centerY);
		ctx.beginPath();
		ctx.moveTo(centerX, centerY-R+arrowHt/2);
		ctx.lineTo(centerX+10, centerY-R-arrowHt/2);
		ctx.lineTo(centerX-10, centerY-R-arrowHt/2);
		ctx.fill();
		ctx.closePath();
		
		ctx.stroke();
		ctx.beginPath();
		ctx.lineWidth = 3;
		ctx.arc(centerX, centerY, R, 0, 2*Math.PI);
		ctx.stroke();
		}*/

	//function getWx(fc_url = null){
	function getWx(currentPlace){
		forecast = null;
		if(currentPlace.fc_area == null){
			currentPlace.getWxLocation();
		}
			//await currentPlace.getWxLocation();
			console.log('getWx() :: Retrieving forecast for ' + currentPlace.displayName);
			fc_url = currentPlace.fc_area.forecast;
			fetch(fc_url)
			.then(res => res.json())
			.then(out => {
					forecast = out.properties;
					return
				})
			//.then(out => console.log(out.properties))
			.then(getHiLo)
			.then(getForecast)
			.then(getZone(currentPlace))
			.then(nwsAlert);
			//.catch(err => alert(err));
	}
	
	function renderWait(){
		alerts = null;
		//document.getElementById('almanac').style.display='';
	//display a loading icon
		document.getElementById('daily_fc').innerHTML = '<td class="fcst">Loading...</td>';
		document.getElementById('nwsHi').innerHTML = '';
		document.getElementById('nwsLo').innerHTML = '';
		document.getElementById('nwsFc').innerHTML = '';
		//document.getElementById('searchBox').value = '';
	}
	
	function getZone(currentPlace){	//get alert zone from 
		fc_zone = (currentPlace.fc_area.fireWeatherZone).split('/').at(-1);
		//console.log(fc_zone);
		return fc_zone;
		//getWx(fc_area);
	}

	function getHiLo(){
		var nwsHiLo = forecast.periods.slice(0,2).map(a => a.temperature).sort(function(a, b){return (a - b);});
		document.getElementById('nwsHi').innerHTML = nwsHiLo[1];
		document.getElementById('nwsLo').innerHTML = nwsHiLo[0];
		//document.getElementById('currentConditions').innerHTML = '<img src="'+forecast.periods[0].icon+'" width="100vw" onClick="showForecast(0)"/><br>'
		var nwsFc = document.getElementById('nwsFc');
		if(nwsFc.offsetWidth < nwsFc.scrollWidth){
			nwsFc.innerHTML = '<marquee>'+forecast.periods[0].shortForecast+'</marquee>';
		}else{
			nwsFc.innerHTML = forecast.periods[0].shortForecast;
		}
	}

	function getForecast(){
		document.getElementById('daily_fc').innerHTML='';

		if(forecast){
			var nwsFcst = forecast.periods;
			var sunrise = new Date(currentPlace.fc_area.astronomicalData.sunrise);
			document.getElementById('sunriseTime').innerHTML = String(sunrise.getHours()).padStart(2,'0') + ':' + String(sunrise.getMinutes()).padStart(2,'0');
			var sunset = new Date(currentPlace.fc_area.astronomicalData.sunset);
			document.getElementById('sunsetTime').innerHTML = String(sunset.getHours()).padStart(2,'0') + ':' + String(sunset.getMinutes()).padStart(2,'0');
			let d=1;
			for (let i = 1; i<13; i++) {
				if(forecast.periods[i].isDaytime && forecast.periods[i].name != 'Today' && forecast.periods[i].name != 'This Afternoon'){
					//document.getElementById('day'+d).innerHTML = 
					document.getElementById('daily_fc').innerHTML = document.getElementById('daily_fc').innerHTML +
					'<td class="fcst"><img class="fcTile" src="'+forecast.periods[i].icon+'" onClick="showForecast('+i+')"/><br>'
					+'<font color="blue">' + forecast.periods[i-1].temperature + '</font>&nbsp;'
					+forecast.periods[i].name.slice(0,3)
					+'&nbsp;<font color="red">' + forecast.periods[i].temperature + '</font> \
					</td>';
					d++;
				}
			}
		}
	}

	function localize(query){
			//const query = encodeURIComponent(document.getElementById('searchBox').value);
			console.log(query);
			const url = 'https://nominatim.openstreetmap.org/search?q='+query+'&format=json&limit=1&countrycodes=us';
			//get location data from Nominatim
			var XHR = new XMLHttpRequest();
			XHR.onreadystatechange = function () {
				if (XHR.readyState == 4 && XHR.status == 200) {
					//console.log(XHR.responseText);
					const wx_area = JSON.parse(XHR.responseText)[0];
					console.log(wx_area);
					if(wx_area){
					//Create an object if one is not saved
					console.log('localize() :: ' + wx_area.display_name);
					currentPlace = new Place(
						wx_area.display_name.replace(', United States',''),
						wx_area.place_id,
						parseFloat(wx_area.lat).toFixed(3),
						parseFloat(wx_area.lon).toFixed(4)
						);
					//document.getElementById('loc_name').innerHTML = currentPlace.displayName;
					currentPlace.getWx();
					saveLocation();
					getSavedLocations();
					//return wx_area;
					}
					else{
						alert('Location not found.');
						//console.log('Location not found');
					}
					
				}
			};
			XHR.open("GET", url);
			XHR.send();
		}
	
	function getLocation() {
	  if (navigator.geolocation) {
		// Geolocation is available
		console.log("Fixing location")
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	  } else {
		// Geolocation is not supported by this browser
		alert("Geolocation is not supported by this browser.");
	  }
	}

	function showPosition(position) {
	  const latitude = position.coords.latitude;
	  const longitude = position.coords.longitude;
	  // Use the latitude and longitude (e.g., display on a map or log to console)
	  localize(latitude+ ', '+longitude);
	  console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
	}

	function showError(error) {
	  switch(error.code) {
		case error.PERMISSION_DENIED:
		  alert("User denied the request for Geolocation.");
		  break;
		case error.POSITION_UNAVAILABLE:
		  alert("Location information is unavailable.");
		  break;
		case error.TIMEOUT:
		  alert("The request to get user location timed out.");
		  break;
		case error.UNKNOWN_ERROR:
		  alert("An unknown error occurred.");
		  break;
	  }
	}

	let millisPerHour = 60 * 60 * 1000;
	let millisPastTheHour = Date.now() % millisPerHour;
	let millisToTheHour = millisPerHour - millisPastTheHour;

	function forecastRefresh(){
		//Reload hourly
		console.log('Refreshing...')
		var date = new Date();
		document.getElementById("date").innerText = date.toDateString();
		loadLastLocation();
	}

	/*let runHourly = function() {
	console.log("Running task at: " + new Date());
	};*/
	// Wait for the next exact hour, then run every hour
	setTimeout(function() {
	forecastRefresh();
	setInterval(forecastRefresh, millisPerHour);
	}, millisToTheHour);

	function selectLocation(){
		console.log('boop');
		getSavedLocations();
		document.getElementById('Locations').style.display = 'block';
	}
