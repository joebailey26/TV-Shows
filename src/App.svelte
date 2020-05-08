<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
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
	let visible = false

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

	// Add show
	function addShowAPI (data) {
		return fetch('/.netlify/functions/add-show', {
			body: JSON.stringify(data),
			method: 'POST'
		}).then(response => {
			return response.json()
		})
	}

	// Get shows
	function getShowsAPI () {
		return fetch('/.netlify/functions/get-shows', {
			method: 'GET'
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
	async function addShow () {
		await addShowAPI(new_show).then((response) => {
			success = response
		}).catch((error) => {
			console.log('API error', error)
		})
		searching = false
		new_show = {
			id: null
		}
		shows = []
		getShows()
	}

	function addShowHelper (id) {
		new_show = {
			id: id
		}
		addShow()
	}

	// Get Shows on page load
	async function getShows () {
		visible = false
		getShowsAPI().then(async (response) => {
			IDs = await response
			for (let ID of IDs) {
				await getShowsEpisodate(ID.data.id).then((response) => {
					shows.push(response)
				}).catch((error) => {
					console.log('API error', error)
				})
			}
			shows.sort(function(a, b){
				if(a.tvShow.network < b.tvShow.network) { return -1; }
				if(a.tvShow.network > b.tvShow.network) { return 1; }
				return 0;
			})
			shows = shows
			visible = true
		}).catch((error) => {
			console.log('API error', error)
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
			console.log('API error', error)
		})
	}

	function deleteShowAPI (id) {
		let request
		
		for (let ID of IDs) {
			if (id == ID.data.id) {
				request = ID.ref['@ref'].id
			}
		}
		return fetch(`/.netlify/functions/remove-show/${request}`, {
			method: 'POST'
		}).then(response => {
			return response.json()
		})
	}

	async function deleteShow (id) {
		await deleteShowAPI(id)
		shows = []
		getShows()
	}

	getShows()
</script>