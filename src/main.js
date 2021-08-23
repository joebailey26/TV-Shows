import App from './App.svelte';
require('dot-env')

const app = new App({
	target: document.body
});

export default app;