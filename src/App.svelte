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
						<a href="javascript:void(0)" on:click|preventDefault={addShow(show.id)}>Add</a>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	<div style="text-align: left">
		<form on:submit|preventDefault={downloadCalendar} style="display: inline-block">
			<input type="submit" value="Download calendar" />
		</form>
	</div>
	<h2>Currently Watching</h2>
	{#if visible}
		<div class="shows_container container" transition:fade>
			{#each shows as show}
			<div class="show {showClassHelper(show.status, show.countdown)}">
				<h3>{show.name}</h3>
				<p>Next episode: {@html showCountdownHelper(show.countdown)}</p>
				<p>Network: {show.network}</p>
				<a href="javascript:void(0)" on:click|preventDefault={deleteShow(show.id)}>Remove</a>
			</div>
			{/each}
		</div>
	{/if}
</main>

<script>
	import { fade } from 'svelte/transition'

	// Env
	// const apiUrl = 'https://tv-shows-api.joebailey.workers.dev'
	const apiUrl = 'http://127.0.0.1:8787'
	const auth = 'Skyline'

	// Data
	let shows = []
	let searchData = ''
	let search_results = {
		tv_shows: []
	}
	let searching = false
	let visible = true

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
		// ToDo
		//  Open the calendar api endpoint in a new window
	}

	async function getShows () {
		shows = await fetch(`${apiUrl}/shows`, {
			method: 'GET',
			headers: {
				Authorization: auth
			}
		}).then(response => {
			return response.json()
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
		})
	}

	async function addShow (id) {
		await fetch(`${apiUrl}/show/${id}`, {
			method: 'POST',
			headers: {
				Authorization: auth
			}
		})
		searching = false
		getShows()
	}

	async function deleteShow (id) {
		if (window.confirm('Are you sure you want to delete this show?')) {
			await fetch(`${apiUrl}/show/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: auth
				}
			})
			getShows()
		}
	}

	getShows()
</script>