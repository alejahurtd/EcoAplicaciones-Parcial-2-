import { router, socket } from '../routes.js';

export default function renderScreen2() {
	const app = document.getElementById('app');
	app.innerHTML = `
  <h1> 🏅There is a winner 🏅!</h1>
  <p id="winnerMessage"></p>
  <div id="container">
  <h2>Final Ranking 🎯</h2>
  <ul id="players-Final"></ul>
  <button id="ordenAlphabeticallyBtn">Order Alphabetically</button>
  </div>
`;

	// Solicitar datos y jugadores
	socket.emit('getWinner');

	//  recibir los datos del ganador y usuarios.
	socket.on('advertisementWinner', (data) => {
		const { winner, players } = data;

		// Mostrar el mensaje del jugador que gana
		document.getElementById('winnerMessage').textContent = `El ganador es  ${winner}!`;
		//puntuacion en el orden de + a -
		orderPlayer(players);
	});

	// rendirizamos lista y ordenamos
	function orderPlayer(players) {
		players.sort((a, b) => b.score - a.score);

		// Crear la tabla de score puntuaciones
		let playersTable = '';
		players.forEach((player, index) => {
			playersTable += `<li>${index + 1}. ${player.name} (${player.score} pts)</li>`;
		});

		// Renderizar en el HTML
		document.getElementById('players-Final').innerHTML = playersTable;
	}

	// evento para el botón de ordenar
	document.getElementById('ordenAlphabeticallyBtn').addEventListener('click', () => {
		// Aqui es lalista  y ordenamos
		const playersTableElement = document.getElementById('players-Final');
		const playersItems = Array.from(playersTableElement.getElementsByTagName('li'));

		playersItems.sort((a, b) => {
			const userA = a.textContent.split('.')[1].trim();
			const userB = b.textContent.split('.')[1].trim();
			return userA.localeCompare(userB);
		});

		// Limpiar la lista y agregar los elementos
		playersTableElement.innerHTML = '';
		playersItems.forEach((item) => playersTableElement.appendChild(item));
	});
	socket.on('gameRestarted', (data) => {
		console.log(data.message);
		router.navigateTo('/');
	});
}
