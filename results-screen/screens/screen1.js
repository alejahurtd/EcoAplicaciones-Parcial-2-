import { router, socket } from '../routes.js';

export default function renderScreen1() {
	const app = document.getElementById('app');
	app.innerHTML = `
          <h1>Scores 🏅 </h1>
		<div id="container"><ul id="players"></ul></div>
    `;

	// actualizar la lista de jugadores
	const updatePlayerList = (players) => {
		let playersTable = '';

		players.forEach((player, index) => {
			playersTable += `<li>${index + 1}. ${player.nickname} (${player.score} pts)</li>`;
		});

		document.getElementById('players').innerHTML = playersTable;
	};

	// Escuchar puntuaciones y actualziar
	socket.on('updateScore', (data) => {
		const { players } = data;
		updatePlayerList(players); //
	});

	//Escuchar cuando se une alguien evento que hizo el profe inicio de handlers
	socket.on('userJoined', (db) => {
		console.log('userJoined', db);
		const { players } = db;
		updatePlayerList(players);
	});

	// Escuchar el mensjae de quien gabo la aprtida  y redirigir a la otra pantalla
	socket.on('advertisementWinner', (data) => {
		console.log('Winner announced:', data.winner);
		router.navigateTo('/screen2');
	});
}
