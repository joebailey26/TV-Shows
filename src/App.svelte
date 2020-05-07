<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<main>
	<h1>Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	{#each shows as show}
		<p>{show.data.id}</p>
	{/each}
</main>

<script>
	let shows = []

	function getShows() {
		return fetch('/.netlify/functions/get-shows', {
			method: 'GET'
		}).then(response => {
			return response.json()
		})
	}

	getShows().then((response) => {
		console.log('API response', response)
		shows = response
	}).catch((error) => {
		console.log('API error', error)
	})

	export let name;
</script>