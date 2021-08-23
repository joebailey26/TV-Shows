<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

	h1, h2 {
		text-align: left
	}

	h2 {
		margin: 0;
	}

	.container {
		margin: 2rem 0;
	}

	.shows_container {
		display: grid;
		grid-template-columns: repeat(auto-fit, 250px);
		grid-gap: 1rem;
		justify-content: center
	}

	.show {
		padding: 1rem;
		border: 1px solid black;
	}

	.show.red {
		background-color: darkred;
		color: white;
	}

	.show.green {
		background-color: darkgreen;
		color: white;
	}

	form {
		text-align: left;
	}

	form * {
		display: inline
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<main>
	<h1>TV Shows</h1>
	<div class="add_new_container container">
		<form on:submit|preventDefault={addShow}>
			<label for="new_show">
				<h2>Add new show by ID</h2>
				<div><input type="number" name="new_show" bind:value={new_show.id}/></div>
			</label>
			<div><input type="submit" value="Add!"/></div>
		</form>
		<p>{success}</p>
	</div>
	<div class="search_container container">
		<form on:submit|preventDefault={search}>
			<label for="search">
				<h2>Search for a show</h2>
				<div><input type="text" name="search" bind:value={searchData}/></div>
			</label>
			<div><input type="submit" value="Search"/></div>
		</form>
		{#if searching}
			<div class="shows_container container" transition:fade>
				{#each search_results.tv_shows as show}
					<div class="show {showClassHelper(show.status, show.countdown)}">
						<h3>{show.name}</h3>
						<p>Network: {show.network}</p>
						<a href="javascript:void(0)" on:click|preventDefault={addShowHelper(show.id)}>Add</a>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	<div style="text-align: left">
		<form on:submit|preventDefault={downloadCalendar} style="display: inline-block">
			<input type="submit" value="Download calendar" />
		</form>
		<form on:submit|preventDefault={clearStorage} style="display: inline-block">
			<input type="submit" value="Clear Storage" />
		</form>
	</div>
	<h2>Currently Watching</h2>
	{#if visible}
		<div class="shows_container container" transition:fade>
			{#each shows as show}
			<div class="show {showClassHelper(show.tvShow.status, show.tvShow.countdown)}">
				<h3>{show.tvShow.name}</h3>
				<p>Next episode: {@html showCountdownHelper(show.tvShow.countdown)}</p>
				<p>Network: {show.tvShow.network}</p>
				<a href="javascript:void(0)" on:click|preventDefault={deleteShow(show.tvShow.id)}>Remove</a>
			</div>
			{/each}
		</div>
	{/if}
</main>

<script>
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'

	/*! ics.js Wed Aug 20 2014 17:23:02 */
	var saveAs=saveAs||function(e){"use strict";if(typeof e==="undefined"||typeof navigator!=="undefined"&&/MSIE [1-9]\./.test(navigator.userAgent)){return}var t=e.document,n=function(){return e.URL||e.webkitURL||e},r=t.createElementNS("http://www.w3.org/1999/xhtml","a"),o="download"in r,a=function(e){var t=new MouseEvent("click");e.dispatchEvent(t)},i=/constructor/i.test(e.HTMLElement)||e.safari,f=/CriOS\/[\d]+/.test(navigator.userAgent),u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},s="application/octet-stream",d=1e3*40,c=function(e){var t=function(){if(typeof e==="string"){n().revokeObjectURL(e)}else{e.remove()}};setTimeout(t,d)},l=function(e,t,n){t=[].concat(t);var r=t.length;while(r--){var o=e["on"+t[r]];if(typeof o==="function"){try{o.call(e,n||e)}catch(a){u(a)}}}},p=function(e){if(/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)){return new Blob([String.fromCharCode(65279),e],{type:e.type})}return e},v=function(t,u,d){if(!d){t=p(t)}var v=this,w=t.type,m=w===s,y,h=function(){l(v,"writestart progress write writeend".split(" "))},S=function(){if((f||m&&i)&&e.FileReader){var r=new FileReader;r.onloadend=function(){var t=f?r.result:r.result.replace(/^data:[^;]*;/,"data:attachment/file;");var n=e.open(t,"_blank");if(!n)e.location.href=t;t=undefined;v.readyState=v.DONE;h()};r.readAsDataURL(t);v.readyState=v.INIT;return}if(!y){y=n().createObjectURL(t)}if(m){e.location.href=y}else{var o=e.open(y,"_blank");if(!o){e.location.href=y}}v.readyState=v.DONE;h();c(y)};v.readyState=v.INIT;if(o){y=n().createObjectURL(t);setTimeout(function(){r.href=y;r.download=u;a(r);h();c(y);v.readyState=v.DONE});return}S()},w=v.prototype,m=function(e,t,n){return new v(e,t||e.name||"download",n)};if(typeof navigator!=="undefined"&&navigator.msSaveOrOpenBlob){return function(e,t,n){t=t||e.name||"download";if(!n){e=p(e)}return navigator.msSaveOrOpenBlob(e,t)}}w.abort=function(){};w.readyState=w.INIT=0;w.WRITING=1;w.DONE=2;w.error=w.onwritestart=w.onprogress=w.onwrite=w.onabort=w.onerror=w.onwriteend=null;return m}(typeof self!=="undefined"&&self||typeof window!=="undefined"&&window||this.content);if(typeof module!=="undefined"&&module.exports){module.exports.saveAs=saveAs}else if(typeof define!=="undefined"&&define!==null&&define.amd!==null){define("FileSaver.js",function(){return saveAs})}

	var ics=function(e,t){"use strict";{if(!(navigator.userAgent.indexOf("MSIE")>-1&&-1==navigator.userAgent.indexOf("MSIE 10"))){void 0===e&&(e="default"),void 0===t&&(t="Calendar");var r=-1!==navigator.appVersion.indexOf("Win")?"\r\n":"\n",n=[],i=["BEGIN:VCALENDAR","PRODID:"+t,"VERSION:2.0"].join(r),o=r+"END:VCALENDAR",a=["SU","MO","TU","WE","TH","FR","SA"];return{events:function(){return n},calendar:function(){return i+r+n.join(r)+o},addEvent:function(t,i,o,l,u,s){if(void 0===t||void 0===i||void 0===o||void 0===l||void 0===u)return!1;if(s&&!s.rrule){if("YEARLY"!==s.freq&&"MONTHLY"!==s.freq&&"WEEKLY"!==s.freq&&"DAILY"!==s.freq)throw"Recurrence rrule frequency must be provided and be one of the following: 'YEARLY', 'MONTHLY', 'WEEKLY', or 'DAILY'";if(s.until&&isNaN(Date.parse(s.until)))throw"Recurrence rrule 'until' must be a valid date string";if(s.interval&&isNaN(parseInt(s.interval)))throw"Recurrence rrule 'interval' must be an integer";if(s.count&&isNaN(parseInt(s.count)))throw"Recurrence rrule 'count' must be an integer";if(void 0!==s.byday){if("[object Array]"!==Object.prototype.toString.call(s.byday))throw"Recurrence rrule 'byday' must be an array";if(s.byday.length>7)throw"Recurrence rrule 'byday' array must not be longer than the 7 days in a week";s.byday=s.byday.filter(function(e,t){return s.byday.indexOf(e)==t});for(var c in s.byday)if(a.indexOf(s.byday[c])<0)throw"Recurrence rrule 'byday' values must include only the following: 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'"}}var g=new Date(l),d=new Date(u),f=new Date,S=("0000"+g.getFullYear().toString()).slice(-4),E=("00"+(g.getMonth()+1).toString()).slice(-2),v=("00"+g.getDate().toString()).slice(-2),y=("00"+g.getHours().toString()).slice(-2),A=("00"+g.getMinutes().toString()).slice(-2),T=("00"+g.getSeconds().toString()).slice(-2),b=("0000"+d.getFullYear().toString()).slice(-4),D=("00"+(d.getMonth()+1).toString()).slice(-2),N=("00"+d.getDate().toString()).slice(-2),h=("00"+d.getHours().toString()).slice(-2),I=("00"+d.getMinutes().toString()).slice(-2),R=("00"+d.getMinutes().toString()).slice(-2),M=("0000"+f.getFullYear().toString()).slice(-4),w=("00"+(f.getMonth()+1).toString()).slice(-2),L=("00"+f.getDate().toString()).slice(-2),O=("00"+f.getHours().toString()).slice(-2),p=("00"+f.getMinutes().toString()).slice(-2),Y=("00"+f.getMinutes().toString()).slice(-2),U="",V="";y+A+T+h+I+R!=0&&(U="T"+y+A+T,V="T"+h+I+R);var B,C=S+E+v+U,j=b+D+N+V,m=M+w+L+("T"+O+p+Y);if(s)if(s.rrule)B=s.rrule;else{if(B="rrule:FREQ="+s.freq,s.until){var x=new Date(Date.parse(s.until)).toISOString();B+=";UNTIL="+x.substring(0,x.length-13).replace(/[-]/g,"")+"000000Z"}s.interval&&(B+=";INTERVAL="+s.interval),s.count&&(B+=";COUNT="+s.count),s.byday&&s.byday.length>0&&(B+=";BYDAY="+s.byday.join(","))}(new Date).toISOString();var H=["BEGIN:VEVENT","UID:"+n.length+"@"+e,"CLASS:PUBLIC","DESCRIPTION:"+i,"DTSTAMP;VALUE=DATE-TIME:"+m,"DTSTART;VALUE=DATE-TIME:"+C,"DTEND;VALUE=DATE-TIME:"+j,"LOCATION:"+o,"SUMMARY;LANGUAGE=en-us:"+t,"TRANSP:TRANSPARENT","END:VEVENT"];return B&&H.splice(4,0,B),H=H.join(r),n.push(H),H},download:function(e,t){if(n.length<1)return!1;t=void 0!==t?t:".ics",e=void 0!==e?e:"calendar";var a,l=i+r+n.join(r)+o;if(-1===navigator.userAgent.indexOf("MSIE 10"))a=new Blob([l]);else{var u=new BlobBuilder;u.append(l),a=u.getBlob("text/x-vCalendar;charset="+document.characterSet)}return saveAs(a,e+t),l},build:function(){return!(n.length<1)&&i+r+n.join(r)+o}}}console.log("Unsupported Browser")}};

	// Data
	let shows = []
	let IDs = []
	let new_show = {
		id: null
	}
	let success = ''
	let searchData = ''
	let search_results = {
		tv_shows: []
	}
	let searching = false
	let visible = true
	let cal = ics()

	function showClassHelper (status, countdown) {
		if (status === 'Canceled/Ended' || status === 'Ended') {
			return 'red'
		}
		else if (countdown !== null && countdown !== undefined) {
			return 'green'
		}
	}

	function showCountdownHelper (countdown) {
		if (countdown == null) {
			return 'Unknown'
		}
		else {
			let date = new Date(countdown.air_date)
			let day = date.getDate()
			let monthArr = []
				monthArr[0] = "Jan"
				monthArr[1] = "Feb"
				monthArr[2] = "Mar"
				monthArr[3] = "Apr"
				monthArr[4] = "May"
				monthArr[5] = "Jun"
				monthArr[6] = "Jul"
				monthArr[7] = "Aug"
				monthArr[8] = "Sep"
				monthArr[9] = "Oct"
				monthArr[10] = "Nov"
				monthArr[11] = "Dec"
			let month = monthArr[date.getMonth()]
			let year = date.getFullYear().toString().substring(2)

			return `<time datetime=${date}>${day} ${month} '${year}</time>`
		}
	}

	function downloadCalendar () {
		cal.download('tv_shows')
	}

	function clearStorage () {
		localStorage.clear()
	}

	// Add show
	function addShowAPI (data) {
		return fetch(`https://tv-shows-api.joebailey.workers.dev/add-show/${data.id}`, {
			method: 'POST',
			headers: {
				Authorization: 'Skyline'
			}
		}).then(response => {
			return response.text()
		})
	}

	// Get shows
	function getShowsAPI () {
		return fetch('https://tv-shows-api.joebailey.workers.dev/get-shows', {
			method: 'GET',
			headers: {
				Authorization: 'Skyline'
			}
		}).then(response => {
			return response.json()
		})
	}

	function getShowsEpisodate (id) {
		return fetch(`https://www.episodate.com/api/show-details?q=${id}`, {
			method: 'POST'
		}).then(response => {
			return response.json()
		})
	}

	// On form submit call addShowAPI
	async function addShow (id) {
		if (IDs.find(ID => ID.data.id === id)) {
			success = 'This show has already been added'
		} else {
			await addShowAPI(new_show).then((response) => {
				success = response
			}).catch((error) => {
				console.error('API error', error)
			})
			searching = false
			new_show = {
				id: null
			}
			getShow(id)
			getShowsAPI().then(async (response) => {
				IDs = await response
				localStorage.setItem('id', JSON.stringify(IDs))
			}).catch((error) => {
				console.error('API error', error)
			})
		}
	}

	function addShowHelper (id) {
		new_show = {
			id: id
		}
		addShow(id)
	}

	async function getShow (id) {
		await getShowsEpisodate(id).then((response) => {
			shows.push(response)
			let i
			for (i = 0; i < (response.tvShow.episodes).length; i++) {
				let episode = response.tvShow.episodes[i]
				if (episode.air_date) {
					let date = new Date(episode.air_date)
					date.setDate(date.getDate() + 1)
					date = new Date(date.getFullYear(), date.getMonth(), date.getDate())
					if (date > new Date()) {
						cal.addEvent(response.tvShow.name + ' | ' + episode.name, '', '', date, date)
					}
				}
			}
		}).catch((error) => {
			console.error('API error', error)
		})
		shows.sort(function(a, b){
			if(a.tvShow.network < b.tvShow.network) { return -1; }
			if(a.tvShow.network > b.tvShow.network) { return 1; }
			return 0;
		})
		shows = shows
		localStorage.setItem('shows', JSON.stringify(shows))
	}

	async function getShows () {
		getShowsAPI().then(async (response) => {
			IDs = await response
			if (localStorage.getItem('id') != JSON.stringify(IDs)) {
				for (let ID of IDs) {
					getShow(ID.data.id)
				}
				localStorage.setItem('id', JSON.stringify(IDs))
			} else {
				IDs = JSON.parse(localStorage.getItem('id'))
				shows = JSON.parse(localStorage.getItem('shows'))
			}
		}).catch((error) => {
			console.error('API error', error)
		})
	}

	function searchEpisodate () {
		return fetch(`https://www.episodate.com/api/search?q=${searchData}`, {
			method: 'POST'
		}).then(response => {
			return response.json()
		})
	}

	function search () {
		searchEpisodate().then((response) => {
			search_results = response
			search_results = search_results
			searchData = ''
			searching = true
		}).catch((error) => {
			console.error('API error', error)
		})
	}

	function deleteShowAPI (id) {
		let request
		
		for (let ID of IDs) {
			if (id == ID.data.id) {
				request = ID.ref['@ref'].id
			}
		}
		return fetch(`https://tv-shows-api.joebailey.workers.dev/remove-show/${request}`, {
			method: 'POST',
			headers: {
				Authorization: 'Skyline'
			}
		}).then(response => {
			return response.text()
		})
	}

	async function deleteShow (id) {
		if (window.confirm('Are you sure you want to delete this show?')) {
			await deleteShowAPI(id).then((response) => {
				success = response
			}).catch((error) => {
				console.error('API error', error)
			})
			let i
			for (i in shows) {
				if (shows[i].tvShow.id === id) {
					shows.splice(i, 1)
				}
			}
			let b
			for (b in IDs) {
				if(IDs[b].data.id === id) {
					IDs.splice(b, 1)
				}
			}
			shows.sort(function(a, b){
				if(a.tvShow.network < b.tvShow.network) { return -1; }
				if(a.tvShow.network > b.tvShow.network) { return 1; }
				return 0;
			})
			shows = shows
			localStorage.setItem('shows', JSON.stringify(shows))
		}
	}

	getShows()
</script>