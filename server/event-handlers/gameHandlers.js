const { assignRoles } = require('../utils/helpers');

// Handler para unirse al juego agrego consol logo pora ver si me salen fallas saber en donde es el error
const joinGameHandler = (socket, db, io) => {
	return (user) => {
		if (!user.nickname) {
			console.log('Error: Falta el nickname del jugador');
			socket.emit('error', { message: 'Falta el nickname' });
			return;
		}

		db.players.push({ id: socket.id, score: 0, ...user });
		console.log('Jugadores:', db.players);

		// Emitir actualización a todos los clientes
		io.emit('userJoined', db);
	};
};

// Handler para iniciar el juego
const startGameHandler = (socket, db, io) => {
	return () => {
		db.players = assignRoles(db.players);

		db.players.forEach((element) => {
			io.to(element.id).emit('startGame', element.role);
		});
	};
};

// Notificar a Marco
const notifyMarcoHandler = (socket, db, io) => {
	return () => {
		const rolesToNotify = db.players.filter((user) => user.role === 'polo' || user.role === 'polo-especial');

		rolesToNotify.forEach((element) => {
			io.to(element.id).emit('notification', {
				message: 'Marco!!',
				userId: socket.id,
			});
		});
	};
};

// Notificar a Polo
const notifyPoloHandler = (socket, db, io) => {
	return () => {
		const rolesToNotify = db.players.filter((user) => user.role === 'marco');

		rolesToNotify.forEach((element) => {
			io.to(element.id).emit('notification', {
				message: 'Polo!!',
				userId: socket.id,
			});
		});
	};
};

// Handler para seleccionar a Polo y actualizar puntajes
const onSelectPoloHandler = (socket, db, io) => {
	return (userID) => {
		const marcoPlayer = db.players.find((user) => user.id === socket.id);
		const poloSelected = db.players.find((user) => user.id === userID);
		const poloEspecial = db.players.find((user) => user.role === 'polo-especial');

		// console.log por si sale error poder identificar

		if (!marcoPlayer) {
			console.log(`Error: No se encontró al jugador Marco con ID ${socket.id}`);
			socket.emit('error', { message: 'Jugador Marco no encontrado' });
			return;
		}

		if (!poloSelected) {
			console.log(`Error: No se encontró el jugador con ID ${userID}`);
			socket.emit('error', { message: 'Jugador Polo no encontrado' });
			return;
		}

		// ponemos puntajes  inicializados
		marcoPlayer.score = marcoPlayer.score || 0;
		poloSelected.score = poloSelected.score || 0;
		if (poloEspecial) poloEspecial.score = poloEspecial.score || 0;

		if (poloSelected.role === 'polo-especial') {
			marcoPlayer.score += 50;
			poloSelected.score -= 10;

			console.log(`Puntaje: ${marcoPlayer.nickname} +50, ${poloSelected.nickname} -10`);

			// Notificar que el juego terminó
			db.players.forEach((element) => {
				socket.to(element.id).emit('notifyGameOver', {
					message: `El marco ${marcoPlayer.nickname} ha ganado, ${poloSelected.nickname} ha sido capturado`,
				});
			});
		} else {
			marcoPlayer.score -= 10;

			if (poloEspecial) {
				poloEspecial.score += 10;
				console.log(`Puntaje: ${poloEspecial.nickname} +10`);
			}

			// Notificar que el juego terminó
			db.players.forEach((element) => {
				io.to(element.id).emit('notifyGameOver', {
					message: `El marco ${marcoPlayer.nickname} ha perdido`,
				});
			});
		}

		// Emitir la actualización del puntaje a todos los clientes
		socket.emit('updateScore', {
			players: db.players.map((player) => ({
				name: player.nickname,
				score: player.score,
			})),
		});

		// Verificar si hay un ganador con 100 puntos o más
		const winner = db.players.find((player) => player.score >= 100);
		if (winner) {
			lastWinner = winner;
			console.log('Ganador:', winner.nickname);
			io.emit('advertisementWinner', {
				winner: winner.nickname,
				players: db.players.map((player) => ({
					name: player.nickname,
					score: player.score,
				})),
			});
		}
	};
};

let lastWinner = null;

// Handler para solicitar el último ganador
const getWinnersHandler = (socket, db) => {
	return () => {
		if (lastWinner) {
			socket.emit('advertisementWinner', {
				winner: lastWinner.nickname,
				players: db.players.map((player) => ({
					name: player.nickname,
					score: player.score,
				})),
			});
		}
	};
};

// Exportar los handlers
module.exports = {
	joinGameHandler,
	startGameHandler,
	notifyMarcoHandler,
	notifyPoloHandler,
	onSelectPoloHandler,
	getWinnersHandler,
};
